type KeyframeStop = Record<string, string>
type KeyframeFrames = Record<string, KeyframeStop>

const LOOPING_PREFIXES = ['carousel', 'swing', 'elastic']
const MORAINE_ANIM_DUR_VAR_ENTER = 'var(--mo-anim-duration,var(--mo-anim-duration-enter,100ms))'
const MORAINE_ANIM_DUR_VAR_EXIT = 'var(--mo-anim-duration,var(--mo-anim-duration-exit,150ms))'

function getAnimType(name: string): 'moraine-enter' | 'moraine-exit' | 'looping' | 'default' {
  if (name === 'mo-enter') {
    return 'moraine-enter'
  }
  if (name === 'mo-exit') {
    return 'moraine-exit'
  }
  if (LOOPING_PREFIXES.some((p) => name.startsWith(p))) {
    return 'looping'
  }
  return 'default'
}

/**
 * Canonical keyframe definitions in Tailwind-compatible object form.
 * UnoCSS consumes these via `toUnocssKeyframes()`.
 */
export const MORAINE_KEYFRAMES: Record<string, KeyframeFrames> = {
  'mo-enter': {
    from: {
      opacity: 'var(--mo-enter-opacity, 1)',
      transform:
        'translate3d(var(--mo-enter-translate-x, 0), var(--mo-enter-translate-y, 0), 0) scale(var(--mo-enter-scale, 1)) rotate(var(--mo-enter-rotate, 0))',
    },
  },
  'mo-exit': {
    to: {
      opacity: 'var(--mo-exit-opacity, 1)',
      transform:
        'translate3d(var(--mo-exit-translate-x, 0), var(--mo-exit-translate-y, 0), 0) scale(var(--mo-exit-scale, 1)) rotate(var(--mo-exit-rotate, 0))',
    },
  },
  'accordion-down': {
    from: { height: '0' },
    to: { height: 'var(--mo-collapsible-content-height)' },
  },
  'accordion-up': {
    from: { height: 'var(--mo-collapsible-content-height)' },
    to: { height: '0' },
  },
  carousel: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
  'carousel-rtl': {
    '0%': { transform: 'translateX(100%)' },
    '100%': { transform: 'translateX(-100%)' },
  },
  'carousel-vertical': {
    '0%': { transform: 'translateY(100%)' },
    '100%': { transform: 'translateY(-100%)' },
  },
  swing: {
    '0%, 100%': { transform: 'translateX(-60%)' },
    '50%': { transform: 'translateX(60%)' },
  },
  'swing-vertical': {
    '0%, 100%': { transform: 'translateY(60%)' },
    '50%': { transform: 'translateY(-60%)' },
  },
  elastic: {
    '0%': { transform: 'translateX(-100%) scaleX(0.9)' },
    '45%': { transform: 'translateX(0) scaleX(1)' },
    '100%': { transform: 'translateX(100%) scaleX(0.9)' },
  },
  'elastic-vertical': {
    '0%': { transform: 'translateY(100%) scaleY(0.9)' },
    '45%': { transform: 'translateY(0) scaleY(1)' },
    '100%': { transform: 'translateY(-100%) scaleY(0.9)' },
  },
}

/** Generate animation durations for all keyframes. */
export function getMoraineAnimDurations(): Record<string, string> {
  return Object.fromEntries(
    Object.keys(MORAINE_KEYFRAMES).map((name) => {
      const type = getAnimType(name)
      let duration = '150ms'
      switch (type) {
        case 'moraine-enter':
          duration = MORAINE_ANIM_DUR_VAR_ENTER
          break
        case 'moraine-exit':
          duration = MORAINE_ANIM_DUR_VAR_EXIT
          break
        case 'looping':
          duration = '2s'
          break
      }
      return [name, duration]
    }),
  )
}

/** Generate animation timing functions for all keyframes. */
export function getMoraineAnimTimingFns(): Record<string, string> {
  return Object.fromEntries(Object.keys(MORAINE_KEYFRAMES).map((name) => [name, 'ease-in-out']))
}

/** Generate animation iteration counts for all keyframes. */
export function getMoraineAnimCounts(): Record<string, string> {
  return Object.fromEntries(
    Object.keys(MORAINE_KEYFRAMES).map((name) => [
      name,
      getAnimType(name) === 'looping' ? 'infinite' : '1',
    ]),
  )
}

/** Convert a single keyframe frames object to a UnoCSS-style string. */
function keyframeFramesToString(frames: KeyframeFrames): string {
  const parts = Object.entries(frames).map(([stop, props]) => {
    const css = Object.entries(props)
      .map(([p, v]) => `${p}: ${v}`)
      .join('; ')
    return `${stop} { ${css} }`
  })
  return `{ ${parts.join(' ')} }`
}

/** All keyframes as UnoCSS-format strings (`{ stop { prop: val } }`). */
export function toUnocssKeyframes(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(MORAINE_KEYFRAMES).map(([name, frames]) => [
      name,
      keyframeFramesToString(frames),
    ]),
  )
}

/** All animations as Tailwind shorthand strings (`name duration timing count`). */
export function buildTailwindAnimations(): Record<string, string> {
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
