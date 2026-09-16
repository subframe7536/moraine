import type { Accessor, JSX } from 'solid-js'
import { createMemo } from 'solid-js'

import { Icon } from '../../../elements/icon/index.ts'
import type { IconT } from '../../../elements/icon/index.ts'
import type { SlotBinding } from '../../../shared/provider/create-component-styles.ts'

export interface TagsFieldEntry<TValue> {
  value: TValue
  label: JSX.Element
  title: string
  removable: boolean
}

type TagSlot = 'tag' | 'tagLabel' | 'tagRemove'

export interface TagsFieldOptions<TValue> {
  values: Accessor<readonly TValue[]>
  resolve: (value: TValue) => TagsFieldEntry<TValue>
  change: (values: TValue[]) => void
  getInput: Accessor<HTMLInputElement | undefined>
  maxVisible?: Accessor<number | undefined>
  query: Accessor<string>
  setQuery: (value: string) => string
  commitInput: (input: string) => boolean
  tokenSeparators: Accessor<readonly string[] | undefined>
  locked: Accessor<boolean>
  slot: (name: TagSlot) => SlotBinding
  closeIcon: Accessor<IconT.Name | undefined>
}

/** Shared tag presentation, removal, focus, and tokenization behavior. */
export function createTagsField<TValue>(options: TagsFieldOptions<TValue>) {
  const tags = createMemo(() => options.values().map(options.resolve))
  const visible = createMemo(() => {
    const max = options.maxVisible?.()
    return max === undefined ? tags() : tags().slice(0, Math.max(0, max))
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
      options.getInput()?.focus()
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
    options.getInput()?.focus()
  }

  function onInputKeyDown(event: KeyboardEvent, inputValue: string): boolean {
    if (event.key === 'Backspace' && !inputValue) {
      for (let index = tags().length - 1; index >= 0; index -= 1) {
        if (remove(index)) {
          event.preventDefault()
          return true
        }
      }
    }
    if (event.key === 'ArrowLeft' && event.currentTarget instanceof HTMLInputElement) {
      const input = event.currentTarget
      if (input.selectionStart === 0 && input.selectionEnd === 0) {
        for (let index = tags().length - 1; index >= 0; index -= 1) {
          if (tags()[index]?.removable && removeButtons[index]) {
            event.preventDefault()
            removeButtons[index]?.focus()
            return true
          }
        }
      }
    }
    return false
  }

  function onRemoveKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      focusNearest(index, event.key === 'ArrowLeft' ? -1 : 1)
      return
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      const direction = event.key === 'Backspace' ? -1 : 1
      if (remove(index, false)) {
        // oxlint-disable-next-line subf/solid-reactivity -- Delayed focus reads the post-removal tag list.
        queueMicrotask(() => focusNearest(index - (direction === 1 ? 1 : 0), direction))
      }
    }
  }

  function isolatePointer(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
    options.getInput()?.focus()
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
    for (;;) {
      const match = nextSeparator(remaining, !commitLast)
      if (!match) {
        break
      }
      options.commitInput(remaining.slice(0, match.index))
      remaining = remaining.slice(match.index + match.separator.length)
    }
    if (commitLast) {
      options.commitInput(remaining)
      return ''
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

  function renderDefault(tag: TagsFieldEntry<TValue>, index: Accessor<number>): JSX.Element {
    return (
      <span title={tag.title} data-slot="tag" {...options.slot('tag')}>
        <span title={tag.title} data-slot="tagLabel" {...options.slot('tagLabel')}>
          {tag.label}
        </span>
        <button
          type="button"
          data-slot="tagRemove"
          aria-label={`Remove ${tag.title}`}
          tabIndex={-1}
          disabled={!tag.removable}
          {...options.slot('tagRemove')}
          ref={(element) => {
            removeButtons[index()] = element
          }}
          onPointerDown={isolatePointer}
          onKeyDown={(event) => onRemoveKeyDown(event, index())}
          onClick={(event) => {
            event.stopPropagation()
            remove(index())
          }}
        >
          <Icon name={options.closeIcon() ?? 'icon-close'} />
        </button>
      </span>
    )
  }

  return {
    tags,
    visible,
    overflow: () => tags().length - visible().length,
    remove,
    onInputKeyDown,
    onRemoveKeyDown,
    isolatePointer,
    tokenize,
    onPaste,
    renderDefault,
  }
}
