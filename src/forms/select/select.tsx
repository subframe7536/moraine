import type { JSX } from 'solid-js'
import { mergeProps, splitProps, createMemo, Show } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callRef } from '../../shared/utils.ts'
import { useFormFieldContext } from '../form/form-context.ts'

import { BaseSelect, useSelectState } from './base-select.tsx'
import type { SelectProps, SelectT } from './select.types.ts'
import { DefaultSelectContent } from './shared/default-content.tsx'
import { useSelectSearch } from './shared/search.ts'

/** Single selection with optional search and standard item presentation. */
export function Select<V extends SelectT.Value = SelectT.Value>(
  incoming: SelectProps<V>,
): JSX.Element {
  const [, remainingProps] = splitProps(incoming, [
    'itemRender',
    'emptyRender',
    'leadingIcon',
    'loadingIcon',
    'trailingIcon',
    'closeIcon',
  ])
  const itemRender = createMemo(() => incoming.itemRender)
  const emptyRender = createMemo(() => incoming.emptyRender)
  const leadingIcon = createMemo(() => incoming.leadingIcon)
  const loadingIcon = createMemo(() => incoming.loadingIcon)
  const trailingIcon = createMemo(() => incoming.trailingIcon)
  const closeIcon = createMemo(() => incoming.closeIcon)
  const props = mergeProps(remainingProps, {
    get itemRender() {
      return itemRender()
    },
    get emptyRender() {
      return emptyRender()
    },
    get leadingIcon() {
      return leadingIcon()
    },
    get loadingIcon() {
      return loadingIcon()
    },
    get trailingIcon() {
      return trailingIcon()
    },
    get closeIcon() {
      return closeIcon()
    },
  })
  const [, rootAttrs] = splitProps(props, [
    'items',
    'itemToLabelString',
    'id',
    'name',
    'required',
    'disabled',
    'readOnly',
    'value',
    'defaultValue',
    'onChange',
    'open',
    'defaultOpen',
    'onOpenChange',
    'closeOnSelect',
    'classes',
    'styles',
    'class',
    'style',
    'size',
    'variant',
    'search',
    'searchValue',
    'defaultSearchValue',
    'onSearch',
    'searchMaxLength',
    'filterItem',
    'itemRender',
    'itemProps',
    'listboxProps',
    'virtualRender',
    'scrollToItem',
    'onScrollBottom',
    'scrollBottomThreshold',
    'gutter',
    'overflowPadding',
    'emptyRender',
    'placeholder',
    'allowClear',
    'onClear',
    'loading',
    'leadingIcon',
    'loadingIcon',
    'trailingIcon',
    'closeIcon',
    'ref',
    'inputRef',
  ])
  const sharedSlots = [
    'content',
    'listbox',
    'item',
    'group',
    'groupLabel',
    'separator',
    'empty',
  ] as const
  const field = useFormFieldContext()
  const styles = createComponentStyles('select', props, {
    inheritedVariants: () => ({ size: field?.size }),
  })
  function Control(): JSX.Element {
    const state = useSelectState<SelectT.Item<V>>()
    const searchable = () => Boolean(styles.variants.search)
    const search = useSelectSearch(props, searchable)
    const hasValue = () => state.value() !== null
    const label = () =>
      state.selectedItems()[0]?.label ?? (hasValue() ? String(state.value()) : props.placeholder)
    const clear = () => {
      if (state.locked()) {
        return
      }
      state.change(null)
      search.setQuery('')
      props.onClear?.()
    }
    const actionLoading = createMemo(() => Boolean(props.loading))
    const contents = () => (
      <>
        <Show when={props.leadingIcon}>
          {(icon) => <Icon name={icon()} slotName="leading" {...styles.slot('leading')} />}
        </Show>
        <Show
          when={searchable()}
          fallback={
            <span
              data-slot="input"
              data-placeholder={!hasValue() ? '' : undefined}
              {...styles.slot('input')}
            >
              {label()}
            </span>
          }
        >
          <input
            {...search.binding}
            {...state.field.ariaAttrs()}
            data-slot="input"
            {...styles.slot('input')}
            placeholder={props.placeholder}
            ref={(element) => {
              search.binding.ref(element)
              callRef(props.inputRef, element)
            }}
          />
        </Show>
        <Show
          when={!actionLoading() && props.allowClear && hasValue()}
          fallback={
            <Icon
              name={
                actionLoading()
                  ? (props.loadingIcon ?? 'icon-loading')
                  : (props.trailingIcon ?? 'icon-chevron-down')
              }
              slotName="trigger"
              data-loading={actionLoading() ? '' : undefined}
              {...styles.slot('trigger')}
            />
          }
        >
          <button
            type="button"
            data-slot="clear"
            aria-label="Clear selection"
            tabIndex={-1}
            {...styles.slot('clear')}
            disabled={state.locked()}
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              state.control()?.focus()
            }}
            onClick={(event) => {
              event.stopPropagation()
              clear()
            }}
          >
            <Icon name={props.closeIcon ?? 'icon-close'} />
          </button>
        </Show>
      </>
    )
    return (
      <>
        <Show
          when={searchable()}
          fallback={
            <BaseSelect.Trigger
              as="div"
              data-slot="control"
              {...styles.slot('control')}
              data-disabled={state.field.disabled() ? '' : undefined}
              data-readonly={state.field.readOnly() ? '' : undefined}
              data-required={state.field.required() ? '' : undefined}
              data-invalid={state.field.invalid() ? '' : undefined}
            >
              {contents()}
            </BaseSelect.Trigger>
          }
        >
          <div
            data-slot="control"
            {...styles.slot('control')}
            data-disabled={state.field.disabled() ? '' : undefined}
            data-readonly={state.field.readOnly() ? '' : undefined}
            data-required={state.field.required() ? '' : undefined}
            data-invalid={state.field.invalid() ? '' : undefined}
            ref={state.setAnchor}
            onPointerDown={(event: PointerEvent) => {
              if (
                !(event.target instanceof HTMLInputElement) &&
                event.pointerType !== 'touch' &&
                event.pointerType !== 'pen'
              ) {
                event.preventDefault()
                state.control()?.focus()
              }
            }}
            onClick={(event: MouseEvent) => {
              if (event.target instanceof HTMLInputElement) {
                state.setOpen(true)
                return
              }
              state.setOpen(!state.open())
            }}
          >
            {contents()}
          </div>
        </Show>
        <DefaultSelectContent
          {...props}
          slot={styles.slot}
          empty={
            props.emptyRender !== undefined
              ? renderComponentOrElement(props.emptyRender, {
                  get inputValue() {
                    return search.query()
                  },
                  get hasMatches() {
                    return state.visibleItems().length > 0
                  },
                  get selectedValue() {
                    return state.value() as V | null
                  },
                  close: () => state.setOpen(false),
                })
              : 'No items'
          }
        />
      </>
    )
  }
  return (
    <div
      {...rootAttrs}
      ref={props.ref}
      data-slot="root"
      data-disabled={(props.disabled ?? field?.disabled) ? '' : undefined}
      data-readonly={(props.readOnly ?? field?.readOnly) ? '' : undefined}
      data-required={(props.required ?? field?.required) ? '' : undefined}
      {...styles.root}
    >
      <BaseSelect<SelectT.Item<V>>
        {...props}
        multiple={false}
        size={styles.variants.size ?? undefined}
        classes={Object.fromEntries(sharedSlots.map((slot) => [slot, styles.slot(slot).class]))}
        styles={Object.fromEntries(sharedSlots.map((slot) => [slot, styles.slot(slot).style]))}
      >
        <Control />
      </BaseSelect>
    </div>
  )
}
