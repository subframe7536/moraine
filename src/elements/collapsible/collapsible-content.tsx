import type { JSX, ValidComponent } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { callRef, cn } from '../../shared/utils'

import type { CollapsibleT } from './collapsible'
import { useCollapsibleContext } from './collapsible-context'
import { COLLAPSIBLE_CONTENT_ANIMATION_CLASS, COLLAPSIBLE_CONTENT_CLASS } from './collapsible.class'

type CollapsibleContentElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

/** Panel containing the expandable collapsible content. */
export function CollapsibleContent<T extends ValidComponent = 'div'>(
  props: CollapsibleT.ContentProps<T>,
): JSX.Element {
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
            style={{
              '--mo-collapsible-content-height': `${context.contentHeight()}px`,
              ...local.wrapperStyle,
            }}
            class={cn(
              COLLAPSIBLE_CONTENT_CLASS,
              transition() && COLLAPSIBLE_CONTENT_ANIMATION_CLASS,
              local.wrapperClass,
            )}
            {...context.dataAttrs()}
          >
            <Show
              when={customAs()}
              fallback={
                <div
                  data-slot="content"
                  style={local.style}
                  class={local.class}
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
                  style={local.style}
                  class={local.class}
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
