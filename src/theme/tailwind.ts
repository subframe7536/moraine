import plugin from 'tailwindcss/plugin'

import {
  MORAINE_KEYFRAMES,
  getMoraineAnimCounts,
  getMoraineAnimDurations,
  getMoraineAnimTimingFns,
} from './animations'
import { DEFAULT_ICON_SHORTCUTS } from './icons'
import {
  MORAINE_COLORS,
  MORAINE_FONT,
  MORAINE_RADIUS,
  MORAINE_SHADOW,
  MORAINE_TEXT_SIZE,
  MORAINE_WIDTH,
  MORAINE_Z_INDEX,
} from './tokens'

/** All animations as Tailwind shorthand strings (`name duration timing count`). */
function buildTailwindAnimations(): Record<string, string> {
  const durations = getMoraineAnimDurations()
  const timingFns = getMoraineAnimTimingFns()
  const counts = getMoraineAnimCounts()

  return Object.fromEntries(
    Object.keys(MORAINE_KEYFRAMES).map((name) => [
      name,
      `${name} ${durations[name]} ${timingFns[name]} ${counts[name]}`,
    ]),
  )
}
export const moraineTailwind = plugin(
  ({ addUtilities, matchUtilities, matchVariant, theme }) => {
    // Icon styles come from the optional moraine/icon.css asset.
    addUtilities(Object.fromEntries(DEFAULT_ICON_SHORTCUTS.map(([name]) => [`.${name}`, {}])))

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
          'duplicate',
          'editable',
          'expanded',
          'focused',
          'footer',
          'header',
          'highlighted',
          'hidden',
          'indeterminate',
          'instant-motion',
          'invalid',
          'loading',
          'multiple',
          'open',
          'positioned',
          'selected',
          'scroll',
          'pressed',
          'submitting',
          'transitioning',
          'transition',
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
        fontSize: Object.fromEntries(
          Object.entries(MORAINE_TEXT_SIZE).map(([size, [fontSize, lineHeight]]) => [
            size,
            [fontSize, { lineHeight }],
          ]),
        ),
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

export default moraineTailwind
