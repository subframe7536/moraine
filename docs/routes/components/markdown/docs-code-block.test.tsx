import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { CodeBlock } from './docs-code-block'

describe('CodeBlock', () => {
  test('renders plain variant with floating copy button when title is omitted', () => {
    const html = '<pre class="shiki"><code>const a = 1</code></pre>'
    const screen = render(() => <CodeBlock html={html} code="const a = 1" />)

    const root = screen.container.firstElementChild as HTMLElement
    expect(root).not.toBeNull()
    expect(root.className).toContain('border border-border/70 rounded-xl bg-card/40')
    expect(root.innerHTML).toContain('class="shiki"')
    const copyBtn = screen.getByRole('button', { name: /copy code/i })
    expect(copyBtn).toBeTruthy()
  })

  test('renders header toolbar when title is provided', () => {
    const html = '<pre class="shiki"><code>const a = 1</code></pre>'
    const screen = render(() => (
      <CodeBlock title="button.tsx" lang="tsx" html={html} code="const a = 1" />
    ))

    const root = screen.container.firstElementChild as HTMLElement
    expect(root).not.toBeNull()
    expect(screen.getByText('button.tsx')).toBeTruthy()
    const copyBtn = screen.getByRole('button', { name: /copy code/i })
    expect(copyBtn).toBeTruthy()
  })

  test('renders source variant with expandable viewport', () => {
    const html = '<pre class="shiki"><code>const a = 1</code></pre>'
    const screen = render(() => <CodeBlock variant="source" html={html} />)

    const root = screen.container.firstElementChild as HTMLElement
    expect(root).not.toBeNull()
    expect(root.className).toContain('border-t border-border/70')
  })

  test('renders tabs variant without outer card borders', () => {
    const html = '<pre class="shiki"><code>bun add moraine</code></pre>'
    const screen = render(() => <CodeBlock variant="tabs" html={html} />)

    const root = screen.container.firstElementChild as HTMLElement
    expect(root).not.toBeNull()
    expect(root.className).toContain('my-0')
    expect(root.className).not.toContain('rounded-xl')
  })

  test('renders fallback code when html is not provided', () => {
    const screen = render(() => <CodeBlock code="echo hello" lang="bash" />)

    expect(screen.getByText('echo hello')).toBeTruthy()
  })

  test('copies code to clipboard on copy button click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText },
    })

    const screen = render(() => <CodeBlock code="bun add moraine" />)

    const button = screen.getByRole('button', { name: /copy code/i })
    fireEvent.click(button)
    await Promise.resolve()

    expect(writeText).toHaveBeenCalledWith('bun add moraine')
    expect(screen.getByRole('button', { name: /copied/i })).toBeTruthy()
  })

  test('copy button is hidden by default and shown on group hover', () => {
    const screen = render(() => <CodeBlock code="bun add moraine" />)
    const button = screen.getByRole('button', { name: /copy code/i })
    const wrapper = button.parentElement
    expect(wrapper).not.toBeNull()
    expect(wrapper?.className).toContain('opacity-0')
    expect(wrapper?.className).toContain('group-hover:opacity-100')
  })
})
