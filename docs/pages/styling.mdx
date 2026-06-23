# Styling

Moraine follows the shadcn-style token model. You can reuse existing theme variable sets (for example from tweakcn.com) and apply them with UnoCSS or Tailwind.

## UnoCSS

Use either `presetWind3` or `presetWind4`, then add `presetTheme` from Moraine. Built-in component animations are included in `presetTheme`, so no extra animation preset is needed.

[`@subf/unocss`](https://github.com/subframe7536/unocss) is a subset of UnoCSS that optimizes for `solid-js` + `oxlint`'s use case. It is recommended for use with Moraine, but the full `unocss` can also be used if desired.

```tsx
// unocss.config.ts
import { presetWind3, presetWind4 } from '@subf/unocss'
import { presetTheme } from 'moraine/unocss'

export default defineConfig({
  presets: [
    // presetWind3(),
    presetWind4(),
    presetTheme({
      enableComponentLayer: true,
    }),
    // ...other presets
  ],
})
```

## Tailwind CSS

Moraine ships a first-class Tailwind plugin that injects CSS variable tokens, theme extensions (colors, font families, radius, shadows, keyframes, animations, animation metadata), and `icon-*` utility stubs. It also provides `data-*` and `aria-*` variants for attribute-based styling.

### v4

```css
@import 'tailwindcss';

/* Moraine plugin: tokens, theme, icon stubs */
@plugin 'moraine/tailwind';

/* Optional: on-demand icon utilities (recommended) */
@plugin '@iconify/tailwind' {
  collections: lucide;
}

/* Scan moraine dist for component utility classes */
@source './node_modules/moraine/**/*';
```

Or, for a zero-config icon setup (larger bundle), import the pre-built icon CSS instead:

```css
@import 'moraine/icon.css';
```

### v3

```js
/** @type {import('tailwindcss').Config} */
const { addIconSelectors } = require('@iconify/tailwind')
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './node_modules/moraine/dist/**/*'],
  plugins: [
    require('moraine/tailwind')(),
    addIconSelectors(['lucide']), // optional, for on-demand icon utilities
  ],
}
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Icon tiers

| Tier                        | How                                                   | Size              |
| --------------------------- | ----------------------------------------------------- | ----------------- |
| **1 — `moraine/icon.css`**  | `@import 'moraine/icon.css'` — zero deps              | ≈ full lucide set |
| **2 — `@iconify/tailwind`** | Install `@iconify/tailwind`, use per the config above | On-demand ✓       |

### Plugin options

```ts
import { moraineTailwind } from 'moraine/tailwind'

moraineTailwind({
  icons: true, // emit icon-* utility stubs (default: true)
})
```

## Override Component Styles

Most components support `classes` and `styles`. Keys match slot names.

```tsx
import { Button } from 'moraine'

function MyButton() {
  return (
    <Button classes={{ label: 'bg-green-500' }} styles={{ root: { background: 'red' } }}>
      Click me
    </Button>
  )
}
```

## Class Concatenation

Moraine provides `cn()` and `cva()` utilities that concatenate class strings and conditionals. It is used internally to merge user-provided classes with defaults.

```ts
import { cn, cva } from 'moraine'

cn('btn', 'btn-primary', isDisabled && 'btn-disabled') // => "btn btn-primary btn-disabled"

const buttonClasses = cva('btn', {
  variants: {
    color: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
    },
    disabled: {
      true: 'btn-disabled',
    },
  },
})
// Reuse `cn()` under the hood to merge variant classes with other conditionals
buttonClasses({ color: 'primary', disabled: isDisabled }, 'other', condition && 'another')
// => "btn btn-primary btn-disabled other another"
```

## Patch Built-in `cn`

Moraine exports `extendCN` so you can plug in class merge utilities like `tailwind-merge`.

```tsx
import { extendCN } from 'moraine'
import { twMerge } from 'tailwind-merge'

extendCN(twMerge)
```
