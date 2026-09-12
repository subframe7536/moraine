# Plan 030: Expose FileUpload parts with original File identity

> Executor: activate this DEFERRED plan only when FileUpload is selected. Read `plans/README.md` first.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: [003-host-render.md](003-host-render.md)
- **Category**: dx
- **State**: DEFERRED — candidate; activate only when this family is selected

## Why this matters

Expose `Dropzone`, `Trigger`, `List`, `Item`, `Preview`, `Meta`, `Name`, `Size` and `Remove`. Keep `File | File[] | null` and the mandatory native file input. Remove `itemRender`-style customization entirely: each file row is an explicit `FileUpload.Item file={file}` and its namespace children consume the Item context.

This component selects/validates files and performs no HTTP upload.

## Target anatomy

```tsx
<FileUpload multiple value={files()} onValueChange={setFiles}>
  <FileUpload.Dropzone>
    <p>Drop files here</p>
    <FileUpload.Trigger>Choose files</FileUpload.Trigger>
  </FileUpload.Dropzone>

  <FileUpload.List>
    <For each={files()}>
      {(file) => (
        <FileUpload.Item file={file}>
          <FileUpload.Preview />
          <FileUpload.Meta>
            <FileUpload.Name />
            <FileUpload.Size />
          </FileUpload.Meta>
          <FileUpload.Remove aria-label={`Remove ${file.name}`} />
        </FileUpload.Item>
      )}
    </For>
  </FileUpload.List>
</FileUpload>
```

The original `File` object is preserved in Item context. Consumers can also render `{file.name}` directly as children; Name/Size exist because they are stable semantic/styled parts, not because data requires a renderer callback.

## Contract

- Root owns file selection, validation, native input, reset and object URL lifecycle.
- `List` is only a structural/styled list; it does not take `itemRender`.
- Application `<For>` renders `Item file={file}`.
- `Item` context preserves original `File` identity.
- Preview/Meta/Name/Size/Remove consume Item context and never create a second file state.
- Remove public item/content renderer props and renderer-only types.
- Do not add `FileUpload.Items` merely to hide `<For>`.
- Trigger/custom hosts use `as` where valid, never host-level `render`.

## Acceptance tests

Cover native selection/drop, single/multiple/required/name, rejection, original File identity, explicit `<For>` rows, Preview/Name/Size/Remove context, remove propagation, same-file reselection, reset, object URL cleanup, SSR, themes and negative declaration tests for removed renderer props.

## Scope

- `src/forms/file-upload`
- FileUpload docs/API/type tests
- direct Form consumers

## Verification

```sh
nub run test src/forms/file-upload
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] File rows are rendered by namespace parts and application `<For>`.
- [ ] No public FileUpload renderer prop remains.
- [ ] Original File identity and object URL lifecycle are preserved.
- [ ] No `FileUpload.Items` assembler is introduced.
- [ ] Full regression/type/docs gates pass.

## STOP conditions

Stop if explicit Items require cloning/scanning children, if File identity is replaced by copied metadata objects, or if renderer callbacks are reintroduced under another name.