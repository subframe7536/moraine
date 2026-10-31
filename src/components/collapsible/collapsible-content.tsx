import type { JSX } from 'solid-js'
import { onCleanup, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { callRef } from '../../shared/utils'

import { useCollapsibleContext } from './collapsible-context'
import {
  COLLAPSIBLE_CONTENT_WRAPPER_CLASS,
  collapsibleDataAttributes,
  collapsibleRecipe,
  collapsibleWrapperDataAttributes,
} from './collapsible.recipe'
import type { CollapsibleT } from './collapsible.types'

/** Panel containing the expandable collapsible content. */
export function CollapsibleContent<T extends ValidComponent = 'div'>(
  props: CollapsibleT.ContentProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'ref' as any])
  const context = useCollapsibleContext()
  if (!context) {
    throw new Error('Collapsible.Content must be used within Collapsible')
  }
  const disclosure = context.disclosure
  const {
    slots: { content: contentSlot },
  } = useRecipe(collapsibleRecipe, local, {
    slot: 'content',
    data: {
      content: collapsibleDataAttributes.content({
        expanded: disclosure.open,
        closed: disclosure.closed,
      }),
    },
    context: () => context.slotOverrides,
  })

  const shouldRenderContent = () => disclosure.shouldMount()

  return (
    <div
      ref={(element: HTMLElement) => {
        onCleanup(disclosure.registerContentElement(element))
      }}
      id={context.contentId()}
      aria-labelledby={context.triggerId()}
      aria-hidden={disclosure.ariaHidden()}
      data-slot="collapsible-content-wrapper"
      // oxlint-disable-next-line moraine/data-attributes-in-slot-binding -- the private wrapper is not a recipe slot; it uses COLLAPSIBLE_CONTENT_WRAPPER_CLASS
      {...collapsibleWrapperDataAttributes({
        transition: disclosure.transition,
        expanded: disclosure.open,
        closed: disclosure.closed,
      })}
      hidden={disclosure.hidden()}
      inert={disclosure.inert()}
      style={{
        animation: disclosure.initialOpen() ? 'none' : undefined,
        height: disclosure.initialOpen() ? 'auto' : undefined,
      }}
      class={COLLAPSIBLE_CONTENT_WRAPPER_CLASS}
    >
      <Show when={shouldRenderContent()}>
        <Dynamic
          component={local.as ?? 'div'}
          data-slot="collapsible-content"
          {...contentSlot}
          {...rest}
          ref={(element: HTMLElement) => callRef(local.ref, element)}
        />
      </Show>
    </div>
  )
}
