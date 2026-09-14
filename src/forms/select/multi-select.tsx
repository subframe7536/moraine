import type { JSX } from 'solid-js'
import { splitProps, createMemo, createSignal, For, Show, createEffect, on } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callRef } from '../../shared/utils.ts'
import { useFormFieldContext } from '../form/form-context.ts'

import { BaseSelect, useSelectState } from './base-select.tsx'
import type { MultiSelectProps, MultiSelectT } from './multi-select.types.ts'
import { flattenItems, itemKey, labelString } from './shared/collection.ts'
import { DefaultSelectContent } from './shared/default-content.tsx'
import {
  BASE_SELECT_FORWARD_PROP_KEYS,
  BASE_SELECT_SHARED_SLOTS,
  isFormFieldInvalid,
  MULTI_SELECT_LOCAL_PROP_KEYS,
} from './shared/props.ts'
import { useSelectSearch } from './shared/search.ts'

/** Multiple selection with tags, search, and optional item creation. */
export function MultiSelect<V extends MultiSelectT.Value = MultiSelectT.Value>(
  props: MultiSelectProps<V>,
): JSX.Element {
  type Item = MultiSelectT.Item<V>
  const [local, baseSelectProps, rootProps] = splitProps(
    props,
    MULTI_SELECT_LOCAL_PROP_KEYS,
    BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const itemRender = createMemo(() => local.itemRender)
  const emptyRender = createMemo(() => local.emptyRender)
  const leadingIcon = createMemo(() => local.leadingIcon)
  const loadingIcon = createMemo(() => local.loadingIcon)
  const trailingIcon = createMemo(() => local.trailingIcon)
  const closeIcon = createMemo(() => local.closeIcon)
  const tagRender = createMemo(() => local.tagRender)
  const field = useFormFieldContext()
  const styles = createComponentStyles('multiSelect', props, {
    inheritedVariants: () => ({ size: field?.size }),
  })
  const sharedClasses = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).class])),
  )
  const sharedStyles = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).style])),
  )
  const [created, setCreated] = createSignal<Item[]>([])
  const items = createMemo(() => {
    const entries = baseSelectProps.items ?? []
    const existing = new Set(flattenItems(entries).map((item) => itemKey(item.value)))
    return [...created().filter((item) => !existing.has(itemKey(item.value))), ...entries]
  })
  function Control(): JSX.Element {
    const state = useSelectState<Item>()
    const searchable = () =>
      Boolean(styles.variants.search || local.allowCreate || local.tokenSeparators?.length)
    const search = useSelectSearch(local, searchable)
    const atMax = () => local.maxCount !== undefined && state.values().length >= local.maxCount
    state.setDisabledPolicy(
      // oxlint-disable-next-line subf/solid-reactivity -- The signal stores this predicate; BaseSelect evaluates it in tracked scopes.
      () => (item: Item) => atMax() && !state.selectedKeys().has(itemKey(item.value)),
    )
    const tags = createMemo(() =>
      state
        .values()
        .map(
          (value) =>
            state.collection().byValue.get(itemKey(value)) ?? { value, label: String(value) },
        ),
    )
    const visibleTags = createMemo(() =>
      local.maxTagCount === undefined ? tags() : tags().slice(0, local.maxTagCount),
    )
    function remove(item: Item) {
      if (state.locked() || item.disabled) {
        return
      }
      state.change(state.values().filter((value) => !Object.is(value, item.value)))
    }
    const clear = () => {
      if (state.locked()) {
        return
      }
      state.change([])
      search.setQuery('')
      local.onClear?.()
    }
    function addText(text: string, allowCreate: boolean, batch?: V[]): boolean {
      if (state.locked()) {
        return false
      }
      const normalized = text.trim()
      if (!normalized) {
        return false
      }
      let item = state
        .collection()
        .items.find(
          (item) =>
            labelString(item, baseSelectProps.itemToLabelString).toLowerCase() ===
              normalized.toLowerCase() ||
            String(item.value).toLowerCase() === normalized.toLowerCase(),
        )
      const current = batch ?? state.values()
      if (item && current.some((value) => Object.is(value, item!.value))) {
        return true
      }
      if ((local.maxCount !== undefined && current.length >= local.maxCount) || item?.disabled) {
        return false
      }
      if (!item) {
        if (!allowCreate) {
          return false
        }
        item = { value: normalized as V, label: normalized }
        setCreated((previous) => [...previous, item!])
      }
      if (batch) {
        batch.push(item.value)
      } else {
        state.change([...state.values(), item.value])
      }
      return true
    }
    const create = (value?: string) => {
      if (!local.allowCreate) {
        return false
      }
      const added = addText(value ?? search.query(), true)
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
        return search.commit(text)
      }
      const batch = [...state.values()]
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
          addText(token, true, batch)
        }
        remaining = remaining.slice(index + separator.length)
        consumed = true
      }
      if (consumed) {
        state.change(batch)
      }
      return search.commit(consumed ? remaining : text)
    }
    function processInput(event: InputEvent) {
      const target = event.currentTarget as HTMLInputElement
      if (state.locked()) {
        target.value = search.query()
        return
      }
      if (search.composing() || event.isComposing) {
        search.setDraft(target.value)
        return
      }
      target.value = processText(target.value)
    }
    createEffect(
      on(
        state.resetVersion,
        () =>
          setCreated((previous) =>
            previous.filter((item) => state.selectedKeys().has(itemKey(item.value))),
          ),
        { defer: true },
      ),
    )
    return (
      <>
        <Dynamic
          component={searchable() ? 'div' : BaseSelect.Trigger}
          as={searchable() ? undefined : 'div'}
          data-slot="control"
          {...styles.slot('control')}
          data-tags={tags().length ? '' : undefined}
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
            state.control()?.focus()
            if (searchable()) {
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
                    <span
                      title={labelString(item, baseSelectProps.itemToLabelString)}
                      data-slot="tag"
                      {...styles.slot('tag')}
                    >
                      <span
                        title={labelString(item, baseSelectProps.itemToLabelString)}
                        data-slot="label"
                        {...styles.slot('tagLabel')}
                      >
                        {item.label}
                      </span>
                      <button
                        type="button"
                        data-slot="tagRemove"
                        aria-label={`Remove ${labelString(item, baseSelectProps.itemToLabelString)}`}
                        tabIndex={-1}
                        disabled={state.locked() || item.disabled}
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
                  {renderComponentOrElement(tagRender(), { item, onClose: () => remove(item) })}
                </Show>
              )}
            </For>
            <Show when={tags().length > visibleTags().length}>
              <span data-slot="tagOverflow" {...styles.slot('tagOverflow')}>
                +{tags().length - visibleTags().length}
              </span>
            </Show>
            <input
              {...(searchable() ? search.binding : { readOnly: true, value: '' })}
              {...state.field.ariaAttrs()}
              role={searchable() ? 'combobox' : undefined}
              id={searchable() ? state.field.id() : undefined}
              tabIndex={searchable() ? undefined : -1}
              data-slot="input"
              {...styles.slot('input')}
              placeholder={tags().length ? '' : local.placeholder}
              ref={(element) => {
                if (searchable()) {
                  search.binding.ref(element)
                }
                callRef(local.inputRef, element)
              }}
              onInput={processInput}
              onCompositionEnd={(event) => {
                const target = event.currentTarget
                const committed = search.endComposition(target.value)
                target.value = committed
                target.value = processText(committed)
              }}
              onKeyDown={(event) => {
                if (search.composing() || event.isComposing || state.locked()) {
                  return
                }
                if (event.key === 'Backspace' && !search.query()) {
                  const item = tags().at(-1)
                  if (item && !item.disabled) {
                    event.preventDefault()
                    remove(item)
                  }
                  return
                }
                if (
                  event.key === 'Enter' &&
                  local.allowCreate &&
                  search.query() &&
                  !state.visibleItems().some((item) => !item.disabled)
                ) {
                  event.preventDefault()
                  create()
                  return
                }
                const highlighted = state
                  .visibleItems()
                  .find((item) => itemKey(item.value) === state.highlight())
                if (
                  (event.key === 'Enter' || (!searchable() && event.key === ' ')) &&
                  state.open() &&
                  atMax() &&
                  highlighted &&
                  !state.selectedKeys().has(itemKey(highlighted.value))
                ) {
                  event.preventDefault()
                  return
                }
                search.binding.onKeyDown(event)
              }}
            />
          </div>
          <Show
            when={!local.loading && local.allowClear && tags().length}
            fallback={
              <button
                type="button"
                tabIndex={-1}
                data-slot="trigger"
                aria-label={local.loading ? 'Loading' : 'Toggle selection'}
                aria-busy={local.loading ? 'true' : undefined}
                data-loading={local.loading ? '' : undefined}
                disabled={state.locked()}
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
          itemRender={itemRender()}
          itemProps={local.itemProps}
          listboxProps={local.listboxProps}
          virtualRender={local.virtualRender}
          scrollToItem={local.scrollToItem}
          onScrollBottom={local.onScrollBottom}
          scrollBottomThreshold={local.scrollBottomThreshold}
          gutter={local.gutter}
          overflowPadding={local.overflowPadding}
          slot={styles.slot}
          empty={
            emptyRender() !== undefined
              ? renderComponentOrElement(emptyRender(), {
                  get inputValue() {
                    return search.query()
                  },
                  get hasMatches() {
                    return state.visibleItems().length > 0
                  },
                  get selectedValues() {
                    return state.values()
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
    <div
      {...rootProps}
      ref={local.ref}
      data-slot="root"
      data-disabled={(baseSelectProps.disabled ?? field?.disabled) ? '' : undefined}
      data-readonly={(baseSelectProps.readOnly ?? field?.readOnly) ? '' : undefined}
      data-required={(baseSelectProps.required ?? field?.required) ? '' : undefined}
      data-invalid={isFormFieldInvalid(field) ? '' : undefined}
      {...styles.root}
    >
      <BaseSelect<Item>
        {...baseSelectProps}
        items={items()}
        multiple
        size={styles.variants.size ?? undefined}
        classes={sharedClasses()}
        styles={sharedStyles()}
      >
        <Control />
      </BaseSelect>
    </div>
  )
}
