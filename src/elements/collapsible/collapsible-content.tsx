import type { JSX, ValidComponent } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { resolveComponentStyle } from '../../shared/provider/index.ts'
import { callRef, cn } from '../../shared/utils.ts'

import { useCollapsibleContext } from './collapsible-context.ts'
import type { CollapsibleT } from './collapsible.types.ts'

type CollapsibleContentElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

const COLLAPSIBLE_TRANSITION_CLASS =
  'h-[var(--mo-collapsible-content-height)] overflow-hidden data-expanded:animate-accordion-down data-closed:h-0 data-closed:animate-accordion-up motion-reduce:animate-none'

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
  const resolved = resolveComponentStyle({
    rootSlot: 'content',
    base: {
      get classes() {
        return { content: context.resolved.slotClass('content') }
      },
      get styles() {
        return { content: context.resolved.slotStyle('content') }
      },
    },
    get instance() {
      return { class: local.class, style: local.style }
    },
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
            style={{
              '--mo-collapsible-content-height': `${context.contentHeight()}px`,
              ...context.resolved.slotStyle('contentWrapper'),
              ...local.wrapperStyle,
            }}
            class={cn(
              transition() && COLLAPSIBLE_TRANSITION_CLASS,
              context.resolved.slotClass('contentWrapper'),
              local.wrapperClass,
            )}
            {...context.dataAttrs()}
          >
            <Show
              when={customAs()}
              fallback={
                <div
                  data-slot="content"
                  {...resolved.rootClassAndStyle()}
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
                  {...resolved.rootClassAndStyle()}
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
