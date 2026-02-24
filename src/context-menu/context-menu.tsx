import * as KobalteContextMenu from '@kobalte/core/context-menu'
import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import type { IconName } from '../icon'
import { OverlayMenuBaseContent } from '../shared/overlay-menu/base'
import type { OverlayMenuItemVariantProps } from '../shared/overlay-menu/base.class'
import type {
  OverlayMenuSharedClasses,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderContext,
} from '../shared/overlay-menu/types'
import type {
  OverlayMenuContentSlot,
  OverlayMenuItems,
  OverlayMenuPlacement,
} from '../shared/overlay-menu/utils'
import { resolveOverlayMenuSide } from '../shared/overlay-menu/utils'

type ContextMenuColor = NonNullable<OverlayMenuItemVariantProps['color']>
type ContextMenuSize = NonNullable<OverlayMenuItemVariantProps['size']>

export type ContextMenuItem = OverlayMenuSharedItem<ContextMenuColor, ContextMenuItem>
export type ContextMenuItems = OverlayMenuItems<ContextMenuItem>
export type ContextMenuClasses = OverlayMenuSharedClasses
export type ContextMenuItemRenderContext = OverlayMenuSharedItemRenderContext<ContextMenuItem>

export interface ContextMenuBaseProps {
  id?: string
  onOpenChange?: (open: boolean) => void
  placement?: OverlayMenuPlacement
  gutter?: number
  size?: ContextMenuSize
  disabled?: boolean
  items?: ContextMenuItems
  checkedIcon?: IconName
  submenuIcon?: IconName
  itemRender?: (context: ContextMenuItemRenderContext) => JSX.Element
  contentTop?: OverlayMenuContentSlot
  contentBottom?: OverlayMenuContentSlot
  classes?: ContextMenuClasses
  children: JSX.Element
}

export type ContextMenuProps = ContextMenuBaseProps &
  Omit<KobalteContextMenu.ContextMenuRootProps, keyof ContextMenuBaseProps | 'children' | 'class'>

export function ContextMenu(props: ContextMenuProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      checkedIcon: 'icon-check' as IconName,
      submenuIcon: 'icon-chevron-right' as IconName,
    },
    props,
  ) as ContextMenuProps
  const [menuProps, local, rootProps] = splitProps(
    merged,
    [
      'size',
      'disabled',
      'items',
      'checkedIcon',
      'submenuIcon',
      'itemRender',
      'contentTop',
      'contentBottom',
    ],
    ['classes', 'children'],
  )

  return (
    <KobalteContextMenu.Root overflowPadding={4} {...rootProps}>
      <KobalteContextMenu.Trigger
        data-slot="trigger"
        class={local.classes?.trigger}
        disabled={menuProps.disabled}
      >
        {local.children}
      </KobalteContextMenu.Trigger>

      <OverlayMenuBaseContent<ContextMenuItem>
        content={KobalteContextMenu.Content}
        classes={local.classes}
        {...menuProps}
        rootSide={resolveOverlayMenuSide(rootProps.placement ?? 'right')}
      />
    </KobalteContextMenu.Root>
  )
}
