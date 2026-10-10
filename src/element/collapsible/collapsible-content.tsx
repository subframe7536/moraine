import type { JSX } from 'solid-js'
import { children as resolveChildren, onCleanup, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
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
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'style',
    'ref' as any,
    'unmountOnHide',
    'forceMount',
  ])
  const context = useCollapsibleContext()
  const disclosure = context.disclosure
  const resolved = createStyles(collapsibleRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => context.presentation,
  })

  const shouldRenderContent = () =>
    disclosure.shouldMount({
      forceMount: local.forceMount,
      unmountOnHide: local.unmountOnHide,
    })

  return (
    <div
      ref={(element: HTMLElement) => {
        onCleanup(disclosure.registerContentElement(element))
      }}
      id={context.contentId()}
      aria-labelledby={context.triggerId()}
      aria-hidden={disclosure.ariaHidden()}
      data-slot="collapsible-content-wrapper"
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
          {...collapsibleDataAttributes.content({
            expanded: disclosure.open,
            closed: disclosure.closed,
          })}
          {...rest}
          {...resolved.styles.content}
          ref={(element: HTMLElement) => callRef(local.ref, element)}
        >
          {resolveChildren(() => local.children)()}
        </Dynamic>
      </Show>
    </div>
  )
}
