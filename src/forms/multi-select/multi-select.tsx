import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callHandler, callRef } from '../../shared/utils.ts'
import { BaseSelect, useSelectState } from '../base-select/base-select.tsx'
import { useBaseSelectSearchInput } from '../base-select/utils.ts'
import { useFormFieldContext } from '../form/form-context.ts'
import { createSource, labelString, sameValue } from '../shared/select/collection.ts'
import { DefaultSelectContent } from '../shared/select/default-content.tsx'
import {
  BASE_SELECT_FORWARD_PROP_KEYS,
  BASE_SELECT_SHARED_SLOTS,
  MULTI_SELECT_LOCAL_PROP_KEYS,
} from '../shared/select/props.ts'
import { useComboboxSearch } from '../shared/select/search.ts'
import { SELECT_LOADING_ICON_CLASS } from '../shared/select/select-field.class.ts'
import { createTagsField } from '../shared/select/tags-field.ts'

import type { MultiSelectProps, MultiSelectT } from './multi-select.types.ts'

/** Collection-backed multiple selection with tags and optional search or creation. */
export function MultiSelect<T extends MultiSelectT.Item = MultiSelectT.Item>(
  props: MultiSelectProps<T>,
): JSX.Element {
  type Value = T['value']
  const [local, baseSelectProps, rootProps] = splitProps(
    props,
    MULTI_SELECT_LOCAL_PROP_KEYS,
    BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const field = useFormFieldContext()
  const styles = createComponentStyles('multiSelect', props, {
    rootSlot: 'control',
    inheritedVariants: () => ({ size: field?.size }),
  })
  const sharedClasses = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).class])),
  )
  const sharedStyles = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).style])),
  )
  const [created, setCreated] = createSignal<T[]>([])
  const source = createMemo(() => createSource(local.items ?? [], created()))
  const editable = () => local.search === true || local.createItem !== undefined
  const search = useComboboxSearch(
    local,
    editable,
    () => source(),
    () => baseSelectProps.itemToLabelString,
  )

  function Control(): JSX.Element {
    const state = useSelectState<T>()
    const inputBinding = useBaseSelectSearchInput(state, local, editable, search, () =>
      editable() ? search.query() : '',
    )
    const atMax = () => local.maxCount !== undefined && state.value().length >= local.maxCount
    const tags = createTagsField<Value>({
      values: state.value,
      change: state.change,
      getInput: () => state.focusOwner() as HTMLInputElement | undefined,
      maxVisible: () => local.maxTagCount,
      resolve: (value) => {
        const item = source().byValue.get(value)
        const label = item?.label ?? String(value)
        return {
          value,
          item,
          label,
          title:
            item && baseSelectProps.itemToLabelString
              ? baseSelectProps.itemToLabelString(item)
              : typeof label === 'string'
                ? label
                : String(value),
          removable: !state.locked() && (!item || !state.itemDisabled(item)),
        }
      },
    })

    function focusInput(): void {
      state.focusOwner()?.focus()
    }
    function clear(): void {
      if (state.locked()) {
        return
      }
      inputBinding.discardComposition()
      state.change([])
      search.setQuery('')
      local.onClear?.()
      focusInput()
    }
    function create(input = search.query()): boolean {
      if (state.locked()) {
        return false
      }
      const normalized = input.trim()
      if (!normalized) {
        return false
      }
      let item = source().items.find(
        (candidate) =>
          labelString(candidate, baseSelectProps.itemToLabelString).toLowerCase() ===
            normalized.toLowerCase() ||
          String(candidate.value).toLowerCase() === normalized.toLowerCase(),
      )
      if (item && state.value().some((value) => sameValue(value, item!.value))) {
        search.setQuery('')
        return true
      }
      if (
        atMax() ||
        (item && (item.disabled || baseSelectProps.isItemDisabled?.(item, state.value()) === true))
      ) {
        return false
      }
      if (!item) {
        if (!local.createItem) {
          return false
        }
        const candidate = local.createItem(normalized)
        if (
          !candidate ||
          (typeof candidate.value !== 'string' && typeof candidate.value !== 'number')
        ) {
          return false
        }
        item = source().byValue.get(candidate.value) ?? candidate
        if (item.disabled || baseSelectProps.isItemDisabled?.(item, state.value()) === true) {
          return false
        }
        if (!source().byValue.has(item.value)) {
          const createdItem = item
          setCreated((previous) =>
            previous.some((entry) => sameValue(entry.value, createdItem.value))
              ? previous
              : [...previous, createdItem],
          )
        }
      }
      if (!state.value().some((value) => sameValue(value, item.value))) {
        state.change([...state.value(), item.value])
      }
      search.setQuery('')
      return true
    }

    return (
      <>
        <BaseSelect.Control
          {...rootProps}
          {...styles.slot('control')}
          data-tags={tags.tags().length ? '' : undefined}
          data-editable={editable() ? '' : undefined}
          data-disabled={state.field.disabled() ? '' : undefined}
          data-readonly={state.field.readOnly() ? '' : undefined}
          data-required={state.field.required() ? '' : undefined}
          data-invalid={state.field.invalid() ? '' : undefined}
          ref={(element) => callRef(local.ref, element)}
          onPointerDown={(event) => {
            callHandler(event, rootProps.onPointerDown)
            if (
              !event.defaultPrevented &&
              event.target !== state.focusOwner() &&
              event.pointerType !== 'touch' &&
              event.pointerType !== 'pen'
            ) {
              event.preventDefault()
              if (editable()) {
                focusInput()
              }
            }
          }}
          onClick={(event) => {
            callHandler(event, rootProps.onClick)
            if (!event.defaultPrevented && (local.openOnControlClick ?? false)) {
              focusInput()
              state.setOpen(true)
            }
          }}
        >
          <Show when={local.leadingIcon}>
            {(icon) => <Icon name={icon()} slotName="leading" {...styles.slot('leading')} />}
          </Show>
          <div data-slot="tagsContainer" {...styles.slot('tagsContainer')}>
            <For each={tags.visible()}>
              {(tag, index) => (
                <Show
                  when={local.tagRender !== undefined}
                  fallback={
                    <span title={tag.title} data-slot="tag" {...styles.slot('tag')}>
                      <span title={tag.title} data-slot="tagLabel" {...styles.slot('tagLabel')}>
                        {tag.label}
                      </span>
                      <button
                        type="button"
                        data-slot="tagRemove"
                        aria-label={`Remove ${tag.title}`}
                        tabIndex={-1}
                        disabled={!tag.removable}
                        {...styles.slot('tagRemove')}
                        ref={(element) => tags.registerRemove(index(), element)}
                        onPointerDown={tags.isolatePointer}
                        onKeyDown={(event) => tags.onRemoveKeyDown(event, index())}
                        onClick={(event) => {
                          event.stopPropagation()
                          tags.remove(index())
                          focusInput()
                        }}
                      >
                        <Icon name={local.closeIcon ?? 'icon-close'} />
                      </button>
                    </span>
                  }
                >
                  {renderComponentOrElement(local.tagRender, {
                    item: source().byValue.get(tag.value),
                    value: tag.value,
                    label: tag.label,
                    onClose: () => tags.remove(index()),
                  } satisfies MultiSelectT.TagRenderProps<T>)}
                </Show>
              )}
            </For>
            <Show when={tags.overflow() > 0}>
              <span data-slot="tagOverflow" {...styles.slot('tagOverflow')}>
                +{tags.overflow()}
              </span>
            </Show>
            <input
              {...inputBinding.binding}
              {...state.field.ariaAttrs()}
              data-slot="input"
              {...styles.slot('input')}
              placeholder={tags.tags().length ? '' : local.placeholder}
              ref={(element) => {
                inputBinding.binding.ref(element)
                callRef(local.inputRef, element)
              }}
              onKeyDown={(event) => {
                if (inputBinding.composing() || event.isComposing || state.locked()) {
                  return
                }
                if (tags.onInputKeyDown(event, search.query())) {
                  return
                }
                if (event.key === 'Enter' && state.open()) {
                  const highlighted = state
                    .items()
                    .find((item) => sameValue(item.value, state.highlightedValue()))
                  if (highlighted && !state.itemDisabled(highlighted)) {
                    inputBinding.binding.onKeyDown(event)
                    return
                  }
                  if (editable() && local.createItem && search.query()) {
                    event.preventDefault()
                    create()
                    return
                  }
                }
                inputBinding.binding.onKeyDown(event)
              }}
            />
          </div>
          <Show when={local.allowClear && (tags.tags().length > 0 || Boolean(search.query()))}>
            <button
              type="button"
              tabIndex={-1}
              data-slot="clear"
              aria-label="Clear selection"
              disabled={state.locked()}
              {...styles.slot('clear')}
              onPointerDown={tags.isolatePointer}
              onClick={(event) => {
                event.stopPropagation()
                clear()
              }}
            >
              <Icon name={local.closeIcon ?? 'icon-close'} />
            </button>
          </Show>
          <button
            type="button"
            tabIndex={-1}
            data-slot="trigger"
            aria-label={local.loading ? 'Loading' : 'Toggle options'}
            aria-controls={state.listboxId()}
            aria-expanded={state.open() ? 'true' : 'false'}
            aria-busy={local.loading ? 'true' : undefined}
            data-loading={local.loading ? '' : undefined}
            disabled={state.field.disabled() || Boolean(local.loading)}
            {...styles.slot('trigger')}
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (editable()) {
                focusInput()
              }
            }}
            onClick={(event) => {
              event.stopPropagation()
              state.setOpen(!state.open())
            }}
          >
            <Icon
              name={
                local.loading
                  ? (local.loadingIcon ?? 'icon-loading')
                  : (local.trailingIcon ?? 'icon-chevron-down')
              }
              data-loading={local.loading ? '' : undefined}
              class={SELECT_LOADING_ICON_CLASS}
            />
          </button>
        </BaseSelect.Control>
        <DefaultSelectContent
          view={search.view()}
          onExitComplete={() => search.setQuery('')}
          itemRender={local.itemRender}
          itemProps={local.itemProps}
          listboxProps={local.listboxProps}
          virtualRender={local.virtualRender}
          scrollToItem={local.scrollToItem}
          onScrollBottom={local.onScrollBottom}
          scrollBottomThreshold={local.scrollBottomThreshold}
          gutter={local.gutter}
          overflowPadding={local.overflowPadding}
          slot={styles.slot}
          renderEmpty={() =>
            local.emptyRender !== undefined
              ? renderComponentOrElement(local.emptyRender, {
                  get inputValue() {
                    return search.query()
                  },
                  get hasMatches() {
                    return state.items().length > 0
                  },
                  get selectedValues() {
                    return state.value()
                  },
                  get isAtMaxCount() {
                    return atMax()
                  },
                  create,
                  close: () => state.setOpen(false),
                })
              : 'No items'
          }
        />
      </>
    )
  }

  return (
    <BaseSelect<T>
      {...baseSelectProps}
      closeOnSelect={false}
      items={search.view().items}
      serializeValue={(value) =>
        source().byValue.get(value)?.disabled ? undefined : String(value)
      }
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={(values) => {
        search.setQuery('')
        local.onChange?.(values)
      }}
      onReset={() => {
        search.setQuery('')
        setCreated([])
        local.onReset?.()
      }}
      isItemDisabled={(item, values) =>
        baseSelectProps.isItemDisabled?.(item, values) === true ||
        (local.maxCount !== undefined &&
          values.length >= local.maxCount &&
          !values.some((value) => sameValue(value, item.value)))
      }
      multiple
      size={styles.variants.size ?? undefined}
      classes={sharedClasses()}
      styles={sharedStyles()}
    >
      <Control />
    </BaseSelect>
  )
}
