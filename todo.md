## Fix

- [x] try to pass `jsx: true` and remove `jsxImportSource: "solid-js/h"` to `mdx` compiler, so generated code is jsx and can be used in `solid-js` directly, instead of compiled by satteri using `solid-js/h/jsx-runtime`.
- [x] try to use frontmatter to replace `<DocsHeader />` and `<DocsApiReference />`, so we can remove `docs/build/markdown/compile.ts` and `docs/build/markdown/compile.test.ts`, and also remove `DocsHeader` and `DocsApiReference` components, and also remove `docs/build/markdown/createDocsHastPlugin.ts` and `docs/build/markdown/createDocsCodePlugin.ts`.

- [ ] reference from https://ink-ui.com , add primary/secondary/background/\*-{active,hover,focus} color tokens
- [ ] unify slot names, only contains inner element slots, the outest slot should be component itself, and add class / style props to component props, so no longer needed to setup classes / styles object for simple root component
- [ ] add new dot/divider slot for slider to indicate step visually, enable via prop
- [ ] unify custom render function prop with prefix `render`, target should be `renderXXXX`

# V1

## Components

- [ ] Solid 2
- [ ] NavigationMenu
- [ ] Calendar https://ant.design/components/calendar.md
- [ ] DatePicker https://ant.design/components/date-picker.md
- [ ] Table: tanstack solid table

## Documentation

- [ ] Add documentation pages for config-driven usage, accessibility guarantees, keyboard behavior, form integration, and controlled/uncontrolled patterns.
- [ ] Add `llm.txt`.
