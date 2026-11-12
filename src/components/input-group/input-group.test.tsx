import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, onCleanup, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider/index'
import { defineTheme } from '../../theme/create-theme'
import { Button } from '../button/button'
import { DropdownMenu } from '../dropdown-menu/dropdown-menu'
import { Field } from '../field'
import { Icon } from '../icon/index'
import { Input } from '../input/input'
import { Textarea } from '../textarea/textarea'

import { InputGroup } from './input-group'
import type { InputGroupT } from './input-group.types'

describe('InputGroup', () => {
  test('keeps Leading and Trailing scoped to InputGroup', () => {
    expect(() => render(() => <InputGroup.Leading>Prefix</InputGroup.Leading>)).toThrow(
      'InputGroup.Leading must be used within InputGroup',
    )
    expect(() => render(() => <InputGroup.Trailing>Suffix</InputGroup.Trailing>)).toThrow(
      'InputGroup.Trailing must be used within InputGroup',
    )
  })

  test('forwards the root ref without requiring a provider', () => {
    let group: HTMLDivElement | undefined
    const screen = render(() => (
      <InputGroup
        ref={(el) => {
          group = el
        }}
      >
        <InputGroup.Leading>Prefix</InputGroup.Leading>
        <Input />
      </InputGroup>
    ))
    expect(group).toBe(screen.getByRole('group'))
    expect(group?.contains(screen.getByRole('textbox'))).toBe(true)
  })

  test.each([Input, Textarea])(
    'hides the decorative frame from assistive technology for %s',
    (Control) => {
      const screen = render(() => (
        <InputGroup variant="subtle">
          <Control variant="outline" />
        </InputGroup>
      ))
      const frame = screen
        .getByRole('group')
        .querySelector<HTMLElement>('[data-slot="input-group-frame"]')!

      expect(frame.getAttribute('aria-hidden')).toBe('true')
    },
  )

  test('uses DOM order and root orientation for leading and trailing content', () => {
    const [orientation, setOrientation] =
      createSignal<InputGroupT.Variants['orientation']>('horizontal')
    const screen = render(() => (
      <InputGroup dir="rtl" orientation={orientation()}>
        <InputGroup.Leading data-testid="leading">
          <Icon name="icon-search" />
        </InputGroup.Leading>
        <Input aria-label="Query" />
        <InputGroup.Trailing data-testid="trailing">Suffix</InputGroup.Trailing>
      </InputGroup>
    ))
    const group = screen.getByRole('group')
    const input = screen.getByRole('textbox')
    const leading = screen.getByTestId('leading')
    const trailing = screen.getByTestId('trailing')
    const frame = group.querySelector('[data-slot="input-group-frame"]')!
    expect(group.getAttribute('dir')).toBe('rtl')
    expect(group.getAttribute('data-orientation')).toBe('horizontal')
    expect(Array.from(group.children)).toEqual([leading, input, trailing, frame])
    expect(
      Array.from(
        group.querySelectorAll(
          '[data-slot="input-group-leading"], [data-slot="input-group-trailing"]',
        ),
        (el) => `${el.getAttribute('data-slot')}:${el.getAttribute('data-orientation')}`,
      ),
    ).toEqual(['input-group-leading:horizontal', 'input-group-trailing:horizontal'])
    setOrientation('vertical')
    expect(group.getAttribute('data-orientation')).toBe('vertical')
    expect(screen.getByText('Suffix').getAttribute('data-orientation')).toBe('vertical')
    expect(screen.getByRole('textbox')).toBe(input)
    expect(screen.getByTestId('leading')).toBe(leading)
    expect(screen.getByTestId('trailing')).toBe(trailing)
  })

  test('uses data-compact to remove only the control-side padding without replacing nodes', () => {
    const [compact, setCompact] = createSignal(false)
    const screen = render(() => (
      <InputGroup>
        <InputGroup.Leading compact={compact()} data-testid="leading">
          https://
        </InputGroup.Leading>
        <Input aria-label="Website" placeholder="example.com" />
        <InputGroup.Trailing compact={compact()} data-testid="trailing">
          .com
        </InputGroup.Trailing>
      </InputGroup>
    ))
    const control = screen.getByRole('textbox')
    const leading = screen.getByTestId('leading')
    const trailing = screen.getByTestId('trailing')

    expect(leading.hasAttribute('data-compact')).toBe(false)
    expect(trailing.hasAttribute('data-compact')).toBe(false)
    setCompact(true)
    expect(leading.hasAttribute('data-compact')).toBe(true)
    expect(trailing.hasAttribute('data-compact')).toBe(true)
    expect(screen.getByRole('textbox')).toBe(control)
    expect(screen.getByTestId('leading')).toBe(leading)
    expect(screen.getByTestId('trailing')).toBe(trailing)
    setCompact(false)
    expect(leading.hasAttribute('data-compact')).toBe(false)
    expect(trailing.hasAttribute('data-compact')).toBe(false)
  })

  test('resolves data-compact from theme defaults with explicit prop precedence', () => {
    const [theme, setTheme] = createSignal(
      defineTheme({ inputGroup: { defaultVariants: { compact: true } } }),
    )
    const screen = render(() => (
      <MoraineProvider theme={theme()}>
        <InputGroup>
          <InputGroup.Leading data-testid="inherited">https://</InputGroup.Leading>
          <Input aria-label="Website" />
          <InputGroup.Trailing compact={false} data-testid="explicit">
            .com
          </InputGroup.Trailing>
        </InputGroup>
      </MoraineProvider>
    ))
    const inherited = screen.getByTestId('inherited')
    const explicit = screen.getByTestId('explicit')

    expect(inherited.hasAttribute('data-compact')).toBe(true)
    expect(explicit.hasAttribute('data-compact')).toBe(false)
    setTheme(defineTheme({ inputGroup: { defaultVariants: { compact: false } } }))
    expect(inherited.hasAttribute('data-compact')).toBe(false)
    expect(explicit.hasAttribute('data-compact')).toBe(false)
  })

  test('does not infer compact spacing from button or kbd children', () => {
    const screen = render(() => (
      <InputGroup>
        <InputGroup.Leading data-testid="leading">
          <kbd>⌘K</kbd>
        </InputGroup.Leading>
        <Input aria-label="Query" />
        <InputGroup.Trailing data-testid="trailing">
          <button type="button">Action</button>
        </InputGroup.Trailing>
      </InputGroup>
    ))

    expect(screen.getByTestId('leading').hasAttribute('data-compact')).toBe(false)
    expect(screen.getByTestId('trailing').hasAttribute('data-compact')).toBe(false)
  })

  test('uses compact explicitly for button and kbd children', () => {
    const screen = render(() => (
      <InputGroup>
        <InputGroup.Leading compact data-testid="leading">
          <kbd>⌘K</kbd>
        </InputGroup.Leading>
        <Input aria-label="Query" />
        <InputGroup.Trailing compact data-testid="trailing">
          <button type="button">Action</button>
        </InputGroup.Trailing>
      </InputGroup>
    ))

    expect(screen.getByTestId('leading').hasAttribute('data-compact')).toBe(true)
    expect(screen.getByTestId('trailing').hasAttribute('data-compact')).toBe(true)
  })

  test.each([Input, Textarea])('focuses only from non-interactive space for %s', (Control) => {
    const onPointerDown = vi.fn()
    const screen = render(() => (
      <InputGroup onPointerDown={onPointerDown}>
        <InputGroup.Leading>
          <span>Prefix</span>
          <button type="button">Action</button>
          <a href="#target">Link</a>
          <span tabIndex={0}>Focusable</span>
          <span onPointerDown={(event) => event.preventDefault()}>Cancelled</span>
        </InputGroup.Leading>
        <Control aria-label="Message" />
      </InputGroup>
    ))
    const control = screen.getByRole('textbox')

    fireEvent.pointerDown(screen.getByRole('group'), { button: 0 })
    expect(document.activeElement).toBe(control)
    control.blur()

    fireEvent.pointerDown(screen.getByText('Prefix'), { button: 0 })
    expect(document.activeElement).toBe(control)
    control.blur()

    for (const target of [screen.getByRole('button'), screen.getByRole('link')]) {
      fireEvent.pointerDown(target, { button: 0 })
    }
    fireEvent.pointerDown(screen.getByRole('group'), { button: 1 })
    expect(document.activeElement).not.toBe(control)
    expect(onPointerDown).toHaveBeenCalledTimes(5)
    screen.getByRole('button').focus()
    expect(document.activeElement).toBe(screen.getByRole('button'))
  })

  test('does not redirect focus from interactive addons in an iframe', () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const iframeDocument = iframe.contentDocument!
    const container = iframeDocument.createElement('div')
    iframeDocument.body.append(container)
    const screen = render(
      () => (
        <InputGroup>
          <Input aria-label="Message" />
          <InputGroup.Trailing>
            <button type="button">Action</button>
            <a href="#details">Details</a>
          </InputGroup.Trailing>
        </InputGroup>
      ),
      { container, baseElement: iframeDocument.body },
    )
    const control = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: 'Action' })
    const link = screen.getByRole('link', { name: 'Details' })

    for (const target of [button, link]) {
      target.focus()
      const event = new iframeDocument.defaultView!.MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        cancelable: true,
      })

      expect(target.dispatchEvent(event)).toBe(true)
      expect(event.defaultPrevented).toBe(false)
      expect(iframeDocument.activeElement).toBe(target)
      expect(iframeDocument.activeElement).not.toBe(control)
    }

    screen.unmount()
    iframe.remove()
  })

  test('respects root pointer cancellation and disabled controls without disabling parts', () => {
    const [cancel, setCancel] = createSignal(true)
    const [disabled, setDisabled] = createSignal(false)
    const action = vi.fn()
    const screen = render(() => (
      <InputGroup
        onPointerDown={(event) => {
          if (cancel()) {
            event.preventDefault()
          }
        }}
      >
        <InputGroup.Leading>
          <button type="button" onClick={action}>
            Action
          </button>
        </InputGroup.Leading>
        <Input disabled={disabled()} />
      </InputGroup>
    ))
    const group = screen.getByRole('group')
    const control = screen.getByRole<HTMLInputElement>('textbox')
    fireEvent.pointerDown(group, { button: 0 })
    expect(document.activeElement).not.toBe(control)

    setCancel(false)
    setDisabled(true)
    expect(control.disabled).toBe(true)
    fireEvent.pointerDown(group, { button: 0 })
    expect(document.activeElement).not.toBe(control)

    fireEvent.click(screen.getByRole('button'))
    expect(action).toHaveBeenCalledOnce()

    setDisabled(false)
    fireEvent.pointerDown(group, { button: 0 })
    expect(document.activeElement).toBe(control)
  })

  test('keeps user classes and styles on group slots through theme updates without replacing children', () => {
    const [leadingClass, setLeadingClass] = createSignal('first-leading')
    const screen = render(() => (
      <InputGroup
        classes={{ leading: leadingClass(), frame: 'theme-frame' }}
        styles={{ leading: { color: 'red' }, frame: { color: 'green' } }}
      >
        <InputGroup.Leading class="local-leading" style={{ color: 'blue' }}>
          Suffix
        </InputGroup.Leading>
        <Input />
      </InputGroup>
    ))
    const input = screen.getByRole('textbox')
    const leading = screen.getByText('Suffix')
    const frame = screen
      .getByRole('group')
      .querySelector<HTMLElement>('[data-slot="input-group-frame"]')!
    expect(leading.className).toContain('first-leading')
    expect(leading.className).toContain('local-leading')
    expect(leading.style.color).toBe('blue')
    expect(frame.className).toContain('theme-frame')
    expect(frame.style.color).toBe('green')

    setLeadingClass('next-leading')
    expect(screen.getByRole('textbox')).toBe(input)
    expect(leading.className).toContain('next-leading')
    expect(leading.className).not.toContain('first-leading')
  })

  test('resolves root orientation from theme variants and explicit reactive props', () => {
    const [theme, setTheme] = createSignal(
      defineTheme({
        inputGroup: {
          defaultVariants: { orientation: 'vertical' },
          variants: { orientation: { vertical: { leading: 'custom-header' } } },
        },
      }),
    )
    const [orientation, setOrientation] =
      createSignal<InputGroupT.Variants['orientation']>('horizontal')
    const screen = render(() => (
      <MoraineProvider theme={theme()}>
        <InputGroup orientation={orientation()}>
          <InputGroup.Leading>Inherited</InputGroup.Leading>
          <Input />
          <InputGroup.Trailing>Explicit</InputGroup.Trailing>
        </InputGroup>
      </MoraineProvider>
    ))
    const inherited = screen.getByText('Inherited')
    const explicit = screen.getByText('Explicit')
    expect(inherited.getAttribute('data-orientation')).toBe('horizontal')
    expect(inherited.className).not.toContain('custom-header')
    expect(explicit.getAttribute('data-orientation')).toBe('horizontal')
    setOrientation('vertical')
    expect(inherited.getAttribute('data-orientation')).toBe('vertical')
    expect(inherited.className).toContain('custom-header')
    expect(explicit.getAttribute('data-orientation')).toBe('vertical')
    setTheme(
      defineTheme({
        inputGroup: { defaultVariants: { orientation: 'horizontal' } },
      }),
    )
    expect(inherited.getAttribute('data-orientation')).toBe('vertical')
    expect(inherited.className).not.toContain('custom-header')
    expect(explicit.getAttribute('data-orientation')).toBe('vertical')
    setOrientation(undefined)
    expect(explicit.getAttribute('data-orientation')).toBe('horizontal')
  })

  test('keeps native value, selection and focus when part content changes', () => {
    const [show, setShow] = createSignal(true)
    const [text, setText] = createSignal('First')
    const cleanup = vi.fn()
    function Content() {
      onCleanup(cleanup)
      return <span>{text()}</span>
    }
    const screen = render(() => (
      <InputGroup>
        <Show when={show()}>
          <InputGroup.Leading>
            <Content />
          </InputGroup.Leading>
        </Show>
        <Input defaultValue="Draft" />
      </InputGroup>
    ))
    const control = screen.getByRole<HTMLInputElement>('textbox')
    control.focus()
    control.setSelectionRange(1, 3)
    setText('Next')
    expect(screen.getByText('Next')).toBeTruthy()
    expect(screen.getByRole('textbox')).toBe(control)
    expect(control.value).toBe('Draft')
    expect(control.selectionStart).toBe(1)
    expect(control.selectionEnd).toBe(3)
    expect(document.activeElement).toBe(control)

    setShow(false)
    expect(cleanup).toHaveBeenCalledOnce()
    expect(screen.getByRole('textbox')).toBe(control)
    screen.unmount()
  })

  test('keeps native form ownership, invalid state and reset behavior on the control', async () => {
    const [error, setError] = createSignal<string | undefined>('Invalid')
    const screen = render(() => (
      <form>
        <Field label="Message" name="message" error={error()} required>
          <InputGroup>
            <InputGroup.Leading>Suffix</InputGroup.Leading>
            <Input defaultValue="Initial" />
          </InputGroup>
        </Field>
      </form>
    ))
    const control = screen.getByLabelText<HTMLInputElement>('Message')
    const form = screen.container.querySelector('form')!
    expect(control.getAttribute('aria-invalid')).toBe('true')
    expect(control.required).toBe(true)
    expect(new FormData(form).get('message')).toBe('Initial')
    fireEvent.input(control, { target: { value: 'Edited' } })
    form.reset()
    await Promise.resolve()
    expect(control.value).toBe('Initial')
    setError(undefined)
    expect(control.getAttribute('aria-invalid')).not.toBe('true')
    expect(screen.getByRole('group').hasAttribute('aria-invalid')).toBe(false)
  })

  test('does not focus control when pointerdown targets a portaled child', () => {
    let portalTarget: HTMLDivElement | undefined
    const screen = render(() => (
      <InputGroup>
        <Input aria-label="Message" />
        <InputGroup.Trailing>
          <Portal>
            <div
              ref={(el) => {
                portalTarget = el
              }}
            >
              Portaled content
            </div>
          </Portal>
        </InputGroup.Trailing>
      </InputGroup>
    ))
    const control = screen.getByRole('textbox')
    expect(portalTarget).toBeTruthy()
    fireEvent.pointerDown(portalTarget!, { button: 0 })
    expect(document.activeElement).not.toBe(control)
  })

  test('does not focus control when the dropdown trigger in an addon is clicked', () => {
    const screen = render(() => (
      <InputGroup>
        <Input aria-label="File name" placeholder="Enter file name" />
        <InputGroup.Trailing compact>
          <DropdownMenu placement="bottom" align="end">
            <DropdownMenu.Trigger as={Button} type="button" variant="ghost" size="icon-sm">
              Actions
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              items={[{ label: 'Settings' }, { label: 'Copy path' }, { label: 'Open location' }]}
            />
          </DropdownMenu>
        </InputGroup.Trailing>
      </InputGroup>
    ))
    const control = screen.getByRole('textbox')
    const trigger = screen.getByRole('button', { name: 'Actions' })

    fireEvent.click(trigger)
    expect(document.activeElement).not.toBe(control)
  })

  test('supports polymorphic rendering on Leading and Trailing', () => {
    const screen = render(() => (
      <InputGroup>
        <InputGroup.Leading as="label" for="test-input" data-testid="leading">
          Prefix
        </InputGroup.Leading>
        <Input id="test-input" />
        <InputGroup.Trailing as="span" data-testid="trailing">
          Suffix
        </InputGroup.Trailing>
      </InputGroup>
    ))
    const leading = screen.getByTestId('leading')
    const trailing = screen.getByTestId('trailing')
    expect(leading.tagName).toBe('LABEL')
    expect(leading.getAttribute('for')).toBe('test-input')
    expect(trailing.tagName).toBe('SPAN')
  })
})
