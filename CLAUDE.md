# Project guidance

## Scope

`dsh-oh-my-theme` is a build-free DeepSeek Harness web plugin. The root README is Chinese; `docs/README.en.md` is the English counterpart.

## Runtime shape

- `lib/index.js` is the host half and exposes read-only, workspace-scoped Typert methods.
- `lib/client.js` is the browser half and is served verbatim; keep it valid plain JavaScript without adding a build requirement.
- `package.json#dsh.bundle.patch` and `cordis.patch.yml` are the install manifest. Keep the loader package name aligned with the npm package name.
- Official `@deepseek-ai/*` packages remain `peerDependencies` to avoid duplicate runtimes inside a profile.

## Safety boundaries

- Workspace file methods must resolve paths inside the active session cwd and reject traversal.
- File preview remains read-only, rejects binary content, and keeps its existing size limits.
- Keep client and host Typert invocation descriptors wire-identical.

## Verification

```sh
node --test test/host.test.mjs
node test/client.smoke.mjs
npm pack --dry-run
```

When changing user-visible behavior, update both README files in the same commit.
