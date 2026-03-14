import type { Accessor, JSX } from 'solid-js'

/**
 * A type that can be either a JSX element or a function that returns a JSX element given some props.
 */
export type MaybeRenderProp<TProps> = JSX.Element | ((props: TProps) => JSX.Element)

/**
 * Resolves a maybe-render prop into a JSX element.
 * If the value is a function, it is called with the provided props.
 */
export function resolveRenderProp<TProps>(
  value: MaybeRenderProp<TProps> | undefined,
  propsInput: Accessor<TProps>,
): JSX.Element {
  if (typeof value !== 'function') {
    return value as JSX.Element
  }

  if (value.length === 0) {
    return (value as () => JSX.Element)()
  }

  return value(propsInput())
}
