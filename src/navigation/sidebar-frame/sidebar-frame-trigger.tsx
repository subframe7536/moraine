import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callRef } from '../../shared/utils'

import { useSidebarFrameContext } from './sidebar-frame-context'
import { sidebarFrameDataAttributes } from './sidebar-frame.recipe'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Interactive trigger button for toggling sidebar visibility. */
export function SidebarFrameTrigger<T extends ValidComponent = 'button'>(
  props: SidebarFrameT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'disabled',
    'children',
    'class',
    'style',
    'ref' as any,
  ])
  const context = useSidebarFrameContext()
  const tag = createMemo(() => local.as ?? 'button')
  const disabled = () => Boolean(local.disabled)

  const interactionProps = useButtonInteraction(
    {
      disabled,
      disabledForComponent: true,
      onPress: context.toggle,
      tag,
    },
    rest,
  )
  const children = resolveChildren(() => local.children)

  return (
    <Dynamic
      data-slot="trigger"
      {...interactionProps}
      component={tag()}
      class={local.class}
      style={local.style}
      aria-expanded={context.isOpen()}
      {...sidebarFrameDataAttributes.trigger({
        open: context.isOpen,
        closed: () => !context.isOpen(),
        disabled,
      })}
      ref={(element: HTMLElement) => callRef(local.ref, element)}
    >
      {children()}
    </Dynamic>
  )
}
