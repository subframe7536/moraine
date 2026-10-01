import type { Accessor, JSX } from 'solid-js'
import { children as resolveChildren, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useCn } from '../../provider/cn-context'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'

import { useModalContext } from './modal-context'
import type { ModalT } from './modal.types'

/** Closes the current modal without registering another trigger or focus target. */
export function ModalClose<T extends ValidComponent = 'button'>(
  props: ModalT.CloseProps<T>,
): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'as',
    'disabled',
    'children',
    'class',
    'style',
    'ref' as any,
  ])
  const context = useModalContext()
  const tag: Accessor<ValidComponent> = () => local.as ?? 'button'
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })
  const interaction = useButtonInteraction(
    {
      disabled: () => Boolean(local.disabled),
      disabledForComponent: true,
      element: root.element,
      onPress: () => context.updateOpen(false),
      tag,
    },
    rest,
  )
  const binding = root.bind(interaction)
  const children = resolveChildren(() => local.children)

  return (
    <Dynamic
      data-slot={context.slotName('close')}
      {...binding}
      component={tag()}
      class={cn(local.class)}
      style={local.style}
    >
      {children()}
    </Dynamic>
  )
}
