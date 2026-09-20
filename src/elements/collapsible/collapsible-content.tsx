import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import type { ValidComponent } from '../../shared/types.ts'
import { callRef } from '../../shared/utils'

import { useCollapsibleContext } from './collapsible-context'
import { collapsibleRecipe } from './collapsible.recipe'
import type { CollapsibleT } from './collapsible.types'

/** Panel containing the expandable collapsible content. */
export function CollapsibleContent<T extends ValidComponent = 'div'>(
  props: CollapsibleT.ContentProps<T>,
): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'style',
    'ref' as any,
    'unmountOnHide',
    'forceMount',
    'wrapperClass',
    'wrapperStyle',
    'wrapperRef',
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
            ref={(element) => {
              context.setContentElement(element)
              context.contentPresence.setElement(element)
              callRef(local.wrapperRef, element)
            }}
            id={context.contentId()}
            aria-labelledby={context.triggerId()}
            aria-hidden={closed() ? true : undefined}
            data-slot="content-wrapper"
            data-transition={context.transition() ? '' : undefined}
            hidden={hidden()}
            inert={closed() ? true : undefined}
            style={{
              '--mo-collapsible-content-height': `${context.contentHeight()}px`,
              ...resolved.styles.contentWrapper.style,
              ...local.wrapperStyle,
            }}
            class={cn(resolved.styles.contentWrapper.class, local.wrapperClass)}
            {...context.dataAttrs()}
          >
            <Dynamic
              data-slot="content"
              {...rest}
              component={local.as ?? 'div'}
              {...resolved.styles.content}
              ref={(el: HTMLElement) => callRef(local.ref, el)}
            >
              {children()}
            </Dynamic>
          </div>
        )
      }}
    </Show>
  )
}
