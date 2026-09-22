import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types.ts'
import { callRef } from '../../shared/utils'

import { useCollapsibleContext } from './collapsible-context'
import {
  COLLAPSIBLE_CONTENT_WRAPPER_CLASS,
  collapsibleDataAttributes,
  collapsibleRecipe,
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

  const shouldRender = createMemo(
    () =>
      local.forceMount ||
      !(local.unmountOnHide ?? context.unmountOnHide()) ||
      context.open() ||
      (context.transition() && context.contentPresence.present()),
  )
  const closed = createMemo(() => !context.open())
  const exiting = createMemo(
    () => closed() && context.transition() && context.contentPresence.present(),
  )
  const hidden = createMemo(() => closed() && !exiting())

  return (
    <Show when={shouldRender()}>
      {(_visible) => {
        const children = resolveChildren(() => local.children)

        return (
          <div
            ref={(element: HTMLElement) => {
              context.setContentElement(element)
              context.contentPresence.setElement(element)
            }}
            id={context.contentId()}
            aria-labelledby={context.triggerId()}
            aria-hidden={closed() ? true : undefined}
            data-slot="content-wrapper"
            {...collapsibleDataAttributes.content({
              transition: context.transition,
              expanded: () => context.dataAttrs()['data-expanded'],
              closed: () => context.dataAttrs()['data-closed'],
            })}
            hidden={hidden()}
            inert={closed() ? true : undefined}
            style={{
              get '--mo-collapsible-content-height'() {
                return `${context.contentHeight()}px`
              },
            }}
            class={COLLAPSIBLE_CONTENT_WRAPPER_CLASS}
          >
            <Dynamic
              data-slot="content"
              {...rest}
              component={local.as ?? 'div'}
              {...resolved.styles.content}
              ref={(element: HTMLElement) => callRef(local.ref, element)}
            >
              {children()}
            </Dynamic>
          </div>
        )
      }}
    </Show>
  )
}
