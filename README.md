# Moraine

Inspired by Nuxt UI and shadcn, Moraine is a comprehensive SolidJS component library with atomic class styling.

> [!important]
> **Status: Beta.** Breaking changes are allowed between minors before `v1.0.0`. Use at your own risk.

## Documentation

Full guide and examples: https://ui.subf.dev

## Quick Start

1. Install `moraine` in a Solid project

```bash
npm add moraine solid-js
```

2. Configure UnoCSS or Tailwind CSS. Moraine needs the integration and a scan of its published classes to render styles.

For UnoCSS, use Wind4 with the Moraine preset:

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

For Tailwind CSS v4, add the plugin and a source path relative to your stylesheet:

```css
@import 'tailwindcss';
@plugin 'moraine/tailwind';
@source '../node_modules/moraine/dist';
```

Import `moraine/icon.css` only when you want the optional bundled icon masks. It does not replace the required preset/plugin configuration.

3. Render a component. Built-in styles work without a Provider.

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

4. See the [component guides](https://ui.subf.dev) for usage and [Customization](https://ui.subf.dev/styling/customization) for style overrides. Components use built-in styles by default. Add `MoraineProvider` for Theme or class-merging overrides; [Advanced](https://ui.subf.dev/styling/advanced) explains inheritance and composition.

## Package entry points

Import components and `MoraineProvider` from `moraine`. Component subpaths and internal files are not supported entry points.

Use `moraine/theme` for Theme authoring, `moraine/styles` for readonly built-in style definitions, `moraine/utils` for shared hooks, and `moraine/unocss` or `moraine/tailwind` for styling integration. `moraine/virtualizer` provides the optional `useListVirtualizer` adapter and requires `@tanstack/virtual-core`.

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
