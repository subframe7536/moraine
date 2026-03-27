import * as KobalteDropdownMenu from '@kobalte/core/dropdown-menu'
import type { JSX } from 'solid-js'
import {
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'

import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn, useId } from '../../shared/utils'
import { OverlayMenuBaseContent } from '../shared-overlay-menu/menu'
import type { OverlayMenuItemVariantProps } from '../shared-overlay-menu/menu.class'
import type {
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderContext,
  OverlayMenuSharedSlots,
} from '../shared-overlay-menu/types'
import type { OverlayMenuContentSlot, OverlayMenuPlacement } from '../shared-overlay-menu/utils'
import { resolveOverlayMenuSide } from '../shared-overlay-menu/utils'

type ContextMenuColor = NonNullable<OverlayMenuItemVariantProps['color']>
type ContextMenuSize = NonNullable<OverlayMenuItemVariantProps['size']>

export namespace ContextMenuT {
  export type Slot = OverlayMenuSharedSlots
  export type Variant = {}
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>

  export interface Items extends OverlayMenuSharedItem<ContextMenuColor, Items> {}
  export type Extend = KobalteDropdownMenu.DropdownMenuRootProps

  /**
   * Base props for the ContextMenu component.
   */
  export interface Base {
    /**
     * Unique identifier for the context menu.
     */
    id?: string

    /**
     * Controlled open state of the menu.
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
     * Preferred placement of the menu relative to the interaction point.
     * @default 'right-start'
     */
    placement?: OverlayMenuPlacement

    /**
     * Distance in pixels between the menu and the interaction point.
     */
    gutter?: number

    /**
     * Size of the menu items.
     * @default 'md'
     */
    size?: ContextMenuSize

    /**
     * Whether the context menu is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Items to display in the context menu.
     */
    items?: Items[]

    /**
     * Icon name used for checked menu items.
     * @default 'icon-check'
     */
    checkedIcon?: IconT.Name

    /**
     * Icon name used for submenu indicators.
     * @default 'icon-chevron-right'
     */
    submenuIcon?: IconT.Name

    /**
     * Custom renderer for individual menu items.
     */
    itemRender?: (context: OverlayMenuSharedItemRenderContext<Items>) => JSX.Element

    /**
     * Content to render at the top of the menu.
     */
    contentTop?: OverlayMenuContentSlot

    /**
     * Content to render at the bottom of the menu.
     */
    contentBottom?: OverlayMenuContentSlot

    /**
     * Slot-based class overrides.
     */
    classes?: Classes

    /**
     * Slot-based style overrides.
     */
    styles?: Styles

    /**
     * The element to which the context menu is attached.
     */
    children: JSX.Element
  }

  /**
   * Props for the ContextMenu component.
   */
  export interface Props extends BaseProps<
    Base,
    Variant,
    Extend,
    'arrowPadding' | 'getAnchorRect'
  > {}
}

/**
 * Props for the ContextMenu component.
 */
export interface ContextMenuProps extends ContextMenuT.Props {}

const CONTEXT_MENU_LONG_PRESS_DELAY = 700

function isTouchOrPen(pointerType: string): boolean {
  return pointerType === 'touch' || pointerType === 'pen'
}

/** Right-click activated context menu with nested items, checkboxes, and radio groups. */
export function ContextMenu(props: ContextMenuProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      checkedIcon: 'icon-check' as IconT.Name,
      submenuIcon: 'icon-chevron-right' as IconT.Name,
      placement: 'right-start' as const,
    },
    props,
  ) as ContextMenuProps
  const [menuProps, localProps, controlProps, rootProps] = splitProps(
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
    ['id', 'classes', 'styles', 'children'],
    ['open', 'defaultOpen', 'onOpenChange'],
  )
  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(
    untrack(() => Boolean(controlProps.defaultOpen)),
  )
  const [anchorPoint, setAnchorPoint] = createSignal<{ x: number; y: number } | null>(null)
  const resolvedOpen = createMemo(() => controlProps.open ?? uncontrolledOpen())
  const resolvedId = useId(() => localProps.id, 'contextmenu')
  let longPressTimeoutId = 0
  let triggerElement: HTMLElement | undefined

  const commitOpen = (open: boolean): void => {
    if (controlProps.open === undefined) {
      setUncontrolledOpen(open)
    }

    controlProps.onOpenChange?.(open)
  }

  const onRootOpenChange = (open: boolean): void => {
    if (!open) {
      commitOpen(false)
    }
  }

  const clearLongPressTimeout = (): void => {
    if (typeof window === 'undefined') {
      return
    }

    window.clearTimeout(longPressTimeoutId)
  }

  onCleanup(() => {
    clearLongPressTimeout()
  })

  const isPointerInsideTrigger = (event: MouseEvent): boolean => {
    if (!triggerElement) {
      return false
    }

    const rect = triggerElement.getBoundingClientRect()

    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    )
  }

  onMount(() => {
    const onDocumentContextMenuCapture = (event: MouseEvent): void => {
      if (menuProps.disabled) {
        return
      }

      const targetInsideTrigger =
        event.target instanceof Node && Boolean(triggerElement?.contains(event.target))
      const pointerInsideTrigger = isPointerInsideTrigger(event)

      if (!targetInsideTrigger && !pointerInsideTrigger) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (resolvedOpen()) {
        commitOpen(false)
        return
      }

      openFromPoint(event.clientX, event.clientY)
    }

    document.addEventListener('contextmenu', onDocumentContextMenuCapture, true)

    onCleanup(() => {
      document.removeEventListener('contextmenu', onDocumentContextMenuCapture, true)
    })
  })

  const openFromPoint = (x: number, y: number): void => {
    if (menuProps.disabled) {
      return
    }

    setAnchorPoint({ x, y })
    commitOpen(true)
  }

  const onContextMenu = (event: MouseEvent): void => {
    if (event.defaultPrevented) {
      return
    }

    if (menuProps.disabled) {
      return
    }

    clearLongPressTimeout()
    event.preventDefault()
    event.stopPropagation()
    openFromPoint(event.clientX, event.clientY)
  }

  const Content = (props: KobalteDropdownMenu.DropdownMenuContentProps): JSX.Element => {
    const [localProps, restProps] = splitProps(props, ['onCloseAutoFocus', 'onInteractOutside'])
    let hasInteractedOutside = false

    const onCloseAutoFocus = (event: Event): void => {
      localProps.onCloseAutoFocus?.(event)

      if (!event.defaultPrevented && hasInteractedOutside) {
        event.preventDefault()
      }

      hasInteractedOutside = false
    }

    const onInteractOutside: KobalteDropdownMenu.DropdownMenuContentProps['onInteractOutside'] = (
      event,
    ): void => {
      localProps.onInteractOutside?.(event)

      if (!event.defaultPrevented) {
        hasInteractedOutside = true
      }
    }

    const onContentContextMenu = (event: MouseEvent): void => {
      event.preventDefault()
      event.stopPropagation()

      if (resolvedOpen()) {
        commitOpen(false)
      }
    }

    return (
      <KobalteDropdownMenu.Content
        onCloseAutoFocus={onCloseAutoFocus}
        onInteractOutside={onInteractOutside}
        onContextMenu={onContentContextMenu}
        {...restProps}
      />
    )
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (menuProps.disabled || !isTouchOrPen(event.pointerType)) {
      return
    }

    clearLongPressTimeout()
    setAnchorPoint({ x: event.clientX, y: event.clientY })

    const isUncontrolled = controlProps.open === undefined
    const onOpenChange = controlProps.onOpenChange

    longPressTimeoutId = window.setTimeout(() => {
      if (isUncontrolled) {
        setUncontrolledOpen(true)
      }

      onOpenChange?.(true)
    }, CONTEXT_MENU_LONG_PRESS_DELAY)
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (menuProps.disabled || !isTouchOrPen(event.pointerType)) {
      return
    }

    clearLongPressTimeout()
  }

  const onPointerCancel = (event: PointerEvent): void => {
    if (menuProps.disabled || !isTouchOrPen(event.pointerType)) {
      return
    }

    clearLongPressTimeout()
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (menuProps.disabled || !isTouchOrPen(event.pointerType)) {
      return
    }

    clearLongPressTimeout()
  }

  const getAnchorRect = (
    anchor?: HTMLElement,
  ): { x: number; y: number; width: number; height: number } => {
    const point = anchorPoint()

    if (point) {
      return { x: point.x, y: point.y, width: 0, height: 0 }
    }

    if (anchor) {
      const rect = anchor.getBoundingClientRect()

      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: 0,
        height: 0,
      }
    }

    return { x: 0, y: 0, width: 0, height: 0 }
  }

  return (
    <KobalteDropdownMenu.Root
      overflowPadding={4}
      open={resolvedOpen()}
      onOpenChange={onRootOpenChange}
      getAnchorRect={getAnchorRect}
      id={resolvedId()}
      {...rootProps}
    >
      <KobalteDropdownMenu.Trigger
        as="span"
        tabIndex={-1}
        data-slot="trigger"
        class={cn(localProps.classes?.trigger)}
        disabled={menuProps.disabled}
        ref={(element) => {
          triggerElement = element
        }}
        style={{ '-webkit-touch-callout': 'none', ...localProps.styles?.trigger }}
        onContextMenu={onContextMenu}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerCancel={onPointerCancel}
        onPointerUp={onPointerUp}
      >
        {localProps.children}
      </KobalteDropdownMenu.Trigger>

      <OverlayMenuBaseContent<ContextMenuT.Items>
        content={Content}
        classes={localProps.classes}
        styles={localProps.styles}
        {...menuProps}
        rootSide={resolveOverlayMenuSide(rootProps.placement)}
      />
    </KobalteDropdownMenu.Root>
  )
}
