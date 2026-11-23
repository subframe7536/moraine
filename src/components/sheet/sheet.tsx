import type { JSX } from '@solidjs/web'
import { merge, omit } from 'solid-js'

import { pickSlotOverrides } from '../../provider'
import { pick } from '../../shared/utils'
import { BaseDialog } from '../base-dialog/base-dialog'
import { BASE_DIALOG_ROOT_KEYS } from '../base-dialog/base-dialog-context'

import { SheetBody } from './sheet-body'
import { SheetClose } from './sheet-close'
import { SheetContent } from './sheet-content'
import type { SheetContextValue } from './sheet-context'
import { SheetProvider } from './sheet-context'
import { SheetDescription } from './sheet-description'
import { SheetFooter } from './sheet-footer'
import { SheetHeader } from './sheet-header'
import { SheetTitle } from './sheet-title'
import { SheetTrigger } from './sheet-trigger'
import type { SheetProps } from './sheet.types'
/**
 * Focused panel that slides in from a viewport edge, such as mobile navigation or an inspector. Use
 * `Drawer` when the surface needs swipe-to-dismiss gestures or snap points, `Dialog` for a centered
 * labeled task, `Popover` for anchored content that should not take over the page, and `BaseDialog` to
 * compose backdrop and content yourself. It renders no element of its own; open state is controlled
 * with `open`/`onOpenChange` or uncontrolled with `defaultOpen`.
 *
 * @example
 * ```tsx
 * import { Button, Sheet } from 'moraine'
 *
 * <Sheet>
 *   <Sheet.Trigger as={Button}>Open</Sheet.Trigger>
 *   <Sheet.Content title="Details">
 *     <Sheet.Body>Sheet content</Sheet.Body>
 *     <Sheet.Footer>
 *       <Sheet.Close as={Button}>Done</Sheet.Close>
 *     </Sheet.Footer>
 *   </Sheet.Content>
 * </Sheet>
 * ```
 */
export function Sheet(props: SheetProps): JSX.Element {
  const modalProps = pick(props, ...BASE_DIALOG_ROOT_KEYS)
  const sheetProps = omit(props, ...BASE_DIALOG_ROOT_KEYS)
  const context: SheetContextValue = merge(sheetProps, {
    get slotOverrides() {
      return pickSlotOverrides(props)
    },
  })
  return (
    <SheetProvider value={context}>
      <BaseDialog {...modalProps} />
    </SheetProvider>
  )
}

Sheet.Trigger = SheetTrigger
Sheet.Content = SheetContent
Sheet.Header = SheetHeader
Sheet.Title = SheetTitle
Sheet.Description = SheetDescription
Sheet.Body = SheetBody
Sheet.Footer = SheetFooter
Sheet.Close = SheetClose
