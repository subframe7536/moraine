import plugin from 'tailwindcss/plugin'

import {
  MORAINE_KEYFRAMES,
  buildTailwindAnimations,
  getMoraineAnimCounts,
  getMoraineAnimDurations,
  getMoraineAnimTimingFns,
} from '../shared/style/animations'
import { DEFAULT_ICON_SHORTCUTS } from '../shared/style/icons'
import { MORAINE_COLORS, MORAINE_FONT, MORAINE_RADIUS, MORAINE_SHADOW } from '../shared/style/theme'

export interface MorainePluginOptions {
  /**
   * Emit `icon-*` utility stubs so Tailwind's scanner recognises them.
   * Actual icon rendering is handled by `@iconify/tailwind` or `moraine/icon.css`.
   * @default true
   */
  icons?: boolean
}

/**
 * Generate empty CSS stubs for each `icon-*` shortcut so Tailwind's scanner
 * keeps them when they appear in moraine component files.
 * Actual icon rendering comes from `@iconify/tailwind` (Tier 2) or
 * `moraine/icon.css` (Tier 1).
 */
function buildIconShortcutUtilities(): Record<string, Record<string, never>> {
  return Object.fromEntries(DEFAULT_ICON_SHORTCUTS.map(([name]) => [`.${name}`, {}]))
}

type TailwindPlugin = (options?: MorainePluginOptions) => ReturnType<typeof plugin>

export const moraineTailwind: TailwindPlugin = (options: MorainePluginOptions = {}) =>
  plugin(
    ({ addUtilities, matchVariant }) => {
      if (options.icons !== false) {
        addUtilities(buildIconShortcutUtilities() as any)
      }

      // Attribute variants for data-* and aria-* selectors
      // Enables utilities like data-active:bg-primary -> [data-active]:bg-primary
      matchVariant('data', (value) => `[data-${value}] &`, {
        values: Object.fromEntries(
          [
            'active',
            'checked',
            'disabled',
            'expanded',
            'hidden',
            'open',
            'selected',
            'pressed',
          ].map((v) => [v, v]),
        ),
      })

      matchVariant('aria', (value) => `[aria-${value}] &`, {
        values: Object.fromEntries(
          [
            'busy',
            'checked',
            'disabled',
            'expanded',
            'hidden',
            'modal',
            'pressed',
            'readonly',
            'required',
            'selected',
          ].map((v) => [v, v]),
        ),
      })
    },
    {
      theme: {
        extend: {
          borderRadius: MORAINE_RADIUS,
          boxShadow: MORAINE_SHADOW,
          fontFamily: MORAINE_FONT,
          colors: MORAINE_COLORS,
          keyframes: MORAINE_KEYFRAMES,
          animation: buildTailwindAnimations(),
          transitionDuration: getMoraineAnimDurations(),
          transitionTimingFunction: getMoraineAnimTimingFns(),
          animationIterationCount: getMoraineAnimCounts(),
        },
      },
    },
  )
