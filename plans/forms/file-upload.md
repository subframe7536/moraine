# FileUpload Base UI Parity Plan

## Status

- Ready for audit and implementation.
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
