import type { JSX } from 'solid-js'
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
} from 'solid-js'

import { useCn } from '../../../../provider/cn-context'
import { bindElement } from '../../../../shared/element-binding'
import { createEventListener } from '../../../../shared/event-listener'
import { renderWithProps } from '../../../../shared/render-with-props'
import { callHandler, callRef } from '../../../../shared/utils'
import { dataSlotName } from '../../../../theme/data-slot'
import type { DataAttributeBag } from '../../../../theme/style-contract'
import type { SlotBinding } from '../../../../theme/use-recipe'
import { useFloatingPosition } from '../floating'
import { parseFloatingPlacement, resolveFloatingPlacement } from '../placement'

import { createMenuItemRenderers } from './menu-item'
import { createMenuRadioState } from './menu-radio'
import { createSubmenuItemRenderer } from './menu-submenu-item'
import { overlayMenuDataAttributes } from './menu.recipe'
import {
  createLayerKeyDownHandler,
  focusLayerFromStrategy,
  hasOverlayMenuChildren,
  resolveMenuGroups,
  useOverlayMenuLayerState,
} from './menu.utils'
import type { OverlayMenuGroup } from './menu.utils'
import type { OverlayMenuItem, OverlayMenuLayerProps, OverlayMenuSharedSlots } from './types'

export function OverlayMenuLayer<TItem extends OverlayMenuItem = OverlayMenuItem>(
  props: OverlayMenuLayerProps<TItem>,
): JSX.Element {
  const cn = useCn()
  const layer = useOverlayMenuLayerState()
  const resolveSlot = (slot: keyof OverlayMenuSharedSlots) => props.slotBinding(slot)
  const slotName = (slot: string) => dataSlotName(props.owner, slot)
  function slotWithData(
    slot: keyof OverlayMenuSharedSlots,
    options: { data: DataAttributeBag },
  ): SlotBinding {
    const binding = mergeProps(
      {
        get class() {
          return resolveSlot(slot).class
        },
        get style() {
          return resolveSlot(slot).style
        },
      },
      options.data,
    )
    return binding
  }
  const resolvedPlacement = () =>
    resolveFloatingPlacement(props.placement ?? 'bottom', props.align ?? 'start')
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement | undefined>(
    undefined,
  )
  const [isPositioned, setIsPositioned] = createSignal(false)
  const groups = createMemo(() => resolveMenuGroups(props.items))
  const { radioGroupValues, setRadioGroupValues } = createMenuRadioState({ groups })
  const subtreeBranches = new Set<HTMLElement>()

  /**
   * Track this layer's positioner and descendant submenu branches while
   * forwarding branch registration to the parent layer.
   */
  const registerLayerBranch = (element: HTMLElement): (() => void) => {
    subtreeBranches.add(element)
    const unregisterBranch = props.registerBranch(element)

    return () => {
      subtreeBranches.delete(element)
      unregisterBranch()
    }
  }

  createEffect(
    on([() => props.placement, () => props.align], () => {
      layer.setCurrentPlacement(resolvedPlacement())
    }),
  )

  useFloatingPosition({
    contentElement: layer.contentElement,
    deferPositioned: true,
    floatingElement: positionerElement,
    getReferenceElement: () => props.getReferenceElement(),
    gutter: () => props.gutter ?? 0,
    shift: () => props.shift ?? 0,
    onPositionedChange: setIsPositioned,
    onPlacementChange: layer.setCurrentPlacement,
    open: () => props.present(),
    overflowPadding: () => props.overflowPadding ?? 4,
    placement: resolvedPlacement,
  })

  createEffect(
    on(
      [positionerElement, () => props.open, () => props.present()],
      ([positioner, open, present]) => {
        if (!positioner || open || !present) {
          return
        }

        positioner.style.visibility = 'visible'
      },
    ),
  )

  bindElement(positionerElement, (positioner) => {
    setIsPositioned(false)
    // Stay hidden until the floating position commits; an exiting layer is shown by the effect above.
    if (props.open) {
      positioner.style.visibility = 'hidden'
    }
    return registerLayerBranch(positioner)
  })

  createEffect(
    on([positionerElement, layer.contentElement], ([positioner, content]) => {
      if (!positioner || !content) {
        return
      }

      queueMicrotask(() => {
        if (positioner.isConnected && content.isConnected) {
          const contentZIndex = content.ownerDocument.defaultView?.getComputedStyle(content).zIndex
          if (contentZIndex && contentZIndex !== 'auto') {
            positioner.style.zIndex = contentZIndex
          }
        }
      })
    }),
  )

  createEffect(
    on(
      () => props.refState,
      (refState) => {
        refState?.(layer)

        onCleanup(() => {
          props.refState?.(undefined)
        })
      },
    ),
  )

  bindElement(layer.contentElement, (content) => {
    const release = props.registerPresenceElement(content)
    createEventListener(
      content,
      'keydown',
      (event) => {
        if (props.open && !event.defaultPrevented) {
          layer.handleTypeaheadKeyDown(event)
        }
      },
      true,
    )
    createEventListener(content, 'keydown', onContentKeyDown)
    return release
  })

  createEffect(
    on(
      [() => props.open, isPositioned, () => props.autoFocusStrategy],
      ([open, positioned, focusStrategy]) => {
        if (!open) {
          layer.setHighlightedItemId(undefined)
          layer.setPointerGraceIntent(null)
          layer.resetTypeahead()
          return
        }
        if (!positioned || !focusStrategy || focusStrategy === 'none') {
          return
        }
        const onAutoFocusHandled = props.onAutoFocusHandled
        let frameId = 0
        const ownerWindow = layer.contentElement()?.ownerDocument.defaultView

        const runAutoFocus = () => {
          focusLayerFromStrategy(layer, focusStrategy ?? 'none')
          onAutoFocusHandled?.()
        }

        if (typeof ownerWindow?.requestAnimationFrame !== 'function') {
          queueMicrotask(runAutoFocus)
          return
        }

        frameId = ownerWindow.requestAnimationFrame(() => {
          runAutoFocus()
        })

        onCleanup(() => {
          if (frameId !== 0) {
            ownerWindow.cancelAnimationFrame(frameId)
          }
        })
      },
    ),
  )

  const { LeafItem, CheckboxMenuItem, RadioMenuItem, RenderItemContent, getItemSlot } =
    createMenuItemRenderers<TItem>({
      props,
      layer,
      closeRoot: (options) => props.closeRoot(options),
      radioGroupValues,
      setRadioGroupValues,
      resolveSlot,
      slotName,
      cn,
    })

  const SubmenuItem = createSubmenuItemRenderer<TItem>({
    layer,
    layerProps: props,
    layerComponent: OverlayMenuLayer,
    registerLayerBranch,
    getItemSlot,
    slotName,
    renderItemContent: RenderItemContent,
  })

  const side = createMemo(() => parseFloatingPlacement(layer.currentPlacement()).side)
  const align = () => parseFloatingPlacement(layer.currentPlacement()).align
  const closeParentKey = () =>
    props.parentLayer ? (side() === 'left' ? 'ArrowRight' : 'ArrowLeft') : undefined

  const dispatchLayerKeyDown = createLayerKeyDownHandler(
    layer,
    (options) => props.close(options),
    closeParentKey,
    (direction) => props.closeOnTab?.(direction),
  )
  const handledKeyDown = new WeakSet<Event>()
  const onContentKeyDown = (event: KeyboardEvent): void => {
    if (handledKeyDown.has(event)) {
      return
    }
    handledKeyDown.add(event)
    const { defaultPrevented } = callHandler(event, props.elementAttrs?.onKeyDown)
    if (!defaultPrevented) {
      dispatchLayerKeyDown(event)
    }
  }

  // The content binding comes from the owning menu; the layer adds its own `data-*` state.
  const contentSlot = slotWithData('content', {
    data: overlayMenuDataAttributes.content({
      expanded: () => props.open && isPositioned(),
      closed: () => !props.open,
      side,
      align,
    }),
  })

  // `elementAttrs` class/style merge over the content binding instead of replacing it.
  const contentPresentation = {
    get class() {
      return cn(contentSlot.class, props.elementAttrs?.class)
    },
    get style() {
      return {
        ...contentSlot.style,
        ...(typeof props.elementAttrs?.style === 'object' ? props.elementAttrs.style : undefined),
      }
    },
  }

  function MenuGroup(groupProps: { group: OverlayMenuGroup<TItem> }): JSX.Element {
    const groupLabel = createMemo(() => groupProps.group.label)
    const groupLabelId = () =>
      groupLabel() ? `${props.id}-group-${groups().indexOf(groupProps.group)}-label` : undefined

    return (
      <div
        data-slot={slotName('group')}
        role="group"
        aria-labelledby={groupLabelId()}
        {...resolveSlot('group')}
      >
        <Show when={groupProps.group.separator}>
          <div data-slot={slotName('separator')} role="separator" {...resolveSlot('separator')} />
        </Show>

        <Show when={groupLabel()}>
          <div
            id={groupLabelId()}
            data-slot={slotName('groupLabel')}
            aria-hidden="true"
            {...resolveSlot('groupLabel')}
          >
            {groupLabel()}
          </div>
        </Show>

        <For each={groupProps.group.items}>
          {(item) => (
            <Switch fallback={<LeafItem item={item} />}>
              <Match when={item.type === 'separator'}>
                <div
                  data-slot={slotName('separator')}
                  role="separator"
                  {...resolveSlot('separator')}
                />
              </Match>

              <Match when={item.type === 'checkbox'}>
                <CheckboxMenuItem item={item} />
              </Match>

              <Match when={item.type === 'radio'}>
                <RadioMenuItem item={item} />
              </Match>

              <Match when={hasOverlayMenuChildren(item)}>
                <SubmenuItem item={item} />
              </Match>
            </Switch>
          )}
        </For>
      </div>
    )
  }

  return (
    <div
      ref={setPositionerElement}
      data-slot={slotName('positioner')}
      class={'left-0 top-0 absolute'}
    >
      <div
        data-slot={slotName('content')}
        role="menu"
        id={props.id}
        aria-labelledby={props.ariaLabelledBy}
        tabIndex={layer.highlightedItemId() === undefined ? 0 : -1}
        {...contentSlot}
        {...props.elementAttrs}
        {...contentPresentation}
        ref={(element: HTMLDivElement) => {
          layer.setContentElement(element)
          callRef(props.elementAttrs?.ref, element)
        }}
        onPointerDown={(event) => {
          const { defaultPrevented } = callHandler(event, props.elementAttrs?.onPointerDown)
          if (!defaultPrevented) {
            props.onContentPointerDown?.(event)
          }
          if (props.parentLayer) {
            event.stopPropagation()
          }
        }}
        onContextMenu={(event) => {
          const { defaultPrevented } = callHandler(event, props.elementAttrs?.onContextMenu)
          if (!defaultPrevented) {
            props.onContentContextMenu?.(event)
          }
          if (props.parentLayer) {
            event.stopPropagation()
          }
        }}
        onFocusIn={(event) => {
          const { defaultPrevented } = callHandler(event, props.elementAttrs?.onFocusIn)
          if (defaultPrevented) {
            return
          }

          if (!event.currentTarget.contains(event.target)) {
            return
          }

          if (event.target === event.currentTarget) {
            layer.setHighlightedItemId(undefined)
          }
        }}
        onFocusOut={(event) => {
          const { defaultPrevented } = callHandler(event, props.elementAttrs?.onFocusOut)
          if (defaultPrevented) {
            return
          }

          if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return
          }

          layer.setHighlightedItemId(undefined)
          layer.resetTypeahead()
        }}
      >
        <Show when={props.topRender} keyed>
          {(render) => renderWithProps(render, { sub: props.depth > 0 })}
        </Show>
        <For each={groups()}>{(group) => <MenuGroup group={group} />}</For>
        <Show when={props.bottomRender} keyed>
          {(render) => renderWithProps(render, { sub: props.depth > 0 })}
        </Show>
      </div>
    </div>
  )
}
