import plugin from 'tailwindcss/plugin'

import {
  MORAINE_KEYFRAMES,
  buildTailwindAnimations,
  getMoraineAnimCounts,
  getMoraineAnimDurations,
  getMoraineAnimTimingFns,
} from '../shared/style/animations.ts'
import { DEFAULT_ICON_SHORTCUTS } from '../shared/style/icons.ts'
import {
  MORAINE_COLORS,
  MORAINE_FONT,
  MORAINE_RADIUS,
  MORAINE_SHADOW,
  MORAINE_WIDTH,
  MORAINE_Z_INDEX,
} from '../shared/style/theme.ts'

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
 * Actual icon rendering comes from `@iconify/tailwind` or `moraine/icon.css`.
 */
function buildIconShortcutUtilities(): Record<string, Record<string, never>> {
  return Object.fromEntries(DEFAULT_ICON_SHORTCUTS.map(([name]) => [`.${name}`, {}]))
}

type TailwindPlugin = (options?: MorainePluginOptions) => ReturnType<typeof plugin>

export const moraineTailwind: TailwindPlugin = (options: MorainePluginOptions = {}) =>
  plugin(
    ({ addUtilities, matchUtilities, matchVariant, theme }) => {
      if (options.icons !== false) {
        addUtilities(buildIconShortcutUtilities())
      }

      matchUtilities(
        {
          'enter-opacity': (value) => ({ '--mo-enter-opacity': value }),
          'exit-opacity': (value) => ({ '--mo-exit-opacity': value }),
        },
        { values: theme('opacity') },
      )

      matchUtilities(
        {
          'enter-scale': (value) => ({ '--mo-enter-scale': value }),
          'exit-scale': (value) => ({ '--mo-exit-scale': value }),
        },
        { values: theme('scale') },
      )

      matchUtilities(
        {
          'enter-translate-x': (value) => ({ '--mo-enter-translate-x': value }),
          'exit-translate-x': (value) => ({ '--mo-exit-translate-x': value }),
          'enter-translate-y': (value) => ({ '--mo-enter-translate-y': value }),
          'exit-translate-y': (value) => ({ '--mo-exit-translate-y': value }),
        },
        {
          values: { ...theme('spacing'), ...theme('translate') },
          supportsNegativeValues: true,
        },
      )

      matchUtilities(
        {
          'enter-rotate': (value) => ({ '--mo-enter-rotate': value }),
          'exit-rotate': (value) => ({ '--mo-exit-rotate': value }),
        },
        {
          values: theme('rotate'),
          supportsNegativeValues: true,
        },
      )

      // Attribute variants for data-* and aria-* selectors
      // Enables utilities like data-active:bg-primary -> [data-active]:bg-primary
      matchVariant('data', (value) => `&[data-${value}]`, {
        values: Object.fromEntries(
          [
            'active',
            'checked',
            'clickable',
            'closed',
            'cross',
            'disabled',
            'dragging',
            'expanded',
            'focused',
            'highlighted',
            'hidden',
            'indeterminate',
            'invalid',
            'loading',
            'open',
            'positioned',
            'selected',
            'pressed',
            'submitting',
            'transitioning',
            'unchecked',
          ].map((v) => [v, v]),
        ),
      })

      matchVariant('aria', (value) => `&[aria-${value}]`, {
        values: Object.fromEntries(
          [
            'busy',
            'checked',
            'disabled',
            'expanded',
            'hidden',
            'invalid',
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
          spacing: MORAINE_WIDTH,
          zIndex: MORAINE_Z_INDEX,
          keyframes: MORAINE_KEYFRAMES,
          animation: buildTailwindAnimations(),
          transitionDuration: {
            ...getMoraineAnimDurations(),
          },
          transitionTimingFunction: {
            ...getMoraineAnimTimingFns(),
          },
          animationIterationCount: getMoraineAnimCounts(),
        },
      },
    },
  )

export default moraineTailwind()
