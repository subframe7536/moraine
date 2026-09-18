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

type CollapsibleContentElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

/** Panel containing the expandable collapsible content. */
export function CollapsibleContent<T extends ValidComponent = 'div'>(
  props: CollapsibleT.ContentProps<T>,
): JSX.Element {
  const cn = useCn()
  type RuntimeProps = CollapsibleT.ContentBase<T> & {
    class?: string
    style?: JSX.CSSProperties
    ref?: (element: CollapsibleContentElementFor<T> | undefined) => void
  } & Record<string, unknown>

  const [local, rest] = splitProps(props as RuntimeProps, [
    'as',
    'children',
    'class',
    'style',
    'ref',
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
  const customAs = createMemo(() => local.as)
  const unmount = createMemo(() => local.unmountOnHide ?? context.unmountOnHide())
  const forceMount = createMemo(() => Boolean(local.forceMount))
  const transition = createMemo(() => context.transition())
  const shouldRender = createMemo(
    () =>
      forceMount() ||
      !unmount() ||
      context.open() ||
      (transition() && context.contentPresence.present()),
  )

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
            data-slot="content-wrapper"
            data-transition={transition() ? '' : undefined}
            style={{
              '--mo-collapsible-content-height': `${context.contentHeight()}px`,
              ...resolved.styles.contentWrapper.style,
              ...local.wrapperStyle,
            }}
            class={cn(resolved.styles.contentWrapper.class, local.wrapperClass)}
            {...context.dataAttrs()}
          >
            <Show
              when={customAs()}
              fallback={
                <div
                  data-slot="content"
                  {...resolved.styles.content}
                  ref={(el) => callRef(local.ref, el as any)}
                  {...rest}
                >
                  {children()}
                </div>
              }
            >
              {(as) => (
                <Dynamic
                  data-slot="content"
                  {...(rest as Record<string, unknown>)}
                  component={as() as ValidComponent}
                  {...resolved.styles.content}
                  ref={(el: any) => callRef(local.ref, el)}
                >
                  {children()}
                </Dynamic>
              )}
            </Show>
          </div>
        )
      }}
    </Show>
  )
}
