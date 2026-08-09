# FileUpload Base UI Parity Plan

## Status

- Audit complete; implementation not started. Audited from the working tree rooted at `3c02b36` on 2026-08-09.
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

## Verified Missing Features

1. **Preview URLs are created even when previews are disabled.** Moraine's effect creates an object URL for every image regardless of `preview`; Kobalte creates URLs only inside mounted preview ownership and revokes on cleanup. Priority P0, medium, resource leak; owner: FileUpload.
2. **Drag acceptance is too broad.** Any drag sets dragging state; file types are not checked and `dropEffect='copy'` is not set. Kobalte guards file drags with `DataTransfer.types/items`. Priority P1, small; owner: FileUpload.
3. **Signal files and native `input.files` can diverge.** Drops never populate the input, rejected picker files remain native, and appended picker batches are not represented by the latest FileList. This breaks required validity and FormData. Priority P0, large, high platform risk; owner: FileUpload.
4. **Native reset leaves files and previews mounted.** Priority P0, medium; owner: FileUpload plus Form.
5. **The drop control can be unnamed without a label.** Kobalte provides an explicit dropzone name; Moraine has no fallback naming contract. Priority P1, small API/localization decision; owner: FileUpload.

## Detailed Execution Plan

1. Add URL-spy tests for preview off/on, replacement, reset, rejection, removal, and unmount; require one create/revoke lifecycle per mounted preview.
2. Port Kobalte's file-drag predicate and copy drop effect; cover non-file drags, mixed items, dragleave, disabled state, and caller cancellation.
3. Write tests first for picker, drop, append, remove, rejection, required validity, and FormData. Implement one native synchronization layer using supported `DataTransfer` assignment when available, with feature detection.
4. Add form reset handling that clears public state, native state, Formisch state, validation errors, and URLs exactly once.
5. Define an accessible fallback label or require an explicit label before code, then add FormField association and SSR/hydration tests for label/description/preview branches.
6. Update the matrix; run FileUpload, FormField, Form, SSR, typecheck, and diff checks.

## STOP Conditions

- If a browser does not permit reliable `FileList` assignment, classify that exact native synchronization path `unverified-platform` and document the fallback; do not claim jsdom proves it.
- Do not add upload/network behavior, browser test dependencies, or new localization APIs without approval.
