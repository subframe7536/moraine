import { fireEvent, render as baseRender } from '@solidjs/testing-library'
import { createComponent, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/button.tsx'
import { Icon } from '../../elements/icon/index.ts'
import { DropdownMenu } from '../../overlays/dropdown-menu/dropdown-menu.tsx'
import { MoraineProvider } from '../../provider/index.ts'
import { defineTheme } from '../../theme/create-theme.ts'
import { Field } from '../field'
import { Input } from '../input/input.tsx'
import { Textarea } from '../textarea/textarea.tsx'

import { InputGroup } from './input-group.tsx'
import type { InputGroupT } from './input-group.types.ts'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider>{ui()}</MoraineProvider>, options)

describe('InputGroup', () => {
  test.each([Input, Textarea])('allows %s to render outside an InputGroup', (Control) => {
    const screen = baseRender(() => <Control />)

    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  test('keeps Leading and Trailing scoped to InputGroup', () => {
    expect(() => baseRender(() => <InputGroup.Leading>Prefix</InputGroup.Leading>)).toThrow(
      'InputGroup.Leading must be used within InputGroup',
    )
    expect(() => baseRender(() => <InputGroup.Trailing>Suffix</InputGroup.Trailing>)).toThrow(
      'InputGroup.Trailing must be used within InputGroup',
    )
  })

  test('renders without presentation when no theme is supplied', () => {
    let group: HTMLDivElement | undefined
    const screen = baseRender(() => (
      <InputGroup
        ref={(el) => {
          group = el
        }}
      >
        <InputGroup.Leading>Prefix</InputGroup.Leading>
        <Input />
      </InputGroup>
    ))
    const frame = group?.querySelector<HTMLElement>('[data-slot="frame"]')
    expect(group).toBe(screen.getByRole('group'))
    expect(group?.className).not.toBe('')
    expect(screen.getByRole('textbox').className).not.toBe('')
    expect(screen.getByText('Prefix').className).not.toBe('')
    expect(frame?.className).not.toBe('')
  })

  test.each([Input, Textarea])(
    'keeps the none variant free of a normal focus ring for %s',
    (Control) => {
      const screen = render(() => <Control variant="none" />)
      const classes = screen.getByRole('textbox').className.split(/\s+/)
      expect(classes).toContain('focus:ring-0')
      expect(classes).not.toContain('focus:ring-3')
    },
  )

  test.each([Input, Textarea])(
    'selects grouped control presentation through context for %s',
    (Control) => {
      const screen = render(() => (
        <InputGroup variant="subtle">
          <Control variant="outline" />
        </InputGroup>
      ))
      const group = screen.getByRole('group')
      const control = screen.getByRole('textbox')
      const frame = group.querySelector<HTMLElement>('[data-slot="frame"]')!
      expect(group.className).toContain('bg-input/30')
      expect(group.className).not.toContain(':has(>input:focus)')
      expect(control.className).toContain('peer')
      expect(control.className).toContain('border-0')
      expect(control.className).not.toContain('border-input')
      expect(control.className).not.toContain('shadow-xs')
      expect(control.hasAttribute('data-input-group-control')).toBe(false)
      expect(frame.getAttribute('aria-hidden')).toBe('true')
      expect(frame.className).toContain('peer-focus:ring-3')
      expect(frame.className).toContain('peer-aria-invalid:border-destructive')
    },
  )

  test.each([Input, Textarea])(
    'keeps the grouped none variant frame free of its normal focus ring for %s',
    (Control) => {
      const screen = render(() => (
        <InputGroup variant="none">
          <Control />
        </InputGroup>
      ))
      const frame = screen.getByRole('group').querySelector<HTMLElement>('[data-slot="frame"]')!
      expect(frame.className).toContain('peer-focus:ring-0')
    },
  )

  test('uses DOM order and root orientation for leading and trailing content', () => {
    const [orientation, setOrientation] =
      createSignal<InputGroupT.Variant['orientation']>('horizontal')
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
    const frame = group.querySelector('[data-slot="frame"]')!
    expect(group.getAttribute('dir')).toBe('rtl')
    expect(group.getAttribute('data-orientation')).toBe('horizontal')
    expect(Array.from(group.children)).toEqual([leading, input, trailing, frame])
    expect(group.className).not.toMatch(/\border-/)
    expect(leading.className).not.toMatch(/(?:^|\s)-m(?:[setb]?)-/)
    expect(trailing.className).not.toMatch(/(?:^|\s)-m(?:[setb]?)-/)
    expect(
      Array.from(
        group.querySelectorAll('[data-slot="leading"], [data-slot="trailing"]'),
        (el) => `${el.getAttribute('data-slot')}:${el.getAttribute('data-orientation')}`,
      ),
    ).toEqual(['leading:horizontal', 'trailing:horizontal'])
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
    expect(leading.className).toContain('data-compact:px-1')
    expect(trailing.className).toContain('data-compact:px-1')
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
    const screen = baseRender(() => (
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
    const leading = screen.getByTestId('leading')
    const trailing = screen.getByTestId('trailing')

    expect(leading.className).toContain('px-2')
    expect(trailing.className).toContain('px-2')
    expect(leading.className).not.toContain('has-[>kbd]')
    expect(trailing.className).not.toContain('has-[>button]')
    expect(leading.hasAttribute('data-compact')).toBe(false)
    expect(trailing.hasAttribute('data-compact')).toBe(false)
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
    const leading = screen.getByTestId('leading')
    const trailing = screen.getByTestId('trailing')

    expect(leading.hasAttribute('data-compact')).toBe(true)
    expect(trailing.hasAttribute('data-compact')).toBe(true)
    expect(leading.className).toContain('data-compact:px-1')
    expect(trailing.className).toContain('data-compact:px-1')
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
    const focus = vi.spyOn(control, 'focus')
    fireEvent.pointerDown(screen.getByRole('group'), { button: 0 })
    fireEvent.pointerDown(screen.getByText('Prefix'), { button: 0 })
    expect(focus).toHaveBeenCalledTimes(2)
    expect(document.activeElement).toBe(control)
    for (const target of [
      control,
      screen.getByRole('button'),
      screen.getByRole('link'),
      screen.getByText('Focusable'),
      screen.getByText('Cancelled'),
    ]) {
      fireEvent.pointerDown(target, { button: 0 })
    }
    fireEvent.pointerDown(screen.getByRole('group'), { button: 1 })
    expect(focus).toHaveBeenCalledTimes(2)
    expect(onPointerDown).toHaveBeenCalledTimes(8)
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
        <Input disabled={disabled()} readOnly />
      </InputGroup>
    ))
    const group = screen.getByRole('group')
    const control = screen.getByRole('textbox') as HTMLInputElement
    const focus = vi.spyOn(control, 'focus')
    fireEvent.pointerDown(group, { button: 0 })
    expect(focus).not.toHaveBeenCalled()
    setCancel(false)
    setDisabled(true)
    fireEvent.pointerDown(group, { button: 0 })
    expect(focus).not.toHaveBeenCalled()
    expect(group.className).not.toContain('opacity-64')
    expect(control.className).toContain('disabled:opacity-64')
    fireEvent.click(screen.getByRole('button'))
    expect(action).toHaveBeenCalledOnce()
    setDisabled(false)
    fireEvent.pointerDown(group, { button: 0 })
    expect(focus).toHaveBeenCalledOnce()
  })

  test('inherits sizes reactively with explicit control, group and field precedence', () => {
    const [size, setSize] = createSignal<InputGroupT.Variant['size']>('md')
    const screen = render(() => (
      <Field size="sm" label="Message">
        <InputGroup size={size()}>
          <InputGroup.Leading>First</InputGroup.Leading>
          <Input />
        </InputGroup>
        <InputGroup size="lg">
          <Textarea size="sm" />
        </InputGroup>
        <InputGroup>
          <Input aria-label="Inherited" />
        </InputGroup>
      </Field>
    ))
    const [input, textarea, inherited] = screen.getAllByRole('textbox')
    expect(input?.className).toContain('h-7.5')
    expect(textarea?.className).toContain('min-h-14')
    expect(inherited?.className).toContain('h-6.5')
    setSize('lg')
    expect(input?.className).toContain('h-8.5')
    expect(screen.getByText('First').className).toContain('gap-2')
    setSize(undefined)
    expect(input?.className).toContain('h-6.5')
  })

  test('updates theme defaults and group slot overrides without replacing children', () => {
    const [theme, setTheme] = createSignal(
      defineTheme({ inputGroup: { defaultVariants: { size: 'sm' } } }),
    )
    const [leadingClass, setLeadingClass] = createSignal('first-leading')
    const screen = baseRender(() => (
      <MoraineProvider theme={theme()}>
        <InputGroup
          classes={{ leading: leadingClass(), frame: 'theme-frame' }}
          styles={{ leading: { color: 'red' }, frame: { color: 'green' } }}
        >
          <InputGroup.Leading class="local-leading" style={{ color: 'blue' }}>
            Suffix
          </InputGroup.Leading>
          <Input />
        </InputGroup>
      </MoraineProvider>
    ))
    const input = screen.getByRole('textbox')
    const leading = screen.getByText('Suffix')
    const frame = screen.getByRole('group').querySelector<HTMLElement>('[data-slot="frame"]')!
    expect(input.className).toContain('h-6.5')
    expect(leading.className).toContain('first-leading')
    expect(leading.className).toContain('local-leading')
    expect(leading.style.color).toBe('blue')
    expect(frame.className).toContain('theme-frame')
    expect(frame.style.color).toBe('green')
    setTheme(defineTheme({ inputGroup: { defaultVariants: { size: 'lg' } } }))
    setLeadingClass('next-leading')
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input.className).toContain('h-8.5')
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
      createSignal<InputGroupT.Variant['orientation']>('horizontal')
    const screen = baseRender(() => (
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

  test('mounts part children once and preserves native value, selection and focus across changes', () => {
    const [show, setShow] = createSignal(true)
    const [text, setText] = createSignal('First')
    const mount = vi.fn()
    const cleanup = vi.fn()
    let reads = 0
    function Content() {
      onMount(mount)
      onCleanup(cleanup)
      return <span>{text()}</span>
    }
    const screen = render(() => (
      <InputGroup>
        <Show when={show()}>
          {createComponent(InputGroup.Leading, {
            get children() {
              reads += 1
              return <Content />
            },
          })}
        </Show>
        <Input defaultValue="Draft" />
      </InputGroup>
    ))
    const control = screen.getByRole('textbox') as HTMLInputElement
    control.focus()
    control.setSelectionRange(1, 3)
    setText('Next')
    expect(screen.getByText('Next')).toBeTruthy()
    expect(reads).toBe(1)
    expect(mount).toHaveBeenCalledOnce()
    setShow(false)
    expect(cleanup).toHaveBeenCalledOnce()
    setShow(true)
    expect(mount).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('textbox')).toBe(control)
    expect(control.value).toBe('Draft')
    expect(control.selectionStart).toBe(1)
    expect(control.selectionEnd).toBe(3)
    expect(document.activeElement).toBe(control)
    screen.unmount()
    expect(cleanup).toHaveBeenCalledTimes(2)
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
    const control = screen.getByLabelText('Message') as HTMLInputElement
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
    const focus = vi.spyOn(control, 'focus')
    expect(portalTarget).toBeTruthy()
    fireEvent.pointerDown(portalTarget!, { button: 0 })
    expect(focus).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(control)
  })

  test('does not focus control or activate focus ring when clicking dropdown trigger and clicking outside', () => {
    const screen = render(() => (
      <InputGroup>
        <Input aria-label="File name" placeholder="Enter file name" />
        <InputGroup.Trailing compact>
          <DropdownMenu placement="bottom-end">
            <DropdownMenu.Trigger as={Button} type="button" variant="ghost" size="icon-xs">
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
    const focusSpy = vi.spyOn(control, 'focus')

    fireEvent.click(trigger)
    expect(focusSpy).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(control)

    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement
    if (overlay) {
      fireEvent.pointerDown(overlay, { button: 0 })
      expect(focusSpy).not.toHaveBeenCalled()
      expect(document.activeElement).not.toBe(control)
    }
  })
})
