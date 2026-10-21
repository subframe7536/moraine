import type { JSX } from 'solid-js'

import { DropdownMenuContent } from './dropdown-menu-content'
import { DropdownMenuProvider, createDropdownMenu } from './dropdown-menu-context'
import { DropdownMenuTrigger } from './dropdown-menu-trigger'
import type { DropdownMenuProps } from './dropdown-menu.types'

/** Menu state and interaction context, without a DOM root. */
export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const context = createDropdownMenu(props)
  return <DropdownMenuProvider value={context}>{props.children}</DropdownMenuProvider>
}

DropdownMenu.Trigger = DropdownMenuTrigger
DropdownMenu.Content = DropdownMenuContent
