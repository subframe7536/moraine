import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { createContextProvider } from './create-context-provider'

describe('createContextProvider', () => {
  test('creates a required context that throws when missing', () => {
    interface TestContext {
      value: number
    }

    const [, useTestContext] = createContextProvider<TestContext>('Test')

    function Consumer() {
      const ctx = useTestContext()
      return <div data-testid="value">{ctx.value}</div>
    }

    expect(() => render(() => <Consumer />)).toThrow(
      'useTestContext must be used within <TestProvider />',
    )
  })

  test('creates a required context that works inside provider', () => {
    interface TestContext {
      value: number
    }

    const [TestProvider, useTestContext] = createContextProvider<TestContext>('Test')

    function Consumer() {
      const ctx = useTestContext()
      return <div data-testid="value">{ctx.value}</div>
    }

    const screen = render(() => (
      <TestProvider value={{ value: 42 }}>
        <Consumer />
      </TestProvider>
    ))

    expect(screen.getByTestId('value').textContent).toBe('42')
  })

  test('creates an optional context with defaultValue', () => {
    interface TestContext {
      value: number
    }

    const defaultCtx: TestContext = { value: 100 }
    const [TestProvider, useTestContext] = createContextProvider<TestContext>('Test', defaultCtx)

    function Consumer() {
      const ctx = useTestContext()
      return <div data-testid="value">{ctx.value}</div>
    }

    // Works outside provider with default
    const screen1 = render(() => <Consumer />)
    expect(screen1.getByTestId('value').textContent).toBe('100')

    // Works inside provider with override
    const screen2 = render(() => (
      <TestProvider value={{ value: 42 }}>
        <Consumer />
      </TestProvider>
    ))
    expect(screen2.getByTestId('value').textContent).toBe('42')
  })

  test('optional context nests correctly', () => {
    interface TestContext {
      value: number
    }

    const defaultCtx: TestContext = { value: 0 }
    const [TestProvider, useTestContext] = createContextProvider<TestContext>('Test', defaultCtx)

    let outerValue = 0
    let innerValue = 0

    function OuterConsumer() {
      const ctx = useTestContext()
      outerValue = ctx.value
      return <div>outer</div>
    }

    function InnerConsumer() {
      const ctx = useTestContext()
      innerValue = ctx.value
      return <div>inner</div>
    }

    render(() => (
      <TestProvider value={{ value: 10 }}>
        <OuterConsumer />
        <TestProvider value={{ value: 20 }}>
          <InnerConsumer />
        </TestProvider>
      </TestProvider>
    ))

    expect(outerValue).toBe(10)
    expect(innerValue).toBe(20)
  })
})
