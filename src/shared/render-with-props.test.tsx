import { render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { Show, createSignal, onCleanup } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { renderWithProps } from './render-with-props'

describe('renderWithProps', () => {
  test('returns static JSX unchanged', () => {
    let element!: JSX.Element
    const screen = render(() => {
      element = <span>Static content</span>
      return renderWithProps(element, {})
    })

    expect(screen.container.firstChild).toBe(element)
  })

  test('mounts a renderer with reactive props', () => {
    const [value, setValue] = createSignal('first')
    const Value = (props: { value: string }) => <span>{props.value}</span>
    const screen = render(() =>
      renderWithProps(Value, {
        get value() {
          return value()
        },
      }),
    )

    expect(screen.container.textContent).toBe('first')

    setValue('second')

    expect(screen.container.textContent).toBe('second')
  })

  test('preserves undefined and static primitive values', () => {
    const screen = render(() => (
      <div>
        <span data-testid="undefined">{renderWithProps(undefined, {})}</span>
        <span data-testid="zero">{renderWithProps(0, {})}</span>
        <span data-testid="false">{renderWithProps(false, {})}</span>
      </div>
    ))

    expect(screen.getByTestId('undefined').textContent).toBe('')
    expect(screen.getByTestId('zero').textContent).toBe('0')
    expect(screen.getByTestId('false').textContent).toBe('')
  })

  test('owns renderer cleanup across conditional mounts', () => {
    const cleanup = vi.fn()
    const Owned = () => {
      onCleanup(cleanup)
      return <span>Owned content</span>
    }
    const [visible, setVisible] = createSignal(true)
    const screen = render(() => <Show when={visible()}>{renderWithProps(Owned, {})}</Show>)

    expect(cleanup).not.toHaveBeenCalled()

    setVisible(false)
    expect(cleanup).toHaveBeenCalledOnce()

    setVisible(true)
    screen.unmount()
    expect(cleanup).toHaveBeenCalledTimes(2)
  })
})
