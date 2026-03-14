import * as KobalteDropdownMenu from '@kobalte/core/dropdown-menu'
import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import type { IconName } from '../../elements/icon'
import type { RockUIComposeProps } from '../../shared/types'
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

/**
 * Base props for the DropdownMenu component.
 */
export interface DropdownMenuBaseProps {
  /**
   * Unique identifier for the dropdown menu.
   */
  id?: string

  /**
   * Controlled open state of the dropdown.
   */
  open?: boolean

  /**
   * Initial open state when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Callback triggered when the open state changes.
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Preferred placement of the dropdown menu relative to the trigger.
   * @default 'bottom'
   */
  placement?: OverlayMenuPlacement

  /**
   * Distance in pixels between the dropdown menu and the trigger.
   */
  gutter?: number

  /**
   * Size of the dropdown menu items.
   * @default 'md'
   */
  size?: DropdownMenuSize

  /**
   * Whether the dropdown menu is disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Items to display in the dropdown menu.
   */
  items?: DropdownMenuItems

  /**
   * Icon name for checked selection states.
   * @default 'icon-check'
   */
  checkedIcon?: IconName

  /**
   * Icon name for submenu indicators.
   * @default 'icon-chevron-right'
   */
  submenuIcon?: IconName

  /**
   * Custom renderer for individual dropdown menu items.
   */
  itemRender?: (context: DropdownMenuItemRenderContext) => JSX.Element

  /**
   * Content to render at the top of the dropdown menu body.
   */
  contentTop?: OverlayMenuContentSlot

  /**
   * Content to render at the bottom of the dropdown menu body.
   */
  contentBottom?: OverlayMenuContentSlot

  /**
   * Slot-based class overrides.
   */
  classes?: DropdownMenuClasses

  /**
   * Slot-based style overrides.
   */
  styles?: DropdownMenuStyles

  /**
   * Trigger element that opens the dropdown menu.
   */
  children: JSX.Element
}

/**
 * Props for the DropdownMenu component.
 */
export type DropdownMenuProps = RockUIComposeProps<
  DropdownMenuBaseProps,
  KobalteDropdownMenu.DropdownMenuRootProps,
  'arrowPadding'
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
