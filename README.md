# Rock UI

A comprehensive, opinionated component library for SolidJS, built on top of Kobalte primitives with UnoCSS styling.

**Status: Active development**. Api may breaking changed before V1.0. Use at your risk!

## Features

- **SolidJS First**: Built specifically for SolidJS with reactive primitives
- **Kobalte Foundation**: Leverages accessible, unstyled primitives from Kobalte
- **Atomic CSS Classes**: Atomic CSS classes with Tailwind CSS (v3 and v4) and UnoCSS support
- **TypeScript**: Full TypeScript support with comprehensive type definitions
- **Accessible**: Built-in accessibility features from Kobalte
- **Modular**: Tree-shakable components organized by category

## Installation

```bash
bun add @subf/rock-ui solid-js
```

### UnoCSS

```bash
bun add unocss oxc-parser oxc-walker
```

### Tailwind CSS

```bash
bun add tailwindcss
```

## Quick Start

```tsx
import { Button, Input } from '@subf/rock-ui'

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

Rock UI uses Shadcn's style system, so you can just reuse Shadcn's theme CSS variables (e.g. https://tweakcn.com)

### UnoCSS

You can use `presetWind3` or `presetWind4` here

```ts
// unocss.config.ts
import { defineConfig } from 'unocss'
import { presetWind3, presetWind4 } from 'unocss'
import { presetTheme } from '@subf/rock-ui/unocss-preset-theme'

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
@source "./node_modules/@subf/rock-ui/**/*";
```

### Tailwind CSS v3

Create a `tailwind.config.js` or `tailwind.config.ts` file:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/@subf/rock-ui/**/*'],
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
import { Button } from '@subf/rock-ui'

;<Button classes={{ label: 'bg-green-500' }} styles={{ root: 'bg-red-500' }}>
  Click me
</Button>
```

#### Built-in `cn`

Builtin `cn` only support concat classes, you can extend it by `extendCN`

```ts
import { extendCN } from '@subf/rock-ui'
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
