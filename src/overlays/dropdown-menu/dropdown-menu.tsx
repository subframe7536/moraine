import * as KobalteDropdownMenu from '@kobalte/core/dropdown-menu'
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
  OverlayMenuSharedStyles,
} from '../shared-overlay-menu/types'
import type {
  OverlayMenuContentSlot,
  OverlayMenuItems,
  OverlayMenuPlacement,
} from '../shared-overlay-menu/utils'
import { resolveOverlayMenuSide } from '../shared-overlay-menu/utils'

type DropdownMenuColor = NonNullable<OverlayMenuItemVariantProps['color']>
type DropdownMenuSize = NonNullable<OverlayMenuItemVariantProps['size']>

export type DropdownMenuItem = OverlayMenuSharedItem<DropdownMenuColor, DropdownMenuItem>
export type DropdownMenuItems = OverlayMenuItems<DropdownMenuItem>
export type DropdownMenuClasses = OverlayMenuSharedClasses
export type DropdownMenuStyles = OverlayMenuSharedStyles
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
  styles?: DropdownMenuStyles
  children: JSX.Element
}

export type DropdownMenuProps = DropdownMenuBaseProps &
  Omit<
    KobalteDropdownMenu.DropdownMenuRootProps,
    keyof DropdownMenuBaseProps | 'children' | 'class' | 'arrowPadding'
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
    ['classes', 'styles', 'children'],
  )

  return (
    <KobalteDropdownMenu.Root overflowPadding={4} {...restProps}>
      <KobalteDropdownMenu.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        style={localProps.styles?.trigger}
        class={cn('outline-none', localProps.classes?.trigger)}
        disabled={menuProps.disabled}
      >
        {localProps.children}
      </KobalteDropdownMenu.Trigger>

      <OverlayMenuBaseContent<DropdownMenuItem>
        content={KobalteDropdownMenu.Content}
        classes={localProps.classes}
        styles={localProps.styles}
        {...menuProps}
        rootSide={resolveOverlayMenuSide(restProps.placement ?? 'bottom')}
      />
    </KobalteDropdownMenu.Root>
  )
}
