import {
  ButtonGroup,
  Collapsible,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Modal,
  Popover,
  Sheet,
  Tooltip,
} from 'moraine'
import type { DialogT, SheetT } from 'moraine'
import { defineTheme } from 'moraine/theme'

type Assert<T extends true> = T
type DialogConfigKeys =
  | 'overlay'
  | 'scrollable'
  | 'fullscreen'
  | 'trapFocus'
  | 'ariaLabel'
  | 'close'
  | 'closeIcon'
type SheetConfigKeys =
  | 'overlay'
  | 'side'
  | 'inset'
  | 'transition'
  | 'trapFocus'
  | 'ariaLabel'
  | 'close'
type ContentShorthandKeys = 'title' | 'description'

export type OverlayConfigPlacement = [
  Assert<Exclude<DialogConfigKeys, keyof DialogT.Props> extends never ? true : false>,
  Assert<Extract<DialogConfigKeys, keyof DialogT.ContentProps> extends never ? true : false>,
  Assert<Exclude<SheetConfigKeys, keyof SheetT.Props> extends never ? true : false>,
  Assert<Extract<SheetConfigKeys, keyof SheetT.ContentProps> extends never ? true : false>,
  Assert<Extract<ContentShorthandKeys, keyof DialogT.Props> extends never ? true : false>,
  Assert<Exclude<ContentShorthandKeys, keyof DialogT.ContentProps> extends never ? true : false>,
  Assert<Extract<ContentShorthandKeys, keyof SheetT.Props> extends never ? true : false>,
  Assert<Exclude<ContentShorthandKeys, keyof SheetT.ContentProps> extends never ? true : false>,
]

;<Dialog classes={{ trigger: 'trigger', body: 'body' }} styles={{ content: { width: '20rem' } }} />
;<Dialog
  overlay={false}
  scrollable
  fullscreen
  trapFocus={false}
  ariaLabel="Dialog"
  close={false}
  closeIcon="icon-close"
/>
// @ts-expect-error A headless root has no primary DOM element.
;<Dialog class="root" />
;<Dialog.Trigger class="trigger" />
// @ts-expect-error A one-slot Trigger has no slot map.
;<Dialog.Trigger classes={{ trigger: 'trigger' }} />
;<Dialog.Content classes={{ overlay: 'overlay', contentClose: 'close' }} class="content" />
;<Dialog.Content title="Title" description="Description" />
// @ts-expect-error Dialog title shorthand belongs to Content.
;<Dialog title="Title" />
// @ts-expect-error Dialog layout belongs to the root.
;<Dialog.Content scrollable fullscreen />
// @ts-expect-error Dialog behavior belongs to the root.
;<Dialog.Content trapFocus={false} close={false} ariaLabel="Dialog" />
;<Dialog.Header class="header" />
;<Dialog.Title as="h3" id="title" />
;<Dialog.Description />
;<Dialog.Action />
;<Dialog.Body as="section" style={{ color: 'red' }} />
;<Dialog.Footer />
// @ts-expect-error A part has a direct class, not a slot map.
;<Dialog.Header classes={{ header: 'header' }} />
// @ts-expect-error Dialog.Content cannot style independently owned parts.
;<Dialog.Content classes={{ body: 'body' }} />
// @ts-expect-error Removed JSX prop.
;<Dialog.Content header="header" />
// @ts-expect-error Removed JSX prop.
;<Dialog.Content body="body" />
// @ts-expect-error Removed JSX prop.
;<Dialog.Content footer="footer" />
// @ts-expect-error Dialog.Content cannot configure Dialog.Trigger.
;<Dialog.Content classes={{ trigger: 'trigger' }} />
;<Dialog.Close class="close" />
// @ts-expect-error Dialog.Close is behavior-only.
;<Dialog.Close classes={{ contentClose: 'close' }} />

;<Sheet classes={{ trigger: 'trigger', body: 'body' }} />
;<Sheet
  side="left"
  inset
  overlay={false}
  transition={false}
  trapFocus={false}
  ariaLabel="Sheet"
  close={false}
/>
// @ts-expect-error A headless root has no primary DOM element.
;<Sheet style={{ color: 'red' }} />
;<Sheet.Trigger class="trigger" />
// @ts-expect-error A one-slot Trigger has no slot map.
;<Sheet.Trigger classes={{ trigger: 'trigger' }} />
;<Sheet.Content classes={{ overlay: 'overlay', contentClose: 'close' }} />
;<Sheet.Content title="Title" description="Description" />
// @ts-expect-error Sheet title shorthand belongs to Content.
;<Sheet title="Title" />
// @ts-expect-error Sheet layout belongs to the root.
;<Sheet.Content side="left" inset />
// @ts-expect-error Sheet behavior belongs to the root.
;<Sheet.Content transition={false} trapFocus={false} close={false} ariaLabel="Sheet" />
;<Sheet.Header class="header" />
;<Sheet.Title as="h3" id="title" />
;<Sheet.Description />
;<Sheet.Action />
;<Sheet.Body as="section" />
;<Sheet.Footer />
// @ts-expect-error A part has a direct class, not a slot map.
;<Sheet.Header classes={{ header: 'header' }} />
// @ts-expect-error Sheet.Content cannot style independently owned parts.
;<Sheet.Content classes={{ body: 'body' }} />
// @ts-expect-error Removed JSX prop.
;<Sheet.Content header="header" />
// @ts-expect-error Removed JSX prop.
;<Sheet.Content body="body" />
// @ts-expect-error Removed JSX prop.
;<Sheet.Content footer="footer" />
// @ts-expect-error Sheet.Content cannot configure Sheet.Trigger.
;<Sheet.Content classes={{ trigger: 'trigger' }} />
;<Sheet.Close class="close" />
// @ts-expect-error Sheet.Close is behavior-only.
;<Sheet.Close styles={{ contentClose: { color: 'red' } }} />
// @ts-expect-error Sheet header actions are no longer a public Content prop.
;<Sheet.Content action="action" />

;<Modal classes={{ overlay: 'overlay', content: 'content' }} />
// @ts-expect-error A headless root has no primary DOM element.
;<Modal class="root" />
;<Modal.Overlay class="overlay" />
// @ts-expect-error Modal.Overlay is a one-slot part.
;<Modal.Overlay classes={{ overlay: 'overlay' }} />
;<Modal.Content class="content">Content</Modal.Content>
// @ts-expect-error Modal.Content is a one-slot part.
;<Modal.Content classes={{ content: 'content' }}>Content</Modal.Content>

;<Popover classes={{ trigger: 'trigger', body: 'body' }} />
// @ts-expect-error A headless root has no primary DOM element.
;<Popover class="root" />
;<Popover.Trigger class="trigger" />
// @ts-expect-error Popover.Trigger is a one-slot part.
;<Popover.Trigger classes={{ trigger: 'trigger' }} />
;<Popover.Content classes={{ content: 'content', body: 'body' }} />
// @ts-expect-error Popover.Content cannot configure Popover.Trigger.
;<Popover.Content classes={{ trigger: 'trigger' }} />

;<Tooltip classes={{ trigger: 'trigger', text: 'text' }} />
// @ts-expect-error A headless root has no primary DOM element.
;<Tooltip class="root" />
;<Tooltip.Trigger class="trigger" />
// @ts-expect-error Tooltip.Trigger is a one-slot part.
;<Tooltip.Trigger classes={{ trigger: 'trigger' }} />
;<Tooltip.Content classes={{ content: 'content', text: 'text', kbds: 'kbds' }} />
// @ts-expect-error Shortcut keycaps belong to KbdGroup.
;<Tooltip.Content classes={{ kbd: 'kbd' }} />
// @ts-expect-error Tooltip.Content cannot configure Tooltip.Trigger.
;<Tooltip.Content classes={{ trigger: 'trigger' }} />

;<DropdownMenu classes={{ trigger: 'trigger', itemSubIndicator: 'submenu' }} />
// @ts-expect-error A headless root has no primary DOM element.
;<DropdownMenu class="root" />
;<DropdownMenu.Trigger class="trigger" />
// @ts-expect-error DropdownMenu.Trigger is a one-slot part.
;<DropdownMenu.Trigger classes={{ trigger: 'trigger' }} />
;<DropdownMenu.Content items={[]} classes={{ content: 'content', itemSubIndicator: 'submenu' }} />
// @ts-expect-error DropdownMenu.Content cannot configure DropdownMenu.Trigger.
;<DropdownMenu.Content items={[]} classes={{ trigger: 'trigger' }} />

;<ContextMenu classes={{ trigger: 'trigger', itemSubIndicator: 'submenu' }} />
// @ts-expect-error A headless root has no primary DOM element.
;<ContextMenu class="root" />
;<ContextMenu.Trigger class="trigger" />
// @ts-expect-error ContextMenu.Trigger is a one-slot part.
;<ContextMenu.Trigger classes={{ trigger: 'trigger' }} />
;<ContextMenu.Content items={[]} classes={{ content: 'content', itemSubIndicator: 'submenu' }} />
// @ts-expect-error ContextMenu.Content cannot configure ContextMenu.Trigger.
;<ContextMenu.Content items={[]} classes={{ trigger: 'trigger' }} />

;<ButtonGroup.Separator class="separator" />
// @ts-expect-error ButtonGroup.Separator is a one-slot part.
;<ButtonGroup.Separator classes={{ separator: 'separator' }} />
;<Collapsible.Content class="content">Content</Collapsible.Content>
// @ts-expect-error Collapsible.Content is a one-slot part.
;<Collapsible.Content classes={{ content: 'content' }}>Content</Collapsible.Content>
// @ts-expect-error Removed with the extra Collapsible wrapper DOM.
;<Collapsible.Content wrapperClass="wrapper" />
// @ts-expect-error Removed with the extra Collapsible wrapper DOM.
;<Collapsible.Content wrapperStyle={{ color: 'red' }} />
// @ts-expect-error Removed with the extra Collapsible wrapper DOM.
;<Collapsible.Content wrapperRef={() => undefined} />

defineTheme({ dialog: { base: { contentClose: 'close' } } })
defineTheme({ sheet: { base: { contentClose: 'close' } } })
defineTheme({ dropdownMenu: { base: { itemSubIndicator: 'submenu' } } })
defineTheme({ contextMenu: { base: { itemSubIndicator: 'submenu' } } })

// @ts-expect-error Dialog.wrapper was removed.
defineTheme({ dialog: { base: { wrapper: 'wrapper' } } })
// @ts-expect-error Dialog.close was replaced by contentClose.
defineTheme({ dialog: { base: { close: 'close' } } })
// @ts-expect-error Sheet.wrapper was removed.
defineTheme({ sheet: { base: { wrapper: 'wrapper' } } })
// @ts-expect-error Sheet.actions was removed.
defineTheme({ sheet: { base: { actions: 'actions' } } })
// @ts-expect-error Sheet.close was replaced by contentClose.
defineTheme({ sheet: { base: { close: 'close' } } })
// @ts-expect-error Tooltip.positioner is internal implementation styling.
defineTheme({ tooltip: { base: { positioner: 'positioner' } } })
// @ts-expect-error Menu itemSub was renamed to itemSubIndicator.
defineTheme({ dropdownMenu: { base: { itemSub: 'submenu' } } })
// @ts-expect-error Menu itemSub was renamed to itemSubIndicator.
defineTheme({ contextMenu: { base: { itemSub: 'submenu' } } })
// @ts-expect-error Collapsible.contentWrapper is internal and not configurable.
defineTheme({ collapsible: { base: { contentWrapper: 'wrapper' } } })
