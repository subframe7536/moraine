## Fix

- [x] docs: blank line in normal codeblock should not be trimmed
- [x] unify component slot names
- [x] docs: support slot indicator in playground, like https://www.chakra-ui.com/docs/components/pin-input#explorer
- [x] docs polish
  - [x] usage sync and content correction, more guidance orientated
  - [x] richer and more real-world examples, reference:
    - https://coss.com/ui/particles
    - https://reui.io/components
  - [x] make content more human and agent friendly
- [x] make all form components use standard `value` / `onValueChange` / `onCheckedChange` / `onValueCommit` props with `useFormValue`
- [x] slider: unify the prop and slot name as `marker`, with data-slot `slider-marker`
- [x] cleanup "fill `as`" logic in extract-types.ts, only `as` in Base ispolymorphic component, add indicator in docs
- [x] docs: add neccessory `| undefined` in expanded prop row. `Function` should be `function`
- [x] icon card copy should not cause layout shift
- [x] make card composite, add `as`.
- [x] collapsible: move data-transition on wrapper to eliminate `:has` selector
- [x] landing page polish
- [x] resizable: refresh docs
- [x] expose `useBaseSelectSearchInput` with explicit BaseSelect state and keep query state internal
- [x] normalize public reactive utility naming and replace wildcard re-exports with explicit exports across `src/`
- [x] refactor theme and css engine
  - [x] remove local `ClassValue`, reuse it from `cn`, and use direct type re-exports
  - [x] simplify recipe and theme generator
  - [x] avoid circular type imports
  - [x] make UnoCSS theme options selector-scoped, grouped, typed, and optional
  - [x] complete semantic hover and active color usage
  - [x] verify Tailwind 4 and UnoCSS Wind3/Wind4; document Tailwind 3 as unsupported
  - [x] flatten CSS engine and style modules into `src/theme`
  - [x] move engine-specific logic to its entry file
  - [x] polish styling guides
- [x] reconsider `renderComponentOrElement` and its usage, cleanup small helpers
- [x] docs page polish
  - [x] fix: landing page and docs 's header padding are not same; docs&components link button on header 's visibility detection should same as sidebar
  - [x] use `@solid-primitives/clipboard` to unify docs/ 's copy logic
  - [x] move `docs/pages/docs/utils/create-list-virtualizer.mdx` to docs guide as a new page "Virtualization", make it more user and agent friendly, provider guides to setup `List` and `Combobox`
  - [x] cleanup `## Anatomy` section, cleanup descriptions, generate tree via config object instead of writing raw codeblock
  - [x] add docs header composition & polymorphism badge link
  - [x] update playground, try to showcase more slots
  - [x] add `data-loaded` state on toc indicator to prevent clip-path transition on load from 0 to target
- [x] add --backdrop, --shadow-surface, --shadow-overlay, --shadow-input
- [ ] select panel align with trigger

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table

## Agent

- [ ] mcp
- [ ] skills
