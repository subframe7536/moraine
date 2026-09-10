import type { JSX, ValidComponent } from 'solid-js'
import { children as resolveChildren, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useCn } from '../../shared/provider/cn-context'
import { useButtonInteraction } from '../../shared/use-button-interaction'

import { useModalContext } from './modal-context'
import type { ModalT } from './modal.types'

/** Closes the current modal without registering another trigger or focus target. */
export function ModalClose<T extends ValidComponent = 'button'>(
  props: ModalT.CloseProps<T>,
): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, ['as', 'type', 'disabled', 'children', 'class', 'style'])
  const context = useModalContext()
  const interaction = useButtonInteraction(
    {
      disabled: () => Boolean(local.disabled),
      disabledForComponent: true,
      onPress: () => () => context.updateOpen(false),
      tag: () => local.as ?? 'button',
      type: () => local.type,
      typeForComponent: true,
    },
    rest,
  )
  const children = resolveChildren(() => local.children)

  return (
    <Dynamic
      data-slot="close"
      {...interaction}
      component={(local.as as ValidComponent) ?? 'button'}
      class={cn(local.class)}
      style={local.style}
    >
      {children()}
    </Dynamic>
  )
}
