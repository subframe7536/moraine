import type { ReferenceElement } from '@floating-ui/dom'
import type { Accessor, JSX } from 'solid-js'
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { useCn } from '../../../../provider/cn-context'
import { useLocale } from '../../../../provider/locale/locale-context'
import { createControllableValue } from '../../../../shared/controllable-value'
import { createEventListener } from '../../../../shared/event-listener'
import { renderWithProps } from '../../../../shared/render-with-props'
import { createTransitionPresence } from '../../../../shared/transition-presence'
import { callHandler, callRef, createId } from '../../../../shared/utils'
import { dataSlotName } from '../../../../theme/data-slot'
import { useFloatingPosition } from '../floating'
import { parseFloatingPlacement, resolveFloatingPlacement } from '../placement'
import { focusWithoutScrolling, resolveDirection } from '../utils'

import { attachSelectableItemHandlers, createMenuItemRenderers } from './menu-item'
import { overlayMenuDataAttributes } from './menu.recipe'
import {
  createPointerGraceIntent,
  getOverlayMenuTextValue,
  focusLayerFromStrategy,
  hasOverlayMenuChildren,
  onLayerKeyDown,
  resolveMenuGroups,
  useOverlayMenuLayerState,
} from './menu.utils'
import type {
  OverlayMenuCloseOptions,
  OverlayMenuFocusStrategy,
  OverlayMenuGroup,
  OverlayMenuLayerState,
} from './menu.utils'
import type { OverlayMenuItem, OverlayMenuProps, OverlayMenuSharedSlots } from './types'

export interface OverlayMenuLayerProps<
  TItem extends OverlayMenuItem = OverlayMenuItem,
> extends OverlayMenuProps<TItem> {
  ariaLabelledBy?: string
  close: (options?: OverlayMenuCloseOptions) => void
  closeOnTab: (direction: 'forward' | 'backward') => void
  closeRoot: (options?: OverlayMenuCloseOptions) => void
  depth: number
  getReferenceElement: () => ReferenceElement | undefined
  parentLayer?: OverlayMenuLayerState
  present: Accessor<boolean>
  refState?: (state: OverlayMenuLayerState | undefined) => void
  registerBranch: (element: HTMLElement) => () => void
  setPresenceElement: (element: HTMLElement | undefined) => void
}

export function OverlayMenuLayer<TItem extends OverlayMenuItem = OverlayMenuItem>(
  props: OverlayMenuLayerProps<TItem>,
): JSX.Element {
  const cn = useCn()
  const layer = useOverlayMenuLayerState()
  const resolveSlot = (slot: keyof OverlayMenuSharedSlots) => props.slotBinding(slot)
  const slotName = (slot: string) => dataSlotName(props.owner, slot)
  const resolvedPlacement = () =>
    resolveFloatingPlacement(props.placement ?? 'bottom', props.align ?? 'start')
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement | undefined>(
    undefined,
  )
  const [isPositioned, setIsPositioned] = createSignal(false)
  const groups = createMemo(() => resolveMenuGroups(props.items))
  const [radioGroupValues, setRadioGroupValues] = createSignal<Record<string, string | undefined>>(
    untrack(() => {
      const initialValues: Record<string, string | undefined> = {}

      for (const group of groups()) {
        for (const item of group.items) {
          if (
            item.type === 'radio' &&
            item.group &&
            item.value !== undefined &&
            (item.checked ?? item.defaultChecked)
          ) {
            initialValues[item.group] = item.value
          }
        }
      }

      return initialValues
    }),
  )
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

  const radioItemSnapshot = () =>
    groups().map((group) =>
      group.items.map((item) => ({
        type: item.type,
        group: 'group' in item ? item.group : undefined,
        value: 'value' in item ? item.value : undefined,
        checked: 'checked' in item ? item.checked : undefined,
      })),
    )

  createEffect(
    on(radioItemSnapshot, (itemGroups) => {
      const controlledGroups = new Set<string>()
      const controlledValues: Record<string, string | undefined> = {}

      for (const group of itemGroups) {
        for (const item of group) {
          if (
            item.type !== 'radio' ||
            !item.group ||
            item.value === undefined ||
            item.checked === undefined
          ) {
            continue
          }

          controlledGroups.add(item.group)
          if (item.checked) {
            controlledValues[item.group] = item.value
          }
        }
      }

      if (controlledGroups.size === 0) {
        return
      }

      setRadioGroupValues((currentValues) => {
        const nextValues = { ...currentValues }

        for (const group of controlledGroups) {
          delete nextValues[group]
          if (controlledValues[group] !== undefined) {
            nextValues[group] = controlledValues[group]
          }
        }

        return nextValues
      })
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

  onMount(() => {
    const branchElement = positionerElement()

    if (!branchElement) {
      return
    }

    onCleanup(registerLayerBranch(branchElement))
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

  createEffect(
    on(layer.contentElement, (content) => {
      if (!content) {
        return
      }

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
    }),
  )

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

  function SubmenuItem(itemProps: { item: TItem }): JSX.Element {
    const direction = useLocale().dir
    const submenuId = createId(undefined, `${props.id}-sub`)
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
        contentPresence.setElement(undefined)
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
            if (!props.open || itemProps.item.disabled) {
              return
            }

            openSubmenu('content')
          })
        }, 100)
      }
    }

    const handlers = {
      onPointerDown: (event) => {
        if (itemProps.item.disabled) {
          event.preventDefault()
        }
      },
      onClick: (event) => {
        if (itemProps.item.disabled) {
          return
        }

        event.preventDefault()
        openSubmenu('content')
      },
      onFocus: () => {
        if (itemProps.item.disabled) {
          return
        }

        layer.closeSubmenus(submenuId())
        layer.setHighlightedItemId(submenuId())
      },
      onKeyDown: (event) => {
        if (event.defaultPrevented || event.repeat || itemProps.item.disabled) {
          return
        }

        const openKey =
          resolveDirection(triggerElement(), direction()) === 'rtl' ? 'ArrowLeft' : 'ArrowRight'

        if (event.key === openKey || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openSubmenu('first')
        }
      },
      onPointerEnter: (event) => {
        if (itemProps.item.disabled || event.pointerType !== 'mouse') {
          if (itemProps.item.disabled) {
            layer.focusContent()
          }

          return
        }

        if (layer.highlightedItemId() === submenuId()) {
          return
        }

        if (layer.shouldBlockPointerEnter(event)) {
          layer.queuePointerEnter(event.currentTarget, onPointerMove)
          event.preventDefault()
          return
        }

        onPointerMove()
      },
      onPointerMove: (event) => {
        if (itemProps.item.disabled || event.pointerType !== 'mouse') {
          if (itemProps.item.disabled) {
            layer.focusContent()
          }

          return
        }

        if (layer.highlightedItemId() === submenuId()) {
          return
        }

        if (layer.shouldBlockPointerEnter(event)) {
          layer.queuePointerEnter(event.currentTarget, onPointerMove)
          event.preventDefault()
          return
        }

        onPointerMove()
      },
      onPointerLeave: (event) => {
        if (event.pointerType !== 'mouse') {
          return
        }

        layer.clearQueuedPointerEnter(event.currentTarget)
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
    } satisfies Parameters<typeof attachSelectableItemHandlers>[1]

    return (
      <>
        <div
          id={submenuId()}
          data-slot={slotName('item')}
          role="menuitem"
          tabIndex={layer.highlightedItemId() === submenuId() ? 0 : -1}
          aria-haspopup="menu"
          aria-controls={isOpen() ? submenuContentId() : undefined}
          aria-expanded={isOpen() ? 'true' : 'false'}
          aria-disabled={itemProps.item.disabled ? 'true' : undefined}
          {...overlayMenuDataAttributes.item({
            danger: () => itemProps.item.variant === 'danger',
            disabled: () => itemProps.item.disabled,
            highlighted: () => layer.highlightedItemId() === submenuId(),
            expanded: isOpen,
            selected: undefined,
          })}
          ref={(itemElement) => {
            setTriggerElement(itemElement)
            onCleanup(attachSelectableItemHandlers(itemElement, handlers))
          }}
          {...getItemSlot(itemProps.item.style, itemProps.item.class)}
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
            <OverlayMenuLayer<TItem>
              owner={props.owner}
              slotBinding={props.slotBinding}
              checkedIcon={props.checkedIcon}
              submenuIcon={props.submenuIcon}
              itemRender={props.itemRender}
              topRender={props.topRender}
              bottomRender={props.bottomRender}
              id={submenuContentId()}
              ariaLabelledBy={submenuId()}
              open={isOpen()}
              close={closeSubmenu}
              closeOnTab={props.closeOnTab}
              closeRoot={props.closeRoot}
              depth={props.depth + 1}
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
              setPresenceElement={contentPresence.setElement}
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

  const side = createMemo(() => parseFloatingPlacement(layer.currentPlacement()).side)
  const align = () => parseFloatingPlacement(layer.currentPlacement()).align
  const closeParentKey = () =>
    props.parentLayer ? (side() === 'left' ? 'ArrowRight' : 'ArrowLeft') : undefined

  const handledKeyDown = new WeakSet<Event>()
  const onContentKeyDown = (event: KeyboardEvent): void => {
    if (handledKeyDown.has(event)) {
      return
    }
    handledKeyDown.add(event)
    const { defaultPrevented } = callHandler(event, props.elementAttrs?.onKeyDown)
    if (!defaultPrevented) {
      onLayerKeyDown(event, layer, props.close, closeParentKey(), props.closeOnTab)
    }
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
      ref={(element) => {
        setPositionerElement(element)
        element.style.position = 'absolute'
        element.style.left = '0'
        element.style.top = '0'
        setIsPositioned(false)

        if (props.open) {
          element.style.visibility = 'hidden'
        }
      }}
      data-slot={slotName('positioner')}
      class={'left-0 top-0 absolute'}
    >
      <div
        data-slot={slotName('content')}
        role="menu"
        id={props.id}
        aria-labelledby={props.ariaLabelledBy}
        tabIndex={layer.highlightedItemId() === undefined ? 0 : -1}
        {...overlayMenuDataAttributes.content({
          expanded: () => props.open && isPositioned(),
          closed: () => !props.open,
          side,
          align,
        })}
        {...props.elementAttrs}
        {...resolveSlot('content')}
        class={cn(resolveSlot('content').class, props.elementAttrs?.class)}
        style={{
          ...resolveSlot('content').style,
          ...(typeof props.elementAttrs?.style === 'object' ? props.elementAttrs.style : undefined),
        }}
        ref={(element: HTMLDivElement) => {
          layer.setContentElement(element)
          props.setPresenceElement(element)
          callRef(props.elementAttrs?.ref, element)
          createEventListener(element, 'keydown', onContentKeyDown)
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
