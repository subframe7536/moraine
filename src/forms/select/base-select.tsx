import type { Accessor, JSX, ValidComponent } from 'solid-js'
import {
  batch,
  children as resolveChildren,
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
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { createTypeahead } from '../../shared/typeahead.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { BaseSelectProps, BaseSelectT } from './base-select.types.ts'
import {
  diagnoseDuplicateItems,
  labelString,
  normalizeSelection,
  sameValue,
  selectionEqual,
} from './shared/collection.ts'

export const INTERNAL_FORM_VALUE_EXISTS = '__formValueExists' as const

type InternalBaseSelectProps<T extends BaseSelectT.Item> = BaseSelectProps<T> & {
  [INTERNAL_FORM_VALUE_EXISTS]?: (value: T['value']) => boolean
}

function createSelectState<T extends BaseSelectT.Item>(props: BaseSelectProps<T>) {
  type Value = readonly T['value'][]
  const internalProps = props as InternalBaseSelectProps<T>
  const normalize = (values: Value): T['value'][] =>
    normalizeSelection(values, props.multiple === true)
  const id = useId(() => props.id, 'select')
  const initial = untrack(() => normalize(props.defaultValue ?? []))
  const field = useFormField(
    () => props,
    () => ({
      defaultId: id(),
      bind: false,
      initialValue: props.multiple ? initial : (initial[0] ?? ''),
    }),
  )
  const items = () => props.items ?? []
  const formValueExists = (value: T['value']) =>
    internalProps[INTERNAL_FORM_VALUE_EXISTS]?.(value) ??
    items().some((item) => sameValue(item.value, value))
  createEffect(on(items, diagnoseDuplicateItems))
  const [selection, setSelection] = useControllableValue<Value>({
    value: () => {
      if (props.value !== undefined) {
        return props.value
      }
      const value = field.value()
      if (Array.isArray(value)) {
        return value
      }
      if (!props.multiple && (typeof value === 'string' || typeof value === 'number')) {
        return value === '' && !formValueExists(value) ? [] : [value]
      }
      return undefined
    },
    defaultValue: () => initial,
  })
  const value = createMemo(() => normalize(selection() ?? []))
  const itemDisabled = (item: T) => Boolean(item.disabled || props.isItemDisabled?.(item, value()))
  const [openValue, setOpenValue] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const open = () => openValue() ?? false
  const [highlightedValue, setHighlightedValue] = createSignal<T['value']>()
  const [anchor, setAnchor] = createSignal<HTMLElement>()
  const [control, setControl] = createSignal<HTMLElement>()
  const listboxId = () => `${field.id()}-listbox`
  const itemId = (value: BaseSelectT.Value) =>
    `${listboxId()}-${encodeURIComponent(`${typeof value}:${String(value)}`)}`
  const styles = createComponentStyles('baseSelect', props, {
    inheritedVariants: () => ({ size: field.size() ?? undefined }),
  })
  const locked = () => field.disabled() || field.readOnly()
  let validationInput: HTMLInputElement | undefined

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
    const before = value()
    const after = normalize(next)
    if (selectionEqual(before, after)) {
      return
    }
    setSelection(after)
    if (props.value === undefined) {
      field.setFormValue(props.multiple ? after : (after[0] ?? ''))
    }
    props.onChange?.(after)
    if (props.value !== undefined) {
      field.setFormValue(props.multiple ? normalize(props.value) : (props.value[0] ?? ''))
    }
    field.emit('change')
    field.emit('input')
  }
  function select(item: T) {
    if (locked() || itemDisabled(item)) {
      return
    }
    if (!items().some((candidate) => sameValue(candidate.value, item.value))) {
      return
    }
    discardComposition()
    batch(() => {
      if (props.closeOnSelect ?? !props.multiple) {
        setOpen(false)
      }
      change(
        props.multiple
          ? value().includes(item.value)
            ? value().filter((value) => !sameValue(value, item.value))
            : [...value(), item.value]
          : [item.value],
      )
    })
    if (props.closeOnSelect ?? !props.multiple) {
      const target = control()
      // oxlint-disable-next-line subf/solid-reactivity -- Delayed focus validates the current control and open state.
      queueMicrotask(() => {
        if (!open() && target === control() && target?.isConnected) {
          target.focus()
        }
      })
    }
  }
  const enabled = createMemo(() => items().filter((item) => !itemDisabled(item)))
  createEffect(
    on([open, enabled, highlightedValue, value], ([isOpen, items, current, selected]) => {
      if (!isOpen) {
        return
      }
      if (!items.some((item) => sameValue(item.value, current) && !itemDisabled(item))) {
        const next =
          items.find((item) => !itemDisabled(item) && selected.includes(item.value)) ??
          items.find((item) => !itemDisabled(item))
        setHighlightedValue(next ? next.value : undefined)
      }
    }),
  )
  const typeahead = createTypeahead({
    getItems: items,
    getStartIndex: () =>
      items().findIndex((item) =>
        open() ? sameValue(item.value, highlightedValue()) : value().includes(item.value),
      ),
    getText: (item) => labelString(item, props.itemToLabelString),
    isDisabled: (item) => itemDisabled(item),
    onMatch: (item) => (open() ? setHighlightedValue(item.value) : select(item)),
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
      const current = items.findIndex((item) => sameValue(item.value, highlightedValue()))
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
      setHighlightedValue(items[index] ? items[index].value : undefined)
      return
    }
    if (key === 'Enter' || (!textInput && (key === ' ' || key === 'Spacebar'))) {
      event.preventDefault()
      if (!open()) {
        setOpen(true)
        return
      }
      const item = items().find((item) => sameValue(item.value, highlightedValue()))
      if (item) {
        select(item)
      }
    }
  }
  createEffect(
    on(
      [value, field.value, () => props.value !== undefined],
      ([current, formValue, controlled]) => {
        if (!controlled) {
          return
        }
        if (props.multiple) {
          if (!Array.isArray(formValue) || !selectionEqual(current, formValue as T['value'][])) {
            field.setFormValue(current)
          }
        } else if (!sameValue(current[0] ?? '', formValue as T['value'] | undefined)) {
          field.setFormValue(current[0] ?? '')
        }
      },
    ),
  )
  let compositionDiscarder: (() => void) | undefined
  function registerCompositionDiscarder(discard: () => void) {
    compositionDiscarder = discard
    onCleanup(() => {
      if (compositionDiscarder === discard) {
        compositionDiscarder = undefined
      }
    })
  }
  function discardComposition() {
    compositionDiscarder?.()
  }
  createEffect(
    on(value, (current, previous) => {
      if (previous !== undefined && !selectionEqual(current, previous)) {
        discardComposition()
      }
    }),
  )
  const serialized = createMemo(() => {
    const selected = value()
    if (!props.multiple && !selected.length) {
      return ['']
    }
    return selected.flatMap((value) => {
      const serialized = props.serializeValue
        ? props.serializeValue(value)
        : items().find((item) => sameValue(item.value, value))?.disabled
          ? undefined
          : String(value)
      return serialized === undefined ? [] : [serialized]
    })
  })
  const validationValue = () =>
    props.multiple ? (value().length ? 'selected' : '') : String(value()[0] ?? '')
  useFormReset(
    () => validationInput?.form,
    () => {
      discardComposition()
      setSelection(initial)
      const next = props.value !== undefined ? normalize(props.value) : initial
      field.setFormValue(props.multiple ? next : (next[0] ?? ''))
      if (validationInput) {
        validationInput.value = validationValue()
      }
      props.onReset?.()
    },
  )
  const presentation: BaseSelectT.TriggerState<T> = {
    get open() {
      return open()
    },
    get value() {
      return value()
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
    items,
    value,
    open,
    setOpen,
    highlightedValue,
    setHighlightedValue,
    anchor,
    setAnchor,
    control,
    setControl,
    listboxId,
    itemId,
    field,
    styles,
    locked,
    change,
    select,
    keyDown,
    presentation,
    itemDisabled,
    registerCompositionDiscarder,
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
  // Solid context erases the item generic; the root and its parts share the same T.
  return context as unknown as SelectState<T>
}

/** Public selection primitive for a flat navigation collection. */
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
  const child = resolveChildren(() => local.children)
  const resolvedChildren = createMemo(() =>
    renderComponentOrElement(
      child() as ComponentOrElement<BaseSelectT.TriggerState<TItem>>,
      state.presentation,
    ),
  )
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
        state.open() && state.highlightedValue() !== undefined
          ? state.itemId(state.highlightedValue()!)
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
      {resolvedChildren()}
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
    'onExitComplete',
  ])
  const presence = useTransitionPresence({
    open: state.open,
    onExitComplete: () => local.onExitComplete?.(),
  })
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
              presence.setElement(element)
              callRef(local.ref, element)
            }}
            class={cn(state.styles.slot('content').class, local.class)}
            style={{
              ...state.styles.slot('content').style,
              ...local.style,
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
  const [listbox, setListbox] = createSignal<HTMLDivElement>()
  createEffect(
    on([state.highlightedValue, state.open, listbox], ([key, open, element]) => {
      if (key === undefined || !open || !element) {
        return
      }
      // oxlint-disable-next-line subf/solid-reactivity -- Scroll only if the same node and highlight remain active in this microtask.
      queueMicrotask(() => {
        if (listbox() !== element || !state.open() || !sameValue(state.highlightedValue(), key)) {
          return
        }
        const item = element.ownerDocument.getElementById(state.itemId(key))
        if (item && element.contains(item)) {
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
      tabIndex={-1}
      data-slot="listbox"
      aria-multiselectable={state.props.multiple ? 'true' : undefined}
      ref={(element) => {
        setListbox(element)
        callRef(local.ref, element)
        onCleanup(() => {
          if (listbox() === element) {
            setListbox(undefined)
          }
        })
      }}
      class={cn(state.styles.slot('listbox').class, local.class)}
      style={{
        ...state.styles.slot('listbox').style,
        ...local.style,
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
  const child = resolveChildren(() => local.children as JSX.Element)
  const item = () => local.item
  const selected = () => state.value().includes(item().value)
  const highlighted = () => sameValue(state.highlightedValue(), item().value)
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
  const resolvedChildren = createMemo(() => {
    const value = child()
    if (value === undefined) {
      return item().label
    }
    return renderComponentOrElement(
      value as ComponentOrElement<BaseSelectT.ItemState<T>>,
      presentation,
    )
  })
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
        ...local.style,
      }}
      onPointerMove={(event) => {
        callHandler(event, local.onPointerMove)
        if (
          !event.defaultPrevented &&
          event.pointerType === 'mouse' &&
          !disabled() &&
          !state.locked()
        ) {
          state.setHighlightedValue(item().value)
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
          state.setHighlightedValue(item().value)
          state.select(item())
        }
      }}
    >
      {resolvedChildren()}
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
          ...props.style,
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
  const id = useId(() => props.id, 'select-group-label')
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
        ...props.style,
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
        ...props.style,
      }}
    />
  )
}
function BaseSelectEmpty(props: BaseSelectT.PartProps): JSX.Element {
  const state = useSelectState()
  const cn = useCn()
  return (
    <Show when={state.items().length === 0}>
      <div
        {...props}
        data-slot="empty"
        class={cn(state.styles.slot('empty').class, props.class)}
        style={{
          ...state.styles.slot('empty').style,
          ...props.style,
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
