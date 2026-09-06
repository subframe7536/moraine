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

3. Create the official Design once and provide it at the application root. Components without a provider render unstyled.

```tsx
import { Button, Input, MoraineProvider } from 'moraine'
import { createDesign } from 'moraine/design'

const design = createDesign()

function App() {
  return (
    <MoraineProvider design={design}>
      <div class="flex flex-col gap-3">
        <Input placeholder="Enter text" />
        <Button variant="outline">Save changes</Button>
      </div>
    </MoraineProvider>
  )
}
```

`createDesign({ button: { defaultVariants: { size: 'sm' }, base: { root: 'rounded-xl' } } })` extends the official recipes. Use `preset: false` for an unstyled Design, or `extends: existingDesign` for explicit inheritance. Nested providers replace the Design without remounting components. UnoCSS and Tailwind integrations do not override global transition defaults.

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
