import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Button } from '../../elements/button/button.tsx'
import { Input } from '../../forms/input/input.tsx'
import { createTheme } from '../../theme/create-theme.ts'

import { MoraineProvider, MoraineUnstyledProvider } from './moraine-provider.tsx'

describe('MoraineProvider', () => {
  test('supplies official root presentation without a theme prop', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Button>Save</Button>
      </MoraineProvider>
    ))
    expect(screen.getByRole('button').className).toContain('bg-primary')
    expect(screen.getByRole('button').className).toContain('h-8')
  })

  test('appends nested layers without adding the official layer again', () => {
    const parent = createTheme({ button: { defaults: { size: 'sm' }, base: { root: 'p-4' } } })
    const child = createTheme({ button: { base: { root: 'p-6' } } })
    const screen = render(() => (
      <MoraineProvider theme={parent}>
        <MoraineProvider theme={child}>
          <Button>Save</Button>
        </MoraineProvider>
      </MoraineProvider>
    ))
    const button = screen.getByRole('button')
    expect(button.className).toContain('h-7')
    expect(button.className).toContain('p-6')
    expect(button.className).not.toContain('p-4')
  })

  test('resets inherited and official layers across styled descendants', () => {
    const parent = createTheme({ button: { base: { root: 'parent-class' } } })
    const custom = createTheme({ button: { base: { root: 'reset-class' } } })
    const screen = render(() => (
      <MoraineProvider theme={parent}>
        <MoraineUnstyledProvider theme={custom}>
          <MoraineProvider>
            <Button>Save</Button>
          </MoraineProvider>
        </MoraineUnstyledProvider>
      </MoraineProvider>
    ))
    expect(screen.getByRole('button').className).toBe('reset-class')
  })

  test('keeps a missing Provider functional and unstyled', () => {
    let clicks = 0
    const screen = render(() => <Button onClick={() => clicks++}>Save</Button>)
    const button = screen.getByRole('button')
    button.click()
    expect(clicks).toBe(1)
    expect(button.className).toBe('')
  })

  test('replaces themes without losing native input state or focus', () => {
    const [theme, setTheme] = createSignal(createTheme({ input: { base: { root: 'p-2' } } }))
    const screen = render(() => (
      <MoraineProvider theme={theme()}>
        <Input defaultValue="hello" />
      </MoraineProvider>
    ))
    const input = screen.getByRole('textbox') as HTMLInputElement
    const root = input.parentElement
    input.focus()
    input.value = 'draft'
    input.setSelectionRange(1, 3)
    setTheme(createTheme({ input: { base: { root: 'p-4' }, defaults: { size: 'lg' } } }))
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input.parentElement).toBe(root)
    expect(root?.className).toContain('p-4')
    expect(input.value).toBe('draft')
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 3])
  })
})
