import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { CodeTabs } from './docs-code-tabs'

describe('CodeTabs', () => {
  const ITEMS = [
    { label: 'bun', value: 'bun', lang: 'bash', code: 'bun add moraine' },
    { label: 'pnpm', value: 'pnpm', lang: 'bash', code: 'pnpm add moraine' },
    { label: 'npm', value: 'npm', lang: 'bash', code: 'npm i moraine' },
  ]

  test('renders tab triggers for each item', () => {
    const screen = render(() => <CodeTabs items={ITEMS} />)

    expect(screen.getByRole('tab', { name: 'bun' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'pnpm' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'npm' })).toBeTruthy()
  })

  test('renders initial tab content using CodeBlock', () => {
    const screen = render(() => <CodeTabs items={ITEMS} />)

    expect(screen.getByText('bun add moraine')).toBeTruthy()
  })

  test('switches active tab on click', async () => {
    const screen = render(() => <CodeTabs items={ITEMS} />)

    const pnpmTab = screen.getByRole('tab', { name: 'pnpm' })
    fireEvent.click(pnpmTab)

    expect(screen.getByText('pnpm add moraine')).toBeTruthy()
  })

  test('renders with CodeTabs.Item namespaced children', () => {
    const screen = render(() => (
      <CodeTabs>
        <CodeTabs.Item lang="shell" title="bun">
          bun add moraine
        </CodeTabs.Item>
        <CodeTabs.Item lang="shell" title="pnpm">
          pnpm add moraine
        </CodeTabs.Item>
      </CodeTabs>
    ))

    expect(screen.getByRole('tab', { name: 'bun' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'pnpm' })).toBeTruthy()
    expect(screen.getByText('bun add moraine')).toBeTruthy()

    const pnpmTab = screen.getByRole('tab', { name: 'pnpm' })
    fireEvent.click(pnpmTab)

    expect(screen.getByText('pnpm add moraine')).toBeTruthy()
  })

  test('renders with template string children containing code content', () => {
    const screen = render(() => (
      <CodeTabs>
        <CodeTabs.Item lang="ts" title="config">
          {`export default defineConfig({\n  presets: [presetMoraine()],\n})`}
        </CodeTabs.Item>
      </CodeTabs>
    ))

    expect(screen.getByRole('tab', { name: 'config' })).toBeTruthy()
    expect(screen.getByText(/export default defineConfig/)).toBeTruthy()
  })

  test('synchronizes active tab across instances with the same groupId', () => {
    const screen = render(() => (
      <div>
        <div data-testid="group-1">
          <CodeTabs groupId="pkg" items={ITEMS} />
        </div>
        <div data-testid="group-2">
          <CodeTabs groupId="pkg" items={ITEMS} />
        </div>
      </div>
    ))

    const group1 = screen.getByTestId('group-1')
    const group2 = screen.getByTestId('group-2')

    // Initial state: both show 'bun'
    expect(group1.textContent).toContain('bun add moraine')
    expect(group2.textContent).toContain('bun add moraine')

    // Switch first group to 'pnpm'
    const [pnpmTab1] = screen.getAllByRole('tab', { name: 'pnpm' })
    expect(pnpmTab1).toBeDefined()
    fireEvent.click(pnpmTab1!)

    // Both groups now show 'pnpm'
    expect(group1.textContent).toContain('pnpm add moraine')
    expect(group2.textContent).toContain('pnpm add moraine')
  })
})
