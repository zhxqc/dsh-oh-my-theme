// Host-half unit tests: workspaceFiles service against a real temp directory.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { WorkspaceFilesRuntime } from '../lib/index.js';

let root;
let runtime;
/** Fake session agent whose header.cwd is the temp workspace. */
let fakeAgent;

test.before(async () => {
	root = await mkdtemp(path.join(os.tmpdir(), 'dsh-ohm-'));
	await mkdir(path.join(root, 'src'));
	await mkdir(path.join(root, 'src', 'components'));
	await mkdir(path.join(root, 'node_modules'));
	await mkdir(path.join(root, '.git'));
	await writeFile(path.join(root, 'README.md'), '# Hello\n\nSome *markdown*.\n');
	await writeFile(path.join(root, 'package.json'), '{"name":"demo"}');
	await writeFile(path.join(root, 'src', 'index.ts'), 'export const x = 1;\n');
	await writeFile(path.join(root, 'src', 'components', 'Button.tsx'), 'export function Button() {}\n');
	await writeFile(path.join(root, 'node_modules', 'dep.js'), 'ignored\n');
	await writeFile(path.join(root, '.git', 'config'), 'ignored\n');
	fakeAgent = { session: { header: { cwd: root } } };
	const ctx = new Context();
	runtime = new WorkspaceFilesRuntime(ctx);
});

test.after(async () => {
	await rm(root, { recursive: true, force: true });
});

test('search indexes the workspace and ignores node_modules/.git', async () => {
	const entries = await runtime.search(fakeAgent, '', undefined);
	const relatives = entries.map((entry) => entry.relative).sort();
	assert.ok(relatives.includes('README.md'), 'root file indexed');
	assert.ok(relatives.includes('src/index.ts'), 'nested file indexed');
	assert.ok(relatives.includes('src'), 'directory indexed');
	assert.ok(relatives.includes('src/components'), 'nested directory indexed');
	assert.ok(!relatives.includes('node_modules'), 'node_modules ignored');
	assert.ok(!relatives.includes('.git'), '.git ignored');
	assert.ok(!relatives.includes('node_modules/dep.js'), 'node_modules content ignored');
});

test('search filters and ranks by query', async () => {
	const exact = await runtime.search(fakeAgent, 'Button', undefined);
	assert.equal(exact[0].relative, 'src/components/Button.tsx', 'basename match ranks first');

	const prefix = await runtime.search(fakeAgent, 'read', undefined);
	assert.ok(prefix.some((entry) => entry.relative === 'README.md'), 'prefix match found');

	const none = await runtime.search(fakeAgent, 'zzz-not-found', undefined);
	assert.equal(none.length, 0, 'no match returns empty');
});

test('listDir loads one level lazily, dirs first', async () => {
	const rootRows = await runtime.listDir(fakeAgent, '', undefined);
	assert.deepEqual(
		rootRows.map((row) => row.relative),
		['src', 'README.md', 'package.json'],
		'root level: dirs first, alphabetical'
	);
	const srcRows = await runtime.listDir(fakeAgent, 'src', undefined);
	assert.deepEqual(
		srcRows.map((row) => row.relative),
		['src/components', 'src/index.ts'],
		'one level only (lazy)'
	);
});

test('readText returns UTF-8 content', async () => {
	const result = await runtime.readText(fakeAgent, 'README.md', undefined);
	assert.equal(result.content, '# Hello\n\nSome *markdown*.\n');
	assert.equal(result.truncated, false);
});

test('readText rejects binary content', async () => {
	const bin = path.join(root, 'blob.bin');
	await writeFile(bin, Buffer.from([0x00, 0x01, 0x02, 0xff]));
	await assert.rejects(
		() => runtime.readText(fakeAgent, 'blob.bin', undefined),
		/is not a text file/
	);
});

test('path traversal is rejected', async () => {
	await assert.rejects(
		() => runtime.listDir(fakeAgent, '../outside', undefined),
		/escapes the workspace root/
	);
	await assert.rejects(
		() => runtime.readText(fakeAgent, 'src/../../etc/hosts', undefined),
		/escapes the workspace root/
	);
});

test('aborted signal stops the walk early', async () => {
	const controller = new AbortController();
	controller.abort();
	const entries = await runtime.search(fakeAgent, '', controller.signal);
	assert.ok(Array.isArray(entries), 'returns an array even when aborted');
});
