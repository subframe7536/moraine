import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { pickSlotOverrides } from '../../provider'
import { Modal } from '../modal/modal'
import { MODAL_ROOT_KEYS } from '../modal/modal-context'

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

/** Sheet state and presentation, sharing the Modal root context. */
export function Sheet(props: SheetProps): JSX.Element {
  const [modalProps, sheetProps] = splitProps(props, MODAL_ROOT_KEYS)
  const context: SheetContextValue = mergeProps(sheetProps, {
    get slotOverrides() {
      return pickSlotOverrides(props)
    },
  })
  return (
    <SheetProvider value={context}>
      <Modal {...modalProps} />
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
