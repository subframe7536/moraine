import { render } from '@solidjs/testing-library'
import { createRoot, createSignal, Show } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { bindElement, publishElement } from './element-binding'

describe('bindElement', () => {
  test('binds each element and cleans up on change and disposal', async () => {
    const log: string[] = []
    const [element, setElement] = createSignal<string>()
    const dispose = createRoot((dispose) => {
      bindElement(element, (value) => {
        log.push(`bind ${value}`)
        return () => log.push(`release ${value}`)
      })
      return dispose
    })

    await Promise.resolve()
    expect(log).toEqual([])

    setElement('a')
    expect(log).toEqual(['bind a'])

    setElement('b')
    expect(log).toEqual(['bind a', 'release a', 'bind b'])

    setElement(undefined)
    expect(log).toEqual(['bind a', 'release a', 'bind b', 'release b'])

    setElement('c')
    dispose()
    expect(log.slice(-2)).toEqual(['bind c', 'release c'])
  })

  test('registers elements created inside a Show branch for the branch lifetime', async () => {
    const mounted: HTMLElement[] = []
    const [open, setOpen] = createSignal(true)

    const screen = render(() => (
      <Show when={open()}>
        {(_open) => {
          const [element, setElement] = createSignal<HTMLElement>()
          bindElement(element, (node) => {
            mounted.push(node)
            return () => mounted.splice(mounted.indexOf(node), 1)
          })
          return <div data-testid="branch" ref={setElement} />
        }}
      </Show>
    ))

    await Promise.resolve()
    expect(mounted).toEqual([screen.getByTestId('branch')])

    setOpen(false)
    expect(mounted).toEqual([])

    setOpen(true)
    await Promise.resolve()
    expect(mounted).toEqual([screen.getByTestId('branch')])
  })
})

describe('publishElement', () => {
  test('clears the target only while it still holds the published element', () => {
    let target: string | undefined
    const publish = publishElement(
      () => target,
      (value) => (target = value),
    )

    const releaseA = publish('a')
    const releaseB = publish('b')
    expect(target).toBe('b')

    releaseA()
    expect(target).toBe('b')

    releaseB()
    expect(target).toBeUndefined()
  })
})
