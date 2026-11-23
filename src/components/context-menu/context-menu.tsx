import type { JSX } from '@solidjs/web'

import { ContextMenuContent } from './context-menu-content'
import { ContextMenuProvider, createContextMenu } from './context-menu-context'
import { ContextMenuTrigger } from './context-menu-trigger'
import type { ContextMenuProps } from './context-menu.types'
/**
 * Menu state and interaction context for actions tied to a specific surface or item at the
 * pointer location; it renders no DOM element of its own. Compose it from `ContextMenu.Trigger`
 * and `ContextMenu.Content`. Use `DropdownMenu` when the same actions open from a visible trigger,
 * `Popover` when the content is not a list of commands, and keep essential actions discoverable
 * through another visible path.
 *
 * @example
 * ```tsx
 * import { ContextMenu } from 'moraine'
 *
 * <ContextMenu>
 *   <ContextMenu.Trigger>Right-click here</ContextMenu.Trigger>
 *   <ContextMenu.Content
 *     items={[
 *       { label: 'Copy' },
 *       { label: 'Paste' },
 *     ]}
 *   />
 * </ContextMenu>
 * ```
 */
export function ContextMenu(props: ContextMenuProps): JSX.Element {
  const context = createContextMenu(props)
  return <ContextMenuProvider value={context}>{props.children}</ContextMenuProvider>
}

ContextMenu.Trigger = ContextMenuTrigger
ContextMenu.Content = ContextMenuContent
