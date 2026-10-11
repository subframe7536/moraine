type KeyframeStop = Record<string, string>
type KeyframeFrames = Record<string, KeyframeStop>

const LOOPING_PREFIXES = ['carousel', 'swing', 'elastic', 'shimmer']
const HORIZONTAL_SLIDE_KEYFRAMES: KeyframeFrames = {
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(100%)' },
}
export const MORAINE_ANIM_DUR_VAR_ENTER =
  'var(--mo-anim-duration,var(--mo-anim-duration-enter,250ms))'
export const MORAINE_ANIM_DUR_VAR_EXIT =
  'var(--mo-anim-duration,var(--mo-anim-duration-exit,150ms))'
export const MORAINE_ANIM_DUR_VAR_LOOP = 'var(--mo-anim-duration,var(--mo-anim-duration-loop,2s))'
export const MORAINE_ANIM_DUR_VAR_SPIN = 'var(--mo-anim-duration,var(--mo-anim-duration-spin,1s))'
export const MORAINE_EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
export const MORAINE_EASE_IN = 'cubic-bezier(0.7, 0, 0.84, 0)'
export const MORAINE_EASE_IN_OUT = 'ease-in-out'
export const MORAINE_EASE_LINEAR = 'linear'

type AnimationType = 'default' | 'enter' | 'exit' | 'loop' | 'spin'

const ANIMATION_DURATIONS: Record<AnimationType, string> = {
  default: MORAINE_ANIM_DUR_VAR_ENTER,
  enter: MORAINE_ANIM_DUR_VAR_ENTER,
  exit: MORAINE_ANIM_DUR_VAR_EXIT,
  loop: MORAINE_ANIM_DUR_VAR_LOOP,
  spin: MORAINE_ANIM_DUR_VAR_SPIN,
}

const ANIMATION_TIMING_FUNCTIONS: Record<AnimationType, string> = {
  default: MORAINE_EASE_OUT,
  enter: `var(--mo-anim-ease,var(--mo-anim-ease-enter,${MORAINE_EASE_OUT}))`,
  exit: `var(--mo-anim-ease,var(--mo-anim-ease-exit,${MORAINE_EASE_IN}))`,
  loop: MORAINE_EASE_IN_OUT,
  spin: MORAINE_EASE_LINEAR,
}

function getAnimType(name: string): AnimationType {
  if (name === 'mo-enter') {
    return 'enter'
  }
  if (name === 'mo-exit') {
    return 'exit'
  }
  if (LOOPING_PREFIXES.some((p) => name.startsWith(p))) {
    return 'loop'
  }
  if (name === 'spin') {
    return 'spin'
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
    from: { height: '0', opacity: '0' },
    to: { height: 'var(--mo-collapsible-content-height)', opacity: '1' },
  },
  'accordion-up': {
    from: { height: 'var(--mo-collapsible-content-height)', opacity: '1' },
    to: { height: '0', opacity: '0' },
  },
  spin: {
    to: { transform: 'rotate(360deg)' },
  },
  carousel: HORIZONTAL_SLIDE_KEYFRAMES,
  shimmer: HORIZONTAL_SLIDE_KEYFRAMES,
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
  'toast-bump': {
    '0%': { transform: 'scale(1)' },
    '45%': { transform: 'scale(1.05)' },
    '100%': { transform: 'scale(1)' },
  },
  'toast-swipe-out-left': {
    from: { transform: 'translateX(var(--toast-swipe-x, 0px))', opacity: '1' },
    to: { transform: 'translateX(calc(var(--toast-swipe-x, 0px) - 100%))', opacity: '0' },
  },
  'toast-swipe-out-right': {
    from: { transform: 'translateX(var(--toast-swipe-x, 0px))', opacity: '1' },
    to: { transform: 'translateX(calc(var(--toast-swipe-x, 0px) + 100%))', opacity: '0' },
  },
  'toast-swipe-out-up': {
    from: { transform: 'translateY(var(--toast-swipe-y, 0px))', opacity: '1' },
    to: { transform: 'translateY(calc(var(--toast-swipe-y, 0px) - 100%))', opacity: '0' },
  },
  'toast-swipe-out-down': {
    from: { transform: 'translateY(var(--toast-swipe-y, 0px))', opacity: '1' },
    to: { transform: 'translateY(calc(var(--toast-swipe-y, 0px) + 100%))', opacity: '0' },
  },
}

export function getMoraineAnimations(): {
  durations: Record<string, string>
  timingFns: Record<string, string>
  counts: Record<string, string>
  properties: Record<string, { 'animation-fill-mode': string }>
} {
  const durations: Record<string, string> = {}
  const timingFns: Record<string, string> = {}
  const counts: Record<string, string> = {}
  for (const name of Object.keys(MORAINE_KEYFRAMES)) {
    const type = getAnimType(name)
    durations[name] = ANIMATION_DURATIONS[type]
    timingFns[name] = name === 'shimmer' ? MORAINE_EASE_LINEAR : ANIMATION_TIMING_FUNCTIONS[type]
    counts[name] = type === 'loop' || type === 'spin' ? 'infinite' : '1'
  }
  return {
    durations,
    timingFns,
    counts,
    properties: { 'mo-exit': { 'animation-fill-mode': 'forwards' } },
  }
}
