import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { omit } from 'solid-js'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { pick } from '../../shared/utils'

import { useBaseDialogContext } from './base-dialog-context'
import type { BaseDialogT } from './base-dialog.types'
/**
 * Control that closes the surrounding `BaseDialog`. Place it anywhere inside the `BaseDialog` root, usually
 * within `BaseDialog.Content`. Renders a `button`; pass `as` to render another component such as
 * `Button`.
 *
 * @example
 * ```tsx
 * import { Button, BaseDialog } from 'moraine'
 *
 * <BaseDialog>
 *   <BaseDialog.Trigger as={Button}>Open</BaseDialog.Trigger>
 *   <BaseDialog.Portal>
 *     <BaseDialog.Overlay />
 *     <BaseDialog.Content aria-label="Details">
 *       <BaseDialog.Close as={Button}>Close</BaseDialog.Close>
 *     </BaseDialog.Content>
 *   </BaseDialog.Portal>
 * </BaseDialog>
 * ```
 */
export function BaseDialogClose<T extends ValidComponent = 'button'>(
  props: BaseDialogT.CloseProps<T>,
): JSX.Element {
  const local = pick(props as BaseDialogT.CloseProps, 'as', 'disabled', 'ref')
  const rest = omit(props as BaseDialogT.CloseProps, 'as', 'disabled', 'ref')
  const context = useBaseDialogContext()
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
  const Root = dynamic(tag)

  return <Root data-slot="base-dialog-close" {...binding} />
}
