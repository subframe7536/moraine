import type { JSX } from '@solidjs/web'

import { DropdownMenuContent } from './dropdown-menu-content'
import { DropdownMenuProvider, createDropdownMenu } from './dropdown-menu-context'
import { DropdownMenuTrigger } from './dropdown-menu-trigger'
import type { DropdownMenuProps } from './dropdown-menu.types'
/**
 * Menu state and interaction context for a compact set of actions opened from a visible trigger;
 * it renders no DOM element of its own. Compose it from `DropdownMenu.Trigger` and
 * `DropdownMenu.Content`. Use `Select` for choosing a form value, `ContextMenu` for actions at a
 * pointer location, and `Popover` when the content is not a list of commands. Pair `open` with
 * `onOpenChange` for controlled state or use `defaultOpen`.
 *
 * @example
 * ```tsx
 * import { Button, DropdownMenu } from 'moraine'
 *
 * <DropdownMenu>
 *   <DropdownMenu.Trigger as={Button}>Actions</DropdownMenu.Trigger>
 *   <DropdownMenu.Content
 *     items={[
 *       { label: 'Edit' },
 *       { label: 'Duplicate' },
 *     ]}
 *   />
 * </DropdownMenu>
 * ```
 */
export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const context = createDropdownMenu(props)
  return <DropdownMenuProvider value={context}>{props.children}</DropdownMenuProvider>
}

DropdownMenu.Trigger = DropdownMenuTrigger
DropdownMenu.Content = DropdownMenuContent
