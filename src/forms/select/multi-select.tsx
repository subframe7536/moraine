import type { JSX } from 'solid-js'
import { splitProps, createMemo, createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callHandler, callRef } from '../../shared/utils.ts'
import { useFormFieldContext } from '../form/form-context.ts'

import { BaseSelect, useSelectState } from './base-select.tsx'
import type { MultiSelectProps, MultiSelectT } from './multi-select.types.ts'
import { createSource, labelString, sameValue } from './shared/collection.ts'
import { DefaultSelectContent } from './shared/default-content.tsx'
import {
  BASE_SELECT_FORWARD_PROP_KEYS,
  BASE_SELECT_SHARED_SLOTS,
  MULTI_SELECT_LOCAL_PROP_KEYS,
} from './shared/props.ts'
import { useSelectSearch } from './shared/search.ts'
import { useBaseSelectSearchInput } from './utils.ts'

/** Multiple selection with tags, search, and optional item creation. */
export function MultiSelect<T extends MultiSelectT.Item = MultiSelectT.Item>(
  props: MultiSelectProps<T>,
): JSX.Element {
  type Item = T
  type V = T['value']
  type RuntimeProps = MultiSelectProps<T> & { closeOnSelect?: boolean }
  const [local, baseSelectProps, rootProps] = splitProps(
    props as RuntimeProps,
    MULTI_SELECT_LOCAL_PROP_KEYS,
    BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const leadingIcon = () => local.leadingIcon
  const loadingIcon = () => local.loadingIcon
  const trailingIcon = () => local.trailingIcon
  const closeIcon = () => local.closeIcon
  const tagRender = createMemo(() => local.tagRender)
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
  const [created, setCreated] = createSignal<Item[]>([])
  const source = createMemo(() => createSource(local.items ?? [], created()))
  const searchable = () =>
    Boolean(styles.variants.search || local.createItem || local.tokenSeparators?.length)
  const search = useSelectSearch(
    local,
    searchable,
    () => source(),
    () => baseSelectProps.itemToLabelString,
  )
  let committingTokens = false
  function Control(): JSX.Element {
    const state = useSelectState<Item>()
    const input = useBaseSelectSearchInput(state, local, searchable, search)
    const atMax = () => local.maxCount !== undefined && state.value().length >= local.maxCount
    const tags = createMemo(() =>
      state.value().map((value) => {
        const item = source().byValue.get(value)
        const label = item?.label ?? String(value)
        const title =
          item && baseSelectProps.itemToLabelString
            ? baseSelectProps.itemToLabelString(item)
            : typeof label === 'string'
              ? label
              : String(value)
        return { value, item, label, title }
      }),
    )
    const visibleTags = createMemo(() =>
      local.maxTagCount === undefined ? tags() : tags().slice(0, local.maxTagCount),
    )
    const canRemove = (item: { item: Item | undefined }) =>
      !state.locked() && (!item.item || !state.itemDisabled(item.item))
    function remove(item: { value: V; item: Item | undefined }) {
      if (!canRemove(item)) {
        return
      }
      state.change(state.value().filter((value) => !sameValue(value, item.value)))
    }
    const clear = () => {
      if (state.locked()) {
        return
      }
      input.discardComposition()
      state.change([])
      search.setQuery('')
      local.onClear?.()
    }
    function addText(text: string, batch?: V[]): boolean {
      if (state.locked()) {
        return false
      }
      const normalized = text.trim()
      if (!normalized) {
        return false
      }
      let item = source().items.find(
        (item) =>
          labelString(item, baseSelectProps.itemToLabelString).toLowerCase() ===
            normalized.toLowerCase() ||
          String(item.value).toLowerCase() === normalized.toLowerCase(),
      )
      const current = batch ?? state.value()
      if (item && current.some((value) => sameValue(value, item!.value))) {
        return true
      }
      if (
        (local.maxCount !== undefined && current.length >= local.maxCount) ||
        (item && (item.disabled || baseSelectProps.isItemDisabled?.(item, current)))
      ) {
        return false
      }
      if (!item) {
        if (!local.createItem) {
          return false
        }
        item = local.createItem(normalized)
        const existing = source().byValue.get(item.value)
        if (existing) {
          item = existing
        }
        if (item.disabled || baseSelectProps.isItemDisabled?.(item, current)) {
          return false
        }
        if (!existing) {
          const createdItem = item
          setCreated((previous) =>
            previous.some((candidate) => sameValue(candidate.value, createdItem.value))
              ? previous
              : [...previous, createdItem],
          )
        }
        if (current.some((value) => sameValue(value, item!.value))) {
          return true
        }
      }
      if (batch) {
        batch.push(item.value)
      } else {
        state.change([...state.value(), item.value])
      }
      return true
    }
    const create = (value?: string) => {
      const added = addText(value ?? search.query())
      if (added) {
        search.setQuery('')
      }
      return added
    }
    const separators = createMemo(() =>
      [...new Set(local.tokenSeparators?.filter(Boolean) ?? [])].sort(
        (a, b) => b.length - a.length,
      ),
    )
    function processText(text: string): string {
      if (state.locked()) {
        return search.query()
      }
      if (!separators().length) {
        return input.commit(text)
      }
      const batch = [...state.value()]
      let remaining = text
      let consumed = false
      for (;;) {
        let index = -1
        let separator = ''
        for (const token of separators()) {
          const found = remaining.indexOf(token)
          if (found >= 0 && (index < 0 || found < index)) {
            index = found
            separator = token
          }
        }
        if (index < 0) {
          break
        }
        const token = remaining.slice(0, index)
        if (token.trim()) {
          addText(token, batch)
        }
        remaining = remaining.slice(index + separator.length)
        consumed = true
      }
      if (consumed) {
        committingTokens = true
        try {
          state.change(batch)
        } finally {
          committingTokens = false
        }
      }
      return input.commit(consumed ? remaining : text)
    }
    function processInput(event: InputEvent) {
      const target = event.currentTarget as HTMLInputElement
      if (state.locked()) {
        target.value = search.query()
        return
      }
      if (input.composing() || event.isComposing) {
        input.setDraft(target.value)
        return
      }
      target.value = processText(target.value)
    }
    return (
      <>
        <Dynamic
          component={searchable() ? 'div' : BaseSelect.Trigger}
          as={searchable() ? undefined : 'div'}
          {...rootProps}
          data-slot="trigger"
          {...styles.slot('control')}
          data-tags={tags().length ? '' : undefined}
          data-disabled={state.field.disabled() ? '' : undefined}
          data-readonly={state.field.readOnly() ? '' : undefined}
          data-required={state.field.required() ? '' : undefined}
          data-invalid={state.field.invalid() ? '' : undefined}
          ref={(element: HTMLDivElement) => {
            state.setAnchor(element)
            callRef(local.ref, element)
          }}
          onPointerDown={(event: PointerEvent) => {
            callHandler(event, rootProps.onPointerDown)
            if (
              !event.defaultPrevented &&
              !(event.target instanceof HTMLInputElement) &&
              event.pointerType !== 'touch' &&
              event.pointerType !== 'pen'
            ) {
              event.preventDefault()
              state.control()?.focus()
            }
          }}
          onClick={(event: MouseEvent) => {
            callHandler(event, rootProps.onClick)
            if (!event.defaultPrevented && searchable()) {
              state.control()?.focus()
              state.setOpen(event.target instanceof HTMLInputElement ? true : !state.open())
            }
          }}
        >
          <Show when={leadingIcon()}>
            {(icon) => <Icon name={icon()} slotName="leading" {...styles.slot('leading')} />}
          </Show>
          <div data-slot="tagsContainer" {...styles.slot('tagsContainer')}>
            <For each={visibleTags()}>
              {(item) => (
                <Show
                  when={tagRender() !== undefined}
                  fallback={
                    <span title={item.title} data-slot="tag" {...styles.slot('tag')}>
                      <span title={item.title} data-slot="label" {...styles.slot('tagLabel')}>
                        {item.label}
                      </span>
                      <button
                        type="button"
                        data-slot="tagRemove"
                        aria-label={`Remove ${item.title}`}
                        tabIndex={-1}
                        disabled={!canRemove(item)}
                        {...styles.slot('tagRemove')}
                        onClick={(event) => {
                          event.stopPropagation()
                          remove(item)
                        }}
                      >
                        <Icon name={closeIcon() ?? 'icon-close'} />
                      </button>
                    </span>
                  }
                >
                  {renderComponentOrElement(tagRender(), { ...item, onClose: () => remove(item) })}
                </Show>
              )}
            </For>
            <Show when={tags().length > visibleTags().length}>
              <span data-slot="tagOverflow" {...styles.slot('tagOverflow')}>
                +{tags().length - visibleTags().length}
              </span>
            </Show>
            <input
              {...(searchable() ? input.binding : { readOnly: true, value: '' })}
              {...state.field.ariaAttrs()}
              role={searchable() ? 'combobox' : undefined}
              id={searchable() ? state.field.id() : undefined}
              tabIndex={searchable() ? undefined : -1}
              data-slot="input"
              {...styles.slot('input')}
              placeholder={tags().length ? '' : local.placeholder}
              ref={(element) => {
                if (searchable()) {
                  input.binding.ref(element)
                }
                callRef(local.inputRef, element)
              }}
              onInput={processInput}
              onCompositionEnd={(event) => {
                const target = event.currentTarget
                const committed = input.endComposition(target.value)
                if (committed === undefined) {
                  target.value = search.query()
                  return
                }
                target.value = committed
                target.value = processText(committed)
              }}
              onKeyDown={(event) => {
                if (input.composing() || event.isComposing || state.locked()) {
                  return
                }
                if (event.key === 'Backspace' && !search.query()) {
                  const item = tags().at(-1)
                  if (item && canRemove(item)) {
                    event.preventDefault()
                    remove(item)
                  }
                  return
                }
                if (
                  event.key === 'Enter' &&
                  local.createItem &&
                  search.query() &&
                  !state.items().some((item) => !item.disabled)
                ) {
                  event.preventDefault()
                  create()
                  return
                }
                const highlighted = state
                  .items()
                  .find((item) => sameValue(item.value, state.highlightedValue()))
                if (
                  (event.key === 'Enter' || (!searchable() && event.key === ' ')) &&
                  state.open() &&
                  atMax() &&
                  highlighted &&
                  !state.value().includes(highlighted.value)
                ) {
                  event.preventDefault()
                  return
                }
                input.binding.onKeyDown(event)
              }}
            />
          </div>
          <Show
            when={!local.loading && local.allowClear && tags().length}
            fallback={
              <button
                type="button"
                tabIndex={-1}
                data-slot="indicator"
                aria-label={local.loading ? 'Loading' : 'Toggle selection'}
                aria-busy={local.loading ? 'true' : undefined}
                data-loading={local.loading ? '' : undefined}
                disabled={state.locked() || Boolean(local.loading)}
                {...styles.slot('trigger')}
              >
                <Icon
                  data-loading={local.loading ? '' : undefined}
                  class="data-loading:animate-spin"
                  name={
                    local.loading
                      ? (loadingIcon() ?? 'icon-loading')
                      : (trailingIcon() ?? 'icon-chevron-down')
                  }
                />
              </button>
            }
          >
            <button
              type="button"
              tabIndex={-1}
              data-slot="clear"
              aria-label="Clear selection"
              disabled={state.locked()}
              {...styles.slot('clear')}
              onClick={(event) => {
                event.stopPropagation()
                clear()
              }}
            >
              <Icon name={closeIcon() ?? 'icon-close'} />
            </button>
          </Show>
        </Dynamic>
        <DefaultSelectContent
          view={search.view()}
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
    <BaseSelect<Item>
      {...baseSelectProps}
      closeOnSelect={false}
      items={search.view().items}
      serializeValue={(value) =>
        source().byValue.get(value)?.disabled ? undefined : String(value)
      }
      value={local.value}
      defaultValue={local.defaultValue}
      onChange={(values) => {
        if (!committingTokens) {
          search.setQuery('')
        }
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
          !values.includes(item.value))
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
