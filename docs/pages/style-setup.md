# Style Setup

Moraine follows the shadcn-style token model. You can reuse existing theme variable sets (for example from tweakcn.com) and apply them with UnoCSS or Tailwind.

## UnoCSS

Use either `presetWind3` or `presetWind4`, then add `presetTheme` from Moraine. Built-in component animations are included in `presetTheme`, so no extra animation preset is needed.

```tsx
// unocss.config.ts
import { defineConfig } from 'unocss'
import { presetWind3, presetWind4 } from 'unocss'
import { presetTheme } from 'moraine/unocss-preset-theme'

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

## Tailwind CSS v4

Add Moraine package files to `@source` so utility classes are detected.

```css
@import 'tailwindcss';
@source "./node_modules/moraine/**/*";
```

## Tailwind CSS v3

Register Moraine in `content`, then include the three Tailwind directives.

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/moraine/**/*'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
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

## Patch Built-in `cn`

Moraine exports `extendCN` so you can plug in class merge utilities like `tailwind-merge`.

```tsx
import { extendCN } from 'moraine'
import { twMerge } from 'tailwind-merge'

extendCN(twMerge)
```
