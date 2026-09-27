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

import { List } from '../../../element/list'
import { useCn } from '../../../provider/cn-context'
import { dataSlotName } from '../../../shared/data-slot.ts'
import { useControllableValue } from '../../../shared/use-controllable-value'
import { useEventListener, attachEventListener } from '../../../shared/use-event-listener'
import { useTransitionPresence } from '../../../shared/use-transition-presence'
import { callHandler, callRef, useId } from '../../../shared/utils'
import type { Cn } from '../../../theme/style/cn'
import { useFloatingPosition } from '../floating'
import { parseFloatingPlacement, resolveFloatingPlacement } from '../placement.ts'
import { focusWithoutScrolling, resolveDirection } from '../utils'

import {
  attachSelectableItemHandlers,
  createMenuItemRenderers,
  itemElementAttributes,
} from './menu-item'
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
  OverlayMenuLayerState,
} from './menu.utils'
import type { OverlayMenuSharedItem, OverlayMenuSharedProps, OverlayMenuSharedSlots } from './types'

interface OverlayMenuResolvedGroup<TItem> {
  label?: JSX.Element
  items: TItem[]
}

type OverlayMenuListEntry<TItem> =
  | { type: 'contentTop' }
  | { type: 'group'; group: OverlayMenuResolvedGroup<TItem> }
  | { type: 'contentBottom' }

export function resolveMenuSlot(
  props: Pick<OverlayMenuSharedProps<never>, 'slotBinding' | 'classes' | 'styles'>,
  slot: keyof OverlayMenuSharedSlots,
  cn: Cn,
) {
  return (
    props.slotBinding?.(slot) ?? {
      get class() {
        return cn(props.classes?.[slot])
      },
      get style() {
        return props.styles?.[slot] ?? {}
      },
    }
  )
}

export interface OverlayMenuLayerProps<
  TItem extends OverlayMenuSharedItem<TItem>,
> extends OverlayMenuSharedProps<TItem> {
  owner: 'dropdown-menu' | 'context-menu'
  autoFocusStrategy?: OverlayMenuFocusStrategy
  ariaLabelledBy?: string
  close: (options?: OverlayMenuCloseOptions) => void
  closeOnTab: (direction: 'forward' | 'backward') => void
  closeRoot: (options?: OverlayMenuCloseOptions) => void
  depth: number
  getReferenceElement: () => ReferenceElement | undefined
  onAutoFocusHandled?: () => void
  onContentPointerDown?: JSX.EventHandler<HTMLDivElement, PointerEvent>
  onContextMenu?: JSX.EventHandler<HTMLDivElement, MouseEvent>
  open: boolean
  parentLayer?: OverlayMenuLayerState
  present: Accessor<boolean>
  presenceDataAttrs: Accessor<{
    'data-closed'?: string
    'data-expanded'?: string
  }>
  refState?: (state: OverlayMenuLayerState | undefined) => void
  registerBranch: (element: HTMLElement) => () => void
  setPresenceElement: (element: HTMLElement | undefined) => void
}

export function OverlayMenuLayer<TItem extends OverlayMenuSharedItem<TItem>>(
  props: OverlayMenuLayerProps<TItem>,
): JSX.Element {
  const cn = useCn()
  const layer = useOverlayMenuLayerState()
  const resolveSlot = (slot: keyof OverlayMenuSharedSlots) => resolveMenuSlot(props, slot, cn)
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
  const listEntries = createMemo<OverlayMenuListEntry<TItem>[]>(() => [
    { type: 'contentTop' },
    ...groups().map((group) => ({ type: 'group' as const, group })),
    { type: 'contentBottom' },
  ])
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
        group: item.group,
        value: item.value,
        checked: item.checked,
      })),
    )

  createEffect(
    on(radioItemSnapshot, (groups) => {
      const controlledGroups = new Set<string>()
      const controlledValues: Record<string, string | undefined> = {}

      for (const group of groups) {
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

      useEventListener(
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

  const {
    LeafItem,
    CheckboxMenuItem,
    RadioMenuItem,
    RenderItemContent,
    getItemSlot,
    getItemRenderProps,
  } = createMenuItemRenderers({
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
    const submenuId = useId(undefined, `${props.id}-sub`)
    const submenuContentId = createMemo(() => `${submenuId()}-content`)
    const [triggerElement, setTriggerElement] = createSignal<HTMLDivElement | undefined>(undefined)
    const [isOpen, setOpenState] = useControllableValue<boolean>({
      value: () => itemProps.item.open,
      defaultValue: () => itemProps.item.defaultOpen ?? false,
    })
    const [autoFocusStrategy, setAutoFocusStrategy] = createSignal<OverlayMenuFocusStrategy>('none')
    const contentPresence = useTransitionPresence({
      open: isOpen,
    })
    const itemAttributes = createMemo(() =>
      props.itemProps?.(getItemRenderProps(itemProps.item, true, false, false)),
    )
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
        const { defaultPrevented } = callHandler(event, itemAttributes()?.onPointerDown)
        if (!defaultPrevented && itemProps.item.disabled) {
          event.preventDefault()
        }
      },
      onClick: (event) => {
        const { defaultPrevented } = callHandler(event, itemAttributes()?.onClick)
        if (defaultPrevented || itemProps.item.disabled) {
          return
        }

        event.preventDefault()
        openSubmenu('content')
      },
      onFocus: (event) => {
        const { defaultPrevented } = callHandler(event, itemAttributes()?.onFocus)
        if (defaultPrevented || itemProps.item.disabled) {
          return
        }

        layer.closeSubmenus(submenuId())
        layer.setHighlightedItemId(submenuId())
      },
      onKeyDown: (event) => {
        const { defaultPrevented } = callHandler(event, itemAttributes()?.onKeyDown)
        if (defaultPrevented) {
          return
        }

        if (event.repeat) {
          return
        }

        if (itemProps.item.disabled) {
          return
        }

        const openKey = resolveDirection(triggerElement()) === 'rtl' ? 'ArrowLeft' : 'ArrowRight'

        if (event.key === openKey || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openSubmenu('first')
        }
      },
      onPointerEnter: (event) => {
        const { defaultPrevented } = callHandler(event, itemAttributes()?.onPointerEnter)
        if (defaultPrevented) {
          return
        }

        if (itemProps.item.disabled || event.pointerType !== 'mouse') {
          if (itemProps.item.disabled) {
            layer.focusContent()
          }

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
        const { defaultPrevented } = callHandler(event, itemAttributes()?.onPointerMove)
        if (defaultPrevented) {
          return
        }

        if (itemProps.item.disabled || event.pointerType !== 'mouse') {
          if (itemProps.item.disabled) {
            layer.focusContent()
          }

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
        const { defaultPrevented } = callHandler(event, itemAttributes()?.onPointerLeave)
        if (defaultPrevented) {
          return
        }

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
            destructive: () => itemProps.item.variant === 'destructive',
            disabled: () => itemProps.item.disabled,
            highlighted: () => layer.highlightedItemId() === submenuId(),
            expanded: isOpen,
            selected: undefined,
          })}
          {...itemElementAttributes(itemAttributes())}
          ref={(itemElement) => {
            setTriggerElement(itemElement)
            callRef(itemAttributes()?.ref, itemElement)
            onCleanup(attachSelectableItemHandlers(itemElement, handlers))
          }}
          {...getItemSlot(itemAttributes()?.style, itemAttributes()?.class)}
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
              id={submenuContentId()}
              ariaLabelledBy={submenuId()}
              open={isOpen()}
              close={closeSubmenu}
              closeOnTab={props.closeOnTab}
              closeRoot={props.closeRoot}
              depth={props.depth + 1}
              items={itemProps.item.children}
              classes={props.classes}
              styles={props.styles}
              slotBinding={props.slotBinding}
              size={props.size}
              checkedIcon={props.checkedIcon}
              submenuIcon={props.submenuIcon}
              itemRender={props.itemRender}
              contentProps={props.contentProps}
              itemProps={props.itemProps}
              contentTop={props.contentTop}
              contentBottom={props.contentBottom}
              getReferenceElement={() => triggerElement()}
              placement={resolveDirection(triggerElement()) === 'rtl' ? 'left' : 'right'}
              align="start"
              gutter={-2}
              shift={-4}
              overflowPadding={props.overflowPadding}
              parentLayer={layer}
              present={contentPresence.present}
              presenceDataAttrs={contentPresence.dataAttrs}
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
  const align = createMemo(() => parseFloatingPlacement(layer.currentPlacement()).align)
  const presenceDataAttrs = createMemo(() => {
    const dataAttrs = props.presenceDataAttrs()

    return dataAttrs['data-expanded'] !== undefined && !isPositioned() ? {} : dataAttrs
  })
  const closeParentKey = createMemo(() =>
    props.parentLayer ? (side() === 'left' ? 'ArrowRight' : 'ArrowLeft') : undefined,
  )

  const handledKeyDown = new WeakSet<Event>()
  const onContentKeyDown = (event: KeyboardEvent): void => {
    if (handledKeyDown.has(event)) {
      return
    }
    handledKeyDown.add(event)
    const { defaultPrevented } = callHandler(event, props.contentProps?.onKeyDown)
    if (!defaultPrevented) {
      onLayerKeyDown(event, layer, props.close, closeParentKey(), props.closeOnTab)
    }
  }

  function renderListEntry(entry: OverlayMenuListEntry<TItem>): JSX.Element {
    if (entry.type === 'contentTop') {
      return <Show when={props.contentTop}>{(slot) => slot()({ sub: props.depth > 0 })}</Show>
    }

    if (entry.type === 'contentBottom') {
      return <Show when={props.contentBottom}>{(slot) => slot()({ sub: props.depth > 0 })}</Show>
    }

    const groupLabel = createMemo(() => entry.group.label)
    const groupLabelId = createMemo(() =>
      groupLabel() ? `${props.id}-group-${groups().indexOf(entry.group)}-label` : undefined,
    )

    return (
      <div
        data-slot={slotName('group')}
        role="group"
        aria-labelledby={groupLabelId()}
        {...resolveSlot('group')}
      >
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

        <For each={entry.group.items}>
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

  const contentSlot = () => ({
    class: cn(resolveSlot('content').class, props.contentProps?.class),
    style: { ...props.contentProps?.style, ...resolveSlot('content').style },
  })

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
      <List
        as="div"
        items={listEntries()}
        itemRender={(context) => renderListEntry(context.item)}
        id={props.id}
        data-slot={slotName('content')}
        role="menu"
        aria-labelledby={props.ariaLabelledBy}
        tabIndex={layer.highlightedItemId() === undefined ? 0 : -1}
        {...props.contentProps}
        {...overlayMenuDataAttributes.content({
          expanded: () => presenceDataAttrs()['data-expanded'],
          closed: () => presenceDataAttrs()['data-closed'],
          side,
          align,
        })}
        ref={(element: HTMLDivElement) => {
          layer.setContentElement(element)
          props.setPresenceElement(element)
          callRef(props.contentProps?.ref, element)
          const releaseKeyDown = attachEventListener(element, 'keydown', onContentKeyDown)
          onCleanup(() => {
            releaseKeyDown()
            const ref = props.contentProps?.ref
            if (typeof ref === 'function') {
              ;(ref as (element: HTMLDivElement | undefined) => void)(undefined)
            }
          })
        }}
        class={contentSlot().class}
        style={contentSlot().style}
        onPointerDown={(event) => {
          const { defaultPrevented } = callHandler(event, props.contentProps?.onPointerDown)
          if (!defaultPrevented) {
            props.onContentPointerDown?.(event)
          }
        }}
        onContextMenu={(event) => {
          const { defaultPrevented } = callHandler(event, props.contentProps?.onContextMenu)
          if (!defaultPrevented) {
            props.onContextMenu?.(event)
          }
        }}
        onFocusIn={(event) => {
          const { defaultPrevented } = callHandler(event, props.contentProps?.onFocusIn)
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
          const { defaultPrevented } = callHandler(event, props.contentProps?.onFocusOut)
          if (defaultPrevented) {
            return
          }

          if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return
          }

          layer.setHighlightedItemId(undefined)
          layer.resetTypeahead()
        }}
        onKeyDown={onContentKeyDown}
      />
    </div>
  )
}
