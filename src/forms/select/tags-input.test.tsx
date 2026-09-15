import { fireEvent, render as baseRender } from '@solidjs/testing-library'
import { createSignal, untrack } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../shared/provider/index.ts'
import { defaultTheme } from '../../theme/default-theme.ts'

import { TagsInput } from './tags-input.tsx'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider theme={defaultTheme}>{ui()}</MoraineProvider>, options)

describe('TagsInput', () => {
  test('commits trimmed free-form input with Enter', () => {
    const onChange = vi.fn()
    const screen = render(() => <TagsInput onChange={onChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.input(input, { target: { value: '  alpha  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['alpha'])
    expect(screen.container.querySelector('[data-slot="tagLabel"]')?.textContent).toBe('alpha')
  })

  test('tokenizes input and paste without committing partial IME text', () => {
    const onChange = vi.fn()
    const screen = render(() => <TagsInput tokenSeparators={[',', ';']} onChange={onChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.input(input, { target: { value: 'alpha,beta;' } })
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta'])

    const clipboardData = { getData: () => 'gamma,delta' }
    fireEvent.paste(input, { clipboardData })
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta', 'gamma', 'delta'])

    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: '未,完' }, isComposing: true })
    expect(onChange).toHaveBeenCalledTimes(2)
    fireEvent.compositionEnd(input)
    expect(onChange).toHaveBeenCalledTimes(3)
  })

  test('prevents duplicates and enforces maxCount', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <TagsInput defaultValue={['alpha']} maxCount={2} onChange={onChange} />
    ))
    const input = screen.getByRole('textbox')
    fireEvent.input(input, { target: { value: 'alpha' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.input(input, { target: { value: 'beta' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.input(input, { target: { value: 'gamma' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta'])
  })

  test('Backspace removes the previous tag and tag actions preserve input focus', () => {
    const onChange = vi.fn()
    const screen = render(() => <TagsInput defaultValue={['alpha', 'beta']} onChange={onChange} />)
    const input = screen.getByRole('textbox')
    input.focus()
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith(['alpha'])
    fireEvent.click(screen.getByRole('button', { name: 'Remove alpha' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    expect(document.activeElement).toBe(input)
  })

  test('moves focus between tag remove actions and keeps the nearest tag after removal', async () => {
    const screen = render(() => <TagsInput defaultValue={['alpha', 'beta', 'gamma']} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    input.setSelectionRange(0, 0)
    fireEvent.keyDown(input, { key: 'ArrowLeft' })
    const gamma = screen.getByRole('button', { name: 'Remove gamma' })
    expect(document.activeElement).toBe(gamma)
    fireEvent.keyDown(gamma, { key: 'ArrowLeft' })
    const beta = screen.getByRole('button', { name: 'Remove beta' })
    expect(document.activeElement).toBe(beta)
    fireEvent.keyDown(beta, { key: 'Backspace' })
    await Promise.resolve()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove alpha' }))
  })

  test('supports controlled draft text', () => {
    const [inputValue, setInputValue] = createSignal('initial')
    const screen = render(() => (
      <TagsInput inputValue={inputValue()} onInputValueChange={setInputValue} />
    ))
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('initial')
    fireEvent.input(input, { target: { value: 'next' } })
    expect(untrack(inputValue)).toBe('next')
    expect(input.value).toBe('next')
  })

  test('clear clears tags and draft exactly once', () => {
    const onClear = vi.fn()
    const onChange = vi.fn()
    const screen = render(() => (
      <TagsInput
        defaultValue={['alpha']}
        defaultInputValue="draft"
        allowClear
        onClear={onClear}
        onChange={onChange}
      />
    ))
    fireEvent.click(screen.getByRole('button', { name: 'Clear tags' }))
    expect(onClear).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledOnce()
    expect(screen.container.querySelector('[data-slot="tag"]')).toBeNull()
  })

  test('keeps every committed tag reachable and has no overflow slot', () => {
    const screen = render(() => <TagsInput defaultValue={['a', 'b', 'c']} />)
    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(3)
    expect(screen.container.querySelector('[data-slot="tagOverflow"]')).toBeNull()
  })

  test('serializes arrays and restores uncontrolled values on native reset', async () => {
    const screen = render(() => (
      <form>
        <TagsInput name="tag" defaultValue={['a']} />
      </form>
    ))
    const form = screen.container.querySelector('form')!
    const input = screen.getByRole('textbox')
    fireEvent.input(input, { target: { value: 'b' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(new FormData(form).getAll('tag')).toEqual(['a', 'b'])
    form.reset()
    await Promise.resolve()
    expect(new FormData(form).getAll('tag')).toEqual(['a'])
  })

  test.each(['disabled', 'readOnly'] as const)('blocks mutation when %s', (state) => {
    const onChange = vi.fn()
    const screen = render(() => (
      <TagsInput {...{ [state]: true }} defaultValue={['a']} onChange={onChange} />
    ))
    fireEvent.click(screen.getByRole('button', { name: 'Remove a' }))
    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'b' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
