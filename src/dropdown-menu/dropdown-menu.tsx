import * as KobalteDropdownMenu from '@kobalte/core/dropdown-menu'
import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import type { IconName } from '../icon'
import { OverlayMenuBaseContent } from '../shared/overlay-menu/menu'
import type { OverlayMenuItemVariantProps } from '../shared/overlay-menu/menu.class'
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
import { cn } from '../shared/utils'

type DropdownMenuColor = NonNullable<OverlayMenuItemVariantProps['color']>
type DropdownMenuSize = NonNullable<OverlayMenuItemVariantProps['size']>

export type DropdownMenuItem = OverlayMenuSharedItem<DropdownMenuColor, DropdownMenuItem>
export type DropdownMenuItems = OverlayMenuItems<DropdownMenuItem>
export type DropdownMenuClasses = OverlayMenuSharedClasses
export type DropdownMenuItemRenderContext = OverlayMenuSharedItemRenderContext<DropdownMenuItem>

export interface DropdownMenuBaseProps {
  id?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: OverlayMenuPlacement
  gutter?: number
  size?: DropdownMenuSize
  disabled?: boolean
  items?: DropdownMenuItems
  checkedIcon?: IconName
  submenuIcon?: IconName
  itemRender?: (context: DropdownMenuItemRenderContext) => JSX.Element
  contentTop?: OverlayMenuContentSlot
  contentBottom?: OverlayMenuContentSlot
  classes?: DropdownMenuClasses
  children: JSX.Element
}

export type DropdownMenuProps = DropdownMenuBaseProps &
  Omit<
    KobalteDropdownMenu.DropdownMenuRootProps,
    keyof DropdownMenuBaseProps | 'children' | 'class'
  >

export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      checkedIcon: 'icon-check' as IconName,
      submenuIcon: 'icon-chevron-right' as IconName,
    },
    props,
  ) as DropdownMenuProps
  const [menuProps, localProps, restProps] = splitProps(
    merged,
    ['size', 'items', 'checkedIcon', 'submenuIcon', 'itemRender', 'contentTop', 'contentBottom'],
    ['classes', 'children'],
  )

  return (
    <KobalteDropdownMenu.Root overflowPadding={4} {...restProps}>
      <KobalteDropdownMenu.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        class={cn(localProps.classes?.trigger)}
        disabled={restProps.disabled}
      >
        {localProps.children}
      </KobalteDropdownMenu.Trigger>

      <OverlayMenuBaseContent<DropdownMenuItem>
        content={KobalteDropdownMenu.Content}
        classes={localProps.classes}
        {...menuProps}
        rootSide={resolveOverlayMenuSide(restProps.placement ?? 'bottom')}
      />
    </KobalteDropdownMenu.Root>
  )
}
