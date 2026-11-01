import type { Accessor, JSX } from 'solid-js'

import type { Orientation } from '../theme/style-types'

import { callHandler } from './utils'

export type KeyboardModifier = 'alt' | 'ctrl' | 'meta' | 'shift'

/** KeyboardEvent narrowed to the host element, matching Solid's JSX event contract. */
export type KeyEvent<TElement extends EventTarget = HTMLElement> = KeyboardEvent & {
  currentTarget: TElement
  target: Element
}

export type KeyHandler<TElement extends EventTarget = HTMLElement, TArgs extends unknown[] = []> = (
  event: KeyEvent<TElement>,
  ...args: TArgs
) => void

/** Declarative binding for one key. */
export interface KeyBindingOptions<
  TElement extends EventTarget = HTMLElement,
  TArgs extends unknown[] = [],
> {
  handle: KeyHandler<TElement, TArgs>
  /**
   * Call `event.preventDefault()` before `handle`.
   * Pass `false` when the handler manages prevention itself.
   * @default true
   */
  preventDefault?: boolean
  /**
   * When it returns false the binding does not apply: no prevention, no `handle`,
   * and the event falls through to `ignore` / `onUnhandled` as if unbound.
   */
  when?: (event: KeyEvent<TElement>, ...args: TArgs) => boolean
}

/**
 * What a key maps to: a handler (auto-`preventDefault`), a `KeyBindingOptions`,
 * or a falsy value that leaves the key unbound (sparse computed maps).
 */
export type KeyBinding<TElement extends EventTarget = HTMLElement, TArgs extends unknown[] = []> =
  | KeyHandler<TElement, TArgs>
  | KeyBindingOptions<TElement, TArgs>
  | null
  | undefined

/**
 * Normalized-key (`' '` is Space) → binding map.
 *
 * Arrow keys also resolve these logical aliases, checked after the literal key
 * in the listed order:
 * - `next` / `previous`: along the `orientation` axis (`rtl` flips horizontal).
 * - `forward` / `backward`: along the inline (reading) direction — expand a node,
 *   open a submenu.
 * - `open` / `close`: perpendicular to the orientation axis — move into or out of
 *   the content a control owns (horizontal: ArrowDown/ArrowUp; vertical:
 *   forward/backward).
 */
export type KeyBindings<
  TElement extends EventTarget = HTMLElement,
  TArgs extends unknown[] = [],
> = Record<string, KeyBinding<TElement, TArgs>>

type EventOption<T, TElement extends EventTarget, TArgs extends unknown[]> = (
  event: KeyEvent<TElement>,
  ...args: TArgs
) => T

export interface KeyboardHandlerOptions<
  TElement extends EventTarget = HTMLElement,
  TArgs extends unknown[] = [],
> {
  /** Skip the whole dispatch while it returns true. */
  disabled?: EventOption<boolean, TElement, TArgs>
  /** Extra IME-composition state (an input's draft or a composition-end grace window). */
  composing?: EventOption<boolean, TElement, TArgs>
  /** Skip auto-repeated keydown events. */
  skipRepeat?: boolean
  /** Only handle events whose target is the host element itself. */
  currentTargetOnly?: boolean
  /** Skip while any of these modifiers are held. */
  ignoreModifiers?: readonly KeyboardModifier[]
  /** Orientation axis for `next` / `previous` / `open` / `close`. @default 'horizontal' */
  orientation?: Orientation | EventOption<Orientation | undefined, TElement, TArgs>
  /** Text direction for horizontal aliases; falls back to the host's computed direction. */
  direction?: EventOption<'ltr' | 'rtl' | undefined, TElement, TArgs>
  /** Key bindings, or a per-event map for computed keys. */
  keys?: KeyBindings<TElement, TArgs> | EventOption<KeyBindings<TElement, TArgs>, TElement, TArgs>
  /** Keys swallowed without preventDefault or `onUnhandled` (Space in a search input). */
  ignore?: readonly string[]
  /** Called when no binding matched after the guards. */
  onUnhandled?: KeyHandler<TElement, TArgs>
}

/**
 * Whether the key event belongs to an ongoing IME composition
 * (`isComposing` plus the legacy 229 `keyCode` / `which` markers).
 */
export function isComposingKeyboardEvent(event: KeyboardEvent): boolean {
  return event.isComposing || event.which === 229 || event.keyCode === 229
}

/** Normalizes `event.key` for binding lookup (`'Spacebar'` → `' '`). */
export function normalizeKey(key: string): string {
  return key === 'Spacebar' ? ' ' : key
}

function keyAliases(key: string, orientation: Orientation, rtl: boolean): readonly string[] {
  const horizontal = orientation === 'horizontal'
  switch (key) {
    case 'ArrowRight':
      return horizontal
        ? [rtl ? 'previous' : 'next', rtl ? 'backward' : 'forward']
        : [rtl ? 'backward' : 'forward', rtl ? 'close' : 'open']
    case 'ArrowLeft':
      return horizontal
        ? [rtl ? 'next' : 'previous', rtl ? 'forward' : 'backward']
        : [rtl ? 'forward' : 'backward', rtl ? 'open' : 'close']
    case 'ArrowDown':
      return horizontal ? ['open'] : ['next']
    case 'ArrowUp':
      return horizontal ? ['close'] : ['previous']
    default:
      return []
  }
}

const MODIFIER_EVENT_KEYS: Record<KeyboardModifier, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'> =
  {
    alt: 'altKey',
    ctrl: 'ctrlKey',
    meta: 'metaKey',
    shift: 'shiftKey',
  }

function computedDirection(element: Element | null | undefined): 'ltr' | 'rtl' {
  return element?.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl'
    ? 'rtl'
    : 'ltr'
}

function eventDirection(event: KeyboardEvent): 'ltr' | 'rtl' {
  const target = event.currentTarget ?? event.target
  return computedDirection(target instanceof Element ? target : undefined)
}

function toBindingOptions<TElement extends EventTarget, TArgs extends unknown[]>(
  binding: KeyBinding<TElement, TArgs>,
): KeyBindingOptions<TElement, TArgs> | undefined {
  if (!binding) {
    return undefined
  }
  return typeof binding === 'function' ? { handle: binding } : binding
}

function createKeyboardHandler<TElement extends EventTarget, TArgs extends unknown[]>(
  options: KeyboardHandlerOptions<TElement, TArgs> & {
    userHandler?: Accessor<JSX.EventHandlerUnion<TElement, KeyboardEvent> | undefined>
  },
): (event: KeyboardEvent, ...args: TArgs) => void {
  return (rawEvent, ...args) => {
    const event = rawEvent as KeyEvent<TElement>

    callHandler(event, options.userHandler?.())

    if (
      event.defaultPrevented ||
      options.disabled?.(event, ...args) ||
      isComposingKeyboardEvent(event) ||
      options.composing?.(event, ...args) ||
      (options.skipRepeat && event.repeat) ||
      (options.currentTargetOnly && event.target !== (event.currentTarget as EventTarget | null)) ||
      options.ignoreModifiers?.some((modifier) => event[MODIFIER_EVENT_KEYS[modifier]])
    ) {
      return
    }

    const key = normalizeKey(event.key)
    const keys = options.keys
    const bindings = typeof keys === 'function' ? keys(event, ...args) : keys

    let binding = toBindingOptions(bindings?.[key])
    if (!binding && bindings) {
      const orientationOption = options.orientation
      const orientation =
        (typeof orientationOption === 'function'
          ? orientationOption(event, ...args)
          : orientationOption) ?? 'horizontal'
      const rtl = (options.direction?.(event, ...args) ?? eventDirection(event)) === 'rtl'
      for (const alias of keyAliases(key, orientation, rtl)) {
        binding = toBindingOptions(bindings[alias])
        if (binding) {
          break
        }
      }
    }

    if (binding?.when && !binding.when(event, ...args)) {
      binding = undefined
    }

    if (!binding) {
      if (!options.ignore?.some((ignoredKey) => normalizeKey(ignoredKey) === key)) {
        options.onUnhandled?.(event, ...args)
      }
      return
    }

    if (binding.preventDefault !== false) {
      event.preventDefault()
    }
    binding.handle(event, ...args)
  }
}

export interface CreateKeyDownHandlerOptions<
  TElement extends EventTarget = HTMLElement,
  TArgs extends unknown[] = [],
> extends KeyboardHandlerOptions<TElement, TArgs> {
  /** User `onKeyDown` forwarded through `callHandler` first; a prevented event skips the rest. */
  onKeyDown?: Accessor<JSX.EventHandlerUnion<TElement, KeyboardEvent> | undefined>
}

/**
 * Shared `keydown` dispatch for interactive components: forwards a caller handler,
 * applies the standard guards, then dispatches through the `keys` map.
 */
export function createKeyDownHandler<
  TElement extends EventTarget = HTMLElement,
  TArgs extends unknown[] = [],
>(
  options: CreateKeyDownHandlerOptions<TElement, TArgs>,
): (event: KeyboardEvent, ...args: TArgs) => void {
  return createKeyboardHandler({ ...options, userHandler: options.onKeyDown })
}

export interface CreateKeyUpHandlerOptions<
  TElement extends EventTarget = HTMLElement,
  TArgs extends unknown[] = [],
> extends KeyboardHandlerOptions<TElement, TArgs> {
  /** User `onKeyUp` forwarded through `callHandler` first; a prevented event skips the rest. */
  onKeyUp?: Accessor<JSX.EventHandlerUnion<TElement, KeyboardEvent> | undefined>
}

/** `keyup` variant of `createKeyDownHandler` for keys that activate on release (Space). */
export function createKeyUpHandler<
  TElement extends EventTarget = HTMLElement,
  TArgs extends unknown[] = [],
>(
  options: CreateKeyUpHandlerOptions<TElement, TArgs>,
): (event: KeyboardEvent, ...args: TArgs) => void {
  return createKeyboardHandler({ ...options, userHandler: options.onKeyUp })
}
