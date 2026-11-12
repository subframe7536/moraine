import type { Accessor, Component, JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, onMount, Show, untrack } from 'solid-js'
import { Portal } from 'solid-js/web'

import { useLocale } from '../../../../provider/locale/locale-context'
import { createControllableValue } from '../../../../shared/controllable-value'
import { createTransitionPresence } from '../../../../shared/transition-presence'
import { createId } from '../../../../shared/utils'
import type { SlotBinding } from '../../../../theme/use-recipe'
import { resolveDirection } from '../direction'
import { focusWithoutScrolling } from '../focus'

import { bindSelectableItemHandlers, createSelectableItemHandlers } from './menu-item'
import type { MenuItemSlotOptions } from './menu-item'
import { overlayMenuDataAttributes } from './menu.recipe'
import { createPointerGraceIntent, getOverlayMenuTextValue } from './menu.utils'
import type { OverlayMenuFocusStrategy, OverlayMenuLayerState } from './menu.utils'
import type { OverlayMenuItem, OverlayMenuLayerProps } from './types'

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
    isCheckbox: boolean
    isRadio: boolean
    item: TItem
  }>
}

export function createSubmenuItemRenderer<TItem extends OverlayMenuItem = OverlayMenuItem>(
  options: CreateSubmenuItemOptions<TItem>,
): (itemProps: { item: TItem }) => JSX.Element {
  const {
    layer,
    layerProps,
    layerComponent: LayerComponent,
    registerLayerBranch,
    getItemSlot,
    slotName,
    renderItemContent: RenderItemContent,
  } = options

  return function SubmenuItem(itemProps: { item: TItem }): JSX.Element {
    const direction = useLocale().dir
    const submenuId = createId(undefined, `${layerProps.id}-sub`)
    const submenuContentId = () => `${submenuId()}-content`
    const [triggerElement, setTriggerElement] = createSignal<HTMLDivElement | undefined>(undefined)
    const [isOpen, setOpenState] = createControllableValue<boolean>({
      value: () => ('open' in itemProps.item ? itemProps.item.open : undefined),
      defaultValue: () =>
        'defaultOpen' in itemProps.item ? (itemProps.item.defaultOpen ?? false) : false,
    })
    const [autoFocusStrategy, setAutoFocusStrategy] = createSignal<OverlayMenuFocusStrategy>('none')
    const contentPresence = createTransitionPresence({
      open: isOpen,
    })
    let openTimeoutId = 0
    let openTimeoutWindow: Window | undefined
    let submenuLayerState: OverlayMenuLayerState | undefined

    const clearOpenTimeout = (): void => {
      openTimeoutWindow?.clearTimeout(openTimeoutId)
      openTimeoutId = 0
      openTimeoutWindow = undefined
    }

    onMount(() => {
      onCleanup(
        layer.registerItem({
          disabled: () => Boolean(itemProps.item.disabled),
          element: triggerElement,
          hasSubmenu: true,
          id: submenuId(),
          textValue: () => getOverlayMenuTextValue(itemProps.item) ?? triggerElement()?.textContent,
        }),
      )
      onCleanup(
        layer.registerSubmenu({
          close: () => {
            clearOpenTimeout()
            submenuLayerState?.closeSubmenus()
            setOpenState(false)
            setAutoFocusStrategy('none')
          },
          id: submenuId(),
        }),
      )
      onCleanup(clearOpenTimeout)
    })

    const closeSubmenu = (): void => {
      clearOpenTimeout()
      submenuLayerState?.closeSubmenus()
      setOpenState(false)
      setAutoFocusStrategy('none')
      layer.setHighlightedItemId(submenuId())
      focusWithoutScrolling(triggerElement())
    }

    const openSubmenu = (strategy: OverlayMenuFocusStrategy): void => {
      layer.closeSubmenus(submenuId())
      layer.setHighlightedItemId(submenuId())
      setAutoFocusStrategy(strategy)
      setOpenState(true)
    }

    createEffect(
      on(contentPresence.present, (present) => {
        if (present) {
          return
        }

        submenuLayerState = undefined
      }),
    )

    const onPointerMove = (): void => {
      if (itemProps.item.disabled) {
        layer.focusContent()
        return
      }

      if (layer.highlightedItemId() === submenuId()) {
        return
      }

      layer.closeSubmenus(submenuId())
      layer.setHighlightedItemId(submenuId())
      clearOpenTimeout()

      submenuLayerState?.setHighlightedItemId(undefined)
      focusWithoutScrolling(triggerElement())

      if (!isOpen()) {
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
    }

    const handlers = createSelectableItemHandlers(layer, {
      activate: () => openSubmenu('content'),
      direction: () => resolveDirection(triggerElement(), direction()),
      disabled: () => Boolean(itemProps.item.disabled),
      element: triggerElement,
      itemId: submenuId,
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

        if (!contentElement) {
          layer.setPointerGraceIntent(null, [event.clientX, event.clientY])
          layer.focusContent()
          return
        }

        layer.setPointerGraceIntent(
          {
            ...createPointerGraceIntent(
              submenuPlacement,
              [event.clientX, event.clientY],
              event.currentTarget,
              contentElement,
            ),
          },
          [event.clientX, event.clientY],
        )
      },
    })
    bindSelectableItemHandlers(triggerElement, handlers)

    const itemSlot = getItemSlot({
      get class() {
        return itemProps.item.class
      },
      data: overlayMenuDataAttributes.item({
        danger: () => itemProps.item.variant === 'danger',
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
          tabIndex={layer.isHighlighted(submenuId()) ? 0 : -1}
          aria-haspopup="menu"
          aria-controls={isOpen() ? submenuContentId() : undefined}
          aria-expanded={isOpen() ? 'true' : 'false'}
          aria-disabled={itemProps.item.disabled ? 'true' : undefined}
          {...itemSlot}
          ref={setTriggerElement}
        >
          <RenderItemContent
            item={itemProps.item}
            hasChildren={true}
            isCheckbox={false}
            isRadio={false}
          />
        </div>

        <Show when={contentPresence.present()}>
          <Portal mount={triggerElement()?.ownerDocument.body}>
            <LayerComponent
              owner={layerProps.owner}
              slotBinding={layerProps.slotBinding}
              checkedIcon={layerProps.checkedIcon}
              submenuIcon={layerProps.submenuIcon}
              itemRender={layerProps.itemRender}
              topRender={layerProps.topRender}
              bottomRender={layerProps.bottomRender}
              id={submenuContentId()}
              ariaLabelledBy={submenuId()}
              open={isOpen()}
              close={closeSubmenu}
              closeOnTab={layerProps.closeOnTab}
              closeRoot={layerProps.closeRoot}
              depth={layerProps.depth + 1}
              items={
                'children' in itemProps.item ? (itemProps.item.children as TItem[]) : undefined
              }
              onClose={closeSubmenu}
              getReferenceElement={() => triggerElement()}
              placement={
                resolveDirection(triggerElement(), direction()) === 'rtl' ? 'left' : 'right'
              }
              align="start"
              gutter={-2}
              shift={-4}
              parentLayer={layer}
              present={contentPresence.present}
              registerBranch={registerLayerBranch}
              registerPresenceElement={contentPresence.registerElement}
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
