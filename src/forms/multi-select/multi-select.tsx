import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callHandler, callRef } from '../../shared/utils.ts'
import { BaseSelect, useSelectState } from '../base-select/base-select.tsx'
import { useBaseSelectSearchInput } from '../base-select/utils.ts'
import { useFormFieldContext } from '../form/form-context.ts'
import {
  createSource,
  labelString,
  sameValue,
  serializeSourceValue,
} from '../shared/select/collection.ts'
import { DefaultSelectContent } from '../shared/select/default-content.tsx'
import {
  BASE_SELECT_FORWARD_PROP_KEYS,
  createBaseSelectStyleProps,
  MULTI_SELECT_LOCAL_PROP_KEYS,
} from '../shared/select/props.ts'
import { useComboboxSearch } from '../shared/select/search.ts'
import { SELECT_LOADING_ICON_CLASS } from '../shared/select/select-field.class.ts'
import { createTagsField } from '../shared/select/tags-field.tsx'

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
  const baseSelectStyles = createBaseSelectStyleProps(styles.slot)
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
    const atMax = () => local.maxCount !== undefined && state.value().length >= local.maxCount

    function resolveInputItem(input: string): T | undefined {
      const normalized = input.trim().toLowerCase()
      if (!normalized) {
        return undefined
      }
      return source().items.find(
        (candidate) =>
          labelString(candidate, baseSelectProps.itemToLabelString).toLowerCase() === normalized ||
          String(candidate.value).toLowerCase() === normalized,
      )
    }

    function commitInput(input: string): boolean {
      if (state.locked()) {
        return false
      }
      const normalized = input.trim()
      if (!normalized) {
        return false
      }
      let item = resolveInputItem(normalized)
      if (item && state.value().some((value) => sameValue(value, item!.value))) {
        return false
      }
      if (atMax() || (item && state.itemDisabled(item))) {
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
        const createdItem = source().byValue.get(candidate.value) ?? candidate
        if (state.itemDisabled(createdItem)) {
          return false
        }
        if (state.value().some((value) => sameValue(value, createdItem.value))) {
          return false
        }
        if (!source().byValue.has(createdItem.value)) {
          setCreated((previous) =>
            previous.some((entry) => sameValue(entry.value, createdItem.value))
              ? previous
              : [...previous, createdItem],
          )
        }
        item = createdItem
      }
      if (!state.value().some((value) => sameValue(value, item.value))) {
        state.change([...state.value(), item.value])
      }
      return true
    }

    function create(input = search.query()): boolean {
      const committed = commitInput(input)
      if (committed) {
        search.setQuery('')
      }
      return committed
    }

    const tags = createTagsField<Value>({
      values: state.value,
      change: state.change,
      getInput: () => state.focusOwner() as HTMLInputElement | undefined,
      maxVisible: () => local.maxTagCount,
      query: search.query,
      setQuery: search.setQuery,
      commitInput,
      tokenSeparators: () => local.tokenSeparators,
      locked: state.locked,
      slot: styles.slot,
      closeIcon: () => local.closeIcon,
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
    const inputBinding = useBaseSelectSearchInput(
      state,
      local,
      editable,
      search,
      () => (editable() ? search.query() : ''),
      tags.tokenize,
    )
    const isDuplicate = () => {
      const query = search.query().trim()
      if (!query) {
        return false
      }
      const item = resolveInputItem(query)
      if (item) {
        return state.value().some((value) => sameValue(value, item.value))
      }
      return state.value().some((value) => sameValue(value, query))
    }

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

    return (
      <>
        <BaseSelect.Control
          {...rootProps}
          {...styles.slot('control')}
          data-tags={tags.tags().length ? '' : undefined}
          data-editable={editable() ? '' : undefined}
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
              focusInput()
            }
          }}
          onClick={(event) => {
            callHandler(event, rootProps.onClick)
            if (
              !event.defaultPrevented &&
              !state.locked() &&
              (local.openOnControlClick ?? !editable())
            ) {
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
                  fallback={tags.renderDefault(tag, index)}
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
              data-duplicate={isDuplicate() ? '' : undefined}
              {...styles.slot('input')}
              placeholder={tags.tags().length ? '' : local.placeholder}
              ref={(element) => {
                inputBinding.binding.ref(element)
                callRef(local.inputRef, element)
              }}
              onPaste={(event) => tags.onPaste(event, inputBinding.composing())}
              onKeyDown={(event) => {
                if (inputBinding.composing() || event.isComposing || state.locked()) {
                  return
                }
                if (tags.onInputKeyDown(event, search.query())) {
                  return
                }
                if (event.key === 'Enter') {
                  if (isDuplicate()) {
                    event.preventDefault()
                    return
                  }
                  if (state.open()) {
                    const highlighted = state
                      .items()
                      .find((item) => sameValue(item.value, state.highlightedValue()))
                    if (highlighted && !state.itemDisabled(highlighted)) {
                      if (state.value().some((value) => sameValue(value, highlighted.value))) {
                        event.preventDefault()
                        return
                      }
                      inputBinding.binding.onKeyDown(event)
                      return
                    }
                  }
                  if (editable() && search.query()) {
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
          {...local}
          view={search.view()}
          onExitComplete={() => search.setQuery('')}
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
              : local.createItem && search.query()
                ? `Press Enter to create “${search.query()}”`
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
      serializeValue={(value) => serializeSourceValue(source(), value)}
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
      classes={baseSelectStyles.classes()}
      styles={baseSelectStyles.styles()}
    >
      <Control />
    </BaseSelect>
  )
}
