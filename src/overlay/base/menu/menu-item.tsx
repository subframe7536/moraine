import type { ClassValue } from 'cn'
import type { Accessor, Component, JSX, Setter } from 'solid-js'
import { Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'

import { Icon } from '../../../element/icon'
import type { IconT } from '../../../element/icon'
import { KbdGroup } from '../../../element/kbd-group'
import { createControllableValue } from '../../../shared/controllable-value'
import { createLazyMemo } from '../../../shared/create-lazy-memo'
import { attachEventListenerMap } from '../../../shared/event-listener'
import { renderWithProps } from '../../../shared/render-with-props'
import { createId } from '../../../shared/utils'
import type { Cn } from '../../../theme/cn'
import type { SlotBinding } from '../../../theme/use-recipe'

import { overlayMenuDataAttributes } from './menu.recipe'
import { focusElement, getOverlayMenuTextValue } from './menu.utils'
import type { OverlayMenuCloseOptions, OverlayMenuLayerState } from './menu.utils'
import type { OverlayMenuItem, OverlayMenuItemRenderProps, OverlayMenuSharedSlots } from './types'

export function createSelectableItemHandlers(
  layer: OverlayMenuLayerState,
  options: {
    activate: () => void
    disabled: () => boolean
    element: Accessor<HTMLDivElement | undefined>
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
    if (layer.highlightedItemId() === options.itemId()) {
      return
    }

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

    if (layer.highlightedItemId() === options.itemId()) {
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
      if (event.defaultPrevented || options.disabled()) {
        event.preventDefault()
        return
      }
      options.activate()
    },
    onFocus: () => {
      if (!options.disabled()) {
        layer.closeSubmenus()
        layer.setHighlightedItemId(options.itemId())
      }
    },
    onKeyDown: (event) => {
      if (
        !event.defaultPrevented &&
        !event.repeat &&
        !options.disabled() &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault()
        options.activate()
      }
    },
    onPointerDown: (event) => {
      if (options.disabled()) {
        event.preventDefault()
      }
    },
    onPointerEnter: (event) => {
      handlePointerMove(event)
    },
    onPointerMove: (event) => {
      handlePointerMove(event)
    },
    onPointerLeave: (event) => {
      if (event.pointerType === 'mouse') {
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
  return attachEventListenerMap(element, {
    click: handlers.onClick,
    focus: handlers.onFocus,
    keydown: handlers.onKeyDown,
    pointerdown: handlers.onPointerDown,
    pointerenter: handlers.onPointerEnter,
    pointermove: handlers.onPointerMove,
    pointerleave: handlers.onPointerLeave,
  } as Record<string, ((event: Event) => void) | undefined>)
}

interface MenuItemRenderers<TItem extends OverlayMenuItem = OverlayMenuItem> {
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
  ) => OverlayMenuItemRenderProps<TItem>
}

export function createMenuItemRenderers<TItem extends OverlayMenuItem = OverlayMenuItem>(options: {
  props: {
    id?: string
    depth: number
    checkedIcon?: IconT.Name
    submenuIcon?: IconT.Name
    itemRender?: Component<OverlayMenuItemRenderProps<TItem>>
  }
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
  ): OverlayMenuItemRenderProps<TItem> {
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
    const kbds = createLazyMemo(() =>
      'kbds' in contentProps.item ? contentProps.item.kbds : undefined,
    )
    return (
      <Show
        when={itemRender() === undefined}
        fallback={
          <Show when={itemRender()} keyed>
            {(render) =>
              renderWithProps(
                render,
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

  function useItemRegistration(
    item: Accessor<TItem>,
    element: Accessor<HTMLDivElement | undefined>,
    itemId: Accessor<string>,
  ): void {
    onMount(() => {
      onCleanup(
        layer.registerItem({
          disabled: () => Boolean(item().disabled),
          element,
          hasSubmenu: false,
          id: itemId(),
          textValue: () => getOverlayMenuTextValue(item()) ?? element()?.textContent,
        }),
      )
    })
  }

  function LeafItem(itemProps: { item: TItem }): JSX.Element {
    const itemId = createId(undefined, `${props.id}-item`)
    const [element, setElement] = createSignal<HTMLDivElement | undefined>(undefined)

    useItemRegistration(() => itemProps.item, element, itemId)

    const activate = (): void => {
      if (itemProps.item.disabled) {
        return
      }

      if ('onSelect' in itemProps.item) {
        itemProps.item.onSelect?.()
      }
      closeRoot({ restoreFocus: true })
    }

    const handlers = createSelectableItemHandlers(layer, {
      activate,
      disabled: () => Boolean(itemProps.item.disabled),
      element,
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
          danger: () => itemProps.item.variant === 'danger',
          disabled: () => itemProps.item.disabled,
          expanded: undefined,
          highlighted: () => layer.highlightedItemId() === itemId(),
          selected: undefined,
        })}
        ref={(itemElement) => {
          setElement(itemElement)
          onCleanup(attachSelectableItemHandlers(itemElement, handlers))
        }}
        {...getItemSlot(itemProps.item.style, itemProps.item.class)}
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
      value: () => ('checked' in itemProps.item ? itemProps.item.checked : undefined),
      defaultValue: () =>
        'defaultChecked' in itemProps.item ? (itemProps.item.defaultChecked ?? false) : false,
    })

    useItemRegistration(() => itemProps.item, element, itemId)

    const toggle = (): void => {
      if (itemProps.item.disabled) {
        return
      }

      const nextChecked = !checked()
      const itemChecked = 'checked' in itemProps.item ? itemProps.item.checked : undefined

      if (itemChecked === undefined) {
        setCheckedState(nextChecked)
      }

      if ('onCheckedChange' in itemProps.item) {
        itemProps.item.onCheckedChange?.(nextChecked)
      }
      if ('onSelect' in itemProps.item) {
        itemProps.item.onSelect?.()
      }
    }

    const handlers = createSelectableItemHandlers(layer, {
      activate: toggle,
      disabled: () => Boolean(itemProps.item.disabled),
      element,
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
          danger: () => itemProps.item.variant === 'danger',
          selected: checked,
          disabled: () => itemProps.item.disabled,
          expanded: undefined,
          highlighted: () => layer.highlightedItemId() === itemId(),
        })}
        ref={(itemElement) => {
          setElement(itemElement)
          onCleanup(attachSelectableItemHandlers(itemElement, handlers))
        }}
        {...getItemSlot(itemProps.item.style, itemProps.item.class)}
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
      value: () => ('checked' in itemProps.item ? itemProps.item.checked : undefined),
      defaultValue: () =>
        'defaultChecked' in itemProps.item ? (itemProps.item.defaultChecked ?? false) : false,
    })
    const checked = createMemo(() => {
      if (
        'group' in itemProps.item &&
        itemProps.item.group &&
        'value' in itemProps.item &&
        itemProps.item.value !== undefined
      ) {
        return radioGroupValues()[itemProps.item.group] === itemProps.item.value
      }

      return checkedState()
    })

    useItemRegistration(() => itemProps.item, element, itemId)

    const select = (): void => {
      if (itemProps.item.disabled) {
        return
      }

      const itemChecked = 'checked' in itemProps.item ? itemProps.item.checked : undefined
      if (!checked() && itemChecked === undefined) {
        setCheckedState(true)
      }

      const group = 'group' in itemProps.item ? itemProps.item.group : undefined
      const value = 'value' in itemProps.item ? itemProps.item.value : undefined
      if (group && value !== undefined) {
        setRadioGroupValues((values) => ({
          ...values,
          [group]: value,
        }))
      }

      if ('onCheckedChange' in itemProps.item) {
        itemProps.item.onCheckedChange?.(true)
      }

      if (value !== undefined && 'onValueChange' in itemProps.item) {
        itemProps.item.onValueChange?.(value)
      }

      if ('onSelect' in itemProps.item) {
        itemProps.item.onSelect?.()
      }
    }

    const handlers = createSelectableItemHandlers(layer, {
      activate: select,
      disabled: () => Boolean(itemProps.item.disabled),
      element,
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
          danger: () => itemProps.item.variant === 'danger',
          selected: checked,
          disabled: () => itemProps.item.disabled,
          expanded: undefined,
          highlighted: () => layer.highlightedItemId() === itemId(),
        })}
        ref={(itemElement) => {
          setElement(itemElement)
          onCleanup(attachSelectableItemHandlers(itemElement, handlers))
        }}
        {...getItemSlot(itemProps.item.style, itemProps.item.class)}
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
