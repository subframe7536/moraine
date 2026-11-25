import type { Placement } from '@floating-ui/dom'
import type { JSX } from '@solidjs/web'
import { Portal } from '@solidjs/web'
import type { Accessor, Component } from 'solid-js'
import { createSignal, onSettled, Show, untrack } from 'solid-js'

import { useLocale } from '../../../../provider/locale/locale-context'
import { createControllableValue } from '../../../../shared/controllable-value'
import { attachEventListenerMap } from '../../../../shared/event-listener'
import { createTransitionPresence } from '../../../../shared/transition-presence'
import { createId, settle } from '../../../../shared/utils'
import type { OverlayPlacement } from '../../../../theme/style-types'
import type { SlotBinding } from '../../../../theme/use-recipe'
import { resolveDirection } from '../direction'
import { isNode } from '../dom'
import { focusWithoutScrolling } from '../focus'
import { parseFloatingPlacement } from '../placement'

import { bindSelectableItemHandlers, createSelectableItemHandlers } from './menu-item'
import type { MenuItemSlotOptions, OverlayMenuEntry } from './menu-item'
import { overlayMenuDataAttributes } from './menu.recipe'
import {
  createPointerGraceIntent,
  getOverlayMenuTextValue,
  isPointInPointerGraceIntent,
} from './menu.utils'
import type {
  OverlayMenuFocusStrategy,
  OverlayMenuLayerState,
  OverlayMenuPointerGraceIntent,
} from './menu.utils'
import type { OverlayMenuItem, OverlayMenuLayerProps } from './types'
const OPPOSITE_PLACEMENT_SIDE: Record<OverlayPlacement, Placement> = {
  bottom: 'top',
  left: 'right',
  right: 'left',
  top: 'bottom',
}

function isExitingAwayFromSubmenu(
  placement: Placement,
  point: [number, number],
  triggerElement: Element,
): boolean {
  const rect = triggerElement.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) {
    return false
  }

  const side = parseFloatingPlacement(placement).side
  switch (side) {
    case 'right':
      return point[0] < rect.left
    case 'left':
      return point[0] > rect.right
    case 'bottom':
      return point[1] < rect.top
    case 'top':
      return point[1] > rect.bottom
  }
}

export interface CreateSubmenuItemOptions<TItem extends OverlayMenuItem = OverlayMenuItem> {
  layer: OverlayMenuLayerState
  layerProps: OverlayMenuLayerProps<TItem>
  layerComponent: Component<OverlayMenuLayerProps<TItem>>
  registerLayerBranch: (element: HTMLElement) => () => void
  getItemSlot: (item: MenuItemSlotOptions) => SlotBinding
  slotName: (slot: string) => string
  renderItemContent: Component<{
    checked?: Accessor<boolean>
    hasChildren: boolean
    item: OverlayMenuEntry<TItem>
  }>
}

export function createSubmenuItemRenderer<TItem extends OverlayMenuItem = OverlayMenuItem>(
  options: CreateSubmenuItemOptions<TItem>,
): (itemProps: { item: OverlayMenuEntry<TItem> }) => JSX.Element {
  const {
    layer,
    layerProps,
    layerComponent: LayerComponent,
    registerLayerBranch,
    getItemSlot,
    slotName,
    renderItemContent: RenderItemContent,
  } = options

  return function SubmenuItem(itemProps: { item: OverlayMenuEntry<TItem> }): JSX.Element {
    const direction = useLocale().dir
    const submenuId = createId(undefined, `${layerProps.id}-sub`)
    const submenuContentId = () => `${submenuId()}-content`
    const [triggerElement, setTriggerElement] = createSignal<HTMLDivElement | undefined>(undefined)
    const [isOpen, setOpenState] = createControllableValue<boolean>({
      value: () => ('open' in itemProps.item ? itemProps.item.open : undefined),
      defaultValue: () =>
        'defaultOpen' in itemProps.item ? (itemProps.item.defaultOpen ?? false) : false,
      onChange: (open) => {
        if ('onOpenChange' in itemProps.item) {
          itemProps.item.onOpenChange?.(open)
        }
      },
    })
    const [autoFocusStrategy, setAutoFocusStrategy] = createSignal<OverlayMenuFocusStrategy>('none')
    const contentPresence = createTransitionPresence({
      open: isOpen,
    })
    let openTimeoutId = 0
    let openTimeoutWindow: Window | undefined
    let submenuLayerState: OverlayMenuLayerState | undefined
    let removePointerExitListener: (() => void) | undefined

    const clearOpenTimeout = (): void => {
      openTimeoutWindow?.clearTimeout(openTimeoutId)
      openTimeoutId = 0
      openTimeoutWindow = undefined
    }

    const stopPointerExitWatch = (): void => {
      removePointerExitListener?.()
      removePointerExitListener = undefined
    }

    const dismissSubmenu = (): void => {
      clearOpenTimeout()
      stopPointerExitWatch()
      submenuLayerState?.closeSubmenus()
      // Close commits per submenu so nested exit motion cascades deepest first.
      settle(() => {
        setOpenState(false)
        setAutoFocusStrategy('none')
      })
    }

    const dismissSubmenuOnPointerExit = (point?: [number, number]): void => {
      const ownerDocument = triggerElement()?.ownerDocument
      const hadSubmenuFocus =
        isNode(ownerDocument?.activeElement) &&
        (submenuLayerState?.containsTarget(ownerDocument.activeElement) ?? false)

      layer.setPointerGraceIntent(null, point)
      dismissSubmenu()

      if (layer.highlightedItemId() === submenuId() || hadSubmenuFocus) {
        layer.focusContent()
      }
    }

    /**
     * Closes the submenu once the pointer leaves the trigger, the submenu subtree,
     * and the grace area between them (see Base UI's `safePolygon` close).
     */
    const watchPointerExit = (intent: OverlayMenuPointerGraceIntent | null): void => {
      stopPointerExitWatch()
      const ownerDocument = triggerElement()?.ownerDocument
      if (!ownerDocument) {
        return
      }

      const onPointerExit = (event: PointerEvent): void => {
        if (event.pointerType !== 'mouse') {
          return
        }

        const target = event.target
        if (
          isNode(target) &&
          (triggerElement()?.contains(target) ||
            (submenuLayerState?.containsTarget(target) ?? false))
        ) {
          return
        }

        if (
          event.type !== 'pointerleave' &&
          intent &&
          isPointInPointerGraceIntent([event.clientX, event.clientY], intent)
        ) {
          return
        }

        dismissSubmenuOnPointerExit()
      }

      removePointerExitListener = attachEventListenerMap(ownerDocument, {
        pointerleave: onPointerExit,
        pointermove: onPointerExit,
      })
    }

    const onContentPointerLeave = (
      event: PointerEvent & { currentTarget: HTMLDivElement },
    ): void => {
      const trigger = triggerElement()
      const contentElement = submenuLayerState?.contentElement()
      if (!trigger || !contentElement) {
        return
      }

      // The grace area mirrors back toward the trigger: the pointer may return to the
      // parent menu, but moving anywhere else closes the submenu.
      const side = parseFloatingPlacement(
        submenuLayerState?.currentPlacement() ?? 'right-start',
      ).side
      const returnSide = OPPOSITE_PLACEMENT_SIDE[side]

      watchPointerExit(
        createPointerGraceIntent(
          returnSide,
          [event.clientX, event.clientY],
          contentElement,
          trigger,
        ),
      )
    }

    onSettled(() => {
      const unregisterItem = layer.registerItem({
        disabled: () => Boolean(itemProps.item.disabled),
        element: triggerElement,
        hasSubmenu: true,
        id: submenuId(),
        textValue: () => getOverlayMenuTextValue(itemProps.item) ?? triggerElement()?.textContent,
      })
      const unregisterSubmenu = layer.registerSubmenu({
        close: dismissSubmenu,
        id: submenuId(),
      })
      return () => {
        unregisterItem()
        unregisterSubmenu()
        clearOpenTimeout()
        stopPointerExitWatch()
      }
    })

    const closeSubmenu = (): void => {
      dismissSubmenu()
      layer.setHighlightedItemId(submenuId())
      focusWithoutScrolling(triggerElement())
    }

    const openSubmenu = (strategy: OverlayMenuFocusStrategy): void => {
      layer.closeSubmenus(submenuId())
      layer.setHighlightedItemId(submenuId())
      setAutoFocusStrategy(strategy)
      setOpenState(true)
    }

    const scheduleOpenSubmenu = (): void => {
      if (isOpen() || openTimeoutId !== 0) {
        return
      }

      const ownerWindow = triggerElement()?.ownerDocument.defaultView
      if (!ownerWindow) {
        return
      }
      openTimeoutWindow = ownerWindow
      openTimeoutId = ownerWindow.setTimeout(() => {
        openTimeoutId = 0
        openTimeoutWindow = undefined
        untrack(() => {
          if (!layerProps.open || itemProps.item.disabled) {
            return
          }

          openSubmenu('content')
        })
      }, 100)
    }

    const onPointerMove = (): void => {
      if (itemProps.item.disabled) {
        layer.focusContent()
        return
      }

      if (layer.highlightedItemId() === submenuId()) {
        scheduleOpenSubmenu()
        return
      }

      layer.closeSubmenus(submenuId())
      layer.setHighlightedItemId(submenuId())
      clearOpenTimeout()

      submenuLayerState?.setHighlightedItemId(undefined)
      focusWithoutScrolling(triggerElement())

      scheduleOpenSubmenu()
    }

    const handlers = createSelectableItemHandlers(layer, {
      activate: () => openSubmenu('content'),
      direction: () => resolveDirection(triggerElement(), direction()),
      disabled: () => Boolean(itemProps.item.disabled),
      element: triggerElement,
      itemId: submenuId,
      submenuId,
      keys: {
        Enter: () => openSubmenu('first'),
        ' ': () => openSubmenu('first'),
        forward: () => openSubmenu('first'),
      },
      onHighlight: onPointerMove,
      onPointerLeave: (event) => {
        clearOpenTimeout()

        const contentElement = submenuLayerState?.contentElement()
        const submenuPlacement = submenuLayerState?.currentPlacement() ?? 'right-start'

        if (!isOpen() || !contentElement) {
          layer.setPointerGraceIntent(null, [event.clientX, event.clientY])
          layer.focusContent()
          return
        }

        if (
          isExitingAwayFromSubmenu(
            submenuPlacement,
            [event.clientX, event.clientY],
            event.currentTarget,
          ) &&
          (!isNode(event.relatedTarget) ||
            !(submenuLayerState?.containsTarget(event.relatedTarget) ?? false))
        ) {
          dismissSubmenuOnPointerExit([event.clientX, event.clientY])
          return
        }

        const intent = createPointerGraceIntent(
          submenuPlacement,
          [event.clientX, event.clientY],
          event.currentTarget,
          contentElement,
        )
        layer.setPointerGraceIntent({ ...intent }, [event.clientX, event.clientY])
        watchPointerExit(intent)
      },
    })
    bindSelectableItemHandlers(triggerElement, handlers)

    const itemSlot = getItemSlot({
      get class() {
        return itemProps.item.class
      },
      data: overlayMenuDataAttributes.item({
        danger: () => itemProps.item.danger,
        disabled: () => itemProps.item.disabled,
        expanded: isOpen,
        highlighted: () => layer.isHighlighted(submenuId()),
        selected: undefined,
      }),
      get style() {
        return itemProps.item.style
      },
    })

    return (
      <>
        <div
          id={submenuId()}
          data-slot={slotName('item')}
          role="menuitem"
          tabindex={layer.isHighlighted(submenuId()) ? 0 : -1}
          aria-haspopup="menu"
          aria-controls={isOpen() ? submenuContentId() : undefined}
          aria-expanded={isOpen() ? 'true' : 'false'}
          aria-disabled={itemProps.item.disabled ? 'true' : undefined}
          {...itemSlot}
          ref={setTriggerElement}
        >
          <RenderItemContent item={itemProps.item} hasChildren={true} />
        </div>

        <Show when={contentPresence.present()}>
          <Portal mount={triggerElement()?.ownerDocument.body}>
            <LayerComponent
              owner={layerProps.owner}
              slotBinding={layerProps.slotBinding}
              checkedIcon={layerProps.checkedIcon}
              expandIcon={layerProps.expandIcon}
              itemRender={layerProps.itemRender}
              headerRender={layerProps.headerRender}
              footerRender={layerProps.footerRender}
              id={submenuContentId()}
              ariaLabelledBy={submenuId()}
              open={isOpen()}
              close={closeSubmenu}
              closeOnTab={layerProps.closeOnTab}
              closeRoot={layerProps.closeRoot}
              depth={layerProps.depth + 1}
              items={
                'children' in itemProps.item ? (itemProps.item.children as Array<TItem>) : undefined
              }
              getReferenceElement={() => triggerElement()}
              placement={
                resolveDirection(triggerElement(), direction()) === 'rtl' ? 'left' : 'right'
              }
              align="start"
              gutter={2}
              shift={-4}
              parentLayer={layer}
              present={contentPresence.present}
              registerBranch={registerLayerBranch}
              registerPresenceElement={contentPresence.registerElement}
              onContentPointerLeave={onContentPointerLeave}
              autoFocusStrategy={autoFocusStrategy()}
              onAutoFocusHandled={() => {
                setAutoFocusStrategy('none')
              }}
              refState={(state) => {
                submenuLayerState = state
              }}
            />
          </Portal>
        </Show>
      </>
    )
  }
}
