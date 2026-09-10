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
  mergeProps,
  onCleanup,
  onMount,
  untrack,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { Icon } from '../../../elements/icon'
import { KbdGroup } from '../../../elements/kbd'
import { List } from '../../../elements/list'
import type { ListProps } from '../../../elements/list'
import { createLazyMemo } from '../../../shared/create-lazy-memo'
import { useCn } from '../../../shared/provider/cn-context'
import { renderComponentOrElement } from '../../../shared/render-prop'
import type { Cn } from '../../../shared/style/cn'
import type { ClassValue, ElementProps } from '../../../shared/types'
import { useControllableValue } from '../../../shared/use-controllable-value'
import { useEventListener } from '../../../shared/use-event-listener'
import { useTransitionPresence } from '../../../shared/use-transition-presence'
import { callHandler, useId } from '../../../shared/utils'
import { useFloatingPosition } from '../floating'
import { useOverlayInteraction } from '../interaction'
import {
  acquireBodyScrollLock,
  focusTrigger,
  focusWithoutScrolling,
  getFocusableElements,
  resolveDirection,
  resolveOverlayMenuSide,
} from '../utils'

import {
  createPointerGraceIntent,
  createVirtualReference,
  getOverlayMenuTextValue,
  focusElement,
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
import type {
  OverlayMenuProps,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
  OverlayMenuSharedProps,
  OverlayMenuSharedSlots,
} from './types'

interface OverlayMenuResolvedGroup<TItem> {
  label?: JSX.Element
  items: TItem[]
}

type OverlayMenuListEntry<TItem> =
  | { type: 'contentTop' }
  | { type: 'group'; group: OverlayMenuResolvedGroup<TItem> }
  | { type: 'contentBottom' }

function toStyleObject(
  style: string | JSX.CSSProperties | undefined,
): JSX.CSSProperties | undefined {
  return typeof style === 'object' ? style : undefined
}

function callRef<T extends HTMLElement>(
  ref: T | ((element: T) => void) | undefined,
  element: T,
): void {
  if (typeof ref === 'function') {
    ref(element)
  }
}

function resolveMenuSlot(
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

interface OverlayMenuLayerProps<
  TItem extends OverlayMenuSharedItem<TItem>,
> extends OverlayMenuSharedProps<TItem> {
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

function OverlayMenuLayer<TItem extends OverlayMenuSharedItem<TItem>>(
  props: OverlayMenuLayerProps<TItem>,
): JSX.Element {
  const cn = useCn()
  const layer = useOverlayMenuLayerState()
  const resolveSlot = (slot: keyof OverlayMenuSharedSlots) => resolveMenuSlot(props, slot, cn)
  const resolvedPlacement = () => props.placement ?? 'bottom-start'
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

  /** Track this layer's own positioner plus all descendant submenu branches while forwarding registration upward. */
  const registerLayerBranch = (element: HTMLElement): (() => void) => {
    subtreeBranches.add(element)
    const unregisterBranch = props.registerBranch(element)

    return () => {
      subtreeBranches.delete(element)
      unregisterBranch()
    }
  }

  createEffect(() => {
    layer.setCurrentPlacement(resolvedPlacement())
  })

  createEffect(() => {
    const controlledGroups = new Set<string>()
    const controlledValues: Record<string, string | undefined> = {}

    for (const group of groups()) {
      for (const item of group.items) {
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
  })

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

  createEffect(() => {
    const positioner = positionerElement()

    if (!positioner || props.open || !props.present()) {
      return
    }

    positioner.style.visibility = 'visible'
  })

  onMount(() => {
    const branchElement = positionerElement()

    if (!branchElement) {
      return
    }

    onCleanup(registerLayerBranch(branchElement))
  })

  createEffect(() => {
    const positioner = positionerElement()
    const content = layer.contentElement()

    if (!positioner || !content) {
      return
    }

    queueMicrotask(() => {
      if (positioner.isConnected && content.isConnected) {
        const contentZIndex = getComputedStyle(content).zIndex
        if (contentZIndex && contentZIndex !== 'auto') {
          positioner.style.zIndex = contentZIndex
        }
      }
    })
  })

  createEffect(() => {
    props.refState?.(layer)

    onCleanup(() => {
      props.refState?.(undefined)
    })
  })

  createEffect(() => {
    const content = layer.contentElement()
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
  })

  createEffect(() => {
    if (!props.open) {
      setIsPositioned(false)
      layer.setHighlightedItemId(undefined)
      layer.setPointerGraceIntent(null)
      layer.resetTypeahead()
      return
    }

    if (!isPositioned()) {
      return
    }

    if (!props.autoFocusStrategy || props.autoFocusStrategy === 'none') {
      return
    }

    const focusStrategy = props.autoFocusStrategy
    const onAutoFocusHandled = props.onAutoFocusHandled
    let frameId = 0

    const runAutoFocus = () => {
      focusLayerFromStrategy(layer, focusStrategy ?? 'none')
      onAutoFocusHandled?.()
    }

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      queueMicrotask(runAutoFocus)
      return
    }

    frameId = window.requestAnimationFrame(() => {
      runAutoFocus()
    })

    onCleanup(() => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }
    })
  })

  function getItemSlot(itemAttrsStyle?: string | JSX.CSSProperties, itemAttrsClass?: ClassValue) {
    const binding = resolveSlot('item')
    return {
      get class() {
        return cn(binding.class, itemAttrsClass)
      },
      get style() {
        return { ...toStyleObject(itemAttrsStyle), ...binding.style }
      },
    }
  }

  function getItemRenderProps(
    item: TItem,
    hasChildren: boolean,
    isCheckbox: boolean,
    isRadio: boolean,
  ): OverlayMenuSharedItemRenderProps<TItem> {
    return {
      item,
      depth: props.depth,
      hasChildren,
      isCheckbox,
      isRadio,
    }
  }

  function RenderItemContent(contentProps: {
    checked?: Accessor<boolean>
    hasChildren: boolean
    isCheckbox: boolean
    isRadio: boolean
    item: TItem
  }): JSX.Element {
    const itemRender = createLazyMemo(() => props.itemRender)
    const label = createLazyMemo(() => contentProps.item.label)
    const description = createLazyMemo(() => contentProps.item.description)
    const kbds = createLazyMemo(() => contentProps.item.kbds)
    return (
      <Show
        when={itemRender() === undefined}
        fallback={renderComponentOrElement(
          itemRender(),
          getItemRenderProps(
            contentProps.item,
            contentProps.hasChildren,
            contentProps.isCheckbox,
            contentProps.isRadio,
          ),
        )}
      >
        <Show when={contentProps.item.icon}>
          <span data-slot="itemLeading" {...resolveSlot('itemLeading')}>
            <Icon name={contentProps.item.icon} />
          </span>
        </Show>

        <Show when={label() || description()}>
          <span data-slot="itemWrapper" {...resolveSlot('itemWrapper')}>
            <Show when={label()}>
              <span data-slot="itemLabel" {...resolveSlot('itemLabel')}>
                {label()}
              </span>
            </Show>

            <Show when={description()}>
              <span data-slot="itemDescription" {...resolveSlot('itemDescription')}>
                {description()}
              </span>
            </Show>
          </span>
        </Show>

        <span data-slot="itemTrailing" {...resolveSlot('itemTrailing')}>
          <Show when={contentProps.hasChildren}>
            <Icon name={props.submenuIcon} class={resolveSlot('itemSub').class} />
          </Show>

          <Show when={!contentProps.hasChildren}>
            <Show when={kbds()?.length ? kbds() : undefined}>
              {(value) => (
                <KbdGroup
                  size="sm"
                  items={value()}
                  classes={{
                    root: resolveSlot('itemKbds').class,
                  }}
                  styles={{
                    root: resolveSlot('itemKbds').style,
                  }}
                />
              )}
            </Show>
          </Show>

          <Show when={contentProps.isCheckbox || contentProps.isRadio}>
            <span data-slot="itemIndicator" {...resolveSlot('itemIndicator')}>
              <Show when={contentProps.checked?.()}>
                <Icon name={props.checkedIcon} />
              </Show>
            </span>
          </Show>
        </span>
      </Show>
    )
  }

  function createSelectableItemHandlers(options: {
    activate: () => void
    disabled: () => boolean
    element: Accessor<HTMLDivElement | undefined>
    itemAttributes: Accessor<ElementProps<HTMLDivElement> | undefined>
    itemId: Accessor<string>
  }): Pick<
    JSX.HTMLAttributes<HTMLDivElement>,
    'onClick' | 'onFocus' | 'onKeyDown' | 'onPointerEnter' | 'onPointerMove' | 'onPointerLeave'
  > {
    const highlight = (): void => {
      layer.closeSubmenus()
      layer.setHighlightedItemId(options.itemId())
      focusElement(options.element())
    }

    const handlePointerMove = (event: PointerEvent & { currentTarget: HTMLDivElement }): void => {
      if (event.pointerType !== 'mouse') {
        return
      }

      if (options.disabled()) {
        layer.focusContent()
        return
      }

      if (layer.shouldBlockPointerEnter(event)) {
        layer.queuePointerEnter(event.currentTarget, highlight)
        event.preventDefault()
        return
      }

      highlight()
    }

    return {
      onClick: (event) => {
        const { defaultPrevented } = callHandler(event, options.itemAttributes()?.onClick)
        if (!defaultPrevented) {
          options.activate()
        }
      },
      onFocus: (event) => {
        const { defaultPrevented } = callHandler(event, options.itemAttributes()?.onFocus)
        if (!defaultPrevented) {
          layer.closeSubmenus()
          layer.setHighlightedItemId(options.itemId())
        }
      },
      onKeyDown: (event) => {
        const { defaultPrevented } = callHandler(event, options.itemAttributes()?.onKeyDown)
        if (
          !defaultPrevented &&
          !event.repeat &&
          !options.disabled() &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault()
          options.activate()
        }
      },
      onPointerEnter: (event) => {
        const { defaultPrevented } = callHandler(event, options.itemAttributes()?.onPointerEnter)
        if (!defaultPrevented) {
          handlePointerMove(event)
        }
      },
      onPointerMove: (event) => {
        const { defaultPrevented } = callHandler(event, options.itemAttributes()?.onPointerMove)
        if (!defaultPrevented) {
          handlePointerMove(event)
        }
      },
      onPointerLeave: (event) => {
        const { defaultPrevented } = callHandler(event, options.itemAttributes()?.onPointerLeave)
        if (!defaultPrevented && event.pointerType === 'mouse') {
          layer.clearQueuedPointerEnter(event.currentTarget)
          layer.focusContent()
        }
      },
    }
  }

  function LeafItem(itemProps: { item: TItem }): JSX.Element {
    const itemId = useId(undefined, `${props.id}-item`)
    const [element, setElement] = createSignal<HTMLDivElement | undefined>(undefined)
    const itemAttributes = createMemo(() =>
      props.itemProps?.(getItemRenderProps(itemProps.item, false, false, false)),
    )

    onMount(() => {
      onCleanup(
        layer.registerItem({
          disabled: () => Boolean(itemProps.item.disabled),
          element,
          hasSubmenu: false,
          id: itemId(),
          textValue: () => getOverlayMenuTextValue(itemProps.item) ?? element()?.textContent,
        }),
      )
    })

    const activate = (): void => {
      if (itemProps.item.disabled) {
        return
      }

      itemProps.item.onSelect?.()
      props.closeRoot({ restoreFocus: true })
    }

    const handlers = createSelectableItemHandlers({
      activate,
      disabled: () => Boolean(itemProps.item.disabled),
      element,
      itemAttributes,
      itemId,
    })

    return (
      <div
        id={itemId()}
        data-slot="item"
        data-destructive={itemProps.item.color === 'destructive' ? '' : undefined}
        role="menuitem"
        tabIndex={layer.highlightedItemId() === itemId() ? 0 : -1}
        aria-disabled={itemProps.item.disabled ? 'true' : undefined}
        data-disabled={itemProps.item.disabled ? '' : undefined}
        data-highlighted={layer.highlightedItemId() === itemId() ? '' : undefined}
        {...itemAttributes()}
        ref={(itemElement) => {
          setElement(itemElement)
          callRef(itemAttributes()?.ref, itemElement)
        }}
        {...getItemSlot(itemAttributes()?.style, itemAttributes()?.class)}
        {...handlers}
      >
        <RenderItemContent
          item={itemProps.item}
          hasChildren={false}
          isCheckbox={false}
          isRadio={false}
        />
      </div>
    )
  }

  function CheckboxMenuItem(itemProps: { item: TItem }): JSX.Element {
    const itemId = useId(undefined, `${props.id}-checkbox`)
    const [element, setElement] = createSignal<HTMLDivElement | undefined>(undefined)
    const [checkedState, setCheckedState] = useControllableValue<boolean>({
      value: () => itemProps.item.checked,
      defaultValue: () => itemProps.item.defaultChecked ?? false,
    })
    const checked = createMemo(() => Boolean(checkedState()))
    const itemAttributes = createMemo(() =>
      props.itemProps?.(getItemRenderProps(itemProps.item, false, true, false)),
    )

    onMount(() => {
      onCleanup(
        layer.registerItem({
          disabled: () => Boolean(itemProps.item.disabled),
          element,
          hasSubmenu: false,
          id: itemId(),
          textValue: () => getOverlayMenuTextValue(itemProps.item) ?? element()?.textContent,
        }),
      )
    })

    const toggle = (): void => {
      if (itemProps.item.disabled) {
        return
      }

      const nextChecked = !checked()

      if (itemProps.item.checked === undefined) {
        setCheckedState(nextChecked)
      }

      itemProps.item.onCheckedChange?.(nextChecked)
      itemProps.item.onSelect?.()
    }

    const handlers = createSelectableItemHandlers({
      activate: toggle,
      disabled: () => Boolean(itemProps.item.disabled),
      element,
      itemAttributes,
      itemId,
    })

    return (
      <div
        id={itemId()}
        data-slot="item"
        data-destructive={itemProps.item.color === 'destructive' ? '' : undefined}
        role="menuitemcheckbox"
        tabIndex={layer.highlightedItemId() === itemId() ? 0 : -1}
        aria-checked={checked() ? 'true' : 'false'}
        aria-disabled={itemProps.item.disabled ? 'true' : undefined}
        data-selected={checked() ? '' : undefined}
        data-disabled={itemProps.item.disabled ? '' : undefined}
        data-highlighted={layer.highlightedItemId() === itemId() ? '' : undefined}
        {...itemAttributes()}
        ref={(itemElement) => {
          setElement(itemElement)
          callRef(itemAttributes()?.ref, itemElement)
        }}
        {...getItemSlot(itemAttributes()?.style, itemAttributes()?.class)}
        {...handlers}
      >
        <RenderItemContent
          item={itemProps.item}
          checked={checked}
          hasChildren={false}
          isCheckbox={true}
          isRadio={false}
        />
      </div>
    )
  }

  function RadioMenuItem(itemProps: { item: TItem }): JSX.Element {
    const itemId = useId(undefined, `${props.id}-radio`)
    const [element, setElement] = createSignal<HTMLDivElement | undefined>(undefined)
    const [checkedState, setCheckedState] = useControllableValue<boolean>({
      value: () => itemProps.item.checked,
      defaultValue: () => itemProps.item.defaultChecked ?? false,
    })
    const checked = createMemo(() => {
      if (itemProps.item.group && itemProps.item.value !== undefined) {
        return radioGroupValues()[itemProps.item.group] === itemProps.item.value
      }

      return Boolean(checkedState())
    })
    const itemAttributes = createMemo(() =>
      props.itemProps?.(getItemRenderProps(itemProps.item, false, false, true)),
    )

    onMount(() => {
      onCleanup(
        layer.registerItem({
          disabled: () => Boolean(itemProps.item.disabled),
          element,
          hasSubmenu: false,
          id: itemId(),
          textValue: () => getOverlayMenuTextValue(itemProps.item) ?? element()?.textContent,
        }),
      )
    })

    const select = (): void => {
      if (itemProps.item.disabled) {
        return
      }

      if (!checked() && itemProps.item.checked === undefined) {
        setCheckedState(true)
      }

      if (itemProps.item.group && itemProps.item.value !== undefined) {
        setRadioGroupValues((values) => ({
          ...values,
          [itemProps.item.group!]: itemProps.item.value,
        }))
      }

      itemProps.item.onCheckedChange?.(true)

      if (itemProps.item.value !== undefined) {
        itemProps.item.onValueChange?.(itemProps.item.value)
      }

      itemProps.item.onSelect?.()
    }

    const handlers = createSelectableItemHandlers({
      activate: select,
      disabled: () => Boolean(itemProps.item.disabled),
      element,
      itemAttributes,
      itemId,
    })

    return (
      <div
        id={itemId()}
        data-slot="item"
        data-destructive={itemProps.item.color === 'destructive' ? '' : undefined}
        role="menuitemradio"
        tabIndex={layer.highlightedItemId() === itemId() ? 0 : -1}
        aria-checked={checked() ? 'true' : 'false'}
        aria-disabled={itemProps.item.disabled ? 'true' : undefined}
        data-selected={checked() ? '' : undefined}
        data-disabled={itemProps.item.disabled ? '' : undefined}
        data-highlighted={layer.highlightedItemId() === itemId() ? '' : undefined}
        {...itemAttributes()}
        ref={(itemElement) => {
          setElement(itemElement)
          callRef(itemAttributes()?.ref, itemElement)
        }}
        {...getItemSlot(itemAttributes()?.style, itemAttributes()?.class)}
        {...handlers}
      >
        <RenderItemContent
          item={itemProps.item}
          checked={checked}
          hasChildren={false}
          isCheckbox={false}
          isRadio={true}
        />
      </div>
    )
  }

  function SubmenuItem(itemProps: { item: TItem }): JSX.Element {
    const submenuId = useId(undefined, `${props.id}-sub`)
    const submenuContentId = createMemo(() => `${submenuId()}-content`)
    const [triggerElement, setTriggerElement] = createSignal<HTMLDivElement | undefined>(undefined)
    const [openState, setOpenState] = useControllableValue<boolean>({
      value: () => itemProps.item.open,
      defaultValue: () => itemProps.item.defaultOpen ?? false,
    })
    const isOpen = createMemo(() => Boolean(openState()))
    const [autoFocusStrategy, setAutoFocusStrategy] = createSignal<OverlayMenuFocusStrategy>('none')
    const contentPresence = useTransitionPresence({
      open: isOpen,
    })
    const itemAttributes = createMemo(() =>
      props.itemProps?.(getItemRenderProps(itemProps.item, true, false, false)),
    )
    let openTimeoutId = 0
    let submenuLayerState: OverlayMenuLayerState | undefined

    const clearOpenTimeout = (): void => {
      window.clearTimeout(openTimeoutId)
      openTimeoutId = 0
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

    createEffect(() => {
      if (contentPresence.present()) {
        return
      }

      submenuLayerState = undefined
      contentPresence.setElement(undefined)
    })

    const onPointerMove = (): void => {
      layer.closeSubmenus(submenuId())
      layer.setHighlightedItemId(submenuId())
      clearOpenTimeout()

      submenuLayerState?.setHighlightedItemId(undefined)
      focusWithoutScrolling(triggerElement())

      if (!isOpen()) {
        openTimeoutId = window.setTimeout(() => {
          openTimeoutId = 0
          untrack(() => {
            if (!props.open || itemProps.item.disabled) {
              return
            }

            openSubmenu('content')
          })
        }, 100)
      }
    }

    return (
      <>
        <div
          id={submenuId()}
          data-slot="item"
          data-destructive={itemProps.item.color === 'destructive' ? '' : undefined}
          role="menuitem"
          tabIndex={layer.highlightedItemId() === submenuId() ? 0 : -1}
          aria-haspopup="menu"
          aria-controls={isOpen() ? submenuContentId() : undefined}
          aria-expanded={isOpen() ? 'true' : 'false'}
          aria-disabled={itemProps.item.disabled ? 'true' : undefined}
          data-disabled={itemProps.item.disabled ? '' : undefined}
          data-highlighted={layer.highlightedItemId() === submenuId() ? '' : undefined}
          data-expanded={isOpen() ? '' : undefined}
          {...itemAttributes()}
          ref={(itemElement) => {
            setTriggerElement(itemElement)
            callRef(itemAttributes()?.ref, itemElement)
          }}
          {...getItemSlot(itemAttributes()?.style, itemAttributes()?.class)}
          onClick={(event) => {
            const { defaultPrevented } = callHandler(event, itemAttributes()?.onClick)
            if (defaultPrevented || itemProps.item.disabled) {
              return
            }

            event.preventDefault()
            openSubmenu('content')
          }}
          onFocus={(event) => {
            const { defaultPrevented } = callHandler(event, itemAttributes()?.onFocus)
            if (defaultPrevented) {
              return
            }

            layer.closeSubmenus(submenuId())
            layer.setHighlightedItemId(submenuId())
          }}
          onKeyDown={(event) => {
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

            const openKey = resolveDirection() === 'rtl' ? 'ArrowLeft' : 'ArrowRight'

            if (event.key === openKey || event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openSubmenu('first')
            }
          }}
          onPointerEnter={(event) => {
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
          }}
          onPointerMove={(event) => {
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
          }}
          onPointerLeave={(event) => {
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
          }}
        >
          <RenderItemContent
            item={itemProps.item}
            hasChildren={true}
            isCheckbox={false}
            isRadio={false}
          />
        </div>

        <Show when={contentPresence.present()}>
          <Portal>
            <OverlayMenuLayer<TItem>
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
              placement={resolveDirection() === 'rtl' ? 'left-start' : 'right-start'}
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

  const side = createMemo(() => resolveOverlayMenuSide(layer.currentPlacement()))
  const align = createMemo(() => {
    const alignment = layer.currentPlacement().split('-')[1]
    return alignment === 'start' || alignment === 'end' ? alignment : undefined
  })
  const presenceDataAttrs = createMemo(() => {
    const dataAttrs = props.presenceDataAttrs()

    return dataAttrs['data-expanded'] !== undefined && !isPositioned() ? {} : dataAttrs
  })
  const closeParentKey = createMemo(() =>
    props.parentLayer ? (side() === 'left' ? 'ArrowRight' : 'ArrowLeft') : undefined,
  )

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
        data-slot="group"
        role="group"
        aria-labelledby={groupLabelId()}
        {...resolveSlot('group')}
      >
        <Show when={groupLabel()}>
          <div id={groupLabelId()} data-slot="label" {...resolveSlot('label')}>
            {groupLabel()}
          </div>
        </Show>

        <For each={entry.group.items}>
          {(item) => (
            <Switch fallback={<LeafItem item={item} />}>
              <Match when={item.type === 'separator'}>
                <div data-slot="separator" role="separator" {...resolveSlot('separator')} />
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

  const RuntimeList = List as unknown as import('solid-js').Component<
    ListProps<OverlayMenuListEntry<TItem>, 'div', HTMLDivElement> &
      JSX.HTMLAttributes<HTMLDivElement>
  >

  const contentSlot = () => ({
    class: cn(resolveSlot('content').class, props.contentProps?.class),
    style: {
      '--mo-popper-content-transform-origin': undefined,
      ...toStyleObject(props.contentProps?.style),
      ...resolveSlot('content').style,
    },
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
      data-slot="positioner"
      class={'left-0 top-0 absolute'}
    >
      <RuntimeList
        as="div"
        items={listEntries()}
        itemRender={(context) => renderListEntry(context.item)}
        id={props.id}
        data-slot="content"
        role="menu"
        aria-labelledby={props.ariaLabelledBy}
        tabIndex={layer.highlightedItemId() === undefined ? 0 : -1}
        {...props.contentProps}
        {...presenceDataAttrs()}
        data-side={side()}
        data-align={align()}
        ref={(element: HTMLDivElement) => {
          layer.setContentElement(element)
          props.setPresenceElement(element)
          callRef(props.contentProps?.ref, element)
          onCleanup(() => {
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
        onKeyDown={(event) => {
          const { defaultPrevented } = callHandler(event, props.contentProps?.onKeyDown)
          if (!defaultPrevented) {
            onLayerKeyDown(event, layer, props.close, closeParentKey(), props.closeOnTab)
          }
        }}
      />
    </div>
  )
}

export function OverlayMenu<TItem extends OverlayMenuSharedItem<TItem>>(
  props: OverlayMenuProps<TItem>,
): JSX.Element {
  const cn = useCn()
  const merged = mergeProps(
    {
      preventScroll: true,
    },
    props,
  )
  const rootId = useId(() => merged.id, 'overlaymenu')
  const contentId = createMemo(() => `${rootId()}-content`)
  const contentPresence = useTransitionPresence({
    open: () => merged.open,
  })
  const branches = new Set<HTMLElement>()
  const [pendingFocusOnClose, setPendingFocusOnClose] = createSignal<'trigger' | 'next'>()
  const [rootLayerState, setRootLayerState] = createSignal<OverlayMenuLayerState | undefined>(
    undefined,
  )

  createEffect(() => {
    if (contentPresence.present()) {
      return
    }

    contentPresence.setElement(undefined)
  })

  createEffect(() => {
    const pendingFocus = pendingFocusOnClose()
    if (merged.open || !pendingFocus) {
      return
    }

    const triggerElement = merged.triggerElement

    queueMicrotask(() => {
      untrack(() => {
        if (merged.open || pendingFocusOnClose() !== pendingFocus) {
          return
        }

        if (pendingFocus === 'trigger') {
          focusTrigger(triggerElement)
        } else if (triggerElement) {
          const focusableElements = getFocusableElements(document.body).filter(
            (element) => ![...branches].some((branch) => branch.contains(element)),
          )
          const triggerIndexes = focusableElements.flatMap((element, index) =>
            element === triggerElement || triggerElement.contains(element) ? [index] : [],
          )
          const triggerIndex = triggerIndexes[triggerIndexes.length - 1]
          if (triggerIndex !== undefined) {
            focusWithoutScrolling(focusableElements[triggerIndex + 1])
          }
        }

        setPendingFocusOnClose(undefined)
      })
    })
  })

  createEffect(() => {
    if (merged.open) {
      return
    }

    rootLayerState()?.closeSubmenus()
  })

  createEffect(() => {
    if (!contentPresence.present()) {
      return
    }

    const releaseBodyScrollLock = merged.preventScroll ? acquireBodyScrollLock() : undefined

    onCleanup(() => {
      releaseBodyScrollLock?.()
    })
  })

  const containsTarget = (node: Node): boolean => {
    if (merged.triggerElement?.contains(node)) {
      return true
    }

    for (const branch of branches) {
      if (branch.contains(node)) {
        return true
      }
    }

    return false
  }

  const closeRoot = (options?: OverlayMenuCloseOptions): void => {
    if (options?.restoreFocus) {
      setPendingFocusOnClose('trigger')
    }

    rootLayerState()?.closeSubmenus()
    merged.onClose()
  }

  const closeOnTab = (direction: 'forward' | 'backward'): void => {
    setPendingFocusOnClose(direction === 'backward' ? 'trigger' : 'next')
    rootLayerState()?.closeSubmenus()
    merged.onClose()
  }

  useOverlayInteraction({
    containsTarget,
    contentElement: () => rootLayerState()?.contentElement(),
    triggerElement: () => merged.triggerElement,
    onPointerOutside: (event) => {
      if (!event.defaultPrevented) {
        closeRoot()
      }
    },
    onFocusOutside: (event) => {
      if (!event.defaultPrevented) {
        closeRoot()
      }
    },
    onEscape: (event, context) => {
      const target = event.target
      if ((target instanceof Node && context.isInside(target)) || event.defaultPrevented) {
        return
      }

      event.preventDefault()
      closeRoot()
    },
    enabled: () => merged.open,
    outsidePressEvent: 'pointerdown',
    requireContent: true,
  })

  const getReferenceElement = createMemo<ReferenceElement | undefined>(() => {
    const anchorRect = merged.getAnchorRect?.(merged.triggerElement)

    if (anchorRect) {
      return createVirtualReference(anchorRect, merged.triggerElement)
    }

    return merged.triggerElement
  })

  return (
    <Show when={contentPresence.present()}>
      <Portal>
        <Show when={merged.preventScroll}>
          <div data-slot="overlay" aria-hidden="true" {...resolveMenuSlot(merged, 'overlay', cn)} />
        </Show>
        <OverlayMenuLayer<TItem>
          id={contentId()}
          ariaLabelledBy={merged.triggerElement?.id}
          open={merged.open}
          close={closeRoot}
          closeOnTab={closeOnTab}
          closeRoot={closeRoot}
          depth={0}
          items={merged.items}
          classes={merged.classes}
          styles={merged.styles}
          slotBinding={merged.slotBinding}
          size={merged.size}
          checkedIcon={merged.checkedIcon}
          submenuIcon={merged.submenuIcon}
          itemRender={merged.itemRender}
          contentProps={merged.contentProps}
          itemProps={merged.itemProps}
          contentTop={merged.contentTop}
          contentBottom={merged.contentBottom}
          getReferenceElement={getReferenceElement}
          placement={merged.placement}
          gutter={merged.gutter}
          shift={merged.shift}
          overflowPadding={merged.overflowPadding}
          present={contentPresence.present}
          presenceDataAttrs={contentPresence.dataAttrs}
          registerBranch={(element) => {
            branches.add(element)

            return () => {
              branches.delete(element)
            }
          }}
          setPresenceElement={contentPresence.setElement}
          autoFocusStrategy={merged.autoFocusStrategy}
          onAutoFocusHandled={merged.onAutoFocusHandled}
          onContentPointerDown={merged.onContentPointerDown}
          onContextMenu={merged.onContentContextMenu}
          refState={setRootLayerState}
        />
      </Portal>
    </Show>
  )
}
