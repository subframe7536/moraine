import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'
import { Button } from '../button'
import { useButtonGroupContext } from '../button-group/button-group-context'

import { toggleButtonDataAttributes, toggleButtonRecipe } from './toggle-button.recipe'
import type { ToggleButtonProps, ToggleButtonT } from './toggle-button.types'

/** Toggle button with independently configurable off and on variants. */
export function ToggleButton<T extends ValidComponent = 'button'>(
  props: ToggleButtonProps<T>,
): JSX.Element {
  const group = useButtonGroupContext()
  const [local, rest] = splitProps(
    props as ToggleButtonProps<T> & {
      ref?: unknown
      onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
    },
    [
      'as',
      'pressed',
      'defaultPressed',
      'onPressedChange',
      'variant',
      'activeVariant',
      'size',
      'classes',
      'styles',
      'class',
      'style',
      'onClick',
      'children',
    ],
  )
  const resolved = createStyles(toggleButtonRecipe, local, {
    inheritedVariants: () => group ?? undefined,
  })
  const [pressed, setPressed] = createControllableValue<boolean>({
    value: () => local.pressed,
    defaultValue: () => local.defaultPressed ?? false,
    onChange: (next) => local.onPressedChange?.(next),
  })
  const child = resolveChildren(() => local.children)
  const buttonChildren = createMemo(() => {
    const value = child() as ToggleButtonT.Base['children']
    if (typeof value !== 'function') {
      return value
    }
    return (state: { loading: boolean }) =>
      renderWithProps(value, {
        get pressed() {
          return pressed()
        },
        get loading() {
          return state.loading
        },
      })
  })

  function handleClick(event: MouseEvent & { currentTarget: HTMLElement }): unknown {
    const { defaultPrevented, result } = callHandler(event, local.onClick)
    if (!defaultPrevented) {
      setPressed(!pressed())
    }
    return result
  }

  return (
    <Button
      {...rest}
      as={local.as}
      slotName="toggle-button"
      aria-pressed={pressed()}
      {...toggleButtonDataAttributes.root({ pressed })}
      variant={pressed() ? resolved.variants.activeVariant : resolved.variants.variant}
      size={resolved.variants.size}
      activeEffect="none"
      classes={{
        get root() {
          return resolved.styles.root.class
        },
        get leading() {
          return resolved.styles.leading.class
        },
        get label() {
          return resolved.styles.label.class
        },
        get trailing() {
          return resolved.styles.trailing.class
        },
      }}
      styles={{
        get root() {
          return resolved.styles.root.style
        },
        get leading() {
          return resolved.styles.leading.style
        },
        get label() {
          return resolved.styles.label.style
        },
        get trailing() {
          return resolved.styles.trailing.style
        },
      }}
      onClick={handleClick}
      children={buttonChildren()}
    />
  )
}
