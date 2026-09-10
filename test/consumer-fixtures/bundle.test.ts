// @vitest-environment jsdom

import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { installHydrationState } from '../../src/test-utils/ssr-test'

import { buildConsumerBundle } from './bundle'

describe('published component bundle ownership', () => {
  test.each(['esm', 'client', 'ssr'] as const)(
    'tree-shakes a %s component consumer without optional dependencies',
    async (mode) => {
      const bundle = await buildConsumerBundle("export { Button } from 'moraine'", {
        mode,
        virtualizer: false,
      })
      expect(bundle.code).toContain('Button')
      expect(bundle.code).not.toContain('defaultTheme')
      expect(bundle.code).not.toContain('sliderRecipe')
      expect(bundle.code).not.toContain('animate-accordion-down')
      expect(bundle.code).not.toContain('Dialog')
      expect(bundle.code).not.toContain('Resizable')
      expect(
        bundle.modules.some((id) => id.includes('@floating-ui') || id.includes('@tanstack')),
      ).toBe(false)
      expect(bundle.gzip).toBeLessThan(40_000)
      expect(
        bundle.modules.some((id) => id.endsWith(mode === 'esm' ? '/button.mjs' : '/button.jsx')),
      ).toBe(true)
    },
  )

  test('keeps the Provider independent of official presentation', async () => {
    const bundle = await buildConsumerBundle("export { Button, MoraineProvider } from 'moraine'")
    expect(bundle.code).not.toContain('defaultTheme')
    expect(bundle.code).not.toContain('sliderRecipe')
    expect(bundle.code).not.toContain('animate-accordion-down')
  })

  test('includes official presentation when explicitly imported from the theme entry', async () => {
    const bundle = await buildConsumerBundle(
      "export { Button, MoraineProvider } from 'moraine'; export { defaultTheme } from 'moraine/theme'",
    )
    expect(bundle.code).toContain('defaultTheme')
    expect(bundle.code).toContain('sliderRecipe')
    expect(bundle.code).toContain('animate-accordion-down')
  })
})

test('hydrates published components with shared context, scoped styles, and attached children', async () => {
  const source = `
    import { createSignal } from 'solid-js'
    import { hydrate, renderToString } from 'solid-js/web'
    import { Button, Collapsible, MoraineProvider, renderComponentOrElement as rootRender } from 'moraine'
    import { createContextProvider, renderComponentOrElement as utilsRender } from 'moraine/utils'
    import { createTheme } from 'moraine/theme'

    export const sharedRender = rootRender === utilsRender
    const [CounterProvider, useCounter] = createContextProvider('Counter')
    const theme = createTheme({ button: { base: { root: 'consumer-theme density-roomy density-compact' } } })
    function Label() {
      const count = useCounter()
      return <span data-counter>{count()}</span>
    }
    function App() {
      const [count, setCount] = createSignal(0)
      return <MoraineProvider theme={theme} cnConfig={{ extend: { classGroups: { density: ['density-roomy', 'density-compact'] } } }}>
        <CounterProvider value={count}>
          <Button onClick={() => setCount(value => value + 1)}><Label /></Button>
          <Collapsible defaultOpen>
            <Collapsible.Trigger>Details</Collapsible.Trigger>
            <Collapsible.Content><p data-details>Visible details</p></Collapsible.Content>
          </Collapsible>
        </CounterProvider>
      </MoraineProvider>
    }
    export const markup = () => renderToString(() => <App />)
    export const mount = container => hydrate(() => <App />, container)
  `
  const serverBundle = await buildConsumerBundle(source, { mode: 'ssr', virtualizer: false })
  const clientBundle = await buildConsumerBundle(source, { mode: 'client', virtualizer: false })
  const server = await import(
    `data:text/javascript;base64,${Buffer.from(serverBundle.code).toString('base64')}`
  )
  const client = await import(
    `data:text/javascript;base64,${Buffer.from(clientBundle.code).toString('base64')}`
  )
  const container = document.createElement('div')
  container.innerHTML = server.markup()
  document.body.append(container)
  const originalCounter = container.querySelector('[data-counter]')
  const originalDetails = container.querySelector('[data-details]')
  expect(originalCounter?.textContent).toBe('0')
  expect(originalDetails?.textContent).toBe('Visible details')
  const restore = installHydrationState()
  let dispose: (() => void) | undefined
  try {
    dispose = client.mount(container)
    expect(server.sharedRender).toBe(true)
    expect(client.sharedRender).toBe(true)
    expect(container.querySelector('[data-counter]')).toBe(originalCounter)
    expect(container.querySelector('[data-details]')).toBe(originalDetails)
    const button = container.querySelector('button')!
    expect(button.classList.contains('consumer-theme')).toBe(true)
    expect(button.classList.contains('density-compact')).toBe(true)
    expect(button.classList.contains('density-roomy')).toBe(false)
    fireEvent.click(button)
    expect(originalCounter?.textContent).toBe('1')
    const trigger = container.querySelector('[aria-expanded]')!
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[data-details]')?.textContent).toBe('Visible details')
  } finally {
    dispose?.()
    container.remove()
    restore()
  }
})

test('builds the virtualizer adapter when its optional peer is installed', async () => {
  const bundle = await buildConsumerBundle(
    "export { useListVirtualizer } from 'moraine/virtualizer'",
    { mode: 'client' },
  )
  expect(bundle.modules.some((id) => id.includes('@tanstack'))).toBe(true)
  expect(bundle.code).toContain('useListVirtualizer')
})

test('executes public class merging exports from the built package', async () => {
  const bundle = await buildConsumerBundle(`
    import { cn, createCn, useCn } from 'moraine'
    export { useCn }
    export const defaultResult = cn('density-roomy density-compact')
    export const result = createCn({ extend: { classGroups: { density: ['density-roomy', 'density-compact'] } } })('density-roomy density-compact')
  `)
  const consumer = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.code).toString('base64')}`
  )
  expect(consumer.result).toBe('density-compact')
  expect(consumer.defaultResult).toBe('density-roomy density-compact')
  expect(consumer.useCn()('p-2 p-4')).toBe('p-4')
})
