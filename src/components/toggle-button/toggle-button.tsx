import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
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
      'tone',
      'activeTone',
      'size',
      'classes',
      'styles',
      'class',
      'style',
      'onClick',
      'children',
    ],
  )
  const { variants, overrides } = useRecipe(toggleButtonRecipe, local, {
    contextVariants: () => {
      if (!group) {
        return undefined
      }
      return {
        get size() {
          return group.size
        },
        get variant() {
          return group.variant
        },
        get tone() {
          return group.tone
        },
        get activeTone() {
          return group.tone
        },
      }
    },
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
      slotName="toggle-button"
      {...toggleButtonDataAttributes.root({ pressed })}
      {...rest}
      as={local.as}
      aria-pressed={pressed()}
      variant={pressed() ? variants.activeVariant : variants.variant}
      tone={pressed() ? variants.activeTone : variants.tone}
      size={variants.size}
      activeEffect="none"
      {...overrides()}
      onClick={handleClick}
      children={buttonChildren()}
    />
  )
}
