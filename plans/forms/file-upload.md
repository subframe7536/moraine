# FileUpload Base UI Parity Plan

## Status

- Implementation complete on 2026-08-11. Audited from the working tree rooted at `3c02b36` on 2026-08-09 and re-verified against the fixed revisions before implementation.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Harden FileUpload's picker, dropzone, validation, file-list, form, accessibility, pointer, and lifecycle behavior using the closest pinned prior art. Keep Moraine's single comprehensive component and existing rejection contract.

## Local Surface

- Source: src/forms/file-upload/file-upload.tsx
- Styles: src/forms/file-upload/file-upload.class.ts
- Tests: src/forms/file-upload/file-upload.test.tsx
- Shared/form dependencies: src/shared/hidden-input.tsx and src/forms/form-field/form-field-context.ts
- Public component and type surface: FileUpload, FileUploadProps, and FileUploadT members Value, Slot, Variant, Classes, Styles, Item, Base, and Props.
- Behavior in scope includes input picker and drop flows, accept/minSize/maxSize/maxFiles/duplicate validation, single versus multiple value shape, removal, previews and object URL cleanup, readOnly/disabled behavior, and native file input participation.

## Upstream References

- Base UI 3011fba8f has no direct file-upload counterpart. Use base-ui/packages/react/src/input, base-ui/packages/react/src/field, and base-ui/packages/react/src/form only for native input, field validity, and event/form conventions.
- Kobalte 2e8ce473 direct prior art: kobalte/packages/core/src/file-field, especially root, dropzone, hidden input, item list/delete trigger, preview image, types, util, and related tests if added at the pinned revision.
- Do not infer Base UI behavior where no counterpart exists. Historical Moraine commits are evidence only.

## Audit and Implementation

1. Produce a gap ledger separating direct Kobalte evidence, Base UI field/input convention evidence, local intentional behavior, and platform behavior that cannot be verified in jsdom.
2. Audit picker semantics: control activation by click/Enter/Space, input click cancellation, focus/blur ownership, same-file reselection, FileList limitations, disabled/readOnly guards, and consumer handler cancellation/order.
3. Audit drag-and-drop: dragenter/dragover/dragleave/drop ordering, nested-target flicker, dropEffect, preventDefault rules, empty dataTransfer, directories/non-file items where supported, disabled/readOnly state, and touch/pointer non-applicability.
4. Audit validation deterministically: accept MIME/extensions and case, empty MIME, min/max boundaries, duplicate identity, single-batch and existing-list duplicates, maxFiles allocation, accepted/rejected ordering, multiple error policy, and exact callback count.
5. Audit native form behavior: name, disabled omission, required validity, single/multiple files, reset, FormData/File values, FormField integration, and the fact that DataTransfer assignment may be browser-limited. Mark unsupported synchronization explicitly instead of faking native behavior.
6. Audit ARIA: accessible picker/dropzone name and description, role/button keyboard equivalence, invalid/described-by propagation, file-list semantics, remove-button labels, disabled versus aria-disabled, and announcement needs for rejection/removal.
7. Audit object URL lifecycle and SSR: no server access to URL/document, create each preview URL once, revoke exactly once on replacement/removal/unmount, preserve non-image fallback, and avoid hydration-dependent IDs or list order.
8. Port the smallest local changes and add a regression test per confirmed gap. Keep validation in the existing centralized helpers and avoid branching separately for picker and drop paths.
9. Any conditional JSX change must pass getter-backed JSX single evaluation plus renderToString-to-hydrate tests for dropzone/button branches, preview fallback branches, and initial empty state.

## Public API

- Preserve FileUpload, FileUploadProps, FileUploadT.Value, rejection callback payloads, slot names, and single/multiple value shapes by default.
- Do not import Kobalte's primitive API, Base UI APIs, polymorphism beyond the existing as prop, styling, spacing, or animation.
- If a correctness gap needs a new public callback or rejection detail, first document the current limitation and proposed minimal contract as an intentional divergence.

## Test Plan

- Focused: bun run test src/forms/file-upload/file-upload.test.tsx
- Form integration: bun run test src/forms/form/form.test.tsx src/forms/form-field/form-field.test.tsx
- Shared hidden input changes: bun run test src/forms/checkbox/checkbox.test.tsx src/forms/switch/switch.test.tsx
- Final touched slice: bun run typecheck
- Add tests for native FormData/required/reset behavior, picker and drop equivalence, cancellation/order, all validation boundaries, duplicate/maxFiles ordering, readOnly/disabled, same-file reselection, and object URL lifecycle. Label untestable browser paths unverified-platform.

## Completion Criteria

- All picker, drop, validation, form, accessibility, lifecycle, and SSR rows are classified with evidence quality.
- Every ported behavior has a focused test; browser-only limitations are explicit.
- FileUpload and affected FormField/hidden-input consumers pass with typecheck.
- No upstream API or visual system is copied.

## Dependencies/Handoff

- Coordinate hidden-input and FormField changes with Checkbox/Switch/Form owners.
- FileUpload can proceed independently of other collection components, but real native FileList/FormData constraints must be recorded for follow-up browser validation.
- Handoff must include rejection ordering, native form limitations, URL ownership rules, test results, and all unverified-platform cases.

## Final Classification

1. **Picker activation and cancellation — verified.** The dropzone opens the hidden input from primary click, Enter, and Space after caller handlers, while canceled handlers, disabled state, and readOnly state suppress internal activation. The non-dropzone native button retains browser keyboard behavior.
2. **File-only drag and drop — ported.** Kobalte's fixed `DataTransfer.types` predicate is applied before preventing defaults or entering dragging state. Accepted drags request `dropEffect='copy'`, nested dragleave does not flicker, non-file drops are ignored, and consumer cancellation runs first.
3. **Validation and allocation — ported.** MIME/wildcard/extension checks are case-insensitive, min/max boundaries remain inclusive, type and size errors accumulate deterministically, duplicates cover current and incoming batches, and `maxFiles` allocates accepted files in source order including zero in single mode.
4. **Native input synchronization — ported with an unverified platform boundary.** Every accepted append, replacement, removal, rejection rollback, disabled/readOnly rollback, and drop attempts to rebuild `input.files` through a feature-detected `DataTransfer`. Empty state always clears the input. Browsers that reject FileList assignment retain the documented native FormData/required limitation; jsdom cannot prove the supported real-browser path.
5. **Form reset and FormField value — ported.** Native reset clears dragging state, selected files, native input state, FormField input, rendered previews, and object URLs without emitting a user `onValueChange` callback. Single and multiple value shapes remain `null` and `[]` respectively.
6. **Accessible naming and field descriptions — ported.** Internal labels name the root/control/input, descriptions are merged with FormField `aria-describedby`, and the existing no-label API receives the fixed fallback name “File upload,” following Kobalte's explicit dropzone-name precedent without adding a localization API.
7. **Object URL ownership — ported.** Image URLs are created only while the preview branch is mounted and only for accepted images. Replacement, removal, preview disablement, reset, and unmount revoke each owned URL once.
8. **SSR and JSX ownership — ported.** Label, description, dropzone, and preview inputs are cached; initial empty SSR does not access browser-only file/URL APIs; hydration reuses the root and safely swaps dropzone/button branches with stable labels and descriptions.
9. **Comprehensive component API and visuals — intentional divergence.** Base UI has no file-upload counterpart and Kobalte uses compound primitives. Moraine retains its single data-driven component, rejection payloads, preview list, variants, slots, classes, and styles without importing upstream API or layout.
10. **Native FileList assignment, picker cancellation retention, validation UI, OS file dialogs, directories, touch, and assistive-technology announcements — unverified platform.** These require real browser/device validation and are not claimed from jsdom.

## Implementation Result

- Added centralized selected-file commits and feature-detected native FileList synchronization for picker, drop, append, replace, remove, rejection, disabled/readOnly, and reset paths.
- Added file-drag filtering, copy drop effect, nested dragleave containment, cancellation ordering, and non-file drop rejection.
- Added deterministic multiple-error validation and single-mode `maxFiles=0` handling.
- Scoped image object URLs to the mounted preview branch with exact cleanup.
- Added reset/FormField synchronization, fallback/internal accessible naming, getter-backed single-evaluation coverage, and isolated empty-state SSR hydration.

## Validation

- `bun run test src/forms/file-upload/file-upload.test.tsx` — 33/33 passed.
- `bun run test src/forms/form/form.test.tsx src/forms/form-field/form-field.test.tsx` — 8/8 passed.
- Targeted oxfmt and oxlint passed for source, tests, and SSR fixture.
- `bun run typecheck`, `bun run build`, and `git diff --check` passed.

## STOP Conditions

- If a browser does not permit reliable `FileList` assignment, classify that exact native synchronization path `unverified-platform` and document the fallback; do not claim jsdom proves it.
- Do not add upload/network behavior, browser test dependencies, or new localization APIs without approval.
