import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  Show,
  splitProps,
  untrack,
} from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { HiddenInput } from '../../shared/hidden-input.tsx'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField, useFormFieldContext } from '../form/form-context.ts'
import { TAGS_INPUT_LOCAL_PROP_KEYS } from '../shared/select/props.ts'
import { createTagsField } from '../shared/select/tags-field.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { TagsInputProps, TagsInputT } from './tags-input.types.ts'

function normalizeValues(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index)
}

/** Free-form multiple string entry with tags and an editable draft input. */
export function TagsInput(props: TagsInputProps): JSX.Element {
  const [local, rootProps] = splitProps(props, TAGS_INPUT_LOCAL_PROP_KEYS)
  const themeField = useFormFieldContext()
  const styles = createComponentStyles('tagsInput', props, {
    rootSlot: 'control',
    inheritedVariants: () => ({ size: themeField?.size }),
  })
  const generatedId = useId(() => local.id, 'tags-input')
  const initial = untrack(() => normalizeValues(local.defaultValue ?? []))
  const field = useFormField(
    () => local,
    () => ({ defaultId: generatedId(), bind: false, initialValue: initial }),
  )
  const [selection, setSelection] = useControllableValue<readonly string[]>({
    value: () => {
      if (local.value !== undefined) {
        return local.value
      }
      return Array.isArray(field.value()) ? (field.value() as string[]) : undefined
    },
    defaultValue: () => initial,
  })
  const values = createMemo(() => normalizeValues(selection() ?? []))
  const [draftValue, setDraftValue] = useControllableValue<string>({
    value: () => local.inputValue,
    defaultValue: () => local.defaultInputValue ?? '',
  })
  const draft = () => draftValue() ?? ''
  const locked = () => field.disabled() || field.readOnly()
  const [input, setInput] = createSignal<HTMLInputElement>()
  const [composing, setComposing] = createSignal(false)
  const [compositionDraft, setCompositionDraft] = createSignal('')
  let validationInput: HTMLInputElement | undefined

  const isDuplicate = createMemo(() => {
    const text = (composing() ? compositionDraft() : draft()).trim()
    return text.length > 0 && values().includes(text)
  })

  function setDraft(next: string): string {
    if (next === draft()) {
      return next
    }
    setDraftValue(next)
    local.onInputValueChange?.(next)
    return next
  }

  function change(next: readonly string[]): void {
    if (locked()) {
      return
    }
    const normalized = normalizeValues(next)
    if (
      values().length === normalized.length &&
      values().every((value, index) => value === normalized[index])
    ) {
      return
    }
    setSelection(normalized)
    if (local.value === undefined) {
      field.setFormValue(normalized)
    }
    local.onChange?.(normalized)
    if (local.value !== undefined) {
      field.setFormValue(normalizeValues(local.value))
    }
    field.emit('change')
    field.emit('input')
  }

  function addTo(current: string[], text: string): boolean {
    const value = text.trim()
    if (
      !value ||
      current.includes(value) ||
      (local.maxCount !== undefined && current.length >= local.maxCount)
    ) {
      return false
    }
    current.push(value)
    return true
  }

  const separators = createMemo(() =>
    [...new Set(local.tokenSeparators ?? [','])]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length),
  )

  function tokenize(text: string, commitLast = false): string {
    const next = [...values()]
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
      addTo(next, remaining.slice(0, index))
      remaining = remaining.slice(index + separator.length)
      consumed = true
    }
    if (commitLast) {
      addTo(next, remaining)
      remaining = ''
      consumed = true
    }
    if (consumed) {
      change(next)
    }
    return setDraft(remaining)
  }

  function commitDraft(): boolean {
    const next = [...values()]
    if (!addTo(next, draft())) {
      return false
    }
    change(next)
    setDraft('')
    return true
  }

  const tags = createTagsField<string>({
    values,
    change,
    getInput: input,
    resolve: (value) => ({
      value,
      label: value,
      title: value,
      removable: !locked(),
    }),
  })

  function clear(): void {
    if (locked()) {
      return
    }
    setComposing(false)
    setCompositionDraft('')
    change([])
    setDraft('')
    local.onClear?.()
    input()?.focus()
  }

  createEffect(
    on(
      [values, field.value, () => local.value !== undefined],
      ([current, formValue, controlled]) => {
        const formValues = Array.isArray(formValue) ? (formValue as string[]) : undefined
        if (
          controlled &&
          (!formValues ||
            formValues.length !== current.length ||
            formValues.some((value, index) => value !== current[index]))
        ) {
          field.setFormValue(current)
        }
      },
    ),
  )

  useFormReset(
    () => validationInput?.form,
    () => {
      setComposing(false)
      setCompositionDraft('')
      setSelection(initial)
      const next = local.value !== undefined ? normalizeValues(local.value) : initial
      field.setFormValue(next)
      setDraftValue(local.inputValue ?? local.defaultInputValue ?? '')
      if (validationInput) {
        validationInput.value = next.length ? 'selected' : ''
      }
    },
  )

  return (
    <>
      <div
        {...rootProps}
        {...styles.slot('control')}
        id={undefined}
        data-slot="control"
        data-editable=""
        data-tags={values().length ? '' : undefined}
        data-disabled={field.disabled() ? '' : undefined}
        data-readonly={field.readOnly() ? '' : undefined}
        data-required={field.required() ? '' : undefined}
        data-invalid={field.invalid() ? '' : undefined}
        ref={(element) => callRef(local.ref, element)}
        onClick={(event) => {
          callHandler(event, rootProps.onClick)
          if (!event.defaultPrevented) {
            input()?.focus()
          }
        }}
      >
        <Show when={local.leadingIcon}>
          {(icon) => <Icon name={icon()} slotName="leading" {...styles.slot('leading')} />}
        </Show>
        <div data-slot="tagsContainer" {...styles.slot('tagsContainer')}>
          <For each={tags.tags()}>
            {(tag, index) => (
              <Show
                when={local.tagRender !== undefined}
                fallback={
                  <span data-slot="tag" title={tag.title} {...styles.slot('tag')}>
                    <span data-slot="tagLabel" title={tag.title} {...styles.slot('tagLabel')}>
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
                        input()?.focus()
                      }}
                    >
                      <Icon name={local.closeIcon ?? 'icon-close'} />
                    </button>
                  </span>
                }
              >
                {renderComponentOrElement(local.tagRender, {
                  value: tag.value,
                  onClose: () => tags.remove(index()),
                } satisfies TagsInputT.TagRenderProps)}
              </Show>
            )}
          </For>
          <input
            id={field.id()}
            data-slot="input"
            {...styles.slot('input')}
            {...field.ariaAttrs()}
            data-duplicate={isDuplicate() ? '' : undefined}
            disabled={field.disabled()}
            readOnly={field.readOnly()}
            value={composing() ? compositionDraft() : draft()}
            placeholder={values().length ? '' : local.placeholder}
            ref={(element) => {
              setInput(element)
              callRef(local.inputRef, element)
            }}
            onFocus={(event) => field.emit('focus', event)}
            onBlur={(event) => field.emit('blur', event)}
            onCompositionStart={(event) => {
              setCompositionDraft(event.currentTarget.value)
              setComposing(true)
            }}
            onCompositionEnd={(event) => {
              if (!composing()) {
                event.currentTarget.value = draft()
                return
              }
              setComposing(false)
              event.currentTarget.value = tokenize(compositionDraft())
              setCompositionDraft('')
            }}
            onInput={(event) => {
              if (locked()) {
                event.currentTarget.value = draft()
              } else if (composing() || event.isComposing) {
                setCompositionDraft(event.currentTarget.value)
              } else {
                event.currentTarget.value = tokenize(event.currentTarget.value)
              }
              callHandler(event, local.onInput)
            }}
            onPaste={(event) => {
              if (locked() || composing()) {
                return
              }
              const pasted = event.clipboardData?.getData('text')
              if (
                pasted === undefined ||
                !separators().some((separator) => pasted.includes(separator))
              ) {
                return
              }
              event.preventDefault()
              event.currentTarget.value = tokenize(`${draft()}${pasted}`, true)
            }}
            onKeyDown={(event) => {
              if (!composing() && !event.isComposing && !locked()) {
                if (tags.onInputKeyDown(event, draft())) {
                  callHandler(event, local.onKeyDown)
                  return
                }
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitDraft()
                }
              }
              callHandler(event, local.onKeyDown)
            }}
          />
        </div>
        <Show when={local.allowClear && (values().length > 0 || draft())}>
          <button
            type="button"
            data-slot="clear"
            aria-label="Clear tags"
            tabIndex={-1}
            disabled={locked()}
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
      </div>
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
        value={values().length ? 'selected' : ''}
        onInvalid={(event) => {
          event.preventDefault()
          input()?.focus()
        }}
      />
      <For each={values()}>
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
  )
}
