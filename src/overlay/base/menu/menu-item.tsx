import type { ClassValue } from 'cn'
import type { Accessor, JSX, Setter } from 'solid-js'
import {
  Show,
  createComponent,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js'

import { Icon } from '../../../element/icon'
import { KbdGroup } from '../../../element/kbd'
import type { SlotBinding } from '../../../provider/create-styles'
import { createControllableValue } from '../../../shared/controllable-value'
import { createLazyMemo } from '../../../shared/create-lazy-memo'
import { attachEventListener } from '../../../shared/event-listener'
import type { ElementProps } from '../../../shared/types'
import { callHandler, callRef, createId } from '../../../shared/utils'
import type { Cn } from '../../../theme/cn'

import { overlayMenuDataAttributes } from './menu.recipe'
import { focusElement, getOverlayMenuTextValue } from './menu.utils'
import type { OverlayMenuCloseOptions, OverlayMenuLayerState } from './menu.utils'
import type {
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
  OverlayMenuSharedProps,
  OverlayMenuSharedSlots,
} from './types'

const SELECTABLE_ITEM_EVENT_PROPS = [
  'onClick',
  'onFocus',
  'onKeyDown',
  'onPointerDown',
  'onPointerEnter',
  'onPointerMove',
  'onPointerLeave',
] as const

export function itemElementAttributes(attributes: ElementProps<HTMLDivElement> | undefined) {
  return splitProps(attributes ?? {}, SELECTABLE_ITEM_EVENT_PROPS)[1]
}

export function createSelectableItemHandlers(
  layer: OverlayMenuLayerState,
  options: {
    activate: () => void
    disabled: () => boolean
    element: Accessor<HTMLDivElement | undefined>
    itemAttributes: Accessor<ElementProps<HTMLDivElement> | undefined>
    itemId: Accessor<string>
  },
): Pick<
  JSX.HTMLAttributes<HTMLDivElement>,
  | 'onClick'
  | 'onFocus'
  | 'onKeyDown'
  | 'onPointerDown'
  | 'onPointerEnter'
  | 'onPointerMove'
  | 'onPointerLeave'
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
      if (options.disabled()) {
        event.preventDefault()
        return
      }
      const { defaultPrevented } = callHandler(event, options.itemAttributes()?.onClick)
      if (!defaultPrevented) {
        options.activate()
      }
    },
    onFocus: (event) => {
      const { defaultPrevented } = callHandler(event, options.itemAttributes()?.onFocus)
      if (!defaultPrevented && !options.disabled()) {
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
    onPointerDown: (event) => {
      const { defaultPrevented } = callHandler(event, options.itemAttributes()?.onPointerDown)
      if (!defaultPrevented && options.disabled()) {
        event.preventDefault()
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

export function attachSelectableItemHandlers(
  element: HTMLDivElement,
  handlers: ReturnType<typeof createSelectableItemHandlers>,
): () => void {
  const names = {
    click: handlers.onClick,
    focus: handlers.onFocus,
    keydown: handlers.onKeyDown,
    pointerdown: handlers.onPointerDown,
    pointerenter: handlers.onPointerEnter,
    pointermove: handlers.onPointerMove,
    pointerleave: handlers.onPointerLeave,
  } as const
  const releases = Object.entries(names).map(([name, handler]) =>
    attachEventListener(
      element,
      name as keyof HTMLElementEventMap,
      handler as (event: Event) => void,
    ),
  )
  return () => releases.forEach((release) => release())
}

interface MenuItemRenderers<TItem> {
  LeafItem: (props: { item: TItem }) => JSX.Element
  CheckboxMenuItem: (props: { item: TItem }) => JSX.Element
  RadioMenuItem: (props: { item: TItem }) => JSX.Element
  RenderItemContent: (props: {
    checked?: Accessor<boolean>
    hasChildren: boolean
    isCheckbox: boolean
    isRadio: boolean
    item: TItem
  }) => JSX.Element
  getItemSlot: (style?: JSX.CSSProperties, className?: ClassValue) => SlotBinding
  getItemRenderProps: (
    item: TItem,
    hasChildren: boolean,
    isCheckbox: boolean,
    isRadio: boolean,
  ) => OverlayMenuSharedItemRenderProps<TItem>
}

export function createMenuItemRenderers<TItem extends OverlayMenuSharedItem<TItem>>(options: {
  props: OverlayMenuSharedProps<TItem> & { depth: number }
  layer: OverlayMenuLayerState
  closeRoot: (options?: OverlayMenuCloseOptions) => void
  radioGroupValues: Accessor<Record<string, string | undefined>>
  setRadioGroupValues: Setter<Record<string, string | undefined>>
  resolveSlot: (slot: keyof OverlayMenuSharedSlots) => SlotBinding
  slotName: (slot: string) => string
  cn: Cn
}): MenuItemRenderers<TItem> {
  const {
    props,
    layer,
    closeRoot,
    radioGroupValues,
    setRadioGroupValues,
    resolveSlot,
    slotName,
    cn,
  } = options
  function getItemSlot(itemAttrsStyle?: JSX.CSSProperties, itemAttrsClass?: ClassValue) {
    const binding = resolveSlot('item')
    return {
      get class() {
        return cn(binding.class, itemAttrsClass)
      },
      get style() {
        return { ...itemAttrsStyle, ...binding.style }
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
        fallback={
          <Show when={itemRender()}>
            {(renderer) =>
              createComponent(
                renderer(),
                getItemRenderProps(
                  contentProps.item,
                  contentProps.hasChildren,
                  contentProps.isCheckbox,
                  contentProps.isRadio,
                ),
              )
            }
          </Show>
        }
      >
        <Show when={contentProps.item.icon}>
          <span data-slot={slotName('itemLeading')} {...resolveSlot('itemLeading')}>
            <Icon name={contentProps.item.icon} />
          </span>
        </Show>

        <Show when={label() || description()}>
          <span data-slot={slotName('itemWrapper')} {...resolveSlot('itemWrapper')}>
            <Show when={label()}>
              <span data-slot={slotName('itemLabel')} {...resolveSlot('itemLabel')}>
                {label()}
              </span>
            </Show>

            <Show when={description()}>
              <span data-slot={slotName('itemDescription')} {...resolveSlot('itemDescription')}>
                {description()}
              </span>
            </Show>
          </span>
        </Show>

        <span data-slot={slotName('itemTrailing')} {...resolveSlot('itemTrailing')}>
          <Show when={contentProps.hasChildren}>
            <Icon
              name={props.submenuIcon}
              data-slot={slotName('itemSubIndicator')}
              {...resolveSlot('itemSubIndicator')}
            />
          </Show>

          <Show when={!contentProps.hasChildren}>
            <Show when={kbds()?.length ? kbds() : undefined}>
              {(value) => (
                <KbdGroup
                  data-slot={slotName('itemKbds')}
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
            <span data-slot={slotName('itemIndicator')} {...resolveSlot('itemIndicator')}>
              <Show when={contentProps.checked?.()}>
                <Icon name={props.checkedIcon} />
              </Show>
            </span>
          </Show>
        </span>
      </Show>
    )
  }

  function LeafItem(itemProps: { item: TItem }): JSX.Element {
    const itemId = createId(undefined, `${props.id}-item`)
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
      closeRoot({ restoreFocus: true })
    }

    const handlers = createSelectableItemHandlers(layer, {
      activate,
      disabled: () => Boolean(itemProps.item.disabled),
      element,
      itemAttributes,
      itemId,
    })

    return (
      <div
        id={itemId()}
        data-slot={slotName('item')}
        role="menuitem"
        tabIndex={layer.highlightedItemId() === itemId() ? 0 : -1}
        aria-disabled={itemProps.item.disabled ? 'true' : undefined}
        {...overlayMenuDataAttributes.item({
          destructive: () => itemProps.item.variant === 'destructive',
          disabled: () => itemProps.item.disabled,
          expanded: undefined,
          highlighted: () => layer.highlightedItemId() === itemId(),
          selected: undefined,
        })}
        {...itemElementAttributes(itemAttributes())}
        ref={(itemElement) => {
          setElement(itemElement)
          callRef(itemAttributes()?.ref, itemElement)
          onCleanup(attachSelectableItemHandlers(itemElement, handlers))
        }}
        {...getItemSlot(itemAttributes()?.style, itemAttributes()?.class)}
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
    const itemId = createId(undefined, `${props.id}-checkbox`)
    const [element, setElement] = createSignal<HTMLDivElement | undefined>(undefined)
    const [checked, setCheckedState] = createControllableValue<boolean>({
      value: () => itemProps.item.checked,
      defaultValue: () => itemProps.item.defaultChecked ?? false,
    })
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

    const handlers = createSelectableItemHandlers(layer, {
      activate: toggle,
      disabled: () => Boolean(itemProps.item.disabled),
      element,
      itemAttributes,
      itemId,
    })

    return (
      <div
        id={itemId()}
        data-slot={slotName('item')}
        role="menuitemcheckbox"
        tabIndex={layer.highlightedItemId() === itemId() ? 0 : -1}
        aria-checked={checked() ? 'true' : 'false'}
        aria-disabled={itemProps.item.disabled ? 'true' : undefined}
        {...overlayMenuDataAttributes.item({
          destructive: () => itemProps.item.variant === 'destructive',
          selected: checked,
          disabled: () => itemProps.item.disabled,
          expanded: undefined,
          highlighted: () => layer.highlightedItemId() === itemId(),
        })}
        {...itemElementAttributes(itemAttributes())}
        ref={(itemElement) => {
          setElement(itemElement)
          callRef(itemAttributes()?.ref, itemElement)
          onCleanup(attachSelectableItemHandlers(itemElement, handlers))
        }}
        {...getItemSlot(itemAttributes()?.style, itemAttributes()?.class)}
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
    const itemId = createId(undefined, `${props.id}-radio`)
    const [element, setElement] = createSignal<HTMLDivElement | undefined>(undefined)
    const [checkedState, setCheckedState] = createControllableValue<boolean>({
      value: () => itemProps.item.checked,
      defaultValue: () => itemProps.item.defaultChecked ?? false,
    })
    const checked = createMemo(() => {
      if (itemProps.item.group && itemProps.item.value !== undefined) {
        return radioGroupValues()[itemProps.item.group] === itemProps.item.value
      }

      return checkedState()
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

      const group = itemProps.item.group
      const value = itemProps.item.value
      if (group && value !== undefined) {
        setRadioGroupValues((values) => ({
          ...values,
          [group]: value,
        }))
      }

      itemProps.item.onCheckedChange?.(true)

      if (itemProps.item.value !== undefined) {
        itemProps.item.onValueChange?.(itemProps.item.value)
      }

      itemProps.item.onSelect?.()
    }

    const handlers = createSelectableItemHandlers(layer, {
      activate: select,
      disabled: () => Boolean(itemProps.item.disabled),
      element,
      itemAttributes,
      itemId,
    })

    return (
      <div
        id={itemId()}
        data-slot={slotName('item')}
        role="menuitemradio"
        tabIndex={layer.highlightedItemId() === itemId() ? 0 : -1}
        aria-checked={checked() ? 'true' : 'false'}
        aria-disabled={itemProps.item.disabled ? 'true' : undefined}
        {...overlayMenuDataAttributes.item({
          destructive: () => itemProps.item.variant === 'destructive',
          selected: checked,
          disabled: () => itemProps.item.disabled,
          expanded: undefined,
          highlighted: () => layer.highlightedItemId() === itemId(),
        })}
        {...itemElementAttributes(itemAttributes())}
        ref={(itemElement) => {
          setElement(itemElement)
          callRef(itemAttributes()?.ref, itemElement)
          onCleanup(attachSelectableItemHandlers(itemElement, handlers))
        }}
        {...getItemSlot(itemAttributes()?.style, itemAttributes()?.class)}
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

  return {
    LeafItem,
    CheckboxMenuItem,
    RadioMenuItem,
    RenderItemContent,
    getItemSlot,
    getItemRenderProps,
  }
}
