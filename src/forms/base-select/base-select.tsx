import type { Accessor, JSX } from 'solid-js'
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
import { useCn } from '../../provider/cn-context.ts'
import { createStyles } from '../../provider/create-styles.ts'
import { HiddenInput } from '../../shared/hidden-input.tsx'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { createTypeahead } from '../../shared/typeahead.ts'
import type { ValidComponent } from '../../shared/types.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField } from '../field/field-context.ts'
import {
  diagnoseDuplicateItems,
  labelString,
  normalizeSelection,
  sameValue,
  selectionEqual,
} from '../shared/select/collection.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectProps, BaseSelectT } from './base-select.types.ts'

function selectionToFormValue<T extends BaseSelectT.Value>(
  values: readonly T[],
  multiple: boolean,
): T[] | T | null {
  return multiple ? [...values] : (values[0] ?? null)
}

function createSelectState<T extends BaseSelectT.Item>(props: BaseSelectProps<T>) {
  type Value = readonly T['value'][]
  const normalize = (values: Value): T['value'][] =>
    normalizeSelection(values, props.multiple === true)
  const id = useId(() => props.id, 'select')
  const initial = untrack(() => normalize(props.defaultValue ?? []))
  const field = useFormField(
    () => props,
    () => ({
      defaultId: id(),
      initialValue: selectionToFormValue(initial, props.multiple === true),
    }),
  )
  const items = () => props.items ?? []
  const itemByValue = createMemo(() => {
    const byValue = new Map<T['value'], T>()
    for (const item of items()) {
      if (!byValue.has(item.value)) {
        byValue.set(item.value, item)
      }
    }
    return byValue
  })
  createEffect(on(items, diagnoseDuplicateItems))
  const [selection, setSelection] = useControllableValue<Value>({
    value: () => {
      if (props.value !== undefined) {
        return props.value
      }
      const value = field.value()
      if (props.multiple && Array.isArray(value)) {
        return value
      }
      if (!props.multiple && value === null) {
        return []
      }
      if (!props.multiple && (typeof value === 'string' || typeof value === 'number')) {
        if (value === '' && !itemByValue().has(value)) {
          return []
        }
        return [value]
      }
      return undefined
    },
    defaultValue: () => initial,
  })
  const value = createMemo(() => normalize(selection()))
  const itemDisabled = (item: T) => {
    const canonical = itemByValue().get(item.value) ?? item
    return Boolean(canonical.disabled || props.isItemDisabled?.(canonical, value()))
  }
  const [open, setOpenValue] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const [highlightedValue, setHighlightedValue] = createSignal<T['value']>()
  const [anchor, setAnchor] = createSignal<HTMLElement>()
  const [focusOwner, setFocusOwner] = createSignal<HTMLElement>()
  const listboxId = () => `${field.id()}-listbox`
  const itemId = (value: BaseSelectT.Value) =>
    `${listboxId()}-${encodeURIComponent(`${typeof value}:${String(value)}`)}`
  const styles = createStyles(baseSelectRecipe, props, {
    rootSlot: 'control',
    inheritedVariants: () => ({ size: field.size() ?? undefined }),
  })
  const locked = () => field.disabled() || field.readOnly()
  let formInput: HTMLInputElement | undefined
  let externalFormControl: HTMLInputElement | undefined
  let formControlClaims = 0
  const [usesExternalFormControl, setUsesExternalFormControl] = createSignal(false)

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
      field.setFormValue(selectionToFormValue(after, props.multiple === true))
    }
    props.onChange?.(after)
    if (props.value !== undefined) {
      field.setFormValue(selectionToFormValue(normalize(props.value), props.multiple === true))
    }
    field.emit('change')
    field.emit('input')
  }
  function select(item: T) {
    if (locked() || itemDisabled(item)) {
      return
    }
    if (!itemByValue().has(item.value)) {
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
      const target = focusOwner()
      // oxlint-disable-next-line subf/solid-reactivity -- Delayed focus validates the current control and open state.
      queueMicrotask(() => {
        if (!open() && target === focusOwner() && target?.isConnected) {
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
      if (items.length === 0) {
        setHighlightedValue(undefined)
        return
      }
      const current = items.findIndex((item) => sameValue(item.value, highlightedValue()))
      const shouldLoop = props.loop ?? true
      const nextIndex = current + (key === 'ArrowUp' ? -1 : 1)
      const index =
        key === 'Home'
          ? 0
          : key === 'End'
            ? items.length - 1
            : current < 0
              ? key === 'ArrowUp'
                ? shouldLoop
                  ? items.length - 1
                  : 0
                : 0
              : shouldLoop
                ? (nextIndex + items.length) % items.length
                : Math.max(0, Math.min(items.length - 1, nextIndex))
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
        const projected = selectionToFormValue(current, props.multiple === true)
        if (props.multiple) {
          if (!Array.isArray(formValue) || !selectionEqual(current, formValue as T['value'][])) {
            field.setFormValue(projected)
          }
        } else if (projected !== formValue) {
          field.setFormValue(projected)
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
    if (!selected.length) {
      return []
    }
    return selected.flatMap((value) => {
      const serialized = props.serializeValue
        ? props.serializeValue(value)
        : itemByValue().get(value)?.disabled
          ? undefined
          : String(value)
      return serialized === undefined ? [] : [serialized]
    })
  })
  const hasSelection = () => value().length > 0
  const primarySerializedValue = () => serialized()[0] ?? ''

  function syncExternalFormControlValidity(required: boolean, selected: boolean): void {
    if (!externalFormControl) {
      return
    }
    const missing = required && !selected
    externalFormControl.required = missing
    externalFormControl.setCustomValidity(missing ? 'Please select an option.' : '')
  }

  function claimFormControl(): VoidFunction {
    if (props.multiple) {
      return () => {}
    }
    formControlClaims += 1
    if (formControlClaims === 1) {
      setUsesExternalFormControl(true)
    }
    return () => {
      formControlClaims -= 1
      if (formControlClaims === 0) {
        setUsesExternalFormControl(false)
      }
    }
  }

  function registerFormControl(element: HTMLInputElement): VoidFunction {
    if (props.multiple) {
      return () => {}
    }
    externalFormControl = element
    untrack(() => syncExternalFormControlValidity(field.required(), hasSelection()))

    const form = element.form
    const onFormData = (event: Event) => {
      const name = field.name()
      if (!name || field.disabled()) {
        return
      }
      const formData = (event as FormDataEvent).formData
      for (const current of serialized()) {
        formData.append(name, current)
      }
    }
    form?.addEventListener('formdata', onFormData)

    return () => {
      form?.removeEventListener('formdata', onFormData)
      element.required = false
      element.setCustomValidity('')
      if (externalFormControl === element) {
        externalFormControl = undefined
      }
    }
  }

  createEffect(
    on([field.required, value], ([required, selected]) => {
      syncExternalFormControlValidity(required, selected.length > 0)
    }),
  )

  useFormReset(
    () => externalFormControl?.form ?? formInput?.form,
    () => {
      discardComposition()
      setSelection(initial)
      const next = props.value !== undefined ? normalize(props.value) : initial
      field.setFormValue(selectionToFormValue(next, props.multiple === true))
      if (formInput) {
        formInput.checked = next.length > 0
        formInput.value = primarySerializedValue()
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
    focusOwner,
    setFocusOwner,
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
    claimFormControl,
    registerFormControl,
    formControls: () => (
      <Show when={!usesExternalFormControl()}>
        <HiddenInput
          ref={(element) => {
            formInput = element
          }}
          type="checkbox"
          aria-hidden="true"
          autocomplete="off"
          disabled={field.disabled()}
          required={field.required()}
          tabIndex={-1}
          checked={hasSelection()}
          name={serialized().length > 0 ? field.name() : undefined}
          value={primarySerializedValue()}
          onInput={(event) => {
            event.currentTarget.checked = hasSelection()
            event.currentTarget.value = primarySerializedValue()
          }}
          onChange={(event) => {
            event.currentTarget.checked = hasSelection()
            event.currentTarget.value = primarySerializedValue()
          }}
          onInvalid={(event) => {
            event.preventDefault()
            focusOwner()?.focus()
          }}
        />
        <For each={serialized().slice(1)}>
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
      </Show>
    ),
  }
}

type SelectState<T extends BaseSelectT.Item> = ReturnType<typeof createSelectState<T>>
const SelectContext = createContext<SelectState<BaseSelectT.Item>>()
/** Accesses BaseSelect state when composing custom controls. */
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
      {props.children}
      {state.formControls()}
    </SelectContext.Provider>
  )
}

function BaseSelectControl(props: BaseSelectT.ControlProps): JSX.Element {
  const state = useSelectState()
  const cn = useCn()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'ref'])
  return (
    <div
      {...rest}
      data-slot="control"
      data-disabled={state.field.disabled() ? '' : undefined}
      data-readonly={state.field.readOnly() ? '' : undefined}
      data-required={state.field.required() ? '' : undefined}
      data-invalid={state.field.invalid() ? '' : undefined}
      ref={(element) => {
        state.setAnchor(element)
        callRef(local.ref, element)
        onCleanup(() => {
          if (state.anchor() === element) {
            state.setAnchor(undefined)
          }
        })
      }}
      class={cn(state.styles.styles.control.class, local.class)}
      style={{
        ...state.styles.styles.control.style,
        ...local.style,
      }}
    >
      {local.children}
    </div>
  )
}

function BaseSelectTrigger<
  T extends ValidComponent = 'button',
  TItem extends BaseSelectT.Item = BaseSelectT.Item,
>(props: BaseSelectT.TriggerProps<T, TItem>): JSX.Element {
  const state = useSelectState<TItem>()
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'style',
    'disabled',
    'onPointerDown',
    'onKeyDown',
    'onFocus',
    'onBlur',
    'ref' as any,
  ])
  const resolvedChildren = resolveChildren(() =>
    renderComponentOrElement(local.children, state.presentation),
  )
  const tag = () => local.as ?? 'button'
  const eventProps = mergeProps(rest, {
    onPointerDown(event: PointerEvent) {
      callHandler(event, local.onPointerDown)
      if (
        !event.defaultPrevented &&
        !state.field.disabled() &&
        event.pointerType !== 'touch' &&
        event.pointerType !== 'pen'
      ) {
        event.preventDefault()
        state.focusOwner()?.focus()
      }
    },
    onKeyDown(event: KeyboardEvent) {
      callHandler(event, local.onKeyDown)
      state.keyDown(event)
    },
    onFocus(event: FocusEvent) {
      callHandler(event, local.onFocus)
      if (!event.defaultPrevented) {
        state.field.emit('focus', event)
      }
    },
    onBlur(event: FocusEvent) {
      callHandler(event, local.onBlur)
      if (!event.defaultPrevented) {
        state.field.emit('blur', event)
      }
    },
  })
  const binding = useButtonInteraction(
    {
      tag,
      disabledForComponent: true,
      disabled: () => state.field.disabled() || Boolean(local.disabled),
      element: state.focusOwner,
      onPress: () => {
        state.focusOwner()?.focus()
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
      data-slot="trigger"
      data-invalid={state.field.invalid() ? '' : undefined}
      aria-haspopup="listbox"
      aria-controls={state.listboxId()}
      aria-expanded={state.open() ? 'true' : 'false'}
      aria-activedescendant={
        state.open() && state.highlightedValue() !== undefined
          ? state.itemId(state.highlightedValue()!)
          : undefined
      }
      class={cn(state.styles.styles.trigger.class, local.class)}
      style={{
        ...state.styles.styles.trigger.style,
        ...local.style,
      }}
      ref={(element: HTMLElement) => {
        state.setFocusOwner(element)
        state.field.setControlRef(element)
        callRef(local.ref, element)
        onCleanup(() => {
          if (state.focusOwner() === element) {
            state.setFocusOwner(undefined)
            state.field.setControlRef(undefined)
          }
          callRef(local.ref, undefined)
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
    onExitComplete: () => {
      state.setHighlightedValue(undefined)
      local.onExitComplete?.()
    },
  })
  const [content, setContent] = createSignal<HTMLDivElement>()
  const [positioner, setPositioner] = createSignal<HTMLDivElement>()
  const [side, setSide] = createSignal('bottom')
  useFloatingPosition({
    contentElement: content,
    floatingElement: positioner,
    getReferenceElement: () => state.anchor() ?? state.focusOwner(),
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
        onCleanup(acquireBodyScrollLock(state.anchor() ?? state.focusOwner()))
      } else {
        presence.setElement(undefined)
      }
    }),
  )
  useOverlayInteraction({
    containsTarget: (node) =>
      Boolean(
        state.anchor()?.contains(node) ||
        state.focusOwner()?.contains(node) ||
        positioner()?.contains(node),
      ),
    onPointerOutside: (event) => {
      if (state.open() && !event.defaultPrevented) {
        state.setOpen(false)
      }
    },
    onFocusOutside: (event) => {
      if (state.open() && !event.defaultPrevented) {
        state.setOpen(false)
      }
    },
    onEscape: (event) => {
      if (state.open() && !event.defaultPrevented) {
        event.preventDefault()
        state.setOpen(false)
      }
    },
    contentElement: content,
    enabled: presence.present,
    requireContent: true,
    triggerElement: () => state.anchor() ?? state.focusOwner(),
  })
  return (
    <Show when={presence.present()}>
      <Portal mount={(state.anchor() ?? state.focusOwner())?.ownerDocument.body}>
        <div data-slot="positioner" ref={setPositioner}>
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
            class={cn(state.styles.styles.content.class, local.class)}
            style={{
              ...state.styles.styles.content.style,
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
      aria-readonly={state.field.readOnly() || undefined}
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
      class={cn(state.styles.styles.listbox.class, local.class)}
      style={{
        ...state.styles.styles.listbox.style,
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
  const resolvedChildren = resolveChildren(() => {
    const children = local.children
    if (children === undefined) {
      return item().label
    }
    return renderComponentOrElement(children, presentation)
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
      class={cn(state.styles.styles.item.class, local.class)}
      style={{
        ...state.styles.styles.item.style,
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
        class={cn(state.styles.styles.group.class, props.class)}
        style={{
          ...state.styles.styles.group.style,
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
      class={cn(state.styles.styles.groupLabel.class, props.class)}
      style={{
        ...state.styles.styles.groupLabel.style,
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
      class={cn(state.styles.styles.separator.class, props.class)}
      style={{
        ...state.styles.styles.separator.style,
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
        class={cn(state.styles.styles.empty.class, props.class)}
        style={{
          ...state.styles.styles.empty.style,
          ...props.style,
        }}
      >
        {props.children}
      </div>
    </Show>
  )
}
BaseSelect.Control = BaseSelectControl
BaseSelect.Trigger = BaseSelectTrigger
BaseSelect.Content = BaseSelectContent
BaseSelect.Listbox = BaseSelectListbox
BaseSelect.Item = BaseSelectItem
BaseSelect.Group = BaseSelectGroup
BaseSelect.GroupLabel = BaseSelectGroupLabel
BaseSelect.Separator = BaseSelectSeparator
BaseSelect.Empty = BaseSelectEmpty
