import type { ComputePositionConfig, Platform } from '@floating-ui/dom'
import { cleanup, render, waitFor } from '@solidjs/testing-library'
import { batch, createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { useFloatingPosition } from './floating.ts'
import type { FloatingPositionOptions } from './floating.ts'

const floatingMocks = vi.hoisted(() => ({
  computePosition: vi.fn(),
  cleanup: vi.fn(),
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
      return floatingMocks.cleanup
    },
    computePosition: floatingMocks.computePosition,
  }
})

interface DeferredPosition {
  middlewareData: { moraineTransformOrigin: { value: string } }
  placement: 'bottom'
  x: number
  y: number
}

function FloatingFixture(props: {
  open: () => boolean
  gutter?: () => number
  options?: Partial<FloatingPositionOptions>
  onPositionedChange: (open: boolean) => void
}) {
  let floatingElement: HTMLDivElement | undefined
  let referenceElement: HTMLButtonElement | undefined

  useFloatingPosition({
    floatingElement: () => floatingElement,
    getReferenceElement: () => referenceElement,
    gutter: () => props.gutter?.() ?? 4,
    onPlacementChange: () => undefined,
    onPositionedChange: (positioned) => props.onPositionedChange(positioned),
    open: () => props.open(),
    overflowPadding: () => 0,
    placement: () => 'bottom',
    // oxlint-disable-next-line subf/solid-reactivity -- Fixture options are fixed; reactive settings are passed as accessors.
    ...props.options,
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
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    floatingMocks.computePosition.mockReset()
    floatingMocks.cleanup.mockReset()
    floatingMocks.updates.length = 0
  })

  test('updates positioning without rebuilding subscriptions for configuration changes without tracking callback reads', async () => {
    const pending: Array<(position: DeferredPosition) => void> = []
    floatingMocks.computePosition.mockImplementation(
      () =>
        new Promise<DeferredPosition>((resolve) => {
          pending.push(resolve)
        }),
    )
    const [open, setOpen] = createSignal(false)
    const [gutter, setGutter] = createSignal(4)
    const [unrelated, setUnrelated] = createSignal(0)
    // oxlint-disable-next-line subf/solid-reactivity -- Deliberate callback reads verify that effects do not subscribe to unrelated state.
    const onPositionedChange = vi.fn(() => {
      unrelated()
    })
    const screen = render(() => (
      <FloatingFixture open={open} gutter={gutter} onPositionedChange={onPositionedChange} />
    ))
    expect(onPositionedChange).toHaveBeenCalledOnce()

    setUnrelated(1)
    expect(onPositionedChange).toHaveBeenCalledOnce()
    setOpen(true)
    expect(pending).toHaveLength(1)
    setGutter(12)
    expect(floatingMocks.cleanup).not.toHaveBeenCalled()
    expect(pending).toHaveLength(2)
    expect(floatingMocks.updates).toHaveLength(1)

    pending[1]!({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 20,
      y: 30,
    })
    await waitFor(() =>
      expect(screen.getByTestId('floating').style.transform).toBe('translate3d(20px, 30px, 0)'),
    )
    pending[0]!({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 1,
      y: 2,
    })
    await Promise.resolve()
    expect(screen.getByTestId('floating').style.transform).toBe('translate3d(20px, 30px, 0)')
    setUnrelated(2)
    expect(pending).toHaveLength(2)
    expect(floatingMocks.cleanup).not.toHaveBeenCalled()

    screen.unmount()
    expect(floatingMocks.cleanup).toHaveBeenCalledOnce()
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

    pending[1]!({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 20,
      y: 30,
    })
    await waitFor(() => {
      expect(screen.getByTestId('floating').style.transform).toBe('translate3d(20px, 30px, 0)')
    })

    pending[0]!({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 10,
      y: 15,
    })
    await Promise.resolve()

    expect(screen.getByTestId('floating').style.transform).toBe('translate3d(20px, 30px, 0)')
    expect(onPositionedChange.mock.calls).toEqual([[false], [true]])
  })

  test('batches configuration updates and preserves readiness across recalculations', async () => {
    floatingMocks.computePosition.mockResolvedValue({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 1,
      y: 2,
    })
    const [gutter, setGutter] = createSignal(4)
    const [padding, setPadding] = createSignal(0)
    const [open, setOpen] = createSignal(true)
    const ready = vi.fn()
    const screen = render(() => (
      <FloatingFixture
        open={open}
        gutter={gutter}
        onPositionedChange={ready}
        options={{ overflowPadding: padding }}
      />
    ))
    await waitFor(() => expect(ready.mock.calls).toEqual([[false], [true]]))
    batch(() => {
      setGutter(8)
      setPadding(4)
    })
    expect(floatingMocks.computePosition).toHaveBeenCalledTimes(2)
    expect(floatingMocks.updates).toHaveLength(1)
    expect(floatingMocks.cleanup).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(ready.mock.calls).toEqual([[false], [true]])
    setOpen(false)
    setOpen(true)
    await waitFor(() => expect(ready.mock.calls).toEqual([[false], [true], [false], [true]]))
    expect(floatingMocks.updates).toHaveLength(2)
    expect(floatingMocks.computePosition).toHaveBeenCalledTimes(3)
    floatingMocks.updates[0]!()
    expect(floatingMocks.computePosition).toHaveBeenCalledTimes(3)
    screen.unmount()
    expect(floatingMocks.cleanup).toHaveBeenCalledTimes(2)
  })

  test('does not commit after a placement callback closes the lifecycle', async () => {
    floatingMocks.computePosition.mockResolvedValue({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 1,
      y: 2,
    })
    const [open, setOpen] = createSignal(true)
    const ready = vi.fn()
    const screen = render(() => (
      <FloatingFixture
        open={open}
        onPositionedChange={ready}
        options={{ onPlacementChange: () => setOpen(false) }}
      />
    ))
    await waitFor(() => expect(floatingMocks.cleanup).toHaveBeenCalledOnce())
    expect(screen.getByTestId('floating').style.transform).toBe('')
    expect(screen.getByTestId('floating').style.visibility).toBe('hidden')
    expect(ready.mock.calls).toEqual([[false]])
  })

  test('uses the timer fallback once and cancels pending notifications on disposal', async () => {
    vi.useFakeTimers()
    const frame = vi.fn(() => 1)
    const cancel = vi.fn()
    vi.stubGlobal('requestAnimationFrame', frame)
    vi.stubGlobal('cancelAnimationFrame', cancel)
    floatingMocks.computePosition.mockResolvedValue({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 1,
      y: 2,
    })
    const [open, setOpen] = createSignal(true)
    const ready = vi.fn()
    const screen = render(() => (
      <FloatingFixture open={open} onPositionedChange={ready} options={{ deferPositioned: true }} />
    ))
    await Promise.resolve()
    floatingMocks.updates[0]!()
    await Promise.resolve()
    expect(frame).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(16)
    expect(ready.mock.calls).toEqual([[false], [true]])
    expect(cancel).toHaveBeenCalledOnce()
    floatingMocks.updates[0]!()
    await Promise.resolve()
    expect(frame).toHaveBeenCalledOnce()
    setOpen(false)
    setOpen(true)
    await Promise.resolve()
    screen.unmount()
    await vi.runAllTimersAsync()
    expect(ready.mock.calls).toEqual([[false], [true], [false]])
  })

  test('starts after late mounting and cleans up element replacement and reference removal', async () => {
    const [floating, setFloating] = createSignal<HTMLElement>()
    const [reference, setReference] = createSignal<HTMLElement>()
    const ready = vi.fn()
    const pending: Array<(position: DeferredPosition) => void> = []
    floatingMocks.computePosition.mockImplementation(
      () => new Promise<DeferredPosition>((resolve) => pending.push(resolve)),
    )
    const screen = render(() => (
      <FloatingFixture
        open={() => true}
        onPositionedChange={ready}
        options={{ floatingElement: floating, getReferenceElement: reference }}
      />
    ))
    expect(floatingMocks.updates).toHaveLength(0)
    const first = screen.getByTestId('floating')
    batch(() => {
      setFloating(first)
      setReference(screen.getByRole('button'))
    })
    expect(pending).toHaveLength(1)
    const second = document.createElement('div')
    document.body.append(second)
    setFloating(second)
    expect(floatingMocks.cleanup).toHaveBeenCalledOnce()
    expect(pending).toHaveLength(2)
    pending[0]!({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 1,
      y: 2,
    })
    pending[1]!({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 3,
      y: 4,
    })
    await Promise.resolve()
    expect(first.style.transform).toBe('')
    expect(second.style.transform).toBe('translate3d(3px, 4px, 0)')
    setReference(undefined)
    expect(floatingMocks.cleanup).toHaveBeenCalledTimes(2)
    expect(second.style.visibility).toBe('hidden')
    screen.unmount()
    second.remove()
  })

  test('captures a virtual reference once and rejects a removed context element', async () => {
    let resolve!: (position: DeferredPosition) => void
    floatingMocks.computePosition.mockImplementation(
      () =>
        new Promise<DeferredPosition>((done) => {
          resolve = done
        }),
    )
    const context = document.createElement('button')
    document.body.append(context)
    const reference = vi.fn(() => ({
      contextElement: context,
      getBoundingClientRect: () => context.getBoundingClientRect(),
    }))
    const ready = vi.fn()
    render(() => (
      <FloatingFixture
        open={() => true}
        onPositionedChange={ready}
        options={{ getReferenceElement: reference }}
      />
    ))
    resolve({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 1,
      y: 2,
    })
    await Promise.resolve()
    expect(ready.mock.calls).toEqual([[false], [true]])
    expect(reference).toHaveBeenCalledOnce()
    floatingMocks.updates[0]!()
    context.remove()
    resolve({
      middlewareData: { moraineTransformOrigin: { value: '50% -4px' } },
      placement: 'bottom',
      x: 20,
      y: 30,
    })
    await Promise.resolve()
    expect(ready.mock.calls).toEqual([[false], [true]])
    expect(reference).toHaveBeenCalledOnce()
  })
})

// Exercise the installed middleware with deterministic geometry instead of jsdom layout.
async function useGeometry(clippingSize = 500, beforeMeasure?: () => Promise<void>) {
  const actual = await vi.importActual<typeof import('@floating-ui/dom')>('@floating-ui/dom')
  const geometry: Platform = {
    isRTL: () => false,
    getClientRects: () => [],
    getElementRects: async () => {
      await beforeMeasure?.()
      return {
        reference: { x: 10.3, y: 20.3, width: 40.3, height: 20 },
        floating: { x: 0, y: 0, width: 80, height: 40 },
      }
    },
    getClippingRect: () => ({ x: 0, y: 0, width: clippingSize, height: clippingSize }),
    getDimensions: () => ({ width: 80, height: 40 }),
    getOffsetParent: () => window,
    isElement: (element) => element instanceof Element,
    convertOffsetParentRelativeRectToViewportRelativeRect: ({ rect }) => rect,
    getScale: () => ({ x: 1, y: 1 }),
    getDocumentElement: () => document.documentElement,
  }
  floatingMocks.computePosition.mockImplementation(
    (reference, floating, config: ComputePositionConfig) =>
      actual.computePosition(reference, floating, {
        ...config,
        platform: { ...geometry, isRTL: config.platform!.isRTL },
      }),
  )
}

describe('floating geometry and style ownership', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    floatingMocks.computePosition.mockReset()
    floatingMocks.cleanup.mockReset()
    floatingMocks.updates.length = 0
  })

  test.each([1, 1.25, 2])('rounds coordinates and anchor width at DPR %s', async (dpr) => {
    await useGeometry()
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(dpr)
    const screen = render(() => (
      <FloatingFixture
        open={() => true}
        onPositionedChange={() => {}}
        options={{
          placement: () => 'bottom-start',
          flip: () => false,
          slide: () => false,
          overlap: () => false,
        }}
      />
    ))
    const floating = screen.getByTestId('floating')
    const round = (value: number) => Math.round(value * dpr) / dpr
    await waitFor(() =>
      expect(floating.style.transform).toBe(`translate3d(${round(10.3)}px, ${round(44.3)}px, 0)`),
    )
    expect(floating.style.getPropertyValue('--mo-popper-anchor-width')).toBe(`${round(40.3)}px`)
    expect(floating.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe('0% -4px')
  })

  describe.each([8, -8])('cross-axis offset %s', (shift) => {
    test.each([
      { placement: 'bottom', direction: 'ltr', baseX: -9.55, sign: 1 },
      { placement: 'bottom-start', direction: 'ltr', baseX: 10.3, sign: 1 },
      { placement: 'bottom-end', direction: 'ltr', baseX: -29.4, sign: -1 },
      { placement: 'bottom', direction: 'rtl', baseX: -9.55, sign: -1 },
      { placement: 'bottom-start', direction: 'rtl', baseX: -29.4, sign: -1 },
      { placement: 'bottom-end', direction: 'rtl', baseX: 10.3, sign: 1 },
    ] as const)(
      'positions $placement in $direction',
      async ({ placement, direction, baseX, sign }) => {
        await useGeometry()
        vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1)
        const screen = render(() => (
          <FloatingFixture
            open={() => true}
            onPositionedChange={() => {}}
            options={{
              placement: () => placement,
              shift: () => shift,
              flip: () => false,
              slide: () => false,
              overlap: () => false,
            }}
          />
        ))
        const floating = screen.getByTestId('floating')
        floating.dir = direction
        floatingMocks.updates[0]!()
        await waitFor(() =>
          expect(floating.style.transform).toBe(
            `translate3d(${Math.round(baseX + sign * shift)}px, 44px, 0)`,
          ),
        )
      },
    )
  })

  test('invalidates size writes as soon as configuration changes while the replacement request is pending', async () => {
    const releases: Array<() => void> = []
    await useGeometry(500, () => new Promise<void>((resolve) => releases.push(resolve)))
    const [constraints, setConstraints] = createSignal(true)
    const ready = vi.fn()
    const screen = render(() => (
      <FloatingFixture
        open={() => true}
        onPositionedChange={ready}
        options={{ sameWidth: constraints, fitViewport: constraints }}
      />
    ))
    await waitFor(() => expect(releases).toHaveLength(1))
    setConstraints(false)
    await waitFor(() => expect(releases).toHaveLength(2))
    const floating = screen.getByTestId('floating')
    const writes = vi.spyOn(floating.style, 'setProperty')
    releases[0]!()
    await floatingMocks.computePosition.mock.results[0]!.value
    await Promise.resolve()
    expect(writes).not.toHaveBeenCalled()
    expect(floating.style.transform).toBe('')
    expect(ready.mock.calls).toEqual([[false]])

    releases[1]!()
    await waitFor(() => expect(ready.mock.calls).toEqual([[false], [true]]))
    expect(floating.style.width).toBe('')
    expect(floating.style.maxWidth).toBe('')
    expect(floating.style.maxHeight).toBe('')
    expect(floatingMocks.updates).toHaveLength(1)
    expect(floatingMocks.cleanup).not.toHaveBeenCalled()
  })

  test('restores inline constraints before measuring disabled options and preserves author changes', async () => {
    await useGeometry()
    const [enabled, setEnabled] = createSignal(true)
    const [target, setTarget] = createSignal<HTMLElement>()
    const first = document.createElement('div')
    first.style.setProperty('width', '13px', 'important')
    first.style.maxWidth = '19px'
    first.style.maxHeight = '23px'
    const second = document.createElement('div')
    setTarget(first)
    const screen = render(() => (
      <FloatingFixture
        open={() => true}
        onPositionedChange={() => {}}
        options={{ contentElement: target, sameWidth: enabled, fitViewport: enabled }}
      />
    ))
    await waitFor(() => expect(first.style.width).toBe('40px'))
    setTarget(second)
    expect(first.style.width).toBe('13px')
    expect(first.style.getPropertyPriority('width')).toBe('important')
    expect(first.style.maxWidth).toBe('19px')
    expect(first.style.maxHeight).toBe('23px')
    await waitFor(() => expect(second.style.width).toBe('40px'))
    second.style.maxHeight = '77px'
    setEnabled(false)
    expect(second.style.width).toBe('')
    expect(second.style.maxWidth).toBe('')
    expect(second.style.maxHeight).toBe('77px')
    expect(floatingMocks.updates).toHaveLength(1)
    setEnabled(true)
    await waitFor(() => expect(second.style.width).toBe('40px'))
    screen.unmount()
    expect(second.style.width).toBe('')
    expect(second.style.maxHeight).toBe('77px')
  })

  test('clamps negative available sizes and computes RTL origin with the actual pipeline', async () => {
    await useGeometry(0)
    const target = document.createElement('div')
    target.dir = 'rtl'
    document.body.append(target)
    render(() => (
      <FloatingFixture
        open={() => true}
        onPositionedChange={() => {}}
        options={{
          floatingElement: () => target,
          fitViewport: () => true,
          placement: () => 'bottom-start',
          flip: () => false,
          slide: () => false,
          overlap: () => false,
        }}
      />
    ))
    await waitFor(() => expect(target.style.maxHeight).toBe('0px'))
    expect(target.style.maxWidth).toBe('0px')
    expect(target.style.getPropertyValue('--mo-popper-content-available-width')).toBe('0px')
    expect(target.style.getPropertyValue('--mo-popper-content-available-height')).toBe('0px')
    await waitFor(() =>
      expect(target.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe(
        '100% -4px',
      ),
    )
    target.remove()
  })
  test('ignores size writes from obsolete requests and callbacks after disposal', async () => {
    let release!: () => void
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    let first = true
    await useGeometry(500, () => {
      if (first) {
        first = false
        return blocked
      }
      return Promise.resolve()
    })
    const [gutter, setGutter] = createSignal(4)
    const screen = render(() => (
      <FloatingFixture
        open={() => true}
        gutter={gutter}
        onPositionedChange={() => {}}
        options={{ sameWidth: () => true, fitViewport: () => true }}
      />
    ))
    const floating = screen.getByTestId('floating')
    const writes = vi.spyOn(floating.style, 'setProperty')
    setGutter(8)
    await waitFor(() => expect(floating.style.visibility).toBe('visible'))
    const count = writes.mock.calls.length
    const transform = floating.style.transform
    release()
    await floatingMocks.computePosition.mock.results[0]!.value
    await Promise.resolve()
    expect(writes).toHaveBeenCalledTimes(count)
    expect(floating.style.transform).toBe(transform)
    screen.unmount()
    const requests = floatingMocks.computePosition.mock.calls.length
    floatingMocks.updates[0]!()
    expect(floatingMocks.computePosition).toHaveBeenCalledTimes(requests)
  })
})
