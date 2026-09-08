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

3. Wrap the application in `MoraineProvider` to load the official Theme. Components without a provider retain behavior and render unstyled.

```tsx
import { Button, Input, MoraineProvider } from 'moraine'

function App() {
  return (
    <MoraineProvider>
      <div class="flex flex-col gap-3">
        <Input placeholder="Enter text" />
        <Button variant="outline">Save changes</Button>
      </div>
    </MoraineProvider>
  )
}
```

Use `createTheme` from `moraine/theme` for sparse presentation layers:

```tsx
const compact = createTheme({ button: { defaults: { size: 'sm' }, base: { root: 'rounded-xl' } } })
const brand = createTheme({ extends: compact, button: { base: { root: 'font-semibold' } } })
<MoraineProvider theme={brand}><Button>Save</Button></MoraineProvider>
```

Root providers add the official Theme before custom layers. Nested providers append their layers; `MoraineUnstyledProvider` resets all inherited layers, including the official Theme. Styled providers inside that boundary inherit the reset. Reactive Theme replacement preserves component nodes and state.

Visual values resolve from instance props, inherited group/FormField values, then the latest Theme defaults. Only `undefined` falls back; `null` suppresses a visual default. Classes merge from Theme layers to group overrides, instance slot classes, and root `class`. Inline styles merge dynamic geometry, group styles, instance slot styles, and root `style`. State uses data/ARIA selectors such as `data-disabled:opacity-64`; it is not a Theme Variant.

Input and Textarea forward native attributes and events to their editable controls. `ref`, `class`, and `style` belong to the wrapper; `inputRef` and `textareaRef` target the native control. `onChange` receives the native event, while `onValueChange` receives the normalized value.

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
