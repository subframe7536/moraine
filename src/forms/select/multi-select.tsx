import type { JSX } from 'solid-js'
import {
  mergeProps,
  splitProps,
  createMemo,
  createSignal,
  For,
  Show,
  createEffect,
  on,
} from 'solid-js'
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
import { useSelectSearch } from './shared/search.ts'

/** Multiple selection with tags, search, and optional item creation. */
export function MultiSelect<V extends MultiSelectT.Value = MultiSelectT.Value>(
  incoming: MultiSelectProps<V>,
): JSX.Element {
  type Item = MultiSelectT.Item<V>
  const [, remainingProps] = splitProps(incoming, [
    'itemRender',
    'emptyRender',
    'leadingIcon',
    'loadingIcon',
    'trailingIcon',
    'closeIcon',
    'tagRender',
  ])
  const itemRender = createMemo(() => incoming.itemRender)
  const emptyRender = createMemo(() => incoming.emptyRender)
  const leadingIcon = createMemo(() => incoming.leadingIcon)
  const loadingIcon = createMemo(() => incoming.loadingIcon)
  const trailingIcon = createMemo(() => incoming.trailingIcon)
  const closeIcon = createMemo(() => incoming.closeIcon)
  const tagRender = createMemo(() => incoming.tagRender)
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
    get tagRender() {
      return tagRender()
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
    'tagRender',
    'allowCreate',
    'maxCount',
    'maxTagCount',
    'tokenSeparators',
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
  const styles = createComponentStyles('multiSelect', props, {
    inheritedVariants: () => ({ size: field?.size }),
  })
  const [created, setCreated] = createSignal<Item[]>([])
  const items = createMemo(() => {
    const entries = props.items ?? []
    const existing = new Set(flattenItems(entries).map((item) => itemKey(item.value)))
    return [...created().filter((item) => !existing.has(itemKey(item.value))), ...entries]
  })
  function Control(): JSX.Element {
    const state = useSelectState<Item>()
    const searchable = () =>
      Boolean(styles.variants.search || props.allowCreate || props.tokenSeparators?.length)
    const search = useSelectSearch(props, searchable)
    const atMax = () => props.maxCount !== undefined && state.values().length >= props.maxCount
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
      props.maxTagCount === undefined ? tags() : tags().slice(0, props.maxTagCount),
    )
    const remove = (item: Item) =>
      state.change(state.values().filter((value) => !Object.is(value, item.value)))
    const clear = () => {
      if (state.locked()) {
        return
      }
      state.change([])
      search.setQuery('')
      props.onClear?.()
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
            labelString(item, props.itemToLabelString).toLowerCase() === normalized.toLowerCase() ||
            String(item.value).toLowerCase() === normalized.toLowerCase(),
        )
      const current = batch ?? state.values()
      if (item && current.some((value) => Object.is(value, item!.value))) {
        return true
      }
      if ((props.maxCount !== undefined && current.length >= props.maxCount) || item?.disabled) {
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
      if (!props.allowCreate) {
        return false
      }
      const added = addText(value ?? search.query(), true)
      if (added) {
        search.setQuery('')
      }
      return added
    }
    const separators = createMemo(() =>
      [...new Set(props.tokenSeparators?.filter(Boolean) ?? [])].sort(
        (a, b) => b.length - a.length,
      ),
    )
    function processInput(event: InputEvent) {
      const original = (event.currentTarget as HTMLInputElement).value
      search.input(event)
      if (search.composing() || event.isComposing || state.locked() || !separators().length) {
        return
      }
      const text = original
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
        search.setQuery(remaining)
      }
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
          <Show when={props.leadingIcon}>
            {(icon) => <Icon name={icon()} slotName="leading" {...styles.slot('leading')} />}
          </Show>
          <div data-slot="tagsContainer" {...styles.slot('tagsContainer')}>
            <For each={visibleTags()}>
              {(item) => (
                <Show
                  when={props.tagRender !== undefined}
                  fallback={
                    <span
                      title={labelString(item, props.itemToLabelString)}
                      data-slot="tag"
                      {...styles.slot('tag')}
                    >
                      <span
                        title={labelString(item, props.itemToLabelString)}
                        data-slot="label"
                        {...styles.slot('tagLabel')}
                      >
                        {item.label}
                      </span>
                      <button
                        type="button"
                        data-slot="tagRemove"
                        aria-label={`Remove ${labelString(item, props.itemToLabelString)}`}
                        tabIndex={-1}
                        disabled={state.locked() || item.disabled}
                        {...styles.slot('tagRemove')}
                        onClick={(event) => {
                          event.stopPropagation()
                          if (!item.disabled) {
                            remove(item)
                          }
                        }}
                      >
                        <Icon name={props.closeIcon ?? 'icon-close'} />
                      </button>
                    </span>
                  }
                >
                  {renderComponentOrElement(props.tagRender, { item, onClose: () => remove(item) })}
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
              placeholder={tags().length ? '' : props.placeholder}
              ref={(element) => {
                if (searchable()) {
                  search.binding.ref(element)
                }
                callRef(props.inputRef, element)
              }}
              onInput={processInput}
              onCompositionEnd={(event) => {
                search.binding.onCompositionEnd(event)
                processInput(event as unknown as InputEvent)
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
                  props.allowCreate &&
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
            when={!props.loading && props.allowClear && tags().length}
            fallback={
              <button
                type="button"
                tabIndex={-1}
                data-slot="trigger"
                aria-label={props.loading ? 'Loading' : 'Toggle selection'}
                aria-busy={props.loading ? 'true' : undefined}
                data-loading={props.loading ? '' : undefined}
                disabled={state.locked()}
                {...styles.slot('trigger')}
              >
                <Icon
                  data-loading={props.loading ? '' : undefined}
                  class="data-loading:animate-spin"
                  name={
                    props.loading
                      ? (props.loadingIcon ?? 'icon-loading')
                      : (props.trailingIcon ?? 'icon-chevron-down')
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
              <Icon name={props.closeIcon ?? 'icon-close'} />
            </button>
          </Show>
        </Dynamic>
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
      {...rootAttrs}
      ref={props.ref}
      data-slot="root"
      data-disabled={(props.disabled ?? field?.disabled) ? '' : undefined}
      data-readonly={(props.readOnly ?? field?.readOnly) ? '' : undefined}
      data-required={(props.required ?? field?.required) ? '' : undefined}
      {...styles.root}
    >
      <BaseSelect<Item>
        {...props}
        items={items()}
        multiple
        size={styles.variants.size ?? undefined}
        classes={Object.fromEntries(sharedSlots.map((slot) => [slot, styles.slot(slot).class]))}
        styles={Object.fromEntries(sharedSlots.map((slot) => [slot, styles.slot(slot).style]))}
      >
        <Control />
      </BaseSelect>
    </div>
  )
}
