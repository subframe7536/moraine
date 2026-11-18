import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'

import { createBaseDialogContentBinding } from './base-dialog-content-binding'
import { useBaseDialogContext } from './base-dialog-context'
import { baseDialogDataAttributes, baseDialogRecipe } from './base-dialog.recipe'
import type { BaseDialogT } from './base-dialog.types'

/**
 * Surface of a `BaseDialog` that holds the modal's content and carries the `dialog` role. Place it
 * inside `BaseDialog.Portal`, next to `BaseDialog.Overlay`; one `BaseDialog` root owns one active content. Give
 * it an accessible name with `aria-label` or `aria-labelledby`. Children can be JSX or a function
 * that receives `close`. Renders a `div`; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, BaseDialog } from 'moraine'
 *
 * <BaseDialog>
 *   <BaseDialog.Trigger as={Button}>Open</BaseDialog.Trigger>
 *   <BaseDialog.Portal>
 *     <BaseDialog.Overlay />
 *     <BaseDialog.Content aria-label="Custom surface">
 *       {(context) => <Button onClick={context.close}>Close</Button>}
 *     </BaseDialog.Content>
 *   </BaseDialog.Portal>
 * </BaseDialog>
 * ```
 */
export function BaseDialogContent<T extends ValidComponent = 'div'>(
  props: BaseDialogT.ContentProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as BaseDialogT.ContentProps<T> & { ref?: unknown }, [
    'as',
    'ref',
    'children',
    'class',
    'style',
  ])
  const context = useBaseDialogContext()
  const binding = createBaseDialogContentBinding(context, {
    ref: () => local.ref,
    onKeyDown: () =>
      rest.onKeyDown as JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined,
  })
  const {
    slots: { content: contentSlot },
  } = useRecipe(baseDialogRecipe, local, {
    slot: 'content',
    data: {
      content: baseDialogDataAttributes.content({
        expanded: context.open,
        closed: () => !context.open(),
        transition: context.transition,
      }),
    },
    context: () => context.slotOverrides,
  })

  const child = resolveChildren(() => local.children)
  const body = createMemo(() =>
    renderWithProps(child(), {
      close: () => context.updateOpen(false),
    }),
  )

  const tag = (): ValidComponent => local.as ?? 'div'

  return (
    <Dynamic
      component={tag()}
      data-slot="base-dialog-content"
      role="dialog"
      id={context.contentId()}
      tabIndex={binding.tabIndex}
      aria-modal={binding.ariaModal()}
      {...contentSlot}
      {...rest}
      ref={binding.ref}
      onKeyDown={binding.onKeyDown}
    >
      {body()}
    </Dynamic>
  )
}
