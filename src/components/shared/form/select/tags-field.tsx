import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, onFlush } from 'solid-js'

import { useMessages } from '../../../../provider/locale/locale-context'
import type { ComponentMessages } from '../../../../provider/locale/messages.types'
import { createKeyDownHandler } from '../../../../shared/keyboard'
import type { SlotBinding } from '../../../../theme/use-recipe'
import { Icon } from '../../../icon/index'
import type { IconT } from '../../../icon/index'

import { defaultTagsFieldMessages } from './tags-field.messages'
export interface TagsFieldEntry<TValue> {
  value: TValue
  label: JSX.Element
  title: string
  removable: boolean
  item?: unknown
}

type TagSlot = 'tag' | 'tagLabel' | 'tagRemove'

export interface TagsFieldOptions<TValue> {
  values: Accessor<ReadonlyArray<TValue>>
  resolve: (value: TValue) => TagsFieldEntry<TValue>
  change: (values: Array<TValue>) => void
  getFocusOwner: Accessor<HTMLElement | undefined>
  maxVisible?: Accessor<number | undefined>
  query: Accessor<string>
  setQuery: (value: string) => string
  commitInput: (input: string) => boolean
  commitInputs?: (inputs: ReadonlyArray<string>) => boolean
  tokenSeparators: Accessor<ReadonlyArray<string> | undefined>
  locked: Accessor<boolean>
  slot: (name: TagSlot) => SlotBinding
  slotName: (name: TagSlot) => string
  removeIcon: Accessor<IconT.Name | undefined>
  translations?: Accessor<Partial<ComponentMessages<typeof defaultTagsFieldMessages>> | undefined>
}

/** Shared tag presentation, removal, focus, and tokenization behavior. */
export function createTagsField<TValue>(options: TagsFieldOptions<TValue>) {
  const messages = useMessages('tagsField', defaultTagsFieldMessages, options.translations)
  const tagCache = new Map<TValue, TagsFieldEntry<TValue>>()
  const tags = createMemo<Array<TagsFieldEntry<TValue>>>(() => {
    const values = options.values()
    const activeValues = new Set(values)
    for (const key of tagCache.keys()) {
      if (!activeValues.has(key)) {
        tagCache.delete(key)
      }
    }
    return values.map((val) => {
      const resolved = options.resolve(val)
      const cached = tagCache.get(val)
      if (
        cached &&
        cached.value === resolved.value &&
        cached.label === resolved.label &&
        cached.title === resolved.title &&
        cached.removable === resolved.removable &&
        cached.item === resolved.item
      ) {
        return cached
      }
      tagCache.set(val, resolved)
      return resolved
    })
  })
  const visible = createMemo((previous: Array<TagsFieldEntry<TValue>> | undefined) => {
    const allTags = tags()
    const max = options.maxVisible?.()
    const next = max === undefined ? allTags : allTags.slice(0, Math.max(0, max))
    if (
      previous &&
      previous.length === next.length &&
      previous.every((item, index) => item === next[index])
    ) {
      return previous
    }
    return next
  })
  const separators = createMemo(() =>
    [...new Set(options.tokenSeparators() ?? [','])]
      .filter(Boolean)
      .sort((left, right) => right.length - left.length),
  )
  const removeButtons: Array<HTMLButtonElement | undefined> = []

  function remove(index: number, restoreInputFocus = true): boolean {
    const tag = tags()[index]
    if (!tag?.removable) {
      return false
    }
    options.change(options.values().filter((_, valueIndex) => valueIndex !== index))
    if (restoreInputFocus) {
      options.getFocusOwner()?.focus()
    }
    return true
  }

  function focusNearest(index: number, direction: -1 | 1): void {
    for (let next = index + direction; next >= 0 && next < tags().length; next += direction) {
      if (tags()[next]?.removable && removeButtons[next]) {
        removeButtons[next]?.focus()
        return
      }
    }
    options.getFocusOwner()?.focus()
  }

  const dispatchFocusOwnerKeyDown = createKeyDownHandler<HTMLElement, [string]>({
    keys: {
      Backspace: {
        preventDefault: false,
        when: (_event, inputValue) => !inputValue,
        handle: (event) => {
          for (let index = tags().length - 1; index >= 0; index -= 1) {
            if (remove(index)) {
              event.preventDefault()
              return
            }
          }
        },
      },
      ArrowLeft: {
        preventDefault: false,
        handle: (event) => {
          const target = event.currentTarget
          const atStart =
            !(target instanceof HTMLInputElement) ||
            (target.selectionStart === 0 && target.selectionEnd === 0)
          if (!atStart) {
            return
          }
          for (let index = tags().length - 1; index >= 0; index -= 1) {
            if (tags()[index]?.removable && removeButtons[index]) {
              event.preventDefault()
              removeButtons[index]?.focus()
              return
            }
          }
        },
      },
    },
  })

  function onFocusOwnerKeyDown(event: KeyboardEvent, inputValue: string): boolean {
    dispatchFocusOwnerKeyDown(event, inputValue)
    return event.defaultPrevented
  }

  function removeTag(index: number, direction: -1 | 1): void {
    if (remove(index, false)) {
      onFlush(() => focusNearest(index - (direction === 1 ? 1 : 0), direction))
    }
  }

  const onRemoveKeyDown = createKeyDownHandler<HTMLElement, [number]>({
    keys: {
      ArrowLeft: (_event, index) => focusNearest(index, -1),
      ArrowRight: (_event, index) => focusNearest(index, 1),
      Backspace: (_event, index) => removeTag(index, -1),
      Delete: (_event, index) => removeTag(index, 1),
    },
  })

  function isolatePointer(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
    options.getFocusOwner()?.focus()
  }

  function nextSeparator(text: string, deferAmbiguousEnd: boolean) {
    let index = -1
    let separator = ''
    for (const candidate of separators()) {
      const found = text.indexOf(candidate)
      if (found >= 0 && (index < 0 || found < index)) {
        index = found
        separator = candidate
      }
    }
    if (
      deferAmbiguousEnd &&
      index >= 0 &&
      index + separator.length === text.length &&
      separators().some(
        (candidate) => candidate.length > separator.length && candidate.startsWith(separator),
      )
    ) {
      return undefined
    }
    return index < 0 ? undefined : { index, separator }
  }

  function tokenize(text: string, commitLast = false): string {
    let remaining = text
    const tokens: Array<string> = []
    for (;;) {
      const match = nextSeparator(remaining, !commitLast)
      if (!match) {
        break
      }
      tokens.push(remaining.slice(0, match.index))
      remaining = remaining.slice(match.index + match.separator.length)
    }
    if (commitLast) {
      tokens.push(remaining)
      remaining = ''
    }
    if (tokens.length > 0) {
      if (options.commitInputs) {
        options.commitInputs(tokens)
      } else {
        for (const token of tokens) {
          options.commitInput(token)
        }
      }
    }
    return remaining
  }

  function onPaste(event: ClipboardEvent, composing: boolean): boolean {
    if (options.locked() || composing) {
      return false
    }
    const pasted = event.clipboardData?.getData('text')
    if (pasted === undefined || !separators().some((separator) => pasted.includes(separator))) {
      return false
    }
    event.preventDefault()
    const input = event.currentTarget as HTMLInputElement
    const query = options.query()
    const start = input.selectionStart ?? query.length
    const end = input.selectionEnd ?? start
    const remaining = tokenize(`${query.slice(0, start)}${pasted}${query.slice(end)}`, true)
    input.value = options.setQuery(remaining)
    return true
  }

  function DefaultTag(tagProps: { tag: TagsFieldEntry<TValue>; index: number }): JSX.Element {
    const [removeButton, setRemoveButton] = createSignal<HTMLButtonElement>()
    // Keyboard navigation looks remove buttons up by tag index, which moves as tags change.
    createEffect(
      () => [tagProps.index, removeButton()] as const,
      ([index, element]) => {
        if (!element) {
          return
        }
        removeButtons[index] = element
        return () => {
          if (removeButtons[index] === element) {
            removeButtons[index] = undefined
          }
        }
      },
    )
    return (
      <span title={tagProps.tag.title} data-slot={options.slotName('tag')} {...options.slot('tag')}>
        <span
          title={tagProps.tag.title}
          data-slot={options.slotName('tagLabel')}
          {...options.slot('tagLabel')}
        >
          {tagProps.tag.label}
        </span>
        <button
          type="button"
          data-slot={options.slotName('tagRemove')}
          aria-label={messages().remove({ title: tagProps.tag.title })}
          tabindex={-1}
          disabled={!tagProps.tag.removable}
          {...options.slot('tagRemove')}
          ref={setRemoveButton}
          onPointerDown={isolatePointer}
          onKeyDown={(event) => onRemoveKeyDown(event, tagProps.index)}
          onClick={(event) => {
            event.stopPropagation()
            remove(tagProps.index)
          }}
        >
          <Icon name={options.removeIcon() ?? 'icon-close'} />
        </button>
      </span>
    )
  }

  return {
    tags,
    visible,
    overflow: () => tags().length - visible().length,
    remove,
    onFocusOwnerKeyDown,
    onRemoveKeyDown,
    isolatePointer,
    tokenize,
    onPaste,
    DefaultTag,
  }
}
