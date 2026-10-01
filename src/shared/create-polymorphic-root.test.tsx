import { fireEvent, render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { Show, createSignal, splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../element/button'
import type { ButtonProps } from '../element/button'

import { createPolymorphicRoot } from './create-polymorphic-root'
import type { ValidComponent } from './types'
import { useButtonInteraction } from './use-button-interaction'
import { callHandler } from './utils'

const NativeButton = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />
const NativeLink = (props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />
const NativeSpan = (props: JSX.HTMLAttributes<HTMLSpanElement>) => <span {...props} />
const CancelingButton = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    onClick={(event) => {
      event.preventDefault()
      callHandler(event, props.onClick)
    }}
  />
)

function Root(
  props: Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'> & {
    as?: ValidComponent
    href?: string
    type?: string
    disabled?: boolean
    focusableWhenDisabled?: boolean
    ref?: (element: HTMLElement | undefined) => void
    onPress?: () => void
    bridgeClick?: boolean
  },
) {
  const [local, rest] = splitProps(props, [
    'as',
    'disabled',
    'focusableWhenDisabled',
    'ref',
    'onPress',
    'bridgeClick',
  ])
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({
    tag,
    bridgeClick: untrack(() => local.bridgeClick),
    ref: () => local.ref,
  })
  const binding = root.bind(
    useButtonInteraction(
      {
        tag,
        element: root.element,
        disabled: () => Boolean(local.disabled),
        focusableWhenDisabled: () => Boolean(local.focusableWhenDisabled),
        onPress: () => local.onPress?.(),
      },
      rest,
    ),
  )
  return <Dynamic component={tag()} {...binding} />
}

describe('polymorphic root', () => {
  test.each([
    ['button', 'BUTTON', undefined],
    ['a', 'A', '/docs'],
    ['div', 'DIV', undefined],
    ['span', 'SPAN', undefined],
    [NativeButton, 'BUTTON', undefined],
    [NativeLink, 'A', '/docs'],
    [Button, 'BUTTON', undefined],
  ] as const)('resolves %s semantics from its DOM root and clicks once', (as, name, href) => {
    const press = vi.fn()
    const click = vi.fn()
    const screen = render(() => (
      <Root as={as} href={href} onClick={click} onPress={press}>
        Action
      </Root>
    ))
    const element = screen.container.firstElementChild as HTMLElement
    expect(element.tagName).toBe(name)
    expect(element.getAttribute('role')).toBe(name === 'DIV' || name === 'SPAN' ? 'button' : null)
    if (name === 'BUTTON') {
      expect(element.getAttribute('type')).toBe('button')
    }
    fireEvent.click(element)
    expect(click).toHaveBeenCalledOnce()
    expect(press).toHaveBeenCalledOnce()
  })

  test('releases refs on reactive root replacement and unmount', () => {
    const [as, setAs] = createSignal<ValidComponent>(NativeButton)
    const ref = vi.fn()
    const screen = render(() => (
      <Root as={as()} ref={ref}>
        Action
      </Root>
    ))
    const initial = screen.container.firstElementChild
    setAs(() => NativeLink)
    const replacement = screen.container.firstElementChild
    expect(replacement).not.toBe(initial)
    expect(ref.mock.calls.map(([element]) => element)).toEqual([initial, undefined, replacement])
    screen.unmount()
    expect(ref.mock.calls.at(-1)).toEqual([undefined])
    expect(ref).toHaveBeenCalledTimes(4)
  })

  test('updates native disabled semantics after a custom root resolves', () => {
    const [disabled, setDisabled] = createSignal(true)
    const screen = render(() => (
      <Root as={NativeButton} disabled={disabled()}>
        Action
      </Root>
    ))
    const element = screen.getByRole('button') as HTMLButtonElement
    expect(element.disabled).toBe(true)
    expect(element.hasAttribute('role')).toBe(false)
    setDisabled(false)
    expect(element.disabled).toBe(false)
    expect(screen.getByRole('button')).toBe(element)
  })

  test('keeps focusable disabled roots inert and preserves explicit attributes', () => {
    const press = vi.fn()
    const screen = render(() => (
      <Root
        as={NativeButton}
        disabled
        focusableWhenDisabled
        type="submit"
        role="menuitem"
        tabIndex={3}
        onPress={press}
      >
        Action
      </Root>
    ))
    const element = screen.getByRole('menuitem') as HTMLButtonElement
    expect(element.type).toBe('submit')
    expect(element.tabIndex).toBe(3)
    expect(element.disabled).toBe(false)
    expect(element.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(element)
    fireEvent.keyDown(element, { key: 'Enter' })
    expect(press).not.toHaveBeenCalled()
  })

  test('runs consumers before activation and honors custom cancellation', () => {
    const press = vi.fn()
    const screen = render(() => (
      <>
        <Root as={CancelingButton} onPress={press}>
          Custom
        </Root>
        <Root
          as="div"
          onClick={(event) => event.preventDefault()}
          onKeyDown={(event) => event.preventDefault()}
          onPress={press}
        >
          Consumer
        </Root>
      </>
    ))
    fireEvent.click(screen.getByText('Custom'))
    fireEvent.click(screen.getByText('Consumer'))
    fireEvent.keyDown(screen.getByText('Consumer'), { key: 'Enter' })
    fireEvent.keyDown(screen.getByText('Consumer'), { key: ' ' })
    fireEvent.keyUp(screen.getByText('Consumer'), { key: ' ' })
    expect(press).not.toHaveBeenCalled()
  })

  test('activates non-native roots with Enter and Space independently', () => {
    const press = vi.fn()
    const screen = render(() => (
      <Root as="span" onPress={press}>
        Action
      </Root>
    ))
    const element = screen.getByRole('button')
    fireEvent.keyDown(element, { key: 'Enter' })
    expect(press).toHaveBeenCalledOnce()
    fireEvent.keyDown(element, { key: ' ' })
    expect(press).toHaveBeenCalledOnce()
    fireEvent.keyUp(element, { key: ' ' })
    expect(press).toHaveBeenCalledTimes(2)
  })

  test.each(['button', NativeButton] as const)(
    'bridges adopted %s roots without duplicate clicks',
    (as) => {
      const iframe = document.createElement('iframe')
      document.body.append(iframe)
      const ownerDocument = iframe.contentDocument!
      const host = ownerDocument.createElement('div')
      ownerDocument.body.append(host)
      const press = vi.fn()
      const screen = render(
        () => (
          <Root as={as} onPress={press}>
            Foreign
          </Root>
        ),
        { container: host },
      )
      try {
        fireEvent.click(host.firstElementChild!)
        expect(press).toHaveBeenCalledOnce()
      } finally {
        screen.unmount()
        iframe.remove()
      }
    },
  )

  test('removes document bridges when nested roots unmount', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const [visible, setVisible] = createSignal(true)
    const press = vi.fn()
    const ConditionalButton = (props: ButtonProps) => (
      <Show when={visible()}>
        <Button {...props} />
      </Show>
    )
    const screen = render(() => (
      <Root as={ConditionalButton} onPress={press} bridgeClick>
        Action
      </Root>
    ))
    const element = screen.getByRole('button')
    const listeners = add.mock.calls.filter(([type]) => type === 'click')
    setVisible(false)
    document.body.append(element)
    fireEvent.click(element)
    expect(press).not.toHaveBeenCalled()
    for (const [, listener] of listeners) {
      expect(
        remove.mock.calls.some(([type, removed]) => type === 'click' && removed === listener),
      ).toBe(true)
    }
    element.remove()
    screen.unmount()
    add.mockRestore()
    remove.mockRestore()
  })

  test.each(['span', NativeSpan] as const)(
    'delegates the first keyboard event after adopting %s into an iframe',
    (as) => {
      const iframe = document.createElement('iframe')
      document.body.append(iframe)
      const ownerDocument = iframe.contentDocument!
      const press = vi.fn()
      const keyDown = vi.fn()
      const screen = render(() => (
        <Root as={as} onPress={press} onKeyDown={keyDown} bridgeClick>
          Action
        </Root>
      ))
      const element = screen.getByRole('button')
      ownerDocument.body.append(ownerDocument.adoptNode(element))
      try {
        fireEvent.keyDown(element, { key: 'Enter' })
        expect(keyDown).toHaveBeenCalledOnce()
        expect(press).toHaveBeenCalledOnce()
        fireEvent.keyDown(element, { key: ' ' })
        fireEvent.keyUp(element, { key: ' ' })
        expect(press).toHaveBeenCalledTimes(2)
      } finally {
        screen.unmount()
        iframe.remove()
      }
    },
  )
})
