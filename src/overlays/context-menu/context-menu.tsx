import * as KobalteContextMenu from '@kobalte/core/context-menu'
import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import type { IconName } from '../../elements/icon'
import { cn } from '../../shared/utils'
import { OverlayMenuBaseContent } from '../shared-overlay-menu/menu'
import type { OverlayMenuItemVariantProps } from '../shared-overlay-menu/menu.class'
import type {
  OverlayMenuSharedClasses,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderContext,
} from '../shared-overlay-menu/types'
import type {
  OverlayMenuContentSlot,
  OverlayMenuItems,
  OverlayMenuPlacement,
} from '../shared-overlay-menu/utils'
import { resolveOverlayMenuSide } from '../shared-overlay-menu/utils'

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
  Omit<
    KobalteContextMenu.ContextMenuRootProps,
    keyof ContextMenuBaseProps | 'children' | 'class' | 'arrowPadding'
  >

export function ContextMenu(props: ContextMenuProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      checkedIcon: 'icon-check' as IconName,
      submenuIcon: 'icon-chevron-right' as IconName,
    },
    props,
  ) as ContextMenuProps
  const [menuProps, localProps, restProps] = splitProps(
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
    <KobalteContextMenu.Root overflowPadding={4} {...restProps}>
      <KobalteContextMenu.Trigger
        data-slot="trigger"
        class={cn(localProps.classes?.trigger)}
        disabled={menuProps.disabled}
      >
        {localProps.children}
      </KobalteContextMenu.Trigger>

      <OverlayMenuBaseContent<ContextMenuItem>
        content={KobalteContextMenu.Content}
        classes={localProps.classes}
        {...menuProps}
        rootSide={resolveOverlayMenuSide(restProps.placement ?? 'right')}
      />
    </KobalteContextMenu.Root>
  )
}
