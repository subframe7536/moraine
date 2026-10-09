import type { JSX } from 'solid-js'

import { ModalInternal } from '../modal/modal'

import { SheetBody } from './sheet-body'
import { SheetClose } from './sheet-close'
import { SheetContent } from './sheet-content'
import { SheetDescription } from './sheet-description'
import { SheetFooter } from './sheet-footer'
import { SheetHeader } from './sheet-header'
import { SheetTitle } from './sheet-title'
import { SheetTrigger } from './sheet-trigger'
import type { SheetProps } from './sheet.types'

/** Sheet state and presentation, sharing the Modal root context. */
export function Sheet(props: SheetProps): JSX.Element {
  return <ModalInternal kind="sheet" {...props} />
}

Sheet.Trigger = SheetTrigger
Sheet.Content = SheetContent
Sheet.Header = SheetHeader
Sheet.Title = SheetTitle
Sheet.Description = SheetDescription
Sheet.Body = SheetBody
Sheet.Footer = SheetFooter
Sheet.Close = SheetClose
