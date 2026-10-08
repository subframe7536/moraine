import type { JSX } from 'solid-js'
import { children as resolveChildren, mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider/create-styles'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { baseSelectDataAttributes, baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectTrigger<
  T extends ValidComponent = 'button',
  TItem extends BaseSelectT.Item = BaseSelectT.Item,
>(props: BaseSelectT.TriggerProps<T, TItem>): JSX.Element {
  const state = useSelectContext<TItem>()
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'style',
    'disabled',
    'onPointerDown',
    'onKeyDown',
    'onFocus',
    'onBlur',
    'ref' as any,
  ])
  const resolved = createStyles(baseSelectRecipe, local, {
    rootSlot: 'trigger',
    inheritedStyles: () => state.stylePresentation,
    inheritedVariants: () => ({ size: state.styleSize }),
  })
  const resolvedChildren = resolveChildren(() =>
    renderWithProps(local.children, state.presentation),
  )
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({
    tag,
    ref: () => local.ref,
    registration: {
      element: state.focusOwner,
      ref: state.setFocusOwner,
    },
  })
  const eventProps = mergeProps(rest, {
    onPointerDown(event: PointerEvent) {
      callHandler(event, local.onPointerDown)
      if (
        !event.defaultPrevented &&
        !state.field.disabled() &&
        event.pointerType !== 'touch' &&
        event.pointerType !== 'pen'
      ) {
        event.preventDefault()
        state.focusOwner()?.focus()
      }
    },
    onKeyDown(event: KeyboardEvent) {
      callHandler(event, local.onKeyDown)
      state.keyDown(event)
    },
    onFocus(event: FocusEvent) {
      callHandler(event, local.onFocus)
      if (!event.defaultPrevented) {
        state.field.emit('focus', event)
      }
    },
    onBlur(event: FocusEvent) {
      callHandler(event, local.onBlur)
      if (!event.defaultPrevented) {
        state.field.emit('blur', event)
      }
    },
  })
  const binding = useButtonInteraction(
    {
      tag,
      disabledForComponent: true,
      disabled: () => state.field.disabled() || Boolean(local.disabled),
      element: root.element,
      onPress: () => {
        state.focusOwner()?.focus()
        state.setOpen(!state.open())
      },
    },
    eventProps,
  )
  const rootBinding = root.bind(binding)
  return (
    <Dynamic
      {...rootBinding}
      component={tag()}
      {...state.field.ariaAttrs()}
      id={state.field.id()}
      role="combobox"
      data-slot={state.slotName('trigger')}
      {...baseSelectDataAttributes.trigger({
        invalid: state.field.invalid,
        expanded: state.open,
        closed: () => !state.open(),
        disabled: () => Boolean(state.field.disabled() || local.disabled),
      })}
      aria-haspopup="listbox"
      aria-controls={state.listboxId()}
      aria-expanded={state.open() ? 'true' : 'false'}
      aria-activedescendant={
        state.open() && state.highlightedValue() !== undefined
          ? state.itemId(state.highlightedValue()!)
          : undefined
      }
      {...resolved.styles.trigger}
    >
      {resolvedChildren()}
    </Dynamic>
  )
}
