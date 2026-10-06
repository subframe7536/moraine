import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'

import { useSidebarFrameContext } from './sidebar-frame-context'
import { sidebarFrameDataAttributes } from './sidebar-frame.recipe'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Interactive trigger button for toggling sidebar visibility. */
export function SidebarFrameTrigger<T extends ValidComponent = 'button'>(
  props: SidebarFrameT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'disabled', 'children', 'class', 'style', 'ref'])
  const context = useSidebarFrameContext()
  const tag = createMemo(() => local.as ?? 'button')
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })
  const disabled = () => Boolean(local.disabled)
  const ariaControls = () => {
    const explicit = (rest as { 'aria-controls'?: string })['aria-controls']
    if (explicit !== undefined) {
      return explicit
    }
    if (context.isMobile() && !context.isOpen()) {
      return undefined
    }
    return context.sidebarId()
  }

  const interactionProps = useButtonInteraction(
    {
      disabled,
      element: root.element,
      disabledForComponent: true,
      onPress: context.toggle,
      tag,
    },
    rest,
  )
  const binding = root.bind(interactionProps)
  const children = resolveChildren(() => local.children)

  return (
    <Dynamic
      data-slot="sidebar-frame-trigger"
      {...binding}
      component={tag()}
      class={local.class}
      style={local.style}
      aria-controls={ariaControls()}
      aria-expanded={context.isOpen()}
      {...sidebarFrameDataAttributes.trigger({
        open: context.isOpen,
        closed: () => !context.isOpen(),
        disabled,
      })}
    >
      {children()}
    </Dynamic>
  )
}
