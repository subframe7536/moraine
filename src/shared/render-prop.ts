import type { Component, JSX } from 'solid-js'
import { createComponent } from 'solid-js'

/**
 * A Solid component that receives render props, or static JSX content.
 */
export type ComponentOrElement<TProps extends object = Record<never, never>> =
  | Component<TProps>
  | JSX.Element

/**
 * Mounts component values with the provided props and returns static JSX unchanged.
 */
export function renderComponentOrElement<TProps extends object>(
  value: ComponentOrElement<TProps>,
  props: TProps,
): JSX.Element {
  if (typeof value === 'function') {
    return createComponent(value, props)
  }

  return value
}
