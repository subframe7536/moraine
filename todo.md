## Fix

- [x] polish switch component's indicator position in different sizes
- [ ] add new divider slot for slider to indicate step visually, enable via prop `divider?: boolean`.
  - [ ] introduce a new variant `bold`, which will make the track thicker than thumb.
  - [ ] use dot style in default variant, and use line style in bold variant.
- [ ] unify slot names, only contains inner element slots, the outest slot should be component itself, and add class / style props to component props, so no longer needed to setup classes / styles object for simple root component
- [ ] unify custom render function prop with prefix `render`, target should be `renderXXXX`
- [ ] reference from https://ink-ui.com , add primary/secondary/background/\*-{active,hover,focus} color tokens, avoid using alpha channel in color tokens
- [ ] button group component, which can be used to group buttons together, and support different sizes and variants.

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table

## Documentation

- [ ] Add `llm.txt`.
