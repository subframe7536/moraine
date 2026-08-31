import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { addIconSelectors } from '@iconify/tailwind'
import { __unstable__loadDesignSystem, compile } from 'tailwindcss'
import { describe, expect, test } from 'vitest'

import { DEFAULT_ICON_SHORTCUTS } from '../shared/style/icons.ts'

import { moraineTailwind } from './index.ts'

const THEME_CSS = readFileSync(
  resolve(__dirname, '../../node_modules/tailwindcss/theme.css'),
  'utf8',
)
const UTILITIES_CSS = readFileSync(
  resolve(__dirname, '../../node_modules/tailwindcss/utilities.css'),
  'utf8',
)
const BASE_CSS = `${THEME_CSS}\n${UTILITIES_CSS}`

function moraineLoadModule(options?: { icons?: boolean }) {
  return async (id: string) => ({
    path: id,
    base: '',
    module: moraineTailwind(options),
  })
}

/**
 * Simulates the v4 config from docs/pages/styling.md:
 *
 *   plugin 'moraine/tailwind';
 *   plugin '@iconify/tailwind' { collections: lucide; }
 */
function combinedLoadModule(moraineOptions?: { icons?: boolean }) {
  return async (id: string) => {
    if (id === 'virtual:moraine') {
      return { path: id, base: '', module: moraineTailwind(moraineOptions) }
    }
    if (id === 'virtual:iconify') {
      return { path: id, base: '', module: addIconSelectors(['lucide']) }
    }
    throw new Error(`Unknown plugin: ${id}`)
  }
}

async function loadDesignSystem(options?: { icons?: boolean }) {
  return __unstable__loadDesignSystem(`${BASE_CSS}\n@plugin "virtual:moraine"`, {
    loadModule: moraineLoadModule(options),
  })
}

async function compileCSS(candidates: string[], options?: { icons?: boolean }) {
  const { build } = await compile(`${BASE_CSS}\n@plugin "virtual:moraine"`, {
    loadModule: moraineLoadModule(options),
  })
  return build(candidates)
}

async function loadDesignSystemWithIconify(moraineOptions?: { icons?: boolean }) {
  const css = [BASE_CSS, '@plugin "virtual:moraine";', '@plugin "virtual:iconify";'].join('\n')
  return __unstable__loadDesignSystem(css, {
    loadModule: combinedLoadModule(moraineOptions),
  })
}

async function compileCSSWithIconify(candidates: string[], moraineOptions?: { icons?: boolean }) {
  const css = [BASE_CSS, '@plugin "virtual:moraine";', '@plugin "virtual:iconify";'].join('\n')
  const { build } = await compile(css, {
    loadModule: combinedLoadModule(moraineOptions),
  })
  return build(candidates)
}

// ─── Colors ───────────────────────────────────────────────────────────

describe('colors', () => {
  test('bg-primary resolves to var(--primary)', async () => {
    const css = await compileCSS(['bg-primary'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .bg-primary {
        background-color: var(--primary);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('text-foreground resolves to var(--foreground)', async () => {
    const css = await compileCSS(['text-foreground'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .text-foreground {
        color: var(--foreground);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('bg-background resolves to var(--background)', async () => {
    const css = await compileCSS(['bg-background'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .bg-background {
        background-color: var(--background);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('primary-foreground color resolves', async () => {
    const css = await compileCSS(['text-primary-foreground'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .text-primary-foreground {
        color: var(--primary-foreground);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('secondary colors resolve', async () => {
    const css = await compileCSS(['bg-secondary', 'text-secondary-foreground'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .bg-secondary {
        background-color: var(--secondary);
      }
      .text-secondary-foreground {
        color: var(--secondary-foreground);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('card colors resolve', async () => {
    const css = await compileCSS(['bg-card', 'text-card-foreground'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .bg-card {
        background-color: var(--card);
      }
      .text-card-foreground {
        color: var(--card-foreground);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('muted colors resolve', async () => {
    const css = await compileCSS(['bg-muted', 'text-muted-foreground'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .bg-muted {
        background-color: var(--muted);
      }
      .text-muted-foreground {
        color: var(--muted-foreground);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('accent colors resolve', async () => {
    const css = await compileCSS(['bg-accent', 'text-accent-foreground'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .bg-accent {
        background-color: var(--accent);
      }
      .text-accent-foreground {
        color: var(--accent-foreground);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('destructive colors resolve', async () => {
    const css = await compileCSS(['bg-destructive', 'text-destructive-foreground'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .bg-destructive {
        background-color: var(--destructive);
      }
      .text-destructive-foreground {
        color: var(--destructive-foreground);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('semantic hover and active colors resolve with base fallbacks', async () => {
    const css = await compileCSS([
      'bg-background-hover',
      'bg-card-active',
      'bg-popover-hover',
      'bg-primary-active',
      'bg-secondary-hover',
      'bg-muted-active',
      'bg-accent-hover',
      'bg-destructive-active',
    ])

    expect(css).toMatchInlineSnapshot()
    expect(css).not.toContain('-focus')
  })

  test('border/ring/input tokens resolve', async () => {
    const css = await compileCSS(['border-border', 'ring-ring', 'bg-input'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .bg-accent-hover {
        background-color: var(--accent-hover, var(--accent));
      }
      .bg-background-hover {
        background-color: var(--background-hover, var(--background));
      }
      .bg-card-active {
        background-color: var(--card-active, var(--card-hover, var(--card)));
      }
      .bg-destructive-active {
        background-color: var(--destructive-active, var(--destructive-hover, var(--destructive)));
      }
      .bg-muted-active {
        background-color: var(--muted-active, var(--muted-hover, var(--muted)));
      }
      .bg-popover-hover {
        background-color: var(--popover-hover, var(--popover));
      }
      .bg-primary-active {
        background-color: var(--primary-active, var(--primary-hover, var(--primary)));
      }
      .bg-secondary-hover {
        background-color: var(--secondary-hover, var(--secondary));
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })
})

// ─── Border Radius ────────────────────────────────────────────────────

describe('border radius', () => {
  test('rounded-lg uses var(--radius)', async () => {
    const css = await compileCSS(['rounded-lg'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .border-border {
        border-color: var(--border);
      }
      .bg-input {
        background-color: var(--input);
      }
      .ring-ring {
        --tw-ring-color: var(--ring);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('rounded-xl uses calc(var(--radius) * 1.4)', async () => {
    const css = await compileCSS(['rounded-xl'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .rounded-xl {
        border-radius: calc(var(--radius) * 1.4);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('rounded-sm uses calc(var(--radius) * 0.6)', async () => {
    const css = await compileCSS(['rounded-sm'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .rounded-sm {
        border-radius: calc(var(--radius) * 0.6);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('rounded-xs uses calc(var(--radius) * 0.5)', async () => {
    const css = await compileCSS(['rounded-xs'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .rounded-xs {
        border-radius: calc(var(--radius) * 0.5);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('rounded-2xl through rounded-4xl resolve', async () => {
    const css = await compileCSS(['rounded-2xl', 'rounded-3xl', 'rounded-4xl'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .rounded-2xl {
        border-radius: calc(var(--radius) * 1.8);
      }
      .rounded-3xl {
        border-radius: calc(var(--radius) * 2.2);
      }
      .rounded-4xl {
        border-radius: calc(var(--radius) * 2.6);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })
})

// ─── Shadows ──────────────────────────────────────────────────────────

describe('shadows', () => {
  test('shadow uses var(--shadow)', async () => {
    const css = await compileCSS(['shadow'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @layer properties;
      .shadow {
        --tw-shadow: var(--shadow);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @property --tw-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-inset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-ring-inset {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-offset-width {
        syntax: "<length>";
        inherits: false;
        initial-value: 0px;
      }
      @property --tw-ring-offset-color {
        syntax: "*";
        inherits: false;
        initial-value: #fff;
      }
      @property --tw-ring-offset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @layer properties {
        @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
          *, ::before, ::after, ::backdrop {
            --tw-shadow: 0 0 #0000;
            --tw-shadow-color: initial;
            --tw-shadow-alpha: 100%;
            --tw-inset-shadow: 0 0 #0000;
            --tw-inset-shadow-color: initial;
            --tw-inset-shadow-alpha: 100%;
            --tw-ring-color: initial;
            --tw-ring-shadow: 0 0 #0000;
            --tw-inset-ring-color: initial;
            --tw-inset-ring-shadow: 0 0 #0000;
            --tw-ring-inset: initial;
            --tw-ring-offset-width: 0px;
            --tw-ring-offset-color: #fff;
            --tw-ring-offset-shadow: 0 0 #0000;
          }
        }
      }
      "
    `)
  })

  test('shadow-sm uses var(--shadow-sm)', async () => {
    const css = await compileCSS(['shadow-sm'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @layer properties;
      .shadow-sm {
        --tw-shadow: var(--shadow-sm);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @property --tw-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-inset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-ring-inset {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-offset-width {
        syntax: "<length>";
        inherits: false;
        initial-value: 0px;
      }
      @property --tw-ring-offset-color {
        syntax: "*";
        inherits: false;
        initial-value: #fff;
      }
      @property --tw-ring-offset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @layer properties {
        @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
          *, ::before, ::after, ::backdrop {
            --tw-shadow: 0 0 #0000;
            --tw-shadow-color: initial;
            --tw-shadow-alpha: 100%;
            --tw-inset-shadow: 0 0 #0000;
            --tw-inset-shadow-color: initial;
            --tw-inset-shadow-alpha: 100%;
            --tw-ring-color: initial;
            --tw-ring-shadow: 0 0 #0000;
            --tw-inset-ring-color: initial;
            --tw-inset-ring-shadow: 0 0 #0000;
            --tw-ring-inset: initial;
            --tw-ring-offset-width: 0px;
            --tw-ring-offset-color: #fff;
            --tw-ring-offset-shadow: 0 0 #0000;
          }
        }
      }
      "
    `)
  })

  test('shadow-lg uses var(--shadow-lg)', async () => {
    const css = await compileCSS(['shadow-lg'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @layer properties;
      .shadow-lg {
        --tw-shadow: var(--shadow-lg);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @property --tw-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-inset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-ring-inset {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-offset-width {
        syntax: "<length>";
        inherits: false;
        initial-value: 0px;
      }
      @property --tw-ring-offset-color {
        syntax: "*";
        inherits: false;
        initial-value: #fff;
      }
      @property --tw-ring-offset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @layer properties {
        @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
          *, ::before, ::after, ::backdrop {
            --tw-shadow: 0 0 #0000;
            --tw-shadow-color: initial;
            --tw-shadow-alpha: 100%;
            --tw-inset-shadow: 0 0 #0000;
            --tw-inset-shadow-color: initial;
            --tw-inset-shadow-alpha: 100%;
            --tw-ring-color: initial;
            --tw-ring-shadow: 0 0 #0000;
            --tw-inset-ring-color: initial;
            --tw-inset-ring-shadow: 0 0 #0000;
            --tw-ring-inset: initial;
            --tw-ring-offset-width: 0px;
            --tw-ring-offset-color: #fff;
            --tw-ring-offset-shadow: 0 0 #0000;
          }
        }
      }
      "
    `)
  })

  test('all shadow sizes use CSS custom properties', async () => {
    const css = await compileCSS([
      'shadow-2xs',
      'shadow-xs',
      'shadow-sm',
      'shadow',
      'shadow-md',
      'shadow-lg',
      'shadow-xl',
      'shadow-2xl',
    ])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @layer properties;
      .shadow {
        --tw-shadow: var(--shadow);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      .shadow-2xl {
        --tw-shadow: var(--shadow-2xl);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      .shadow-2xs {
        --tw-shadow: var(--shadow-2xs);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      .shadow-lg {
        --tw-shadow: var(--shadow-lg);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      .shadow-md {
        --tw-shadow: var(--shadow-md);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      .shadow-sm {
        --tw-shadow: var(--shadow-sm);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      .shadow-xl {
        --tw-shadow: var(--shadow-xl);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      .shadow-xs {
        --tw-shadow: var(--shadow-xs);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @property --tw-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-inset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-ring-inset {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-offset-width {
        syntax: "<length>";
        inherits: false;
        initial-value: 0px;
      }
      @property --tw-ring-offset-color {
        syntax: "*";
        inherits: false;
        initial-value: #fff;
      }
      @property --tw-ring-offset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @layer properties {
        @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
          *, ::before, ::after, ::backdrop {
            --tw-shadow: 0 0 #0000;
            --tw-shadow-color: initial;
            --tw-shadow-alpha: 100%;
            --tw-inset-shadow: 0 0 #0000;
            --tw-inset-shadow-color: initial;
            --tw-inset-shadow-alpha: 100%;
            --tw-ring-color: initial;
            --tw-ring-shadow: 0 0 #0000;
            --tw-inset-ring-color: initial;
            --tw-inset-ring-shadow: 0 0 #0000;
            --tw-ring-inset: initial;
            --tw-ring-offset-width: 0px;
            --tw-ring-offset-color: #fff;
            --tw-ring-offset-shadow: 0 0 #0000;
          }
        }
      }
      "
    `)
  })
})

// ─── Z-index ─────────────────────────────────────────────────────────

describe('z-index', () => {
  test('semantic z-index utilities resolve', async () => {
    const css = await compileCSS([
      'z-base',
      'z-raised',
      'z-control',
      'z-sticky',
      'z-resize',
      'z-overlay',
      'z-floating',
    ])

    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .z-base {
        z-index: 1;
      }
      .z-control {
        z-index: 3;
      }
      .z-floating {
        z-index: 50;
      }
      .z-overlay {
        z-index: 40;
      }
      .z-raised {
        z-index: 2;
      }
      .z-resize {
        z-index: 20;
      }
      .z-sticky {
        z-index: 10;
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })
})

// ─── Animations ───────────────────────────────────────────────────────

describe('animations', () => {
  test('animate-mo-enter uses CSS variable duration', async () => {
    const css = await compileCSS(['animate-mo-enter'])
    expect(css).toMatchInlineSnapshot()
  })

  test('animate-mo-exit uses CSS variable duration', async () => {
    const css = await compileCSS(['animate-mo-exit'])
    expect(css).toMatchInlineSnapshot()
  })

  test('mo-enter keyframe uses CSS variable transforms', async () => {
    const css = await compileCSS(['animate-mo-enter'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .animate-mo-enter {
        animation: mo-enter var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms)) cubic-bezier(0.16, 1, 0.3, 1) 1;
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @keyframes mo-enter {
        from {
          opacity: var(--mo-enter-opacity, 1);
          transform: translate3d(var(--mo-enter-translate-x, 0), var(--mo-enter-translate-y, 0), 0) scale(var(--mo-enter-scale, 1)) rotate(var(--mo-enter-rotate, 0));
        }
      }
      "
    `)
  })

  test('mo-exit keyframe uses CSS variable transforms', async () => {
    const css = await compileCSS(['animate-mo-exit'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .animate-mo-exit {
        animation: mo-exit var(--mo-anim-duration,var(--mo-anim-duration-exit,150ms)) cubic-bezier(0.7, 0, 0.84, 0) 1;
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @keyframes mo-exit {
        to {
          opacity: var(--mo-exit-opacity, 1);
          transform: translate3d(var(--mo-exit-translate-x, 0), var(--mo-exit-translate-y, 0), 0) scale(var(--mo-exit-scale, 1)) rotate(var(--mo-exit-rotate, 0));
        }
      }
      "
    `)
  })

  test('looping animations use shared duration and easing', async () => {
    const css = await compileCSS(['animate-carousel', 'animate-swing', 'animate-elastic'])
    expect(css).toMatchInlineSnapshot()
  })

  test('spin animation uses shared duration and linear easing', async () => {
    const css = await compileCSS(['animate-spin'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .animate-spin {
        animation: spin var(--mo-anim-duration,var(--mo-anim-duration-spin,1s)) linear infinite;
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      "
    `)
  })

  test('standard transition utilities use shared enter tokens', async () => {
    const css = await compileCSS([
      'transition',
      'transition-all',
      'transition-colors',
      'transition-opacity',
      'transition-transform',
      'transition-mo-enter',
      'transition-mo-exit',
    ])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .animate-carousel {
        animation: carousel var(--mo-anim-duration,var(--mo-anim-duration-loop,2s)) ease-in-out infinite;
      }
      .animate-elastic {
        animation: elastic var(--mo-anim-duration,var(--mo-anim-duration-loop,2s)) ease-in-out infinite;
      }
      .animate-swing {
        animation: swing var(--mo-anim-duration,var(--mo-anim-duration-loop,2s)) ease-in-out infinite;
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @keyframes carousel {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
      @keyframes swing {
        0%, 100% {
          transform: translateX(-60%);
        }
        50% {
          transform: translateX(60%);
        }
      }
      @keyframes elastic {
        0% {
          transform: translateX(-100%) scaleX(0.9);
        }
        45% {
          transform: translateX(0) scaleX(1);
        }
        100% {
          transform: translateX(100%) scaleX(0.9);
        }
      }
      "
    `)
    expect(css).not.toContain('.transition-mo-enter')
    expect(css).not.toContain('.transition-mo-exit')
  })
})

// ─── Icon Utilities ──────────────────────────────────────────────────

describe('icon utilities', () => {
  test('icon classes appear in class list when icons enabled', async () => {
    const ds = await loadDesignSystem({ icons: true })
    const classList = ds.getClassList()
    const iconClasses = classList.filter(([name]) => name.startsWith('icon-')).map(([name]) => name)

    expect(iconClasses.length).toBe(DEFAULT_ICON_SHORTCUTS.length)

    for (const [name] of DEFAULT_ICON_SHORTCUTS) {
      expect(iconClasses).toContain(name)
    }
  })

  test('icon classes do not appear when icons disabled', async () => {
    const ds = await loadDesignSystem({ icons: false })
    const classList = ds.getClassList()
    const iconClasses = classList.filter(([name]) => name.startsWith('icon-'))
    expect(iconClasses).toHaveLength(0)
  })

  test('icons default to enabled', async () => {
    const ds = await loadDesignSystem()
    const classList = ds.getClassList()
    const iconClasses = classList.filter(([name]) => name.startsWith('icon-'))
    expect(iconClasses.length).toBe(DEFAULT_ICON_SHORTCUTS.length)
  })

  test('icon stubs produce no CSS (handled by iconify)', async () => {
    const ds = await loadDesignSystem({ icons: true })
    const cssResults = ds.candidatesToCss(['icon-arrow-down', 'icon-check', 'icon-close'])
    for (const result of cssResults) {
      expect(result).toBeNull()
    }
  })

  test('all expected icon names are registered', async () => {
    const ds = await loadDesignSystem({ icons: true })
    const classList = ds.getClassList()
    const iconNames = classList.filter(([name]) => name.startsWith('icon-')).map(([name]) => name)

    const expected = [
      'icon-arrow-down',
      'icon-arrow-up',
      'icon-arrow-left',
      'icon-arrow-right',
      'icon-check',
      'icon-close',
      'icon-menu',
      'icon-plus',
      'icon-minus',
      'icon-chevron-down',
      'icon-chevron-up',
      'icon-chevron-left',
      'icon-chevron-right',
    ]
    for (const icon of expected) {
      expect(iconNames).toContain(icon)
    }
  })
})

// ─── Full compilation ────────────────────────────────────────────────

// ─── Font Families ────────────────────────────────────────────────────

describe('font families', () => {
  test('font-sans resolves to var(--font-sans)', async () => {
    const css = await compileCSS(['font-sans'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .transition {
        transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events;
        transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
        transition-duration: var(--tw-duration, var(--default-transition-duration));
      }
      .transition-all {
        transition-property: all;
        transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
        transition-duration: var(--tw-duration, var(--default-transition-duration));
      }
      .transition-colors {
        transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
        transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
        transition-duration: var(--tw-duration, var(--default-transition-duration));
      }
      .transition-opacity {
        transition-property: opacity;
        transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
        transition-duration: var(--tw-duration, var(--default-transition-duration));
      }
      .transition-transform {
        transition-property: transform, translate, scale, rotate;
        transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
        transition-duration: var(--tw-duration, var(--default-transition-duration));
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('font-mono resolves to var(--font-mono)', async () => {
    const css = await compileCSS(['font-mono'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .font-mono {
        font-family: var(--font-mono);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('font-serif resolves to var(--font-serif)', async () => {
    const css = await compileCSS(['font-serif'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .font-serif {
        font-family: var(--font-serif);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })
})

// ─── Attribute Variants ───────────────────────────────────────────────

describe('attribute variants', () => {
  test('data-active variant transforms correctly', async () => {
    const css = await compileCSS(['data-active:bg-primary'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      [data-active] .data-active\\:bg-primary {
        background-color: var(--primary);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('data-checked variant transforms correctly', async () => {
    const css = await compileCSS(['data-checked:text-foreground'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      [data-checked] .data-checked\\:text-foreground {
        color: var(--foreground);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('data-disabled variant works with opacity', async () => {
    const css = await compileCSS(['data-disabled:opacity-50'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      [data-disabled] .data-disabled\\:opacity-50 {
        opacity: 50%;
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('aria-busy variant transforms correctly', async () => {
    const css = await compileCSS(['aria-busy:opacity-80'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      [aria-busy] .aria-busy\\:opacity-80 {
        opacity: 80%;
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('aria-checked variant works with moraine colors', async () => {
    const css = await compileCSS(['aria-checked:bg-accent'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      [aria-checked] .aria-checked\\:bg-accent {
        background-color: var(--accent);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('aria-disabled variant works with pointer-events', async () => {
    const css = await compileCSS(['aria-disabled:pointer-events-none'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      [aria-disabled] .aria-disabled\\:pointer-events-none {
        pointer-events: none;
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('compiles the button press interaction selector', async () => {
    const css = await compileCSS([
      'transition-all',
      '[&:active:not([aria-haspopup])]:translate-y-px',
    ])

    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @layer properties;
      .transition-all {
        transition-property: all;
        transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
        transition-duration: var(--tw-duration, var(--default-transition-duration));
      }
      .\\[\\&\\:active\\:not\\(\\[aria-haspopup\\]\\)\\]\\:translate-y-px:active:not([aria-haspopup]) {
        --tw-translate-y: 1px;
        translate: var(--tw-translate-x) var(--tw-translate-y);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @property --tw-translate-x {
        syntax: "*";
        inherits: false;
        initial-value: 0;
      }
      @property --tw-translate-y {
        syntax: "*";
        inherits: false;
        initial-value: 0;
      }
      @property --tw-translate-z {
        syntax: "*";
        inherits: false;
        initial-value: 0;
      }
      @layer properties {
        @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
          *, ::before, ::after, ::backdrop {
            --tw-translate-x: 0;
            --tw-translate-y: 0;
            --tw-translate-z: 0;
          }
        }
      }
      "
    `)
  })

  test('data variants compose with hover', async () => {
    const css = await compileCSS(['hover:data-active:bg-primary'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @media (hover: hover) {
        [data-active] .hover\\:data-active\\:bg-primary:hover {
          background-color: var(--primary);
        }
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })
})

// ─── Full compilation ────────────────────────────────────────────────

describe('full compilation', () => {
  test('multiple utility types compile together', async () => {
    const css = await compileCSS([
      'bg-primary',
      'text-primary-foreground',
      'rounded-lg',
      'shadow-md',
      'animate-mo-enter',
      'border-border',
    ])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @layer properties;
      .animate-mo-enter {
        animation: mo-enter var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms)) cubic-bezier(0.16, 1, 0.3, 1) 1;
      }
      .rounded-lg {
        border-radius: var(--radius);
      }
      .border-border {
        border-color: var(--border);
      }
      .bg-primary {
        background-color: var(--primary);
      }
      .text-primary-foreground {
        color: var(--primary-foreground);
      }
      .shadow-md {
        --tw-shadow: var(--shadow-md);
        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @property --tw-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-inset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-shadow-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-shadow-alpha {
        syntax: "<percentage>";
        inherits: false;
        initial-value: 100%;
      }
      @property --tw-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-inset-ring-color {
        syntax: "*";
        inherits: false;
      }
      @property --tw-inset-ring-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @property --tw-ring-inset {
        syntax: "*";
        inherits: false;
      }
      @property --tw-ring-offset-width {
        syntax: "<length>";
        inherits: false;
        initial-value: 0px;
      }
      @property --tw-ring-offset-color {
        syntax: "*";
        inherits: false;
        initial-value: #fff;
      }
      @property --tw-ring-offset-shadow {
        syntax: "*";
        inherits: false;
        initial-value: 0 0 #0000;
      }
      @keyframes mo-enter {
        from {
          opacity: var(--mo-enter-opacity, 1);
          transform: translate3d(var(--mo-enter-translate-x, 0), var(--mo-enter-translate-y, 0), 0) scale(var(--mo-enter-scale, 1)) rotate(var(--mo-enter-rotate, 0));
        }
      }
      @layer properties {
        @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
          *, ::before, ::after, ::backdrop {
            --tw-shadow: 0 0 #0000;
            --tw-shadow-color: initial;
            --tw-shadow-alpha: 100%;
            --tw-inset-shadow: 0 0 #0000;
            --tw-inset-shadow-color: initial;
            --tw-inset-shadow-alpha: 100%;
            --tw-ring-color: initial;
            --tw-ring-shadow: 0 0 #0000;
            --tw-inset-ring-color: initial;
            --tw-inset-ring-shadow: 0 0 #0000;
            --tw-ring-inset: initial;
            --tw-ring-offset-width: 0px;
            --tw-ring-offset-color: #fff;
            --tw-ring-offset-shadow: 0 0 #0000;
          }
        }
      }
      "
    `)
  })

  test('hover variant works with moraine tokens', async () => {
    const css = await compileCSS(['hover:bg-primary'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @media (hover: hover) {
        .hover\\:bg-primary:hover {
          background-color: var(--primary);
        }
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('focus variant works with moraine tokens', async () => {
    const css = await compileCSS(['focus:ring-ring'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .focus\\:ring-ring:focus {
        --tw-ring-color: var(--ring);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('responsive variants work with moraine tokens', async () => {
    const css = await compileCSS(['md:bg-secondary'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @media (width >= 48rem) {
        .md\\:bg-secondary {
          background-color: var(--secondary);
        }
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })
})

// ─── @iconify/tailwind integration (docs config) ────────────────────

describe('with @iconify/tailwind (docs config)', () => {
  test('lucide icon utilities generate SVG CSS', async () => {
    const css = await compileCSSWithIconify(['lucide--arrow-down'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .lucide--arrow-down {
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 5v14m7-7l-7 7l-7-7'/%3E%3C/svg%3E");
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('.iconify base class provides mask-image styles', async () => {
    const css = await compileCSSWithIconify(['iconify'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .iconify {
        display: inline-block;
        width: 1em;
        height: 1em;
        background-color: currentColor;
        -webkit-mask-image: var(--svg);
        mask-image: var(--svg);
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        -webkit-mask-size: 100% 100%;
        mask-size: 100% 100%;
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('iconify icons render with currentColor via mask', async () => {
    const css = await compileCSSWithIconify(['lucide--check'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .lucide--check {
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 6L9 17l-5-5'/%3E%3C/svg%3E");
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })

  test('moraine tokens still work alongside iconify', async () => {
    const css = await compileCSSWithIconify(['bg-primary', 'rounded-lg', 'animate-mo-enter'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      .animate-mo-enter {
        animation: mo-enter var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms)) cubic-bezier(0.16, 1, 0.3, 1) 1;
      }
      .rounded-lg {
        border-radius: var(--radius);
      }
      .bg-primary {
        background-color: var(--primary);
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      @keyframes mo-enter {
        from {
          opacity: var(--mo-enter-opacity, 1);
          transform: translate3d(var(--mo-enter-translate-x, 0), var(--mo-enter-translate-y, 0), 0) scale(var(--mo-enter-scale, 1)) rotate(var(--mo-enter-rotate, 0));
        }
      }
      "
    `)
  })

  test('moraine icon stubs still registered in class list', async () => {
    const ds = await loadDesignSystemWithIconify()
    const classList = ds.getClassList()
    const moraineIcons = classList.filter(([n]) => n.startsWith('icon-'))
    expect(moraineIcons.length).toBe(DEFAULT_ICON_SHORTCUTS.length)
  })

  test('lucide icon classes registered from iconify', async () => {
    const ds = await loadDesignSystemWithIconify()
    const classList = ds.getClassList()
    const lucideClasses = classList.filter(([n]) => n.startsWith('lucide--'))
    expect(lucideClasses.length).toBeGreaterThan(1000)
  })

  test('iconify icon candidates produce CSS, moraine stubs do not', async () => {
    const ds = await loadDesignSystemWithIconify()
    const results = ds.candidatesToCss([
      'lucide--arrow-down',
      'lucide--check',
      'icon-arrow-down',
      'icon-check',
    ])
    // iconify icons produce real CSS
    expect(results[0]).not.toBeNull()
    expect(results[0]).toMatchInlineSnapshot(`
      ".lucide--arrow-down {
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 5v14m7-7l-7 7l-7-7'/%3E%3C/svg%3E");
      }
      "
    `)
    expect(results[1]).not.toBeNull()
    expect(results[1]).toMatchInlineSnapshot(`
      ".lucide--check {
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 6L9 17l-5-5'/%3E%3C/svg%3E");
      }
      "
    `)
    // moraine stubs produce no CSS
    expect(results[2]).toBeNull()
    expect(results[3]).toBeNull()
  })

  test('moraine icons disabled still allows iconify icons', async () => {
    const ds = await loadDesignSystemWithIconify({ icons: false })
    const classList = ds.getClassList()

    // moraine stubs gone
    expect(classList.filter(([n]) => n.startsWith('icon-'))).toHaveLength(0)

    // iconify still works
    const lucideClasses = classList.filter(([n]) => n.startsWith('lucide--'))
    expect(lucideClasses.length).toBeGreaterThan(1000)

    const results = ds.candidatesToCss(['lucide--arrow-down'])
    expect(results[0]).toMatchInlineSnapshot(`
      ".lucide--arrow-down {
        --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 5v14m7-7l-7 7l-7-7'/%3E%3C/svg%3E");
      }
      "
    `)
  })

  test('iconify icons work with variants', async () => {
    const css = await compileCSSWithIconify(['hover:lucide--arrow-down'])
    expect(css).toMatchInlineSnapshot(`
      "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */
      @media (hover: hover) {
        .hover\\:lucide--arrow-down:hover {
          --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 5v14m7-7l-7 7l-7-7'/%3E%3C/svg%3E");
        }
      }
      @layer base {
        :root, :host {
          --default-transition-duration: var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms));
          --default-transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      }
      "
    `)
  })
})
