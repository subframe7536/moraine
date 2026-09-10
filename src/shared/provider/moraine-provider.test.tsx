import { render } from '@solidjs/testing-library'
import { createComponent, createSignal, onCleanup } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Button } from '../../elements/button/button'
import { Input } from '../../forms/input/input'
import { createTheme } from '../../theme/create-theme'
import { defaultTheme } from '../../theme/default-theme'
import { emptyTheme } from '../../theme/types'
import type { MoraineTheme } from '../../theme/types'

import { MoraineProvider } from './moraine-provider'

describe('MoraineProvider', () => {
  test('uses empty presentation at the root unless the official theme is supplied', () => {
    const screen = render(() => (
      <>
        <MoraineProvider>
          <Button class="custom">Headless</Button>
        </MoraineProvider>
        <MoraineProvider theme={defaultTheme}>
          <Button>Official</Button>
        </MoraineProvider>
      </>
    ))
    expect(screen.getByRole('button', { name: 'Headless' }).className).toBe('custom')
    expect(screen.getByRole('button', { name: 'Official' }).className).toContain('bg-primary')
    expect(screen.getByRole('button', { name: 'Official' }).className).toContain('h-8')
  })

  test('inherits reactively, replaces explicit themes, and restores inheritance for undefined', () => {
    const parent = createTheme({
      extends: defaultTheme,
      button: { defaults: { size: 'sm' }, base: { root: 'parent-class' } },
    })
    const [outer, setOuter] = createSignal(parent)
    const [inner, setInner] = createSignal<MoraineTheme | undefined>()
    const screen = render(() => (
      <MoraineProvider theme={outer()}>
        <MoraineProvider theme={inner()}>
          <MoraineProvider>
            <Button>Save</Button>
          </MoraineProvider>
        </MoraineProvider>
      </MoraineProvider>
    ))
    const button = screen.getByRole('button')
    expect(button.className).toContain('parent-class')
    expect(button.className).toContain('h-7')
    setInner(createTheme({ button: { base: { root: 'child-class' } } }))
    expect(button.className).toBe('child-class')
    setOuter(createTheme({ button: { base: { root: 'next-parent' } } }))
    expect(button.className).toBe('child-class')
    setInner(undefined)
    expect(button.className).toBe('next-parent')
    setOuter(parent)
    expect(button.className).toContain('parent-class')
    setInner(emptyTheme)
    expect(button.className).toBe('')
    setOuter(createTheme({ button: { base: { root: 'latest-parent' } } }))
    expect(button.className).toBe('')
    setInner(undefined)
    expect(button.className).toBe('latest-parent')
    expect(screen.getByRole('button')).toBe(button)
  })

  test('evaluates children inside their theme owner once and isolates sibling trees', () => {
    const [theme, setTheme] = createSignal(
      createTheme({ button: { base: { root: 'first-theme' } } }),
    )
    let reads = 0
    let mounts = 0
    let cleanups = 0
    function Child() {
      mounts++
      onCleanup(() => cleanups++)
      return <Button>Owned</Button>
    }
    const screen = render(() => (
      <>
        {createComponent(MoraineProvider, {
          get theme() {
            return theme()
          },
          get children() {
            reads++
            return <Child />
          },
        })}
        <MoraineProvider theme={emptyTheme}>
          <Button>Sibling</Button>
        </MoraineProvider>
      </>
    ))
    expect(reads).toBe(1)
    expect(screen.getByRole('button', { name: 'Owned' }).className).toBe('first-theme')
    setTheme(createTheme({ button: { base: { root: 'second-theme' } } }))
    expect(screen.getByRole('button', { name: 'Owned' }).className).toBe('second-theme')
    expect(screen.getByRole('button', { name: 'Sibling' }).className).toBe('')
    expect([reads, mounts, cleanups]).toEqual([1, 1, 0])
    screen.unmount()
    expect(cleanups).toBe(1)
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
