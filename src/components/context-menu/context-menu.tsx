import type { JSX } from 'solid-js'

import { ContextMenuContent } from './context-menu-content'
import { ContextMenuProvider, createContextMenu } from './context-menu-context'
import { ContextMenuTrigger } from './context-menu-trigger'
import type { ContextMenuProps } from './context-menu.types'

/** Menu state and interaction context, without a DOM root. */
export function ContextMenu(props: ContextMenuProps): JSX.Element {
  const context = createContextMenu(props)
  return <ContextMenuProvider value={context}>{props.children}</ContextMenuProvider>
}

ContextMenu.Trigger = ContextMenuTrigger
ContextMenu.Content = ContextMenuContent
