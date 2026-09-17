# Moraine

Inspired by Nuxt UI and shadcn, Moraine is a comprehensive SolidJS component library with atomic class styling.

> [!important]
> **Status: Beta.** Breaking changes are allowed between minors before `v1.0.0`. Use at your own risk.

## Documention

Full guide and examples: https://ui.subf.dev

## Quick Start

1. Install `moraine` in a Solid project

```bash
npm add moraine solid-js
```

2. Configure a CSS engine. Moraine publishes atomic component classes rather than precompiled component CSS.

For UnoCSS, load either Wind4 or Wind3 with the Moraine preset and scan the published package. Wind3 support is limited to UnoCSS preset compatibility; Tailwind CSS remains v4-only and Moraine does not ship precompiled component CSS.

```ts
// unocss.config.ts
import { defineConfig, presetWind4 } from '@subf/unocss'
import { presetMoraine } from 'moraine/unocss'

export default defineConfig({
  presets: [presetWind4(), presetMoraine()],
  content: {
    filesystem: ['./node_modules/moraine/dist/**/*.{mjs,jsx}'],
  },
})
```

```ts
// unocss.config.ts — Wind3
import { defineConfig, presetWind3 } from '@subf/unocss'
import { presetMoraine } from 'moraine/unocss'

export default defineConfig({
  presets: [presetWind3(), presetMoraine()],
  content: {
    filesystem: ['./node_modules/moraine/dist/**/*.{mjs,jsx}'],
  },
})
```

For Tailwind CSS v4, add the plugin and a source path relative to your stylesheet:

```css
@import 'tailwindcss';
@plugin 'moraine/tailwind';
@source '../node_modules/moraine/dist';
```

Import `moraine/icon.css` only when you want the optional bundled icon masks. It does not replace the required preset/plugin configuration.

3. Moraine components include their official recipes by default; a Provider is only needed for Theme or `cnConfig` overrides.

```tsx
import { Button, Input } from 'moraine'

function App() {
  return (
    <>
      <Input placeholder="Enter text" />
      <Button variant="outline">Save changes</Button>
    </>
  )
}
```

Use `defineTheme` for immutable partial overrides:

```tsx
import { Button, MoraineProvider } from 'moraine'
import { defineTheme } from 'moraine/theme'

const theme = defineTheme({
  button: { defaultVariants: { size: 'sm' }, base: { root: 'rounded-xl' } },
})

<MoraineProvider theme={theme}><Button>Save</Button></MoraineProvider>
```

A Provider with `theme={undefined}` inherits its parent Theme, an explicit Theme replaces it, and `theme={null}` clears inherited overrides back to component-default recipes. Compose Themes explicitly with `defineTheme({ extends: parentTheme, ... })`; use component-level `replace: true` when a Theme must replace the built-in recipe presentation. `cnConfig` remains independent and reactive. Advanced tooling can import readonly component recipes such as `buttonRecipe` from `moraine/styles`.

Input and Textarea forward native attributes and events to their editable controls. `ref`, `class`, and `style` target the native control. Compose icons, text, and actions through `InputGroup.Leading` and `InputGroup.Trailing`. `onChange` receives the native event, while `onValueChange` receives the normalized value.

## Package entry points

Import every component and `MoraineProvider` from `moraine`. The package preserves ESM module boundaries so production bundlers can remove unused components; component subpaths and internal files are not public APIs.

Use `moraine/theme` for Theme authoring, `moraine/styles` for advanced readonly recipe access, `moraine/utils` for shared hooks, and `moraine/unocss` or `moraine/tailwind` for styling integration. Solid-aware bundlers select the preserved JSX entry for client or server compilation; other bundlers use the compiled browser ESM entry.

The optional `useListVirtualizer` adapter is available from `moraine/virtualizer` and requires `@tanstack/virtual-core`. It is not exported by `moraine/utils`.

## Development

```bash
nub install
nub run dev
nub run test
nub run qa
```

## License

MIT

## Credits

- [Kobalte](https://kobalte.dev) - Accessible UI primitives
- [Nuxt UI](https://ui.nuxt.com) - Design inspiration
- [Shadcn/ui](https://ui.shadcn.com) - Component patterns
- [Zaidan](https://github.com/carere/zaidan) - Shadcn-like implementation inspiration
