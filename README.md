<p align="center">
  <svg width="128" height="128" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#212a36" width="512" height="512" x="0" y="0" rx="100" />
    <g fill="none" stroke="#fff" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
      <path d="M106 231.1L223.07 107l148.71 36.21L406 322.27l-89.53 82.39-166.76-28.83z" />
      <path d="M223.42 112.98l3.99 63.16 89.06 37.27 55.31-70.31" />
      <path d="M106 231.1l121.88-52.97-78.17 197.7z" />
      <path d="M400.96 322.98l-85.66-111.33 1.29 193z" />
    </g>
  </svg>
</p>

<h1 align="center">Flint UI</h1>

<p align="center">
  Yet Another <a href="https://solidjs.com">Solid.js</a> UI library
</p>

Inspired by the best of Nuxt UI and shadcn, Flint UI is a comprehensive SolidJS component library with atomic class styling, offering a fast, consistent, and intuitive user experiences.

> [!important]
> **Status: Active development**. Api may breaking changed before V1.0. Use at your risk!

## Features

- **SolidJS First**: Built specifically for SolidJS with reactive primitives
- **Kobalte Foundation**: Leverages accessible, unstyled primitives from Kobalte
- **Atomic CSS Classes**: Atomic CSS classes with Tailwind CSS (v3 and v4) and UnoCSS support
- **TypeScript**: Full TypeScript support with comprehensive type definitions
- **Accessible**: Built-in accessibility features from Kobalte
- **Modular**: Tree-shakable components organized by category

## Installation

```bash
bun add @subf/flint-ui solid-js
```

### UnoCSS

```bash
bun add unocss
```

- install `oxc-parser` and `oxc-walker` if needed

### Tailwind CSS

```bash
bun add tailwindcss
```

## Quick Start

```tsx
import { Button, Input } from '@subf/flint-ui'

function App() {
  return (
    <div>
      <Button variant="primary">Click me</Button>
      <Input placeholder="Enter text" />
    </div>
  )
}
```

## Components

### Elements

- Accordion
- Avatar
- Badge
- Button
- Card
- Collapsible
- Icon
- Kbd (Keyboard)
- Progress
- Resizable
- Separator

### Forms

- Checkbox & CheckboxGroup
- FileUpload
- Form & FormField
- Input
- InputNumber
- RadioGroup
- Select
- Slider
- Switch
- Textarea

### Navigation

- Breadcrumb
- CommandPalette
- Pagination
- Stepper
- Tabs

### Overlays

- ContextMenu
- Dialog
- DropdownMenu
- Popover
- Popup
- Sheet
- Tooltip

## Styling

Flint UI uses Shadcn's style system, so you can just reuse Shadcn's theme CSS variables (e.g. https://tweakcn.com)

### UnoCSS

You can use `presetWind3` or `presetWind4` here. `presetTheme` already includes Flint UI's animation utilities, so no extra UnoCSS animation preset is required.

```ts
// unocss.config.ts
import { defineConfig } from 'unocss'
import { presetWind3, presetWind4 } from 'unocss'
import { presetTheme } from '@subf/flint-ui/unocss-preset-theme'

export default defineConfig({
  presets: [
    // presetWind3(),
    presetWind4(),
    presetTheme({
      enableComponentLayer: true,
    }),
    // ... other presets
  ],
})
```

### Tailwind CSS v4

Create a CSS config file

```css
@import 'tailwindcss';
@source "./node_modules/@subf/flint-ui/**/*";
```

### Tailwind CSS v3

Create a `tailwind.config.js` or `tailwind.config.ts` file:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/@subf/flint-ui/**/*'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Then import the CSS:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Override

#### Component Style

Almost all component support `classes` and `styles` props, key is the same as `Slot`.

```tsx
import { Button } from '@subf/flint-ui'

function MyButton() {
  return (
    <Button classes={{ label: 'bg-green-500' }} styles={{ root: { background: 'red' } }}>
      Click me
    </Button>
  )
}
```

#### Built-in `cn`

Builtin `cn` only support concat classes, you can extend it by `extendCN`

```ts
import { extendCN } from '@subf/flint-ui'
import { twMerge } from 'tailwind-merge'

extendCN(twMerge)
```

## Development

```bash
# Install dependencies
bun install

# Start development build
bun run dev

# Run tests
bun run test

# Start docs development server
bun run docs

# Run linting and type checking
bun run qa
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run quality checks: `bun run qa`
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT

## Credits

- [Kobalte](https://kobalte.dev) - Accessible UI primitives
- [Nuxt UI](https://ui.nuxt.com) - Design inspiration
- [Shadcn/ui](https://ui.shadcn.com) - Component patterns
- [Zaidan](https://github.com/carere/zaidan) - Shadcn-like implementation inspiration
