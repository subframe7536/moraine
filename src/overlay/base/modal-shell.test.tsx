import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createComponent, createSignal, onCleanup } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider'
import { finishExitMotion } from '../../test-util/overlay-test'
import { defineTheme } from '../../theme'
import { Dialog } from '../dialog/dialog'
import { Sheet } from '../sheet/sheet'

describe.each([
  { name: 'Dialog', Root: Dialog },
  { name: 'Sheet', Root: Sheet },
])('$name composition', ({ Root, name }) => {
  const owner = name.toLowerCase()
  test('does not instantiate closed content parts before opening', () => {
    let reads = 0
    const screen = render(() => (
      <Root>
        <Root.Trigger>Open</Root.Trigger>
        <Root.Content title="Title">
          <Root.Body>
            {(() => {
              reads += 1
              return 'Children'
            })()}
          </Root.Body>
        </Root.Content>
      </Root>
    ))
    expect(reads).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(reads).toBe(1)
    expect(document.body.querySelector(`[data-slot="${owner}-body"]`)?.textContent).toBe('Children')
  })

  test('updates body header attributes without replacing the body and forwards its ref', () => {
    const [showHeader, setShowHeader] = createSignal(false)
    let bodyRef: HTMLDivElement | undefined
    render(() => (
      <Root open>
        <Root.Content>
          <Show when={showHeader()}>
            <Root.Header>Header</Root.Header>
          </Show>
          <Root.Body ref={(element) => (bodyRef = element)}>Body</Root.Body>
        </Root.Content>
      </Root>
    ))

    const body = document.body.querySelector<HTMLDivElement>(`[data-slot="${owner}-body"]`)!
    expect(bodyRef).toBe(body)
    expect(body.hasAttribute('data-header')).toBe(false)

    setShowHeader(true)
    expect(body.hasAttribute('data-header')).toBe(true)
    setShowHeader(false)
    expect(body.hasAttribute('data-header')).toBe(false)
    expect(document.body.querySelector(`[data-slot="${owner}-body"]`)).toBe(body)
  })

  test('resolves shorthand JSX once per presence cycle and releases it after exit', async () => {
    const [open, setOpen] = createSignal(false)
    let titleReads = 0
    let descriptionReads = 0
    let cleanups = 0
    const Title = () => {
      onCleanup(() => {
        cleanups += 1
      })
      return <span>Title</span>
    }

    render(() => (
      <Root open={open()}>
        {createComponent(Root.Content, {
          get title() {
            titleReads += 1
            return <Title />
          },
          get description() {
            descriptionReads += 1
            return <span>Description</span>
          },
          get children() {
            return <Root.Body>Body</Root.Body>
          },
        })}
      </Root>
    ))

    expect(titleReads).toBe(0)
    expect(descriptionReads).toBe(0)
    setOpen(true)
    expect(titleReads).toBe(1)
    expect(descriptionReads).toBe(1)
    expect(document.body.querySelector(`[data-slot="${owner}-header"]`)?.textContent).toBe(
      'TitleDescription',
    )

    setOpen(false)
    await finishExitMotion()
    expect(cleanups).toBe(1)

    setOpen(true)
    expect(titleReads).toBe(2)
    expect(descriptionReads).toBe(2)
  })

  test('keeps explicit children mounted while switching between explicit and shorthand headers', () => {
    const [showHeader, setShowHeader] = createSignal(true)
    let titleReads = 0
    let descriptionReads = 0
    let bodyMounts = 0
    const Body = () => {
      bodyMounts += 1
      return <Root.Body>Body</Root.Body>
    }

    render(() => (
      <Root open>
        {createComponent(Root.Content, {
          get title() {
            titleReads += 1
            return <span>Fallback title</span>
          },
          get description() {
            descriptionReads += 1
            return <span>Fallback description</span>
          },
          get children() {
            return (
              <>
                <Show when={showHeader()}>
                  <Root.Header>Explicit header</Root.Header>
                </Show>
                <Body />
              </>
            )
          },
        })}
      </Root>
    ))

    const body = document.body.querySelector<HTMLElement>(`[data-slot="${owner}-body"]`)!
    expect(titleReads).toBe(0)
    expect(descriptionReads).toBe(0)
    expect(bodyMounts).toBe(1)
    expect(body.hasAttribute('data-header')).toBe(true)
    expect(document.body.querySelector(`[data-slot="${owner}-header"]`)?.textContent).toBe(
      'Explicit header',
    )

    setShowHeader(false)
    expect(titleReads).toBe(1)
    expect(descriptionReads).toBe(1)
    expect(document.body.querySelector(`[data-slot="${owner}-header"]`)?.textContent).toBe(
      'Fallback titleFallback description',
    )
    expect(document.body.querySelector(`[data-slot="${owner}-body"]`)).toBe(body)
    expect(body.hasAttribute('data-header')).toBe(true)

    setShowHeader(true)
    expect(document.body.querySelector(`[data-slot="${owner}-header"]`)?.textContent).toBe(
      'Explicit header',
    )
    expect(document.body.querySelector(`[data-slot="${owner}-body"]`)).toBe(body)
    expect(bodyMounts).toBe(1)
  })

  test('mounts controlled content in the root portal destination without a trigger', () => {
    const otherDocument = document.implementation.createHTMLDocument('portal owner')
    const mount = otherDocument.createElement('div')
    otherDocument.body.append(mount)
    const screen = render(() => (
      <Root open portalMount={mount}>
        <Root.Content title="Title">Body</Root.Content>
      </Root>
    ))

    const content = mount.querySelector(`[data-slot="${owner}-content"]`)
    expect(content?.ownerDocument).toBe(otherDocument)
    expect(content?.textContent).toContain('Body')
    screen.unmount()
  })

  test('prefers a native aria-label over a registered title', () => {
    render(() => (
      <Root open ariaLabel="Root label">
        <Root.Content aria-label="Native label" title="Visible title" description="Details">
          <Root.Body>Body</Root.Body>
        </Root.Content>
      </Root>
    ))

    const content = document.body.querySelector(`[data-slot="${owner}-content"]`)!
    const description = document.body.querySelector<HTMLElement>(
      `[data-slot="${owner}-description"]`,
    )!
    expect(document.body.querySelector(`[data-slot="${owner}-title"]`)).not.toBeNull()
    expect(content.getAttribute('aria-label')).toBe('Native label')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBe(description.id)
  })

  test('renders recipe-backed default presentation without a provider', () => {
    render(() => (
      <Root defaultOpen>
        <Root.Trigger>Open</Root.Trigger>
        <Root.Content title="Title" description="Description">
          <Root.Body>Body</Root.Body>
          <Root.Footer>Footer</Root.Footer>
        </Root.Content>
      </Root>
    ))
    const slots = [
      'trigger',
      'overlay',
      'content',
      'header',
      'title',
      'description',
      'content-close',
      'body',
      'footer',
    ]
    expect(
      document.body.querySelector<HTMLElement>(`[data-slot="${owner}-content"]`)?.className,
    ).not.toBe('')
    expect(
      document.body.querySelector<HTMLElement>(`[data-slot="${owner}-overlay"]`)?.className,
    ).not.toBe('')
    const selector = slots.map((slot) => `[data-slot="${owner}-${slot}"]`).join(',')
    for (const element of document.body.querySelectorAll<HTMLElement>(selector)) {
      expect(element.getAttribute('style')).toBeNull()
    }
  })

  test('replaces Design while preserving content identity and focus', () => {
    const key = name === 'Dialog' ? 'dialog' : 'sheet'
    const [design, setDesign] = createSignal(
      defineTheme({
        [key]: { base: { content: 'first-content' } },
      }),
    )
    render(() => (
      <MoraineProvider theme={design()}>
        <Root defaultOpen>
          <Root.Content title="Title">
            <Root.Body>Body</Root.Body>
          </Root.Content>
        </Root>
      </MoraineProvider>
    ))
    const content = document.body.querySelector<HTMLElement>(`[data-slot="${owner}-content"]`)!
    content.focus()
    setDesign(defineTheme({ [key]: { base: { content: 'next-content' } } }))
    expect(document.body.querySelector(`[data-slot="${owner}-content"]`)).toBe(content)
    expect(content.className).toContain('next-content')
    expect(content.className).not.toContain('first-content')
    expect(document.activeElement).toBe(content)
  })

  test('updates modal isolation when root trapFocus changes', async () => {
    const [trapFocus, setTrapFocus] = createSignal(false)
    const screen = render(() => (
      <>
        <main data-testid="background">Background</main>
        <Root defaultOpen trapFocus={trapFocus()}>
          <Root.Content title="Title">Content</Root.Content>
        </Root>
      </>
    ))
    const content = document.body.querySelector(`[data-slot="${owner}-content"]`)!
    const background = screen.getByTestId('background')

    expect(content.getAttribute('aria-modal')).toBeNull()
    expect(background.closest('[aria-hidden="true"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')

    setTrapFocus(true)
    await waitFor(() => {
      expect(content.getAttribute('aria-modal')).toBe('true')
      expect(background.closest('[aria-hidden="true"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('hidden')
    })

    setTrapFocus(false)
    await waitFor(() => {
      expect(content.getAttribute('aria-modal')).toBeNull()
      expect(background.closest('[aria-hidden="true"]')).toBeNull()
      expect(document.body.style.overflow).toBe('')
    })
  })
})
