import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callRef } from '../../shared/utils'

import { useSidebarFrameContext } from './sidebar-frame-context'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Interactive trigger button for toggling sidebar visibility. */
export function SidebarFrameTrigger<T extends ValidComponent = 'button'>(
  props: SidebarFrameT.TriggerProps<T>,
): JSX.Element {
  type RuntimeProps = SidebarFrameT.TriggerBase<T> & {
    type?: string
    class?: string
    style?: JSX.CSSProperties
    ref?: (element: HTMLElement | undefined) => void
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
  const context = useSidebarFrameContext()
  const tag = createMemo(() => (local.as as ValidComponent) ?? 'button')
  const disabled = () => Boolean(local.disabled)

  const interactionProps = useButtonInteraction(
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
    <Dynamic
      data-slot="trigger"
      {...interactionProps}
      component={tag()}
      class={local.class}
      style={local.style}
      aria-expanded={context.isOpen()}
      data-open={context.isOpen() ? '' : undefined}
      data-closed={context.isOpen() ? undefined : ''}
      data-disabled={disabled() ? '' : undefined}
      ref={(element: HTMLElement) => callRef(local.ref, element)}
    >
      {children()}
    </Dynamic>
  )
}
