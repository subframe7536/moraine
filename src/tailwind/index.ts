import plugin from 'tailwindcss/plugin'

import {
  MORAINE_ANIM_DUR_VAR_ENTER,
  MORAINE_EASE_OUT,
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
    ({ addBase, addUtilities, matchVariant }) => {
      addBase({
        ':root, :host': {
          '--default-transition-duration': MORAINE_ANIM_DUR_VAR_ENTER,
          '--default-transition-timing-function': MORAINE_EASE_OUT,
        },
      })

      if (options.icons !== false) {
        addUtilities(buildIconShortcutUtilities())
      }

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
            DEFAULT: MORAINE_ANIM_DUR_VAR_ENTER,
            ...getMoraineAnimDurations(),
          },
          transitionTimingFunction: {
            DEFAULT: MORAINE_EASE_OUT,
            ...getMoraineAnimTimingFns(),
          },
          animationIterationCount: getMoraineAnimCounts(),
          opacity: {
            64: '0.64',
          },
        },
      },
    },
  )

export default moraineTailwind()
