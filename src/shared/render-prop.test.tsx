import { render } from '@solidjs/testing-library'
import { createSignal, onCleanup } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { renderComponentOrElement } from './render-prop.ts'

describe('renderComponentOrElement', () => {
  test('returns static JSX unchanged', () => {
    const element = <span>Static content</span>
    const screen = render(() => renderComponentOrElement(element, {}))

    expect(screen.container.firstChild).toBe(element)
  })

  test('mounts components with reactive props', () => {
    const [value, setValue] = createSignal('first')
    const Value = (props: { value: string }) => <span>{props.value}</span>
    const screen = render(() =>
      renderComponentOrElement(Value, {
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
        <span data-testid="undefined">{renderComponentOrElement(undefined, {})}</span>
        <span data-testid="zero">{renderComponentOrElement(0, {})}</span>
        <span data-testid="false">{renderComponentOrElement(false, {})}</span>
      </div>
    ))

    expect(screen.getByTestId('undefined').textContent).toBe('')
    expect(screen.getByTestId('zero').textContent).toBe('0')
    expect(screen.getByTestId('false').textContent).toBe('')
  })

  test('preserves component ownership and cleanup', () => {
    const cleanup = vi.fn()
    const Owned = () => {
      onCleanup(cleanup)
      return <span>Owned content</span>
    }
    const screen = render(() => renderComponentOrElement(Owned, {}))

    expect(cleanup).not.toHaveBeenCalled()

    screen.unmount()

    expect(cleanup).toHaveBeenCalledOnce()
  })
})
