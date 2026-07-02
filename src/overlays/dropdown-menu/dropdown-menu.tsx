import type { JSX } from 'solid-js'
import { createMemo, createSignal, mergeProps } from 'solid-js'

import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { cn, useId } from '../../shared/utils'
import { OverlayMenu } from '../base/menu'
import type {
  OverlayMenuFocusStrategy,
  OverlayMenuItemVariantProps,
  OverlayMenuPlacement,
  OverlayMenuRootProps,
  OverlayMenuSharedItem,
  OverlayMenuSharedSlots,
} from '../base/menu'

export namespace DropdownMenuT {
  export interface Slot<T = unknown> extends OverlayMenuSharedSlots<T> {}
  export type Variant = Pick<OverlayMenuItemVariantProps, 'size'>
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item extends OverlayMenuSharedItem<Item> {}

  /**
   * Base props for the DropdownMenu component.
   */
  export interface Base extends OverlayMenuRootProps<Item> {
    /**
     * Trigger content used to open the dropdown menu.
     */
    children: JSX.Element
  }

  /**
   * Props for the DropdownMenu component.
   */
  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

/**
 * Props for the DropdownMenu component.
 */
export interface DropdownMenuProps extends DropdownMenuT.Props {}

/**
 * Triggered action menu anchored to its child content.
 */
export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      checkedIcon: 'icon-check' as IconT.Name,
      submenuIcon: 'icon-chevron-right' as IconT.Name,
      placement: 'bottom-start' as OverlayMenuPlacement,
      gutter: 0,
    },
    props,
  )
  const resolvedId = useId(() => merged.id, 'dropdownmenu')
  const contentId = createMemo(() => `${resolvedId()}-content`)
  const [openState, setOpenState] = useControllableValue<boolean>({
    value: () => merged.open,
    defaultValue: () => merged.defaultOpen ?? false,
  })
  const isOpen = createMemo(() => Boolean(openState()))
  const [autoFocusStrategy, setAutoFocusStrategy] =
    createSignal<OverlayMenuFocusStrategy>('content')
  let triggerElement: HTMLElement | undefined

  const commitOpen = (open: boolean): void => {
    if (open && merged.disabled) {
      return
    }

    if (merged.open === undefined) {
      setOpenState(open)
    }

    if (!open) {
      setAutoFocusStrategy('none')
    }

    merged.onOpenChange?.(open)
  }

  const openWithStrategy = (strategy: OverlayMenuFocusStrategy): void => {
    if (merged.disabled) {
      return
    }

    setAutoFocusStrategy(strategy)
    commitOpen(true)
  }

  return (
    <>
      <span
        ref={(element) => {
          triggerElement = element
        }}
        data-slot="trigger"
        data-disabled={merged.disabled ? '' : undefined}
        data-expanded={isOpen() ? '' : undefined}
        data-closed={isOpen() ? undefined : ''}
        tabIndex={-1}
        aria-haspopup="menu"
        aria-controls={isOpen() ? contentId() : undefined}
        aria-expanded={isOpen() ? 'true' : 'false'}
        style={{ ...merged.styles?.trigger, ...merged.style }}
        class={cn('outline-none', merged.classes?.trigger, merged.class)}
        onClick={(event) => {
          if (event.defaultPrevented || merged.disabled) {
            return
          }

          if (isOpen()) {
            commitOpen(false)
            return
          }

          openWithStrategy('content')
        }}
        onKeyDown={(event) => {
          if (event.defaultPrevented || merged.disabled) {
            return
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            openWithStrategy('first')
            return
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            openWithStrategy('last')
            return
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()

            if (isOpen()) {
              commitOpen(false)
              return
            }

            openWithStrategy('first')
          }
        }}
      >
        {merged.children}
      </span>

      <OverlayMenu<DropdownMenuT.Item>
        id={resolvedId()}
        open={isOpen()}
        onClose={() => {
          commitOpen(false)
        }}
        triggerElement={triggerElement}
        placement={merged.placement}
        gutter={merged.gutter}
        autoFocusStrategy={autoFocusStrategy()}
        onAutoFocusHandled={() => {
          setAutoFocusStrategy('none')
        }}
        classes={merged.classes}
        styles={merged.styles}
        size={merged.size}
        items={merged.items}
        checkedIcon={merged.checkedIcon}
        submenuIcon={merged.submenuIcon}
        itemRender={merged.itemRender}
        contentTop={merged.contentTop}
        contentBottom={merged.contentBottom}
        preventScroll={merged.preventScroll}
        overflowPadding={merged.overflowPadding}
      />
    </>
  )
}
