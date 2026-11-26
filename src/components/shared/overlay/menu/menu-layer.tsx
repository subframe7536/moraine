import type { JSX } from '@solidjs/web'
import { isServer } from '@solidjs/web'
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  merge,
  createRenderEffect,
  untrack,
} from 'solid-js'

import { useCn } from '../../../../provider/cn-context'
import { attachEventListener } from '../../../../shared/event-listener'
import { callHandler, callRef, createId } from '../../../../shared/utils'
import { dataSlotName } from '../../../../theme/data-slot'
import type { DataAttributeBag } from '../../../../theme/style-contract'
import type { SlotBinding } from '../../../../theme/use-recipe'
import { isNode } from '../dom'
import { useFloatingPosition, usePositionerZIndex } from '../floating'
import { parseFloatingPlacement, resolveFloatingPlacement } from '../placement'

import { createMenuItemRenderers } from './menu-item'
import type { OverlayMenuEntry } from './menu-item'
import { createMenuRadioGroupState } from './menu-radio'
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
  const subtreeBranches = new Set<HTMLElement>()
  const layer = useOverlayMenuLayerState(subtreeBranches)
  const resolveSlot = (slot: keyof OverlayMenuSharedSlots) => props.slotBinding(slot)
  const slotName = (slot: string) => dataSlotName(props.owner, slot)
  function slotWithData(
    slot: keyof OverlayMenuSharedSlots,
    options: { data: DataAttributeBag },
  ): SlotBinding {
    const binding = merge(
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
  const [isPositioned, setIsPositioned] = createSignal(false, { ownedWrite: true })
  const groups = createMemo(() => resolveMenuGroups(props.items))

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

  createEffect(resolvedPlacement, (placement) => {
    layer.setCurrentPlacement(placement)
  })

  useFloatingPosition({
    contentElement: layer.contentElement,
    deferPositioned: true,
    floatingElement: positionerElement,
    getReferenceElement: () => props.getReferenceElement(),
    flip: () => props.flip ?? true,
    slide: () => props.slide ?? true,
    gutter: () => props.gutter ?? 4,
    shift: () => props.shift ?? 0,
    onPositionedChange: setIsPositioned,
    onPlacementChange: layer.setCurrentPlacement,
    open: () => props.present(),
    overflowPadding: () => props.overflowPadding ?? 4,
    placement: resolvedPlacement,
  })

  createEffect(
    () => [positionerElement(), props.open, props.present()] as const,
    ([positioner, open, present]) => {
      if (!positioner || open || !present) {
        return
      }

      positioner.style.visibility = 'visible'
    },
  )

  createRenderEffect(positionerElement, (positioner) => {
    if (!positioner) {
      return
    }
    setIsPositioned(false)
    // Stay hidden until the floating position commits; an exiting layer is shown by the effect above.
    if (untrack(() => props.open)) {
      positioner.style.visibility = 'hidden'
    }
    return registerLayerBranch(positioner)
  })

  usePositionerZIndex(positionerElement, layer.contentElement)

  createEffect(
    () => props.refState,
    (refState) => {
      refState?.(layer)

      return () => {
        refState?.(undefined)
      }
    },
  )

  createRenderEffect(layer.contentElement, (content) => {
    if (!content) {
      return
    }
    const release = props.registerPresenceElement(content)
    const detach = attachEventListener(
      content,
      'keydown',
      (event) => {
        if (props.open && !event.defaultPrevented) {
          layer.handleTypeaheadKeyDown(event)
        }
      },
      true,
    )
    return () => {
      detach()
      release()
    }
  })

  createEffect(
    () =>
      [
        props.open,
        isPositioned(),
        props.autoFocusStrategy,
        props.onAutoFocusHandled,
        layer.contentElement(),
      ] as const,
    ([open, positioned, focusStrategy, onAutoFocusHandled, contentEl]) => {
      if (!open) {
        layer.setHighlightedItemId(undefined)
        layer.setPointerGraceIntent(null)
        layer.resetTypeahead()
        return
      }
      if (!positioned || !focusStrategy || focusStrategy === 'none') {
        return
      }
      let frameId = 0
      const ownerWindow = contentEl?.ownerDocument.defaultView

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

      return () => {
        if (frameId !== 0) {
          ownerWindow.cancelAnimationFrame(frameId)
        }
      }
    },
  )

  const { LeafItem, CheckboxMenuItem, RadioMenuItem, RenderItemContent, getItemSlot } =
    createMenuItemRenderers<TItem>({
      props,
      layer,
      closeRoot: (options) => props.closeRoot(options),
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
  const onContentKeyDown = (event: KeyboardEvent): void => {
    const { defaultPrevented } = callHandler(event, props.elementAttrs?.onKeyDown)
    if (defaultPrevented) {
      return
    }
    if (event.key === 'Escape' && props.depth === 0 && props.closeOnEscape === false) {
      event.preventDefault()
      props.onClosePrevented?.()
      return
    }
    dispatchLayerKeyDown(event)
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
    const groupId = createId(undefined, () => `${props.id}-group`)
    const groupLabelId = () => (groupLabel() ? `${groupId()}-label` : undefined)
    const radioGroup = createMenuRadioGroupState(() => groupProps.group.radioGroup)

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
          {(item) => {
            // Every branch except the first renders a row, never a separator.
            const entry = item as OverlayMenuEntry<TItem>
            return (
              <Switch fallback={<LeafItem item={entry} />}>
                <Match when={item.type === 'separator'}>
                  <div
                    data-slot={slotName('separator')}
                    role="separator"
                    {...resolveSlot('separator')}
                  />
                </Match>

                <Match when={item.type === 'checkbox'}>
                  <CheckboxMenuItem item={entry} />
                </Match>

                <Match when={hasOverlayMenuChildren(entry)}>
                  <SubmenuItem item={entry} />
                </Match>
              </Switch>
            )
          }}
        </For>

        <For each={groupProps.group.radioGroup?.children}>
          {(item) => <RadioMenuItem item={item} radioGroup={radioGroup} />}
        </For>
      </div>
    )
  }

  return (
    <div
      ref={setPositionerElement}
      data-slot={slotName('positioner')}
      class={'left-0 top-0 absolute'}
      style={isServer ? { visibility: 'hidden' } : undefined}
    >
      <div
        data-slot={slotName('content')}
        role="menu"
        id={props.id}
        aria-labelledby={props.ariaLabelledBy}
        tabindex={layer.highlightedItemId() === undefined ? 0 : -1}
        {...contentSlot}
        {...props.elementAttrs}
        {...contentPresentation}
        ref={(element: HTMLDivElement) => {
          layer.setContentElement(element)
          callRef(() => props.elementAttrs?.ref, element)
        }}
        onKeyDown={onContentKeyDown}
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
        onPointerLeave={(event) => {
          const { defaultPrevented } = callHandler(event, props.elementAttrs?.onPointerLeave)
          if (defaultPrevented || event.pointerType !== 'mouse') {
            return
          }
          const relatedTarget = event.relatedTarget
          if (
            isNode(relatedTarget) &&
            [...subtreeBranches].some((branch) => branch.contains(relatedTarget))
          ) {
            return
          }
          props.onContentPointerLeave?.(event)
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
        <Show when={props.headerRender} keyed>
          {(HeaderRender) => <HeaderRender sub={props.depth > 0} />}
        </Show>
        <For each={groups()}>{(group) => <MenuGroup group={group} />}</For>
        <Show when={props.footerRender} keyed>
          {(FooterRender) => <FooterRender sub={props.depth > 0} />}
        </Show>
      </div>
    </div>
  )
}
