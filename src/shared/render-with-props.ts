import type { JSX } from 'solid-js'
import { createComponent } from 'solid-js'

/** Mounts a single-position renderer with props or returns static JSX unchanged. */
export function renderWithProps<TProps extends object = Record<string, never>>(
  value: JSX.Element | ((props: TProps) => JSX.Element),
  props?: TProps,
): JSX.Element {
  if (typeof value === 'function') {
    return createComponent(value, (props ?? {}) as TProps)
  }

  return value
}
