import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { createKeyDownHandler } from '../../shared/keyboard'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { baseSelectDataAttributes, baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

/**
 * Primary focus owner and activator of the surrounding `BaseSelect`: it opens and closes the
 * popup and handles keyboard navigation, with `role="combobox"` and the related ARIA attributes.
 * Place it inside `BaseSelect`, usually within `BaseSelect.Control`. Renders a `button`; pass `as`
 * to render another component such as `Button`. Children can be a node or a render function
 * receiving `{ open, value, disabled, readOnly }`.
 *
 * @example
 * ```tsx
 * import { BaseSelect } from 'moraine'
 *
 * <BaseSelect items={[{ label: 'Option A', value: 'a' }]}>
 *   <BaseSelect.Control>
 *     <BaseSelect.Trigger>
 *       {(state) => (state.value.length > 0 ? 'Selected' : 'Choose')}
 *     </BaseSelect.Trigger>
 *   </BaseSelect.Control>
 *   <BaseSelect.Content>
 *     <BaseSelect.Listbox>
 *       <BaseSelect.Item item={{ label: 'Option A', value: 'a' }} />
 *     </BaseSelect.Listbox>
 *   </BaseSelect.Content>
 * </BaseSelect>
 * ```
 */
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
  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'trigger',
    data: {
      trigger: baseSelectDataAttributes.trigger({
        invalid: state.invalid,
        expanded: state.open,
        closed: () => !state.open(),
        disabled: () => Boolean(state.disabled() || local.disabled),
      }),
    },
    context: state.recipeContext,
  })
  const presentation: BaseSelectT.TriggerRenderProps<TItem> = {
    get open() {
      return state.open()
    },
    get value() {
      return state.value()
    },
    get disabled() {
      return state.disabled()
    },
    get readOnly() {
      return state.readOnly()
    },
  }
  const child = resolveChildren(() => local.children)
  const resolvedChildren = createMemo(() => renderWithProps(child(), presentation))
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({
    tag,
    ref: () => local.ref,
    registration: {
      element: state.focusOwner,
      setElement: state.setFocusOwner,
    },
  })
  const eventProps = mergeProps({ role: 'combobox' as const }, rest, {
    onPointerDown(event: PointerEvent) {
      callHandler(event, local.onPointerDown)
      if (
        !event.defaultPrevented &&
        !state.disabled() &&
        event.pointerType !== 'touch' &&
        event.pointerType !== 'pen'
      ) {
        event.preventDefault()
        state.focusOwner()?.focus()
      }
    },
    onKeyDown: createKeyDownHandler({
      onKeyDown: () => local.onKeyDown,
      onUnhandled: (event) => state.keyDown(event),
    }),
    onFocus(event: FocusEvent) {
      callHandler(event, local.onFocus)
      if (!event.defaultPrevented) {
        state.focus(event)
      }
    },
    onBlur(event: FocusEvent) {
      callHandler(event, local.onBlur)
      if (!event.defaultPrevented) {
        state.blur(event)
      }
    },
  })
  const binding = useButtonInteraction(
    {
      tag,
      disabledForComponent: true,
      disabled: () => state.disabled() || Boolean(local.disabled),
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
      component={tag()}
      data-slot={state.slotName('trigger')}
      aria-haspopup="listbox"
      {...triggerSlot}
      {...rootBinding}
      {...state.ariaAttrs()}
      id={state.id()}
      aria-controls={state.listboxId()}
      aria-expanded={state.open() ? 'true' : 'false'}
      aria-activedescendant={
        state.open() && state.highlightedValue() !== undefined
          ? state.itemId(state.highlightedValue()!)
          : undefined
      }
    >
      {resolvedChildren()}
    </Dynamic>
  )
}
