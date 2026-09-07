import type { JSX, ValidComponent } from 'solid-js'
import { children as resolveChildren, createMemo, onCleanup, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { resolveComponentStyle } from '../../shared/provider/index.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction.ts'
import { callRef } from '../../shared/utils.ts'

import { useCollapsibleContext } from './collapsible-context.ts'
import type { CollapsibleT } from './collapsible.types.ts'

type CollapsibleTriggerElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

/** Interactive trigger button for expanding/collapsing collapsible content. */
export function CollapsibleTrigger<T extends ValidComponent = 'button'>(
  props: CollapsibleT.TriggerProps<T>,
): JSX.Element {
  type RuntimeProps = CollapsibleT.TriggerBase<T> & {
    class?: string
    style?: JSX.CSSProperties
    ref?: (element: CollapsibleTriggerElementFor<T> | undefined) => void
  } & Record<string, unknown>

  const [local, rest] = splitProps(props as RuntimeProps, [
    'as',
    'type',
    'disabled',
    'children',
    'class',
    'style',
    'ref',
  ])
  const context = useCollapsibleContext()
  const resolved = resolveComponentStyle({
    rootSlot: 'trigger',
    base: {
      get classes() {
        return { trigger: context.resolved.slotClass('trigger') }
      },
      get styles() {
        return { trigger: context.resolved.slotStyle('trigger') }
      },
    },
    get instance() {
      return { class: local.class, style: local.style }
    },
  })
  const customAs = createMemo(() => local.as)
  const tag = createMemo(() => customAs() ?? 'button')
  const disabled = () => Boolean(context.disabled() || local.disabled)

  const handleRef = (element: HTMLElement | undefined) => {
    context.setTriggerElement(element)
    callRef(local.ref as ((el: HTMLElement | undefined) => void) | undefined, element)

    if (element) {
      onCleanup(() => {
        if (context.triggerElement() === element) {
          context.setTriggerElement(undefined)
        }
        callRef(local.ref as ((el: HTMLElement | undefined) => void) | undefined, undefined)
      })
    }
  }

  const interactionProps = useButtonInteraction<CollapsibleTriggerElementFor<T>>(
    {
      disabled,
      disabledForComponent: true,
      onPress: () => context.toggle,
      tag,
      type: () => local.type,
      typeForComponent: true,
    },
    rest,
  )
  const children = resolveChildren(() => local.children)

  return (
    <Show
      when={customAs()}
      fallback={
        <button
          id={context.triggerId()}
          data-slot="trigger"
          {...(interactionProps as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}
          {...resolved.rootClassAndStyle()}
          aria-controls={context.open() ? context.contentId() : undefined}
          aria-expanded={context.open()}
          {...context.dataAttrs()}
          data-disabled={disabled() ? '' : undefined}
          ref={(el) => handleRef(el)}
        >
          {children()}
        </button>
      }
    >
      {(as) => (
        <Dynamic
          id={context.triggerId()}
          data-slot="trigger"
          {...(interactionProps as Record<string, unknown>)}
          component={as() as ValidComponent}
          {...resolved.rootClassAndStyle()}
          aria-controls={context.open() ? context.contentId() : undefined}
          aria-expanded={context.open()}
          {...context.dataAttrs()}
          data-disabled={disabled() ? '' : undefined}
          ref={(el: HTMLElement | undefined) => handleRef(el)}
        >
          {children()}
        </Dynamic>
      )}
    </Show>
  )
}
