import { render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { useFloatingPosition } from './floating'

const floatingMocks = vi.hoisted(() => ({
  computePosition: vi.fn(),
  updates: [] as Array<() => void>,
}))

vi.mock('@floating-ui/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@floating-ui/dom')>()

  return {
    ...actual,
    autoUpdate: (...args: Parameters<typeof actual.autoUpdate>) => {
      const update = args[2]
      floatingMocks.updates.push(update)
      update()
      return () => undefined
    },
    computePosition: floatingMocks.computePosition,
  }
})

interface DeferredPosition {
  middlewareData: Record<string, never>
  placement: 'bottom'
  x: number
  y: number
}

function FloatingFixture(props: {
  open: () => boolean
  onPositionedChange: (open: boolean) => void
}) {
  let floatingElement: HTMLDivElement | undefined
  let referenceElement: HTMLButtonElement | undefined

  useFloatingPosition({
    floatingElement: () => floatingElement,
    getReferenceElement: () => referenceElement,
    gutter: () => 4,
    onPlacementChange: () => undefined,
    onPositionedChange: (positioned) => props.onPositionedChange(positioned),
    open: () => props.open(),
    overflowPadding: () => 0,
    placement: () => 'bottom',
  })

  return (
    <>
      <button ref={(element) => (referenceElement = element)} type="button">
        Reference
      </button>
      <div ref={(element) => (floatingElement = element)} data-testid="floating" />
    </>
  )
}

describe('useFloatingPosition', () => {
  afterEach(() => {
    floatingMocks.computePosition.mockReset()
    floatingMocks.updates.length = 0
  })

  test('ignores an older position result that resolves after a newer request', async () => {
    const pending: Array<(position: DeferredPosition) => void> = []
    floatingMocks.computePosition.mockImplementation(
      () =>
        new Promise<DeferredPosition>((resolve) => {
          pending.push(resolve)
        }),
    )
    const [open] = createSignal(true)
    const onPositionedChange = vi.fn()

    const screen = render(() => (
      <FloatingFixture open={open} onPositionedChange={onPositionedChange} />
    ))

    await waitFor(() => expect(pending).toHaveLength(1))
    floatingMocks.updates[0]!()
    await waitFor(() => expect(pending).toHaveLength(2))

    pending[1]!({ middlewareData: {}, placement: 'bottom', x: 20, y: 30 })
    await waitFor(() => {
      expect(screen.getByTestId('floating').style.transform).toBe('translate3d(20px, 30px, 0)')
    })

    pending[0]!({ middlewareData: {}, placement: 'bottom', x: 10, y: 15 })
    await Promise.resolve()

    expect(screen.getByTestId('floating').style.transform).toBe('translate3d(20px, 30px, 0)')
    expect(onPositionedChange).toHaveBeenCalledTimes(1)
  })
})
