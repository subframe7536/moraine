import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler } from '../../shared/utils'
import { Button } from '../button'
import { useButtonGroupContext } from '../button/button-group-context'

import { toggleButtonDataAttributes, toggleButtonRecipe } from './toggle-button.recipe'
import type { ToggleButtonProps, ToggleButtonT } from './toggle-button.types'

/** Native toggle button with independently configurable off and on variants. */
export function ToggleButton(props: ToggleButtonProps): JSX.Element {
  const group = useButtonGroupContext()
  const [local, rest] = splitProps(props, [
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
  ])
  const resolved = createStyles(toggleButtonRecipe, local, {
    inheritedVariants: () => group ?? undefined,
  })
  const [pressed, setPressed] = createControllableValue({
    value: () => local.pressed,
    defaultValue: () => local.defaultPressed ?? false,
  })
  const child = resolveChildren(() => local.children as JSX.Element)
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

  function handleClick(event: MouseEvent & { currentTarget: HTMLButtonElement }): unknown {
    const { defaultPrevented, result } = callHandler(event, local.onClick)
    if (!defaultPrevented) {
      const next = !pressed()
      setPressed(next)
      local.onPressedChange?.(next)
    }
    return result
  }

  return (
    <Button
      {...rest}
      as="button"
      type="button"
      slotName="toggle-button"
      aria-pressed={pressed()}
      {...toggleButtonDataAttributes.root({ selected: pressed })}
      variant={pressed() ? resolved.variants.activeVariant : resolved.variants.variant}
      size={resolved.variants.size}
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
