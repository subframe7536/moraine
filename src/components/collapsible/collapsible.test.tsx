import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'

import { Collapsible } from './collapsible'

function renderCollapsible(props?: {
  open?: boolean
  defaultOpen?: boolean
  disabled?: boolean
  transition?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return render(() => (
    <MoraineProvider>
      <Collapsible
        open={props?.open}
        defaultOpen={props?.defaultOpen}
        disabled={props?.disabled}
        transition={props?.transition}
        onOpenChange={props?.onOpenChange}
      >
        <Collapsible.Trigger data-testid="trigger-control">Toggle</Collapsible.Trigger>
        <Collapsible.Content>
          <span data-testid="content">Content</span>
        </Collapsible.Content>
      </Collapsible>
    </MoraineProvider>
  ))
}

describe('Collapsible', () => {
  test('renders closed by default, unmounts closed content, and toggles on trigger click', () => {
    const screen = render(() => (
      <Collapsible defaultOpen={false}>
        <Collapsible.Trigger>Toggle Details</Collapsible.Trigger>
        <Collapsible.Content>
          <span data-testid="content">Expanded Content</span>
        </Collapsible.Content>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Toggle Details' })
    const root = screen.container.querySelector('[data-slot="collapsible"]')

    expect(trigger.getAttribute('data-slot')).toBe('collapsible-trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(root?.hasAttribute('data-closed')).toBe(true)
    expect(screen.queryByTestId('content')).toBeNull()

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(root?.hasAttribute('data-expanded')).toBe(true)
    expect(screen.getByTestId('content')).not.toBeNull()
    const wrapper = screen.container.querySelector('[data-slot="collapsible-content-wrapper"]')!
    expect(trigger.getAttribute('aria-controls')).toBe(wrapper.id)
    expect(wrapper.getAttribute('aria-labelledby')).toBe(trigger.id)

    fireEvent.click(trigger)

    expect(screen.queryByTestId('content')).toBeNull()
    expect(root?.hasAttribute('data-closed')).toBe(true)
  })

  test('renders open state with content', () => {
    const screen = renderCollapsible({ open: true })

    expect(screen.getByTestId('content')).not.toBeNull()
    expect(
      screen.container.querySelector('[data-slot="collapsible"]')?.hasAttribute('data-expanded'),
    ).toBe(true)

    const trigger = screen.getByTestId('trigger-control')
    const wrapper = screen.container.querySelector('[data-slot="collapsible-content-wrapper"]')
    expect(trigger.getAttribute('aria-controls')).toBe(wrapper?.getAttribute('id'))
  })

  test('allows callers to override generated root state attributes', () => {
    const screen = render(() => (
      <Collapsible defaultOpen data-expanded="caller-expanded" data-closed="caller-closed">
        <Collapsible.Trigger>Trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <span>Content</span>
        </Collapsible.Content>
      </Collapsible>
    ))
    const root = screen.container.querySelector('[data-slot="collapsible"]')

    expect(root?.getAttribute('data-expanded')).toBe('caller-expanded')
    expect(root?.getAttribute('data-closed')).toBe('caller-closed')
  })

  test('controlled open does not self-mutate and calls onOpenChange', async () => {
    const onOpenChange = vi.fn()
    const screen = renderCollapsible({ open: true, onOpenChange })
    const trigger = screen.getByTestId('trigger-control')
    const root = screen.container.querySelector('[data-slot="collapsible"]')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-expanded')).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('publishes each uncontrolled state change exactly once in order', async () => {
    const onOpenChange = vi.fn()
    const screen = renderCollapsible({ defaultOpen: false, onOpenChange })
    const trigger = screen.getByTestId('trigger-control')

    fireEvent.click(trigger)
    fireEvent.click(trigger)

    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
  })

  test('disabled prevents toggling', async () => {
    const onOpenChange = vi.fn()
    const screen = renderCollapsible({
      defaultOpen: false,
      disabled: true,
      onOpenChange,
    })
    const trigger = screen.getByTestId('trigger-control')
    const root = screen.container.querySelector('[data-slot="collapsible"]')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-closed')).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('reactive disabled state suppresses trigger', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Collapsible disabled={disabled()} onOpenChange={onOpenChange}>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Toggle' })

    setDisabled(true)
    expect(trigger.hasAttribute('disabled')).toBe(true)
    fireEvent.click(trigger)

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('honors a canceled trigger event before toggling', () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Collapsible onOpenChange={onOpenChange}>
        <Collapsible.Trigger>Prevented</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Prevented' })
    const root = screen.container.querySelector('[data-slot="collapsible"]')!
    root.addEventListener('click', (event) => event.preventDefault(), { capture: true })
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })

    trigger.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('cancels stale close completion when controlled state reopens', async () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <Collapsible open={open()} transition>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>
          <span data-testid="content">Content</span>
        </Collapsible.Content>
      </Collapsible>
    ))
    const wrapper = screen.container.querySelector('[data-slot="collapsible-content-wrapper"]')!

    setOpen(false)
    setOpen(true)
    fireEvent.animationEnd(wrapper, { animationName: 'accordion-up' })

    expect(screen.getByTestId('content')).not.toBeNull()
    expect(wrapper.firstElementChild?.getAttribute('data-expanded')).toBe('')
  })

  test('keeps nested collapsible ids and state independent', async () => {
    const screen = render(() => (
      <Collapsible defaultOpen>
        <Collapsible.Trigger>Outer</Collapsible.Trigger>
        <Collapsible.Content>
          <Collapsible>
            <Collapsible.Trigger>Inner</Collapsible.Trigger>
            <Collapsible.Content>Inner content</Collapsible.Content>
          </Collapsible>
        </Collapsible.Content>
      </Collapsible>
    ))
    const outer = screen.getByRole('button', { name: 'Outer' })
    const inner = screen.getByRole('button', { name: 'Inner' })

    expect(outer.id).not.toBe(inner.id)
    expect(outer.getAttribute('aria-expanded')).toBe('true')
    expect(inner.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(inner)
    expect(outer.getAttribute('aria-expanded')).toBe('true')
    expect(inner.getAttribute('aria-expanded')).toBe('true')
  })

  test('keeps aria-controls pointing at the stable shell', async () => {
    const screen = renderCollapsible({ defaultOpen: false })
    const trigger = screen.getByTestId('trigger-control')

    const contentId = trigger.getAttribute('aria-controls')
    expect(document.getElementById(contentId!)).not.toBeNull()

    fireEvent.click(trigger)
    await Promise.resolve()

    const content = screen.container.querySelector(
      '[data-slot="collapsible-content-wrapper"]',
    ) as HTMLElement

    expect(trigger.getAttribute('aria-controls')).toBe(content.id)

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(trigger.getAttribute('aria-controls')).toBe(contentId)
  })

  test('transition=true keeps content mounted until close transition ends', async () => {
    const screen = renderCollapsible({ defaultOpen: true, transition: true })
    const trigger = screen.getByTestId('trigger-control')
    const content = screen.container.querySelector(
      '[data-slot="collapsible-content-wrapper"]',
    ) as HTMLElement

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(trigger.getAttribute('aria-controls')).toBe(content.id)
    expect(content.hasAttribute('data-closed')).toBe(true)
    expect(content.firstElementChild?.getAttribute('data-closed')).toBe('')
    expect(screen.queryByTestId('content')).not.toBeNull()

    fireEvent.animationEnd(content, { animationName: 'accordion-up' })
    await Promise.resolve()

    expect(screen.queryByTestId('content')).toBeNull()
  })

  test('transition defaults to false so closing unmounts content immediately', async () => {
    const screen = renderCollapsible({ defaultOpen: true })
    const trigger = screen.getByTestId('trigger-control')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(screen.queryByTestId('content')).toBeNull()
  })

  test('initial open with transition suppresses entrance animation until toggled', async () => {
    const screen = renderCollapsible({ defaultOpen: true, transition: true })
    const trigger = screen.getByTestId('trigger-control')
    const wrapper = screen.container.querySelector(
      '[data-slot="collapsible-content-wrapper"]',
    ) as HTMLElement

    expect(wrapper.style.animation).toBe('none')
    expect(wrapper.style.height).toBe('auto')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(wrapper.style.animation).toBe('')
    expect(wrapper.style.height).toBe('')

    fireEvent.animationEnd(wrapper, { animationName: 'accordion-up' })
    await Promise.resolve()

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(wrapper.style.animation).toBe('')
    expect(wrapper.style.height).toBe('')
  })

  test('forwards root, trigger, and content class and style props to their own elements', () => {
    const screen = render(() => (
      <Collapsible open class="root-override" style={{ width: '100px' }}>
        <Collapsible.Trigger
          data-testid="direct-trigger"
          class="trigger-override"
          style={{ width: '200px' }}
        >
          Trigger
        </Collapsible.Trigger>
        <Collapsible.Content class="content-override" style={{ width: '300px' }}>
          <span data-testid="direct-content">Content</span>
        </Collapsible.Content>
      </Collapsible>
    ))

    const root = screen.container.querySelector<HTMLElement>('[data-slot="collapsible"]')!
    const trigger = screen.getByTestId('direct-trigger')
    const content = screen.getByTestId('direct-content').parentElement!

    expect(root.className).toContain('root-override')
    expect(root.style.width).toBe('100px')
    expect(trigger.className).toContain('trigger-override')
    expect(trigger.style.width).toBe('200px')
    expect(content.className).toContain('content-override')
    expect(content.style.width).toBe('300px')
  })

  test('forwards id to root', async () => {
    const screen = render(() => (
      <Collapsible id="collapsible-root">
        <Collapsible.Trigger>Trigger</Collapsible.Trigger>
        <Collapsible.Content>content</Collapsible.Content>
      </Collapsible>
    ))

    const root = screen.container.querySelector('[data-slot="collapsible"]')

    await waitFor(() => {
      expect(root?.getAttribute('id')).toBe('collapsible-root')
    })
  })

  test('polymorphic trigger supporting as="div" and keyboard Enter / Space activation', async () => {
    const screen = render(() => (
      <Collapsible>
        <Collapsible.Trigger as="div" class="custom-div-trigger">
          Custom Div Trigger
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div data-testid="keyboard-content">Keyboard Content</div>
        </Collapsible.Content>
      </Collapsible>
    ))

    const trigger = screen.getByRole('button', { name: 'Custom Div Trigger' })
    expect(trigger.tagName.toLowerCase()).toBe('div')
    expect(trigger.getAttribute('tabindex')).toBe('0')

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(screen.getByTestId('keyboard-content')).not.toBeNull()

    fireEvent.keyDown(trigger, { key: ' ' })
    fireEvent.keyUp(trigger, { key: ' ' })
    expect(screen.queryByTestId('keyboard-content')).toBeNull()
  })

  test('unmountOnHide={false} keeps content mounted in DOM when closed', async () => {
    const screen = render(() => (
      <Collapsible defaultOpen={false} unmountOnHide={false}>
        <Collapsible.Trigger>Keep Mounted Trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <div data-testid="unmount-false-content">Always Mounted</div>
        </Collapsible.Content>
      </Collapsible>
    ))

    const wrapper = screen.container.querySelector('[data-slot="collapsible-content-wrapper"]')!
    expect(screen.getByTestId('unmount-false-content')).not.toBeNull()
    expect(wrapper.firstElementChild?.getAttribute('data-closed')).toBe('')

    const trigger = screen.getByRole('button', { name: 'Keep Mounted Trigger' })
    fireEvent.click(trigger)
    expect(wrapper.firstElementChild?.getAttribute('data-expanded')).toBe('')
    expect(screen.getByTestId('unmount-false-content')).not.toBeNull()
  })

  test('kept-mounted closed content uses hidden="until-found" and expands on beforematch', async () => {
    const screen = render(() => (
      <Collapsible defaultOpen={false} unmountOnHide={false}>
        <Collapsible.Trigger>Find Trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <a href="/details">Findable details</a>
        </Collapsible.Content>
      </Collapsible>
    ))
    const wrapper = screen.container.querySelector<HTMLElement>(
      '[data-slot="collapsible-content-wrapper"]',
    )!
    const trigger = screen.getByRole('button', { name: 'Find Trigger' })

    expect(wrapper.getAttribute('hidden')).toBe('until-found')

    wrapper.dispatchEvent(new Event('beforematch'))
    await Promise.resolve()

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(wrapper.hasAttribute('hidden')).toBe(false)
  })

  test('hides retained closed content from visual, keyboard, and accessibility trees', () => {
    const screen = render(() => (
      <Collapsible defaultOpen={false} unmountOnHide={false}>
        <Collapsible.Trigger>Keep Mounted Trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <a href="/details">Retained details</a>
        </Collapsible.Content>
      </Collapsible>
    ))
    const wrapper = screen.container.querySelector<HTMLElement>(
      '[data-slot="collapsible-content-wrapper"]',
    )!
    const trigger = screen.getByRole('button', { name: 'Keep Mounted Trigger' })

    expect(wrapper.hidden).toBe(true)
    expect(wrapper.getAttribute('aria-hidden')).toBe('true')
    expect(wrapper.inert).toBe(true)
    expect(screen.queryByRole('link', { name: 'Retained details' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Retained details', hidden: true })).not.toBeNull()

    fireEvent.click(trigger)

    expect(wrapper.hidden).toBe(false)
    expect(wrapper.hasAttribute('aria-hidden')).toBe(false)
    expect(wrapper.inert).not.toBe(true)
    expect(screen.getByRole('link', { name: 'Retained details' })).not.toBeNull()
  })

  test('forceMount keeps content mounted in the DOM but inaccessible when closed', () => {
    const screen = render(() => (
      <Collapsible defaultOpen={false} forceMount>
        <Collapsible.Trigger>Force Mount Trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <a href="/details" data-testid="force-mount-content">
            Force Mounted
          </a>
        </Collapsible.Content>
      </Collapsible>
    ))
    const wrapper = screen.container.querySelector<HTMLElement>(
      '[data-slot="collapsible-content-wrapper"]',
    )!

    expect(screen.getByTestId('force-mount-content')).not.toBeNull()
    expect(wrapper.hidden).toBe(true)
    expect(wrapper.getAttribute('aria-hidden')).toBe('true')
    expect(wrapper.inert).toBe(true)
    expect(screen.queryByRole('link', { name: 'Force Mounted' })).toBeNull()
  })

  test('keeps retained content inaccessible during and after an exit transition', async () => {
    const screen = render(() => (
      <Collapsible defaultOpen transition unmountOnHide={false}>
        <Collapsible.Trigger>Retained transition trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <a href="/details">Retained transition details</a>
        </Collapsible.Content>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Retained transition trigger' })
    const wrapper = screen.container.querySelector<HTMLElement>(
      '[data-slot="collapsible-content-wrapper"]',
    )!

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(wrapper.hidden).toBe(false)
    expect(wrapper.getAttribute('aria-hidden')).toBe('true')
    expect(wrapper.inert).toBe(true)
    expect(screen.queryByRole('link', { name: 'Retained transition details' })).toBeNull()

    fireEvent.animationEnd(wrapper, { animationName: 'accordion-up' })
    await Promise.resolve()

    expect(wrapper.hidden).toBe(true)
    expect(
      screen.getByRole('link', { name: 'Retained transition details', hidden: true }),
    ).not.toBeNull()
  })

  test('keeps force-mounted content inaccessible during and after an exit transition', async () => {
    const screen = render(() => (
      <Collapsible defaultOpen transition forceMount>
        <Collapsible.Trigger>Force Mount Trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <a href="/details">Force-mounted details</a>
        </Collapsible.Content>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Force Mount Trigger' })
    const wrapper = screen.container.querySelector<HTMLElement>(
      '[data-slot="collapsible-content-wrapper"]',
    )!

    fireEvent.click(trigger)

    expect(wrapper.hidden).toBe(false)
    expect(wrapper.getAttribute('aria-hidden')).toBe('true')
    expect(wrapper.inert).toBe(true)
    expect(screen.queryByRole('link', { name: 'Force-mounted details' })).toBeNull()

    await Promise.resolve()
    fireEvent.animationEnd(wrapper, { animationName: 'accordion-up' })
    await Promise.resolve()

    expect(wrapper.hidden).toBe(true)
    expect(screen.getByRole('link', { name: 'Force-mounted details', hidden: true })).not.toBeNull()

    fireEvent.click(trigger)

    expect(wrapper.hidden).toBe(false)
    expect(wrapper.hasAttribute('aria-hidden')).toBe(false)
    expect(wrapper.inert).not.toBe(true)
    expect(screen.getByRole('link', { name: 'Force-mounted details' })).not.toBeNull()
  })

  test('restores trigger focus when a controlled close hides focused content', () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <Collapsible open={open()}>
        <Collapsible.Trigger>Controlled trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <a href="/details">Controlled details</a>
        </Collapsible.Content>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Controlled trigger' })
    const link = screen.getByRole('link', { name: 'Controlled details' })

    link.focus()
    expect(document.activeElement).toBe(link)

    setOpen(false)

    expect(document.activeElement).toBe(trigger)
  })

  test('does not restore trigger focus after focus leaves open content', () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <>
        <button>Outside</button>
        <Collapsible open={open()}>
          <Collapsible.Trigger>Controlled trigger</Collapsible.Trigger>
          <Collapsible.Content>
            <a href="/details">Controlled details</a>
          </Collapsible.Content>
        </Collapsible>
      </>
    ))
    const outside = screen.getByRole('button', { name: 'Outside' })
    const link = screen.getByRole('link', { name: 'Controlled details' })

    link.focus()
    outside.focus()
    setOpen(false)

    expect(document.activeElement).toBe(outside)
  })

  test('restores focus within the content owner document on controlled close', () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const iframeDocument = iframe.contentDocument!
    const container = iframeDocument.createElement('div')
    iframeDocument.body.append(container)
    const [open, setOpen] = createSignal(true)
    const screen = render(
      () => (
        <Collapsible open={open()}>
          <Collapsible.Trigger>Frame trigger</Collapsible.Trigger>
          <Collapsible.Content>
            <a href="/details">Frame details</a>
          </Collapsible.Content>
        </Collapsible>
      ),
      { container, baseElement: iframeDocument.body },
    )
    const trigger = screen.getByRole('button', { name: 'Frame trigger' })
    const link = screen.getByRole('link', { name: 'Frame details' })

    link.focus()
    expect(iframeDocument.activeElement).toBe(link)

    setOpen(false)

    expect(iframeDocument.activeElement).toBe(trigger)
    expect(document.activeElement).toBe(iframe)

    screen.unmount()
    iframe.remove()
  })

  test('forwards Content polymorphism, class, and ref to the rendered element', () => {
    let contentRef: HTMLElement | undefined

    const screen = render(() => (
      <Collapsible defaultOpen>
        <Collapsible.Trigger>Ref Trigger</Collapsible.Trigger>
        <Collapsible.Content
          as="section"
          class="custom-section-class"
          ref={(el) => (contentRef = el)}
        >
          <p>Section Body</p>
        </Collapsible.Content>
      </Collapsible>
    ))

    const section = screen.container.querySelector('section[data-slot="collapsible-content"]')!

    expect(section).not.toBeNull()
    expect(section.className).toContain('custom-section-class')
    expect(contentRef).toBe(section)
    expect(screen.getByText('Section Body')).not.toBeNull()
  })

  test('renders the trigger and lazily renders Content children only while open', async () => {
    const screen = render(() => (
      <Collapsible>
        {createComponent(Collapsible.Trigger, {
          children: 'Trigger Evaluation',
        })}
        {createComponent(Collapsible.Content, {
          children: <span data-testid="lazy-composable-content">Content Evaluation</span>,
        })}
      </Collapsible>
    ))

    const trigger = screen.getByRole('button', { name: 'Trigger Evaluation' })
    expect(screen.queryByTestId('lazy-composable-content')).toBeNull()

    fireEvent.click(trigger)
    expect(screen.getByTestId('lazy-composable-content')).not.toBeNull()

    fireEvent.click(trigger)
    expect(screen.queryByTestId('lazy-composable-content')).toBeNull()
  })

  test('applies Provider theme slots and user class/style props to the right slots', () => {
    const parent = defineTheme({
      collapsible: {
        base: {
          root: 'theme-parent-root',
          trigger: 'theme-parent-trigger',
        },
      },
    })
    const design = defineTheme({
      extends: parent,
      collapsible: { base: { content: 'theme-design-content' } },
    })
    const [padding, setPadding] = createSignal('user-trigger-a')
    const screen = render(() => (
      <MoraineProvider theme={design}>
        <Collapsible
          defaultOpen
          class="user-root"
          classes={{ trigger: 'user-trigger-slot', content: 'user-content-slot' }}
          styles={{ trigger: { 'background-color': 'black' } }}
          style={{ color: 'blue' }}
        >
          <Collapsible.Trigger class={padding()} style={{ color: 'green' }}>
            Toggle styled
          </Collapsible.Trigger>
          <Collapsible.Content class="user-content-prop">Styled content</Collapsible.Content>
        </Collapsible>
      </MoraineProvider>
    ))
    const root = screen.container.querySelector<HTMLElement>('[data-slot="collapsible"]')!
    const trigger = screen.getByRole('button')
    const content = screen.getByText('Styled content')

    expect(root.className).toContain('theme-parent-root')
    expect(root.className).toContain('user-root')
    expect(root.style.color).toBe('blue')
    expect(trigger.className).toContain('theme-parent-trigger')
    expect(trigger.className).toContain('user-trigger-slot')
    expect(trigger.className).toContain('user-trigger-a')
    expect(trigger.style.backgroundColor).toBe('black')
    expect(trigger.style.color).toBe('green')
    expect(content.className).toContain('theme-design-content')
    expect(content.className).toContain('user-content-slot')
    expect(content.className).toContain('user-content-prop')

    setPadding('user-trigger-b')
    expect(trigger.className).toContain('user-trigger-b')
    expect(trigger.className).not.toContain('user-trigger-a')
  })

  test('stays functional with an empty theme and exposes transition state', () => {
    const design = defineTheme({})
    const screen = render(() => (
      <MoraineProvider theme={design}>
        <Collapsible defaultOpen transition>
          <Collapsible.Trigger>Toggle empty</Collapsible.Trigger>
          <Collapsible.Content>Empty preset content</Collapsible.Content>
        </Collapsible>
      </MoraineProvider>
    ))
    const wrapper = screen.container.querySelector('[data-slot="collapsible-content-wrapper"]')!

    expect(wrapper.hasAttribute('data-transition')).toBe(true)
    expect(screen.getByText('Empty preset content')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Toggle empty' }))
    expect(wrapper.hasAttribute('data-closed')).toBe(true)
  })
})
