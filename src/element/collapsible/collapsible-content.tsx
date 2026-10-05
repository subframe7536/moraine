import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, Show, splitProps } from 'solid-js'
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
  const resolved = createStyles(collapsibleRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => context.presentation,
  })

  const shouldRenderContent = createMemo(() =>
    context.disclosure.shouldMount({
      forceMount: local.forceMount,
      unmountOnHide: local.unmountOnHide,
    }),
  )

  return (
    <div
      ref={(element: HTMLElement) => {
        onCleanup(context.registerContentElement(element))
      }}
      id={context.contentId()}
      aria-labelledby={context.triggerId()}
      aria-hidden={context.disclosure.ariaHidden()}
      data-slot="collapsible-content-wrapper"
      {...collapsibleWrapperDataAttributes({
        transition: context.transition,
        expanded: () => context.dataAttrs()['data-expanded'],
        closed: () => context.dataAttrs()['data-closed'],
      })}
      hidden={context.disclosure.hidden()}
      inert={context.disclosure.inert()}
      style={{
        '--mo-collapsible-content-height': `${context.contentHeight()}px`,
      }}
      class={COLLAPSIBLE_CONTENT_WRAPPER_CLASS}
    >
      <Show when={shouldRenderContent()}>
        <Dynamic
          data-slot="collapsible-content"
          {...rest}
          {...collapsibleDataAttributes.content({
            expanded: () => context.dataAttrs()['data-expanded'],
            closed: () => context.dataAttrs()['data-closed'],
          })}
          component={local.as ?? 'div'}
          {...resolved.styles.content}
          ref={(element: HTMLElement) => callRef(local.ref, element)}
        >
          {resolveChildren(() => local.children)()}
        </Dynamic>
      </Show>
    </div>
  )
}
