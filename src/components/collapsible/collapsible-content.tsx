import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { createSignal, Show, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { bindElement } from '../../shared/element-binding'
import type { ValidComponent } from '../../shared/types'
import { callRef, pick } from '../../shared/utils'

import { useCollapsibleContext } from './collapsible-context'
import {
  COLLAPSIBLE_CONTENT_WRAPPER_CLASS,
  collapsibleDataAttributes,
  collapsibleRecipe,
  collapsibleWrapperDataAttributes,
} from './collapsible.recipe'
import type { CollapsibleT } from './collapsible.types'
/**
 * Panel inside `Collapsible` holding the expandable content, labelled by the trigger. Place it
 * inside `Collapsible`; it renders a `div` by default and `as` applies to that inner element. By
 * default the content mounts on first open and unmounts after it closes; set `forceMount` on
 * `Collapsible` to keep state inside it.
 *
 * @example
 * ```tsx
 * import { Collapsible } from 'moraine'
 *
 * <Collapsible defaultOpen>
 *   <Collapsible.Trigger>Details</Collapsible.Trigger>
 *   <Collapsible.Content>More information</Collapsible.Content>
 * </Collapsible>
 * ```
 */
export function CollapsibleContent<T extends ValidComponent = 'div'>(
  props: CollapsibleT.ContentProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'class', 'style', 'ref' as any)
  const rest = omit(props, 'as', 'class', 'style', 'ref' as any)
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
  const [wrapper, setWrapper] = createSignal<HTMLDivElement>()
  bindElement(wrapper, (element) => {
    const releaseContent = disclosure.registerContentElement(element)
    const releaseMeasure = disclosure.registerMeasureElement(element)
    return () => {
      releaseMeasure()
      releaseContent()
    }
  })

  return (
    <div
      ref={setWrapper}
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
      {...{ "prop:inert": disclosure.inert() }}
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
