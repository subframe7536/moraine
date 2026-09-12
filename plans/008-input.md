# Plan 008: Make Input/Textarea native controls and extract InputGroup

> Executor: read this entire file and `plans/README.md` before implementation. Follow the composition-first contract there. Update this plan and the index together when finished. Never overwrite unrelated user changes.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [003-host-render.md](003-host-render.md)
- **Category**: dx
- **State**: TODO

## Why this matters

The current Input API mixes two DOM targets: wrapper ref/class/style and native input attributes/events. Remove that ambiguity.

`Input` and `Textarea` become styled native editing controls. Their `ref`, `class`, `style`, `id`, `aria-*`, native attributes and native events target the actual native element. Preserve value modifiers, form binding and normalized `onValueChange` separately from native `onInput` / `onChange`.

Move icons, prefixes/suffixes, header/footer-like content and grouped controls into a new `InputGroup` composition family. InputGroup owns layout and presentation only; it must not introduce another value, validation or form authority.

Reuse Moraine theme resolution and override behavior. This is a structural refactor, not a move to unstyled primitives.

## Target anatomy

```tsx
<Input
  ref={inputRef}
  aria-label="Project name"
  placeholder="Project name"
/>

<Textarea
  ref={textareaRef}
  aria-label="Description"
/>
```

Grouped single-line control:

```tsx
<InputGroup>
  <InputGroup.Addon align="inline-start">
    <SearchIcon aria-hidden="true" />
  </InputGroup.Addon>
  <InputGroup.Input
    aria-label="Search projects"
    placeholder="Search projects..."
  />
  <InputGroup.Addon align="inline-end">
    <Kbd>⌘K</Kbd>
  </InputGroup.Addon>
</InputGroup>
```

Grouped multiline control:

```tsx
<InputGroup>
  <InputGroup.Textarea
    aria-label="Message"
    placeholder="Write a message..."
  />
  <InputGroup.Addon align="block-end">
    <InputGroup.Text>Markdown supported</InputGroup.Text>
    <InputGroup.Button type="submit">Send</InputGroup.Button>
  </InputGroup.Addon>
</InputGroup>
```

## Public contract

### Input / Textarea

- Exactly one native editing element is the public host.
- `ref` points to `HTMLInputElement` / `HTMLTextAreaElement`.
- `class`, `style`, `classList`, `id`, `data-*`, `aria-*`, native input attributes and native events target that element.
- Remove wrapper-only `inputRef` / textarea equivalent once all callers migrate; add negative declaration tests for removed ambiguous props.
- Preserve normalized value APIs, modifiers, readonly/disabled behavior, form integration, SSR value semantics and existing validation adapters.
- Do not add `Input.Control` or `Textarea.Control` aliases.
- Do not add a hidden wrapper merely to keep old CSS selectors working.

### InputGroup

Expose only demonstrated parts:

- `InputGroup` — styled group container.
- `InputGroup.Input` — native input behavior/types with group presentation.
- `InputGroup.Textarea` — native textarea behavior/types with group presentation.
- `InputGroup.Addon` — prefix/suffix/header/footer/tool region with logical `align` values such as `inline-start`, `inline-end`, `block-start`, `block-end`.
- `InputGroup.Button` — thin group-aware button presentation using existing Button behavior where practical.
- `InputGroup.Text` — non-interactive supporting text.

Do not add public state/context APIs unless an actual consumer needs them.

InputGroup must not:

- own `value` or `onValueChange`;
- bind a Form field independently from its editing control;
- clone or parse children to discover the editing element;
- require exactly one editing control at runtime unless required by semantics;
- swallow native labels, descriptions, errors or FormField responsibilities.

### Styling

- Keep Provider/theme/`createComponentStyles` semantics.
- Independent `Input` / `Textarea` use their standalone presentation.
- `InputGroup.Input` / `.Textarea` share behavior and native props with standalone controls but use group-aware presentation directly; do not apply a complete standalone border/radius and then undo it with override classes.
- Root `classes/styles` and part-local `class/style` continue to override named slots.
- Migrate old wrapper slots intentionally to InputGroup slots; keep compatible control-facing slot names when their semantic target remains valid.
- `emptyTheme` may remove presentation but must not break required group geometry or native focusability.

## Prototype migration constraints

The [prototype](pr37-prototype-findings.md) validated native targeting and presentation-only grouping using existing text value/form/reset hooks. Production must share one native control implementation between standalone and grouped exports; temporary copied components are not a maintainable second path. Complete the existing validation, FormField and Textarea autoresize matrix rather than treating the pilot's trim/reset cases as exhaustive.

Add `inputGroup` to `MoraineThemeSchema` and the default theme, with typed slots/defaults and public namespace/Props exports. The prototype used two temporary schema assertions around `createComponentStyles`; remove that bridge in production. No Provider rewrite is required.

Use this tested migration direction when inventorying consumers:

| Old target                                                      | New target and precedence                                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Input/Textarea wrapper ref; `inputRef`/`textareaRef` on control | Leaf `ref` is native; layout ref belongs to InputGroup                                 |
| Standalone root and input/textarea slots                        | Combine on the native control; root override wins on conflicts, then local class/style |
| Leading/trailing regions                                        | InputGroup.Addon with inline alignment                                                 |
| Header/footer regions                                           | InputGroup.Addon with block alignment                                                  |
| Group root `classes/styles.input` or `.textarea`                | Corresponding native grouped control slot                                              |
| Grouped control `classes/styles.root`, local class/style        | Native control; part overrides narrowest                                               |

Record any incompatible legacy slot removal explicitly in the migration docs. Resolve group presentation directly instead of applying and undoing standalone border/radius styles. Test replacement themes, reactive variants, cnConfig and root/part overrides with the real typed theme entry.

## Scope

Primary implementation scope:

- `src/forms/input`
- `src/forms/textarea`
- `src/forms/input-group` (create)
- `src/theme/types.ts`, `src/theme/default-theme.ts` and focused theme tests for the new group entry
- `src/index.ts` and the existing theme export surface only for required InputGroup exports
- their docs pages and generated API metadata
- shared native text-control helpers/tests
- declaration tests
- direct Form/docs consumers that currently depend on Input/Textarea wrapper composition

Direct consumer edits are migrations only; do not redesign unrelated components.

## Steps

### 1. Record the old target split and migration map

Inventory every public Input/Textarea prop/slot that currently targets a wrapper versus the native control. Identify all consumers of `inputRef`, textarea wrapper refs, icon/prefix/suffix/header/footer composition and wrapper `classes/styles`.

Define the migration table before code changes, including old slot -> new Input/InputGroup target.

### 2. Add failing acceptance tests

Cover:

- Input `ref/class/style/id/aria/data/native events` on the actual `<input>`;
- Textarea equivalent on `<textarea>`;
- normalized `onValueChange` remains separate from native events;
- form reset, controlled/uncontrolled, modifiers, readonly and disabled behavior;
- SSR/hydration preserves the native node;
- InputGroup with addons before/after the control;
- grouped textarea block-end toolbar;
- Button inside an addon does not steal editing-control state;
- default theme, replacement theme, emptyTheme, root slot overrides and part-local overrides;
- declaration tests proving native ref/event targets and rejecting removed wrapper-only refs.

### 3. Implement one native text-control behavior path

Reuse or extract the smallest internal native text-control helpers needed by Input and Textarea. Keep standalone and group controls behaviorally identical for value/form semantics.

InputGroup presentation may share recipes/styles, but there must not be a second editing state implementation.

### 4. Migrate consumers and documentation

Replace old Input/Textarea child composition with InputGroup where grouping is actually needed. Do not wrap plain inputs just to preserve previous markup.

Docs must show:

1. plain Input;
2. plain Textarea;
3. InputGroup with icon/addon;
4. InputGroup multiline toolbar;
5. migration note for old wrapper `ref`, `inputRef`, children and slot targets.

Regenerate API metadata from the normal docs build.

## Verification

Run at minimum:

```sh
nub run test src/forms/input src/forms/textarea src/forms/input-group src/forms/shared
nub run typecheck
nub run test:types
nub run docs:build
nub run test
nub run qa
git diff --check
```

Inspect formatter/linter mutations and reject unrelated changes.

## Done criteria

- [ ] Input and Textarea public DOM props/ref target native elements.
- [ ] Wrapper composition has moved to InputGroup.
- [ ] InputGroup owns presentation only, not value/form state.
- [ ] InputGroup has a typed theme-schema/default-theme entry with no schema bridge assertions.
- [ ] Standalone and grouped controls share one native behavior implementation, including validation/reset/autoresize coverage.
- [ ] Existing normalized value/form behavior is preserved.
- [ ] Theme replacement, emptyTheme and local overrides work for standalone and grouped controls.
- [ ] Direct consumers and docs are migrated with an explicit compatibility map.
- [ ] Declaration, SSR and focused regression tests pass.
- [ ] Full repository verification passes with no out-of-scope tracked edits.

## STOP conditions

Stop and report if the migration requires two competing value/form authorities, if grouped controls can only be implemented by scanning/evaluating children, if native ref/event types must be erased, or if keeping an old wrapper target would force a hidden DOM layer into the new leaf controls.
