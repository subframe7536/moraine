import type { ReferenceElement } from '@floating-ui/dom'
import type { ClassValueArray } from 'cls-variant'
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
import type { IconT } from '../../../elements/icon'
import { KbdGroup } from '../../../elements/kbd'
import { List } from '../../../elements/list'
import type { ComponentOrElement } from '../../../shared/render-prop'
import { renderComponentOrElement } from '../../../shared/render-prop'
import type { ElementProps } from '../../../shared/types'
import { useControllableValue } from '../../../shared/use-controllable-value'
import { useTransitionPresence } from '../../../shared/use-transition-presence'
import { callHandler, cn, useId } from '../../../shared/utils'
import {
  acquireBodyScrollLock,
  focusTrigger,
  focusWithoutScrolling,
  getTransformOrigin,
  resolveDirection,
  resolveOverlayMenuSide,
} from '../utils'

import { overlayMenuContentVariants, overlayMenuItemVariants } from './menu.class'
import type { OverlayMenuItemVariantProps } from './menu.class'
import {
  createPointerGraceIntent,
  createVirtualReference,
  getOverlayMenuTextValue,
  focusElement,
  focusLayerFromStrategy,
  hasOverlayMenuChildren,
  onLayerKeyDown,
  resolveMenuGroups,
  useOverlayMenuDismiss,
  useOverlayMenuFloatingPosition,
  useOverlayMenuLayerState,
} from './menu.utils'
import type {
  OverlayMenuAnchorRect,
  OverlayMenuCloseOptions,
  OverlayMenuFocusStrategy,
  OverlayMenuLayerState,
} from './menu.utils'
import type {
  OverlayMenuSharedClasses,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
  OverlayMenuContentSlot,
  OverlayMenuPlacement,
  OverlayMenuSharedStyles,
} from './types'

export type { OverlayMenuAnchorRect, OverlayMenuFocusStrategy } from './menu.utils'

/** Shared overlay menu props used by the shell, root wrappers, and layers. */
interface OverlayMenuSharedProps<TItem extends OverlayMenuSharedItem<TItem>> {
  /** Unique base id used to derive trigger and content ids. */
  id?: string

  /**
   * Icon used for checked checkbox items.
   * @default 'icon-check'
   */
  checkedIcon?: IconT.Name

  /** Slot class overrides for menu sections. */
  classes?: OverlayMenuSharedClasses

  /** Content rendered after the resolved item groups. */
  contentBottom?: OverlayMenuContentSlot

  /** Content rendered before the resolved item groups. */
  contentTop?: OverlayMenuContentSlot

  /**
   * Gap between the anchor and the content.
   * @default 0
   */
  gutter?: number

  /** Custom renderer for individual items. */
  itemRender?: ComponentOrElement<OverlayMenuSharedItemRenderProps<TItem>>

  /** Additional attributes for each menu layer content element. */
  contentProps?: ElementProps<HTMLDivElement>

  /** Additional attributes for an interactive menu item. */
  itemProps?: (
    context: OverlayMenuSharedItemRenderProps<TItem>,
  ) => ElementProps<HTMLDivElement> | undefined

  /** Items rendered in the menu body. */
  items?: TItem[]

  /**
   * Padding applied to the overflow area when calculating the menu's position.
   * @default 4
   */
  overflowPadding?: number

  /**
   * Preferred content placement relative to the trigger or anchor point.
   */
  placement?: OverlayMenuPlacement

  /**
   * Menu item size variant.
   * @default 'md'
   */
  size?: NonNullable<OverlayMenuItemVariantProps['size']>

  /** Slot style overrides for menu sections. */
  styles?: OverlayMenuSharedStyles

  /**
   * Icon used for submenu trigger items.
   * @default 'icon-chevron-right'
   */
  submenuIcon?: IconT.Name
}

interface OverlayMenuScrollLockProps {
  /**
   * Whether body scroll should be locked while the menu is open.
   * @default true
   */
  preventScroll?: boolean
}

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

interface OverlayMenuLayerProps<
  TItem extends OverlayMenuSharedItem<TItem>,
> extends OverlayMenuSharedProps<TItem> {
  autoFocusStrategy?: OverlayMenuFocusStrategy
  close: (options?: OverlayMenuCloseOptions) => void
  closeRoot: (options?: OverlayMenuCloseOptions) => void
  depth: number
  getReferenceElement: () => ReferenceElement | undefined
  onAutoFocusHandled?: () => void
  onContentPointerDown?: JSX.EventHandler<HTMLDivElement, PointerEvent>
  onContextMenu?: JSX.EventHandler<HTMLDivElement, MouseEvent>
  open: boolean
  parentLayer?: OverlayMenuLayerState
  presenceDataAttrs: Accessor<{
    'data-closed'?: string
    'data-expanded'?: string
  }>
  refState?: (state: OverlayMenuLayerState | undefined) => void
  registerBranch: (element: HTMLElement) => () => void
  setPresenceElement: (element: HTMLElement | undefined) => void
}

export interface OverlayMenuProps<TItem extends OverlayMenuSharedItem<TItem>>
  extends OverlayMenuSharedProps<TItem>, OverlayMenuScrollLockProps {
  /**
   * Strategy used to auto-focus the menu after it is positioned.
   */
  autoFocusStrategy?: OverlayMenuFocusStrategy

  /**
   * Resolve a virtual anchor rectangle when the menu is anchored to a point.
   */
  getAnchorRect?: (anchor?: HTMLElement) => OverlayMenuAnchorRect | undefined

  /**
   * Called after an auto-focus strategy has been handled.
   */
  onAutoFocusHandled?: () => void

  /** Called when the overlay menu should close. */
  onClose: () => void

  /** Pointer down handler for the content wrapper. */
  onContentPointerDown?: JSX.EventHandler<HTMLDivElement, PointerEvent>

  /** Context menu handler for the content wrapper. */
  onContentContextMenu?: JSX.EventHandler<HTMLDivElement, MouseEvent>

  /** Whether the overlay menu content is open. */
  open: boolean

  /** Trigger element used as the position reference. */
  triggerElement?: HTMLElement
}

export interface OverlayMenuRootProps<TItem extends OverlayMenuSharedItem<TItem>>
  extends OverlayMenuSharedProps<TItem>, OverlayMenuScrollLockProps {
  /** Controlled open state of the menu. */
  open?: boolean

  /**
   * Initial open state when the component is uncontrolled.
   * @default false
   */
  defaultOpen?: boolean

  /** Called whenever the menu requests an open state change. */
  onOpenChange?: (open: boolean) => void

  /**
   * Whether trigger interactions should be ignored.
   * @default false
   */
  disabled?: boolean
}

function OverlayMenuLayer<TItem extends OverlayMenuSharedItem<TItem>>(
  props: OverlayMenuLayerProps<TItem>,
): JSX.Element {
  const layer = useOverlayMenuLayerState()
  const resolvedPlacement = () => props.placement ?? 'bottom-start'
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement | undefined>(
    undefined,
  )
  const [isPositioned, setIsPositioned] = createSignal(false)
  const [radioGroupValues, setRadioGroupValues] = createSignal<Record<string, string | undefined>>(
    {},
  )
  const groups = createMemo(() => resolveMenuGroups(props.items))
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
    const nextValues: Record<string, string | undefined> = {}

    for (const group of groups()) {
      for (const item of group.items) {
        if (item.type !== 'radio' || !item.group || item.value === undefined) {
          continue
        }

        if (item.checked ?? item.defaultChecked) {
          nextValues[item.group] = item.value
        }
      }
    }

    setRadioGroupValues((currentValues) => ({ ...currentValues, ...nextValues }))
  })

  useOverlayMenuFloatingPosition({
    contentElement: layer.contentElement,
    floatingElement: positionerElement,
    getReferenceElement: () => props.getReferenceElement(),
    gutter: () => props.gutter ?? 0,
    onPositionedChange: setIsPositioned,
    onPlacementChange: layer.setCurrentPlacement,
    open: () => props.open,
    overflowPadding: () => props.overflowPadding ?? 4,
    placement: resolvedPlacement,
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
      positioner.style.zIndex = getComputedStyle(content).zIndex
    })
  })

  createEffect(() => {
    props.refState?.(layer)

    onCleanup(() => {
      props.refState?.(undefined)
    })
  })

  createEffect(() => {
    if (!props.open) {
      setIsPositioned(false)
      layer.setHighlightedItemId(undefined)
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

  function getItemClass(item: TItem, ...cls: ClassValueArray): string {
    return overlayMenuItemVariants(
      {
        size: props.size,
        color: item.color,
      },
      ...cls,
    )
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
    return (
      <Show
        when={props.itemRender === undefined}
        fallback={renderComponentOrElement(
          props.itemRender,
          getItemRenderProps(
            contentProps.item,
            contentProps.hasChildren,
            contentProps.isCheckbox,
            contentProps.isRadio,
          ),
        )}
      >
        <Show when={contentProps.item.icon}>
          <span
            data-slot="itemLeading"
            style={props.styles?.itemLeading}
            class={cn(
              'inline-flex shrink-0 col-start-1 size-4 items-center justify-center',
              props.classes?.itemLeading,
            )}
          >
            <Icon name={contentProps.item.icon as IconT.Name} />
          </span>
        </Show>

        <Show when={contentProps.item.label || contentProps.item.description}>
          <span
            data-slot="itemWrapper"
            style={props.styles?.itemWrapper}
            class={cn('gap-0.5 grid col-start-2', props.classes?.itemWrapper)}
          >
            <Show when={contentProps.item.label}>
              <span
                data-slot="itemLabel"
                style={props.styles?.itemLabel}
                class={cn('truncate', props.classes?.itemLabel)}
              >
                {contentProps.item.label}
              </span>
            </Show>

            <Show when={contentProps.item.description}>
              <span
                data-slot="itemDescription"
                style={props.styles?.itemDescription}
                class={cn('text-xs text-muted-foreground truncate', props.classes?.itemDescription)}
              >
                {contentProps.item.description}
              </span>
            </Show>
          </span>
        </Show>

        <span
          data-slot="itemTrailing"
          style={props.styles?.itemTrailing}
          class={cn(
            'inline-flex gap-1.5 col-start-3 items-center justify-end',
            props.classes?.itemTrailing,
          )}
        >
          <Show when={contentProps.hasChildren}>
            <Icon name={props.submenuIcon} class={cn('text-sm', props.classes?.itemSub)} />
          </Show>

          <Show when={!contentProps.hasChildren}>
            <Show when={contentProps.item.kbds?.length ? contentProps.item.kbds : undefined}>
              {(value) => (
                <KbdGroup
                  size="sm"
                  items={value()}
                  classes={{
                    root: props.classes?.itemKbds,
                  }}
                />
              )}
            </Show>
          </Show>

          <Show
            when={(contentProps.isCheckbox || contentProps.isRadio) && contentProps.checked?.()}
          >
            <span
              data-slot="itemIndicator"
              style={props.styles?.itemIndicator}
              class={cn(
                'text-sm inline-flex items-center justify-center',
                props.classes?.itemIndicator,
              )}
            >
              <Icon name={props.checkedIcon} />
            </span>
          </Show>
        </span>
      </Show>
    )
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

    const onPointerMove = (): void => {
      layer.closeSubmenus()
      layer.setHighlightedItemId(itemId())
      focusElement(element())
    }

    return (
      <div
        data-slot="item"
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
        style={{
          ...props.styles?.item,
          ...toStyleObject(itemAttributes()?.style),
        }}
        class={getItemClass(itemProps.item, props.classes?.item, itemAttributes()?.class)}
        onClick={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onClick)
          if (!defaultPrevented) {
            activate()
          }
        }}
        onFocus={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onFocus)
          if (defaultPrevented) {
            return
          }

          layer.closeSubmenus()
          layer.setHighlightedItemId(itemId())
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

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            activate()
          }
        }}
        onPointerEnter={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onPointerEnter)
          if (defaultPrevented) {
            return
          }

          if (itemProps.item.disabled) {
            layer.focusContent()
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

          if (itemProps.item.disabled) {
            layer.focusContent()
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

          layer.clearQueuedPointerEnter(event.currentTarget)
          layer.focusContent()
        }}
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

    const onPointerMove = (): void => {
      layer.closeSubmenus()
      layer.setHighlightedItemId(itemId())
      focusElement(element())
    }

    return (
      <div
        data-slot="item"
        role="menuitemcheckbox"
        tabIndex={layer.highlightedItemId() === itemId() ? 0 : -1}
        aria-checked={checked() ? 'true' : 'false'}
        aria-disabled={itemProps.item.disabled ? 'true' : undefined}
        data-disabled={itemProps.item.disabled ? '' : undefined}
        data-highlighted={layer.highlightedItemId() === itemId() ? '' : undefined}
        {...itemAttributes()}
        ref={(itemElement) => {
          setElement(itemElement)
          callRef(itemAttributes()?.ref, itemElement)
        }}
        style={{
          ...props.styles?.item,
          ...toStyleObject(itemAttributes()?.style),
        }}
        class={getItemClass(itemProps.item, props.classes?.item, itemAttributes()?.class)}
        onClick={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onClick)
          if (!defaultPrevented) {
            toggle()
          }
        }}
        onFocus={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onFocus)
          if (defaultPrevented) {
            return
          }

          layer.closeSubmenus()
          layer.setHighlightedItemId(itemId())
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

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }}
        onPointerEnter={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onPointerEnter)
          if (defaultPrevented) {
            return
          }

          if (itemProps.item.disabled) {
            layer.focusContent()
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

          if (itemProps.item.disabled) {
            layer.focusContent()
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

          layer.clearQueuedPointerEnter(event.currentTarget)
          layer.focusContent()
        }}
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

    const onPointerMove = (): void => {
      layer.closeSubmenus()
      layer.setHighlightedItemId(itemId())
      focusElement(element())
    }

    return (
      <div
        data-slot="item"
        role="menuitemradio"
        tabIndex={layer.highlightedItemId() === itemId() ? 0 : -1}
        aria-checked={checked() ? 'true' : 'false'}
        aria-disabled={itemProps.item.disabled ? 'true' : undefined}
        data-disabled={itemProps.item.disabled ? '' : undefined}
        data-highlighted={layer.highlightedItemId() === itemId() ? '' : undefined}
        {...itemAttributes()}
        ref={(itemElement) => {
          setElement(itemElement)
          callRef(itemAttributes()?.ref, itemElement)
        }}
        style={{
          ...props.styles?.item,
          ...toStyleObject(itemAttributes()?.style),
        }}
        class={getItemClass(itemProps.item, props.classes?.item, itemAttributes()?.class)}
        onClick={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onClick)
          if (!defaultPrevented) {
            select()
          }
        }}
        onFocus={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onFocus)
          if (defaultPrevented) {
            return
          }

          layer.closeSubmenus()
          layer.setHighlightedItemId(itemId())
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

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            select()
          }
        }}
        onPointerEnter={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onPointerEnter)
          if (defaultPrevented) {
            return
          }

          if (itemProps.item.disabled) {
            layer.focusContent()
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

          if (itemProps.item.disabled) {
            layer.focusContent()
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

          layer.clearQueuedPointerEnter(event.currentTarget)
          layer.focusContent()
        }}
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
            submenuLayerState?.closeSubmenus()
            setOpenState(false)
            setAutoFocusStrategy('none')
          },
          id: submenuId(),
          isOpen,
        }),
      )
      onCleanup(() => {
        window.clearTimeout(openTimeoutId)
      })
    })

    const closeSubmenu = (): void => {
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
      window.clearTimeout(openTimeoutId)

      submenuLayerState?.setHighlightedItemId(undefined)
      focusWithoutScrolling(triggerElement())

      if (!isOpen()) {
        openTimeoutId = window.setTimeout(() => {
          untrack(() => {
            openSubmenu('content')
          })
        }, 100)
      }
    }

    return (
      <>
        <div
          data-slot="item"
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
          style={{
            ...props.styles?.item,
            ...toStyleObject(itemAttributes()?.style),
          }}
          class={getItemClass(
            itemProps.item,
            'data-expanded:(bg-accent text-accent-foreground)',
            props.classes?.item,
            itemAttributes()?.class,
          )}
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

            const placementSide = layer.currentPlacement().startsWith('left') ? 'left' : 'right'
            const openKey = placementSide === 'left' ? 'ArrowLeft' : 'ArrowRight'

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
            window.clearTimeout(openTimeoutId)

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
              open={isOpen()}
              close={closeSubmenu}
              closeRoot={props.closeRoot}
              depth={props.depth + 1}
              items={itemProps.item.children}
              classes={props.classes}
              styles={props.styles}
              size={props.size}
              checkedIcon={props.checkedIcon}
              submenuIcon={props.submenuIcon}
              itemRender={props.itemRender}
              contentProps={props.contentProps}
              itemProps={props.itemProps}
              contentTop={props.contentTop}
              contentBottom={props.contentBottom}
              getReferenceElement={() => triggerElement()}
              placement={
                resolveOverlayMenuSide(layer.currentPlacement()) === 'left'
                  ? 'left-start'
                  : 'right-start'
              }
              gutter={0}
              overflowPadding={props.overflowPadding}
              parentLayer={layer}
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

    return (
      <div
        data-slot="group"
        role="group"
        style={props.styles?.group}
        class={cn(props.classes?.group)}
      >
        <Show when={entry.group.label}>
          <div
            data-slot="label"
            style={props.styles?.label}
            class={cn(
              'text-xs text-muted-foreground font-medium px-1.5 py-1 inline-flex',
              props.classes?.label,
            )}
          >
            {entry.group.label}
          </div>
        </Show>

        <For each={entry.group.items}>
          {(item) => (
            <Switch fallback={<LeafItem item={item} />}>
              <Match when={item.type === 'separator'}>
                <div
                  data-slot="separator"
                  role="separator"
                  style={props.styles?.separator}
                  class={cn('mx--1 my-1 border-t border-foreground/15', props.classes?.separator)}
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
        element.style.position = 'fixed'
        element.style.left = '0'
        element.style.top = '0'
        setIsPositioned(false)

        if (props.open) {
          element.style.visibility = 'hidden'
        }
      }}
      data-slot="positioner"
      class="left-0 top-0 fixed"
    >
      <List<OverlayMenuListEntry<TItem>, 'div'>
        as="div"
        items={listEntries()}
        itemRender={(context) => renderListEntry(context.item)}
        {...props.presenceDataAttrs()}
        id={props.id}
        data-slot="content"
        data-placement={layer.currentPlacement()}
        role="menu"
        tabIndex={layer.highlightedItemId() === undefined ? 0 : -1}
        {...props.contentProps}
        ref={(element) => {
          layer.setContentElement(element)
          props.setPresenceElement(element)
          callRef(props.contentProps?.ref, element)

          if (!element) {
            return
          }

          element.style.setProperty(
            '--mo-popper-content-transform-origin',
            getTransformOrigin(resolvedPlacement(), resolveDirection()),
          )
        }}
        style={{
          ...props.styles?.content,
          ...toStyleObject(props.contentProps?.style),
        }}
        class={overlayMenuContentVariants(
          { side: side() },
          props.classes?.content,
          props.contentProps?.class,
        )}
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

          if (!event.currentTarget.contains(event.target as Node)) {
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
        }}
        onKeyDown={(event) => {
          const { defaultPrevented } = callHandler(event, props.contentProps?.onKeyDown)
          if (!defaultPrevented) {
            onLayerKeyDown(event, layer, props.close, closeParentKey())
          }
        }}
      />
    </div>
  )
}

export function OverlayMenu<TItem extends OverlayMenuSharedItem<TItem>>(
  props: OverlayMenuProps<TItem>,
): JSX.Element {
  const merged = mergeProps(
    {
      gutter: 0,
      overflowPadding: 4,
      placement: 'bottom-start' as OverlayMenuPlacement,
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
  const [restoreFocusOnClose, setRestoreFocusOnClose] = createSignal(false)
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
    if (merged.open || !restoreFocusOnClose()) {
      return
    }

    const triggerElement = merged.triggerElement

    queueMicrotask(() => {
      focusTrigger(triggerElement)
      setRestoreFocusOnClose(false)
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
      setRestoreFocusOnClose(true)
    }

    rootLayerState()?.closeSubmenus()
    merged.onClose()
  }

  useOverlayMenuDismiss({
    containsTarget,
    contentElement: () => rootLayerState()?.contentElement(),
    triggerElement: () => merged.triggerElement,
    onClose: () => {
      closeRoot()
    },
    open: () => merged.open,
  })

  const getReferenceElement = (): ReferenceElement | undefined => {
    const anchorRect = merged.getAnchorRect?.(merged.triggerElement)

    if (anchorRect) {
      return createVirtualReference(anchorRect, merged.triggerElement)
    }

    return merged.triggerElement
  }

  return (
    <Show when={contentPresence.present()}>
      <Portal>
        <Show when={merged.preventScroll}>
          <div
            data-slot="overlay"
            style={merged.styles?.overlay}
            class={cn('inset-0 fixed z-40', merged.classes?.overlay)}
          />
        </Show>
        <OverlayMenuLayer<TItem>
          id={contentId()}
          open={merged.open}
          close={closeRoot}
          closeRoot={closeRoot}
          depth={0}
          items={merged.items}
          classes={merged.classes}
          styles={merged.styles}
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
          overflowPadding={merged.overflowPadding}
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
