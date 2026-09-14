import type { Accessor, JSX, ValidComponent } from 'solid-js'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  mergeProps,
  on,
  onCleanup,
  splitProps,
  untrack,
  useContext,
} from 'solid-js'
import { Dynamic, Portal } from 'solid-js/web'

import { useFloatingPosition } from '../../overlays/base/floating.ts'
import { useOverlayInteraction } from '../../overlays/base/interaction.ts'
import { acquireBodyScrollLock } from '../../overlays/base/utils.ts'
import { HiddenInput } from '../../shared/hidden-input.tsx'
import { useCn } from '../../shared/provider/cn-context.ts'
import { createComponentStyles } from '../../shared/provider/create-component-styles.ts'
import { createTypeahead } from '../../shared/typeahead.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { BaseSelectProps, BaseSelectT } from './base-select.types.ts'
import { createCollection, flattenItems, itemKey, labelString } from './shared/collection.ts'

function createSelectState<T extends BaseSelectT.Item>(props: BaseSelectProps<T>) {
  type Value = T['value'] | T['value'][] | null
  const id = useId(() => props.id, 'base-select')
  const initial = untrack(() => {
    const value = props.defaultValue
    return Array.isArray(value) ? [...value] : (value ?? (props.multiple ? [] : null))
  })
  const field = useFormField(
    () => props,
    () => ({ defaultId: id(), bind: false, initialValue: initial ?? '' }),
  )
  const collection = createMemo(() => createCollection(props.items ?? []))
  const [disabledPolicy, setDisabledPolicy] = createSignal<(item: T) => boolean>()
  const itemDisabled = (item: T) => Boolean(item.disabled || disabledPolicy()?.(item))
  const [viewSource, setViewSource] = createSignal<Accessor<BaseSelectT.Entry<T>[]> | undefined>()
  const view = createMemo(() => viewSource()?.() ?? collection().entries)
  const visibleItems = createMemo(() => flattenItems(view()))
  const [storedValue, setStoredValue] = useControllableValue<Value>({
    value: () => {
      if (props.value !== undefined) {
        return props.value
      }
      const value = field.value()
      if (props.multiple && Array.isArray(value)) {
        return value as T['value'][]
      }
      if (
        !props.multiple &&
        (value === null || typeof value === 'number' || typeof value === 'string')
      ) {
        return value === '' && !collection().byValue.has(itemKey(value)) ? null : value
      }
      return undefined
    },
    defaultValue: () => initial,
  })
  const value = createMemo(() => storedValue() ?? (props.multiple ? [] : null))
  const values = createMemo<T['value'][]>(() => {
    const current = value()
    return Array.isArray(current)
      ? [...new Map(current.map((value) => [itemKey(value), value])).values()]
      : current === null
        ? []
        : [current]
  })
  const selectedKeys = createMemo(() => new Set(values().map(itemKey)))
  const selectedItems = createMemo(() =>
    values().flatMap((value) => {
      const item = collection().byValue.get(itemKey(value))
      return item ? [item] : []
    }),
  )
  const [openValue, setOpenValue] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const open = () => openValue() ?? false
  const [highlight, setHighlight] = createSignal<string>()
  const [anchor, setAnchor] = createSignal<HTMLElement>()
  const [control, setControl] = createSignal<HTMLElement>()
  const [listbox, setListbox] = createSignal<HTMLDivElement>()
  const [contentPresent, setContentPresent] = createSignal(false)
  const [resetVersion, setResetVersion] = createSignal(0)
  const [selectionVersion, setSelectionVersion] = createSignal(0)
  const listboxId = () => `${field.id()}-listbox`
  const itemId = (value: BaseSelectT.Value) =>
    `${listboxId()}-${encodeURIComponent(itemKey(value))}`
  const styles = createComponentStyles('baseSelect', props, {
    inheritedVariants: () => ({ size: field.size() ?? undefined }),
  })
  const locked = () => field.disabled() || field.readOnly()
  let validationInput: HTMLInputElement | undefined
  let disposed = false
  onCleanup(() => {
    disposed = true
  })

  function setOpen(next: boolean) {
    if (next && field.disabled()) {
      return
    }
    if (next === open()) {
      return
    }
    setOpenValue(next)
    props.onOpenChange?.(next)
  }
  function change(next: Value) {
    if (locked()) {
      return
    }
    const before = values()
    const after = Array.isArray(next) ? next : next === null ? [] : [next]
    if (before.length === after.length && before.every((value, i) => Object.is(value, after[i]))) {
      return
    }
    setStoredValue(next)
    if (props.value === undefined) {
      field.setFormValue(next ?? '')
    }
    if (props.multiple) {
      props.onChange?.(after)
    } else {
      props.onChange?.(Array.isArray(next) ? (next[0] ?? null) : next)
    }
    if (props.value !== undefined) {
      field.setFormValue(props.value ?? '')
    }
    field.emit('change')
    field.emit('input')
  }
  function select(item: T) {
    if (locked() || itemDisabled(item)) {
      return
    }
    const key = itemKey(item.value)
    if (!collection().byValue.has(key)) {
      return
    }
    change(
      props.multiple
        ? selectedKeys().has(key)
          ? values().filter((value) => itemKey(value) !== key)
          : [...values(), item.value]
        : item.value,
    )
    if (props.closeOnSelect ?? !props.multiple) {
      setOpen(false)
      const target = control()
      // oxlint-disable-next-line subf/solid-reactivity -- Delayed focus validates the current control and open state.
      queueMicrotask(() => {
        if (!disposed && !open() && target === control() && target?.isConnected) {
          target.focus()
        }
      })
    }
    setSelectionVersion((version) => version + 1)
  }
  const enabled = createMemo(() => visibleItems().filter((item) => !itemDisabled(item)))
  createEffect(
    on([open, enabled, highlight, selectedKeys], ([isOpen, items, current, selected]) => {
      if (!isOpen) {
        return
      }
      if (!items.some((item) => itemKey(item.value) === current && !itemDisabled(item))) {
        const next =
          items.find((item) => !itemDisabled(item) && selected.has(itemKey(item.value))) ??
          items.find((item) => !itemDisabled(item))
        setHighlight(next ? itemKey(next.value) : undefined)
      }
    }),
  )
  const typeahead = createTypeahead({
    getItems: visibleItems,
    getStartIndex: () =>
      visibleItems().findIndex((item) =>
        open() ? itemKey(item.value) === highlight() : selectedKeys().has(itemKey(item.value)),
      ),
    getText: (item) => labelString(item, props.itemToLabelString),
    isDisabled: (item) => itemDisabled(item),
    onMatch: (item) => (open() ? setHighlight(itemKey(item.value)) : select(item)),
  })
  function keyDown(event: KeyboardEvent, textInput = false) {
    if (event.defaultPrevented || field.disabled() || event.isComposing) {
      return
    }
    if (!textInput && typeahead.handleKeyDown(event)) {
      return
    }
    const key = event.key
    if (key === 'Tab') {
      setOpen(false)
      return
    }
    if (key === 'Escape') {
      if (open()) {
        event.preventDefault()
        setOpen(false)
      }
      return
    }
    if (key === 'ArrowDown' || key === 'ArrowUp' || (open() && (key === 'Home' || key === 'End'))) {
      event.preventDefault()
      setOpen(true)
      const items = enabled()
      const current = items.findIndex((item) => itemKey(item.value) === highlight())
      const index =
        key === 'Home'
          ? 0
          : key === 'End'
            ? items.length - 1
            : current < 0
              ? key === 'ArrowUp'
                ? items.length - 1
                : 0
              : (current + (key === 'ArrowUp' ? -1 : 1) + items.length) % items.length
      setHighlight(items[index] ? itemKey(items[index].value) : undefined)
      return
    }
    if (key === 'Enter' || (!textInput && (key === ' ' || key === 'Spacebar'))) {
      event.preventDefault()
      if (!open()) {
        setOpen(true)
        return
      }
      const item = visibleItems().find((item) => itemKey(item.value) === highlight())
      if (item) {
        select(item)
      }
    }
  }
  createEffect(
    on([() => props.value, field.value], ([current, formValue]) => {
      if (current !== undefined && !Object.is(current ?? '', formValue)) {
        field.setFormValue(current ?? '')
      }
    }),
  )
  const serialized = createMemo(() =>
    !props.multiple && value() === null
      ? ['']
      : values()
          .filter((value) => !collection().byValue.get(itemKey(value))?.disabled)
          .map(String),
  )
  const validationValue = () =>
    props.multiple ? (values().length ? 'selected' : '') : value() === null ? '' : String(value())
  useFormReset(
    () => validationInput?.form,
    () => {
      if (disposed) {
        return
      }
      setStoredValue(initial)
      field.setFormValue((props.value !== undefined ? props.value : initial) ?? '')
      setResetVersion((version) => version + 1)
      if (validationInput) {
        validationInput.value = validationValue()
      }
    },
  )
  const presentation: BaseSelectT.TriggerState<T> = {
    get open() {
      return open()
    },
    get value() {
      return value()
    },
    get selectedItems() {
      return selectedItems()
    },
    get disabled() {
      return field.disabled()
    },
    get readOnly() {
      return field.readOnly()
    },
  }
  return {
    props,
    collection,
    view,
    visibleItems,
    setViewSource,
    value,
    values,
    selectedKeys,
    selectedItems,
    open,
    setOpen,
    highlight,
    setHighlight,
    anchor,
    setAnchor,
    control,
    setControl,
    listbox,
    setListbox,
    contentPresent,
    setContentPresent,
    listboxId,
    itemId,
    field,
    styles,
    locked,
    change,
    select,
    keyDown,
    resetVersion,
    selectionVersion,
    presentation,
    itemDisabled,
    setDisabledPolicy,
    formControls: () => (
      <>
        <HiddenInput
          ref={(element) => {
            validationInput = element
          }}
          type="text"
          aria-hidden="true"
          autocomplete="off"
          disabled={field.disabled()}
          required={field.required()}
          tabIndex={-1}
          value={validationValue()}
          onInput={(event) => {
            event.currentTarget.value = validationValue()
          }}
          onChange={(event) => {
            event.currentTarget.value = validationValue()
          }}
          onInvalid={(event) => {
            event.preventDefault()
            control()?.focus()
          }}
        />
        <For each={serialized()}>
          {(value) => (
            <HiddenInput
              type="hidden"
              visuallyHidden={false}
              name={field.name()}
              value={value}
              disabled={field.disabled()}
            />
          )}
        </For>
      </>
    ),
  }
}

type SelectState<T extends BaseSelectT.Item> = ReturnType<typeof createSelectState<T>>
const SelectContext = createContext<SelectState<BaseSelectT.Item>>()
/** Internal state access for the high-level controls and renderer. */
export function useSelectState<T extends BaseSelectT.Item = BaseSelectT.Item>(): SelectState<T> {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('[Moraine BaseSelect] Parts must be used within BaseSelect.')
  }
  return context as unknown as SelectState<T>
}

/** Public selection primitive with a canonical collection and form ownership. */
export function BaseSelect<T extends BaseSelectT.Item = BaseSelectT.Item>(
  props: BaseSelectProps<T>,
): JSX.Element {
  const state = createSelectState(props)
  return (
    <SelectContext.Provider value={state as unknown as SelectState<BaseSelectT.Item>}>
      {state.formControls()}
      {props.children}
    </SelectContext.Provider>
  )
}

function BaseSelectTrigger<
  T extends ValidComponent = 'button',
  TItem extends BaseSelectT.Item = BaseSelectT.Item,
>(props: BaseSelectT.TriggerProps<T, TItem>): JSX.Element {
  const state = useSelectState<TItem>()
  const cn = useCn()
  const [local, rest] = splitProps(props, ['as', 'children', 'class', 'style', 'type', 'disabled'])
  const children = createMemo(() => local.children)
  const tag = () => local.as ?? 'button'
  const eventProps = mergeProps(rest, {
    onPointerDown(event: PointerEvent) {
      callHandler(event, rest.onPointerDown)
      if (
        !event.defaultPrevented &&
        !state.field.disabled() &&
        event.pointerType !== 'touch' &&
        event.pointerType !== 'pen'
      ) {
        event.preventDefault()
        state.control()?.focus()
      }
    },
    onKeyDown(event: KeyboardEvent) {
      callHandler(event, rest.onKeyDown)
      state.keyDown(event)
    },
    onFocus(event: FocusEvent) {
      callHandler(event, rest.onFocus)
      if (!event.defaultPrevented) {
        state.field.emit('focus', event)
      }
    },
    onBlur(event: FocusEvent) {
      callHandler(event, rest.onBlur)
      if (!event.defaultPrevented) {
        state.field.emit('blur', event)
      }
    },
  })
  const binding = useButtonInteraction(
    {
      tag,
      type: () => local.type ?? 'button',
      typeForComponent: true,
      disabledForComponent: true,
      disabled: () => state.field.disabled() || Boolean(local.disabled),
      onPress: () => () => {
        state.control()?.focus()
        state.setOpen(!state.open())
      },
    },
    eventProps,
  )
  return (
    <Dynamic
      {...binding}
      component={tag()}
      {...state.field.ariaAttrs()}
      id={state.field.id()}
      role="combobox"
      aria-haspopup="listbox"
      aria-controls={state.listboxId()}
      aria-expanded={state.open() ? 'true' : 'false'}
      aria-activedescendant={
        state.open() && state.highlight()
          ? `${state.listboxId()}-${encodeURIComponent(state.highlight()!)}`
          : undefined
      }
      class={cn(local.class)}
      style={local.style}
      ref={(element: HTMLElement) => {
        state.setAnchor(element)
        state.setControl(element)
        callRef(rest.ref, element)
        onCleanup(() => {
          if (state.control() === element) {
            state.setControl(undefined)
          }
          if (state.anchor() === element) {
            state.setAnchor(undefined)
          }
          callRef(rest.ref, undefined)
        })
      }}
    >
      {typeof children() === 'function'
        ? (children() as (state: BaseSelectT.TriggerState<TItem>) => JSX.Element)(
            state.presentation,
          )
        : children()}
    </Dynamic>
  )
}

function BaseSelectContent(props: BaseSelectT.ContentProps): JSX.Element {
  const state = useSelectState()
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'children',
    'ref',
    'class',
    'style',
    'gutter',
    'overflowPadding',
  ])
  const presence = useTransitionPresence({ open: state.open })
  const [content, setContent] = createSignal<HTMLDivElement>()
  const [positioner, setPositioner] = createSignal<HTMLDivElement>()
  const [side, setSide] = createSignal('bottom')
  useFloatingPosition({
    contentElement: content,
    floatingElement: positioner,
    getReferenceElement: state.anchor,
    gutter: () => local.gutter ?? 0,
    onPositionedChange: () => undefined,
    onPlacementChange: (placement) => setSide(placement.split('-')[0] ?? 'bottom'),
    open: presence.present,
    overflowPadding: () => local.overflowPadding ?? 4,
    placement: () => 'bottom-start',
  })
  createEffect(on(presence.present, (present) => state.setContentPresent(present)))
  onCleanup(() => state.setContentPresent(false))
  createEffect(
    on(presence.present, (present) => {
      if (present) {
        onCleanup(acquireBodyScrollLock(state.anchor()))
      } else {
        presence.setElement(undefined)
      }
    }),
  )
  createEffect(
    on([content, positioner], ([element, wrapper]) => {
      if (element && wrapper) {
        // oxlint-disable-next-line subf/solid-reactivity -- Positioning checks the currently mounted popup elements.
        queueMicrotask(() => {
          if (content() === element && positioner() === wrapper) {
            wrapper.style.zIndex = getComputedStyle(element).zIndex
          }
        })
      }
    }),
  )
  useOverlayInteraction({
    containsTarget: (node) =>
      Boolean(state.anchor()?.contains(node) || positioner()?.contains(node)),
    onPointerOutside: (event) => {
      if (!event.defaultPrevented) {
        state.setOpen(false)
      }
    },
    onFocusOutside: (event) => {
      if (!event.defaultPrevented) {
        state.setOpen(false)
      }
    },
    onEscape: (event) => {
      if (!event.defaultPrevented) {
        event.preventDefault()
        state.setOpen(false)
      }
    },
    contentElement: content,
    enabled: state.open,
    outsidePressEvent: 'pointerdown',
    requireContent: true,
    triggerElement: state.anchor,
  })
  return (
    <Show when={presence.present()}>
      <Portal>
        <div
          data-slot="positioner"
          ref={(element) => {
            setPositioner(element)
            element.style.position = 'absolute'
            element.style.visibility = 'hidden'
          }}
          class="left-0 top-0 absolute"
        >
          <div
            {...rest}
            {...presence.dataAttrs()}
            data-slot="content"
            data-side={side()}
            ref={(element) => {
              setContent(element)
              state.setContentPresent(true)
              presence.setElement(element)
              callRef(local.ref, element)
            }}
            class={cn(state.styles.slot('content').class, local.class)}
            style={{
              ...state.styles.slot('content').style,
              ...(typeof local.style === 'object' ? local.style : {}),
            }}
          >
            {local.children}
          </div>
        </div>
      </Portal>
    </Show>
  )
}
function BaseSelectListbox(props: BaseSelectT.PartProps): JSX.Element {
  const state = useSelectState()
  const cn = useCn()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'ref'])
  createEffect(
    on([state.highlight, state.open, state.listbox], ([key, open, listbox]) => {
      if (!key || !open || !listbox) {
        return
      }
      // oxlint-disable-next-line subf/solid-reactivity -- Wait for row attributes to update, then verify the current listbox.
      queueMicrotask(() => {
        if (state.listbox() !== listbox || !state.open() || state.highlight() !== key) {
          return
        }
        const item = listbox.ownerDocument.getElementById(
          `${state.listboxId()}-${encodeURIComponent(key)}`,
        )
        if (item && listbox.contains(item)) {
          item.scrollIntoView?.({ block: 'nearest' })
        }
      })
    }),
  )
  return (
    <div
      {...rest}
      id={state.listboxId()}
      role="listbox"
      aria-multiselectable={state.props.multiple || undefined}
      data-slot="listbox"
      ref={(element) => {
        state.setListbox(element)
        callRef(local.ref, element)
        onCleanup(() => {
          if (state.listbox() === element) {
            state.setListbox(undefined)
          }
        })
      }}
      class={cn(state.styles.slot('listbox').class, local.class)}
      style={{
        ...state.styles.slot('listbox').style,
        ...(typeof local.style === 'object' ? local.style : {}),
      }}
    >
      {local.children}
    </div>
  )
}
function BaseSelectItem<T extends BaseSelectT.Item>(props: BaseSelectT.ItemProps<T>): JSX.Element {
  const state = useSelectState<T>()
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'item',
    'children',
    'class',
    'style',
    'ref',
    'onClick',
    'onPointerMove',
    'onPointerDown',
  ])
  const children = createMemo(() => local.children)
  const item = createMemo(() => {
    const canonical = state.collection().byValue.get(itemKey(local.item.value))
    if (!canonical) {
      throw new Error(
        `[Moraine BaseSelect] Item value ${String(local.item.value)} is not in the canonical collection.`,
      )
    }
    return canonical
  })
  const selected = () => state.selectedKeys().has(itemKey(item().value))
  const highlighted = () => state.highlight() === itemKey(item().value)
  const disabled = () => state.itemDisabled(item())
  const presentation: BaseSelectT.ItemState<T> = {
    get item() {
      return item()
    },
    get selected() {
      return selected()
    },
    get highlighted() {
      return highlighted()
    },
    get disabled() {
      return disabled()
    },
  }
  return (
    <div
      {...rest}
      ref={(element) => callRef(local.ref, element)}
      id={state.itemId(item().value)}
      role="option"
      tabIndex={-1}
      data-slot="item"
      aria-selected={selected() ? 'true' : 'false'}
      aria-disabled={disabled() || undefined}
      data-selected={selected() ? '' : undefined}
      data-highlighted={highlighted() ? '' : undefined}
      data-disabled={disabled() ? '' : undefined}
      class={cn(state.styles.slot('item').class, local.class)}
      style={{
        ...state.styles.slot('item').style,
        ...(typeof local.style === 'object' ? local.style : {}),
      }}
      onPointerMove={(event) => {
        callHandler(event, local.onPointerMove)
        if (
          !event.defaultPrevented &&
          event.pointerType === 'mouse' &&
          !disabled() &&
          !state.locked()
        ) {
          state.setHighlight(itemKey(item().value))
        }
      }}
      onPointerDown={(event) => {
        callHandler(event, local.onPointerDown)
        if (
          !event.defaultPrevented &&
          event.pointerType !== 'touch' &&
          event.pointerType !== 'pen'
        ) {
          event.preventDefault()
        }
      }}
      onClick={(event) => {
        callHandler(event, local.onClick)
        if (!event.defaultPrevented && !disabled() && !state.locked()) {
          state.setHighlight(itemKey(item().value))
          state.select(item())
        }
      }}
    >
      {typeof children() === 'function'
        ? (children() as (state: BaseSelectT.ItemState<T>) => JSX.Element)(presentation)
        : ((children() as JSX.Element) ?? item().label)}
    </div>
  )
}
const GroupContext = createContext<{
  labelId: Accessor<string | undefined>
  setLabelId: (id: string | undefined) => void
}>()
function BaseSelectGroup(props: BaseSelectT.PartProps): JSX.Element {
  const state = useSelectState()
  const cn = useCn()
  const [labelId, setLabelId] = createSignal<string>()
  return (
    <GroupContext.Provider value={{ labelId, setLabelId }}>
      <div
        {...props}
        role="group"
        aria-labelledby={labelId() ?? props['aria-labelledby']}
        data-slot="group"
        class={cn(state.styles.slot('group').class, props.class)}
        style={{
          ...state.styles.slot('group').style,
          ...(typeof props.style === 'object' ? props.style : {}),
        }}
      >
        {props.children}
      </div>
    </GroupContext.Provider>
  )
}
function BaseSelectGroupLabel(props: BaseSelectT.PartProps): JSX.Element {
  const state = useSelectState()
  const cn = useCn()
  const group = useContext(GroupContext)
  const id = useId(() => props.id, 'base-select-group-label')
  createEffect(
    on(id, (value) => {
      group?.setLabelId(value)
      onCleanup(() => group?.setLabelId(undefined))
    }),
  )
  return (
    <div
      {...props}
      id={id()}
      data-slot="groupLabel"
      class={cn(state.styles.slot('groupLabel').class, props.class)}
      style={{
        ...state.styles.slot('groupLabel').style,
        ...(typeof props.style === 'object' ? props.style : {}),
      }}
    >
      {props.children}
    </div>
  )
}
function BaseSelectSeparator(props: BaseSelectT.PartProps): JSX.Element {
  const state = useSelectState()
  const cn = useCn()
  return (
    <div
      {...props}
      role="presentation"
      aria-hidden="true"
      data-slot="separator"
      class={cn(state.styles.slot('separator').class, props.class)}
      style={{
        ...state.styles.slot('separator').style,
        ...(typeof props.style === 'object' ? props.style : {}),
      }}
    />
  )
}
function BaseSelectEmpty(props: BaseSelectT.PartProps): JSX.Element {
  const state = useSelectState()
  const cn = useCn()
  return (
    <Show when={state.visibleItems().length === 0}>
      <div
        {...props}
        data-slot="empty"
        class={cn(state.styles.slot('empty').class, props.class)}
        style={{
          ...state.styles.slot('empty').style,
          ...(typeof props.style === 'object' ? props.style : {}),
        }}
      >
        {props.children}
      </div>
    </Show>
  )
}
BaseSelect.Trigger = BaseSelectTrigger
BaseSelect.Content = BaseSelectContent
BaseSelect.Listbox = BaseSelectListbox
BaseSelect.Item = BaseSelectItem
BaseSelect.Group = BaseSelectGroup
BaseSelect.GroupLabel = BaseSelectGroupLabel
BaseSelect.Separator = BaseSelectSeparator
BaseSelect.Empty = BaseSelectEmpty
