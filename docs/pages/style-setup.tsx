import { ShikiCodeBlock } from '../components/shiki-code-block'

export default () => {
  return (
    <div class="mx-auto p-5 max-w-4xl space-y-10 lg:p-10 sm:p-8">
      <section class="py-2 space-y-4">
        <div class="max-w-3xl space-y-2">
          <h1 class="text-2xl text-foreground font-bold mt-8 sm:text-3xl">Style Setup</h1>
          <p class="text-muted-foreground sm:text-lg">
            Flint UI follows the shadcn-style token model. You can reuse existing theme variable
            sets (for example from tweakcn.com) and apply them with UnoCSS or Tailwind.
          </p>
        </div>
      </section>

      <section class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl text-foreground font-semibold">UnoCSS</h2>
          <p class="text-sm text-muted-foreground">
            Use either <code>presetWind3</code> or <code>presetWind4</code>, then add{' '}
            <code>presetTheme</code> from Flint UI.
          </p>
        </div>
        <ShikiCodeBlock variant="source" lang="tsx">{`// unocss.config.ts
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
    // ...other presets
  ],
})`}</ShikiCodeBlock>
      </section>

      <section class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl text-foreground font-semibold">Tailwind CSS v4</h2>
          <p class="text-sm text-muted-foreground">
            Add Flint UI package files to <code>@source</code> so utility classes are detected.
          </p>
        </div>
        <ShikiCodeBlock variant="source" lang="tsx">{`@import 'tailwindcss';
@source "./node_modules/@subf/flint-ui/**/*";`}</ShikiCodeBlock>
      </section>

      <section class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl text-foreground font-semibold">Tailwind CSS v3</h2>
          <p class="text-sm text-muted-foreground">
            Register Flint UI in <code>content</code>, then include the three Tailwind directives.
          </p>
        </div>
        <ShikiCodeBlock variant="source" lang="tsx">{`/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/@subf/flint-ui/**/*'],
  theme: {
    extend: {},
  },
  plugins: [],
}`}</ShikiCodeBlock>
        <ShikiCodeBlock variant="source" lang="css">{`@tailwind base;
@tailwind components;
@tailwind utilities;`}</ShikiCodeBlock>
      </section>

      <section class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl text-foreground font-semibold">Override Component Styles</h2>
          <p class="text-sm text-muted-foreground">
            Most components support <code>classes</code> and <code>styles</code>. Keys match slot
            names.
          </p>
        </div>
        <ShikiCodeBlock variant="source" lang="tsx">{`import { Button } from '@subf/flint-ui'

function MyButton() {
  return (
    <Button classes={{ label: 'bg-green-500' }} styles={{ root: { background: 'red' } }}>
      Click me
    </Button>
  )
}`}</ShikiCodeBlock>
      </section>

      <section class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl text-foreground font-semibold">
            Patch Built-in <code class="p-1 rounded bg-secondary">cn</code>
          </h2>
          <p class="text-sm text-muted-foreground">
            Flint UI exports <code>extendCN</code> so you can plug in class merge utilities like{' '}
            <code>tailwind-merge</code>.
          </p>
        </div>
        <ShikiCodeBlock variant="source" lang="tsx">{`import { extendCN } from '@subf/flint-ui'
import { twMerge } from 'tailwind-merge'

extendCN(twMerge)`}</ShikiCodeBlock>
      </section>
    </div>
  )
}
