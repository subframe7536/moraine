import type { JSX, ValidComponent } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createComponentStyles } from '../../shared/provider'
import { useCn } from '../../shared/provider/cn-context'
import { callRef } from '../../shared/utils'

import { useCollapsibleContext } from './collapsible-context'
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
  const resolved = createComponentStyles('collapsible', local, {
    rootSlot: 'content',
    groupStyles: () => context.presentation,
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
      {(visible) => {
        if (!visible()) {
          return null
        }

        const children = resolveChildren(() => local.children)

        const handleInnerRef = (element: HTMLElement | undefined) => {
          callRef(local.ref as ((el: HTMLElement | undefined) => void) | undefined, element)
          if (element) {
            onCleanup(() => {
              callRef(local.ref as ((el: HTMLElement | undefined) => void) | undefined, undefined)
            })
          }
        }

        return (
          <div
            ref={(element) => {
              context.setContentElement(element)
              context.contentPresence.setElement(element)
              callRef(local.wrapperRef, element)
              if (element) {
                onCleanup(() => {
                  callRef(local.wrapperRef, undefined)
                })
              }
            }}
            id={context.contentId()}
            aria-labelledby={context.triggerId()}
            data-slot="content-wrapper"
            data-transition={transition() ? '' : undefined}
            style={{
              '--mo-collapsible-content-height': `${context.contentHeight()}px`,
              ...resolved.slot('contentWrapper').style,
              ...local.wrapperStyle,
            }}
            class={cn(resolved.slot('contentWrapper').class, local.wrapperClass)}
            {...context.dataAttrs()}
          >
            <Show
              when={customAs()}
              fallback={
                <div
                  data-slot="content"
                  {...resolved.root}
                  ref={(el) => handleInnerRef(el)}
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
                  {...resolved.root}
                  ref={(el: HTMLElement | undefined) => handleInnerRef(el)}
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
