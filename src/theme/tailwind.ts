import plugin from 'tailwindcss/plugin'

import { getMoraineAnimations, MORAINE_KEYFRAMES } from './animations'
import { DEFAULT_ICON_SHORTCUTS } from './icons'
import {
  MORAINE_COLORS,
  MORAINE_FONT,
  MORAINE_RADIUS,
  MORAINE_SHADOW,
  createStateColorDeclarations,
  MORAINE_TEXT_SIZE,
  MORAINE_WIDTH,
  MORAINE_Z_INDEX,
} from './tokens'

const animations = getMoraineAnimations()

/** All animations as Tailwind shorthand strings (`name duration timing count`). */
function buildTailwindAnimations(): Record<string, string> {
  const { durations, timingFns, counts } = animations

  return Object.fromEntries(
    Object.keys(MORAINE_KEYFRAMES).map((name) => [
      name,
      `${name} ${durations[name]} ${timingFns[name]} ${counts[name]}`,
    ]),
  )
}
export const moraineTailwind = plugin(
  ({ addBase, addUtilities, matchUtilities, matchVariant, theme }) => {
    addBase({
      '@supports (color: color-mix(in oklch, red, white))': {
        '*, ::before, ::after': createStateColorDeclarations({ hover: 8, active: 12 }),
      },
    })

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
          'auto-align',
          'autoresize',
          'checked',
          'clickable',
          'closed',
          'collapse',
          'compact',
          'cross',
          'destructive',
          'disabled',
          'dragging',
          'dropzone',
          'duplicate',
          'editable',
          'ellipsis',
          'expanded',
          'focused',
          'footer',
          'has-text',
          'header',
          'highlighted',
          'hidden',
          'indeterminate',
          'instant-motion',
          'invalid',
          'inverted',
          'loading',
          'mobile',
          'multiple',
          'open',
          'overlay-scroll',
          'placeholder',
          'positioned',
          'readonly',
          'required',
          'resizable-handle-end-target',
          'resizable-handle-start-target',
          'selected',
          'scroll',
          'pressed',
          'submitting',
          'tags',
          'text',
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
        transitionDuration: animations.durations,
        transitionTimingFunction: animations.timingFns,
        animationIterationCount: animations.counts,
      },
    },
  },
)

export default moraineTailwind
