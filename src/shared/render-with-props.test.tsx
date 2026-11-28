import { render } from '@solidjs/testing-library'
import type { JSX } from '@solidjs/web'
import { Show, createSignal, flush, onCleanup } from 'solid-js'
import { describe, expect, vi, it } from 'vitest'

import { renderWithProps } from './render-with-props'
describe('renderWithProps', () => {
  it('returns static JSX unchanged without props argument', () => {
    let element!: JSX.Element
    const screen = render(() => {
      element = <span>Static content</span>
      return renderWithProps(element)
    })

    expect(screen.container.firstChild).toBe(element)
  })

  it('mounts a renderer with reactive props', () => {
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

    flush(() => setValue('second'))

    expect(screen.container.textContent).toBe('second')
  })

  it('preserves undefined and static primitive values without props', () => {
    const screen = render(() => (
      <div>
        <span data-testid="undefined">{renderWithProps(undefined)}</span>
        <span data-testid="zero">{renderWithProps(0)}</span>
        <span data-testid="false">{renderWithProps(false)}</span>
      </div>
    ))

    expect(screen.getByTestId('undefined').textContent).toBe('')
    expect(screen.getByTestId('zero').textContent).toBe('0')
    expect(screen.getByTestId('false').textContent).toBe('')
  })

  it('mounts a zero-argument renderer without props', () => {
    const screen = render(() => (
      <div>
        {renderWithProps(() => (
          <span>Zero props</span>
        ))}
      </div>
    ))

    expect(screen.container.textContent).toBe('Zero props')
  })

  it('owns renderer cleanup across conditional mounts', () => {
    const cleanup = vi.fn<(...args: Array<any>) => void>()
    const Owned = () => {
      onCleanup(cleanup)
      return <span>Owned content</span>
    }
    const [visible, setVisible] = createSignal(true)
    const screen = render(() => <Show when={visible()}>{renderWithProps(Owned)}</Show>)

    expect(cleanup).not.toHaveBeenCalled()

    flush(() => setVisible(false))
    expect(cleanup).toHaveBeenCalledOnce()

    flush(() => setVisible(true))
    screen.unmount()
    expect(cleanup).toHaveBeenCalledTimes(2)
  })
})
