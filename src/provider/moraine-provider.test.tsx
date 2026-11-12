import { render } from '@solidjs/testing-library'
import { createComponent, createSignal, onCleanup } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Button } from '../components/button/button'
import { Input } from '../components/input/input'
import { defineTheme } from '../theme/create-theme'
import type { MoraineTheme } from '../theme/types'

import { MoraineProvider } from './moraine-provider'

describe('MoraineProvider', () => {
  test('preserves instance classes on components rendered under a Provider', () => {
    const screen = render(() => (
      <>
        <MoraineProvider>
          <Button class="custom">Customized</Button>
        </MoraineProvider>
        <MoraineProvider>
          <Button>Default</Button>
        </MoraineProvider>
      </>
    ))
    expect(screen.getByRole('button', { name: 'Customized' }).className).toContain('custom')
    expect(screen.getByRole('button', { name: 'Default' }).className).not.toContain('custom')
  })

  test('inherits reactively, replaces explicit themes, and restores inheritance for undefined', () => {
    const parent = defineTheme({
      button: {
        defaultVariants: { size: 'sm' },
        base: { root: 'parent-class' },
        variants: { size: { sm: { root: 'parent-sm' }, lg: { root: 'parent-lg' } } },
      },
    })
    const [outer, setOuter] = createSignal<ReturnType<typeof defineTheme> | null>(parent)
    const [inner, setInner] = createSignal<MoraineTheme | null | undefined>()
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
    expect(button.className).toContain('parent-sm')
    setInner(defineTheme({ button: { base: { root: 'child-class' } } }))
    expect(button.className).toContain('child-class')
    setOuter(defineTheme({ button: { base: { root: 'next-parent' } } }))
    expect(button.className).toContain('child-class')
    setInner(undefined)
    expect(button.className).toContain('next-parent')
    setOuter(parent)
    expect(button.className).toContain('parent-class')
    setInner(null)
    expect(button.className).not.toContain('parent-class')
    setOuter(defineTheme({ button: { base: { root: 'latest-parent' } } }))
    expect(button.className).not.toContain('latest-parent')
    setInner(undefined)
    expect(button.className).toContain('latest-parent')
    expect(screen.getByRole('button')).toBe(button)
  })

  test('isolates sibling trees and unmounts children owned by the Provider', () => {
    const [theme, setTheme] = createSignal(
      defineTheme({ button: { base: { root: 'first-theme' } } }),
    )
    let cleanups = 0
    function Child() {
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
            return <Child />
          },
        })}
        <MoraineProvider theme={null}>
          <Button>Sibling</Button>
        </MoraineProvider>
      </>
    ))
    expect(screen.getByRole('button', { name: 'Owned' }).className).toContain('first-theme')
    setTheme(defineTheme({ button: { base: { root: 'second-theme' } } }))
    expect(screen.getByRole('button', { name: 'Owned' }).className).toContain('second-theme')
    expect(screen.getByRole('button', { name: 'Sibling' }).className).not.toContain('second-theme')
    expect(cleanups).toBe(0)
    screen.unmount()
    expect(cleanups).toBe(1)
  })

  test('keeps components functional without a Provider', () => {
    let clicks = 0
    const screen = render(() => <Button onClick={() => clicks++}>Save</Button>)
    screen.getByRole('button').click()
    expect(clicks).toBe(1)
  })

  test('replaces themes without losing native input state or focus', () => {
    const [theme, setTheme] = createSignal(defineTheme({ input: { base: { root: 'p-2' } } }))
    const screen = render(() => (
      <MoraineProvider theme={theme()}>
        <Input defaultValue="hello" />
      </MoraineProvider>
    ))
    const input = screen.getByRole('textbox') as HTMLInputElement
    input.focus()
    input.value = 'draft'
    input.setSelectionRange(1, 3)
    setTheme(defineTheme({ input: { base: { root: 'p-4' }, defaultVariants: { size: 'lg' } } }))
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input.className).toContain('p-4')
    expect(input.value).toBe('draft')
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 3])
  })
})
