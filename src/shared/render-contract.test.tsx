import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { createComponent, createSignal, onCleanup, splitProps, untrack } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import {
  BaseSelect,
  Breadcrumb,
  Button,
  Combobox,
  CommandPalette,
  ContextMenu,
  DropdownMenu,
  Modal,
  MultiSelect,
  Popover,
  Progress,
  Select,
} from '../index'
import type { ButtonProps } from '../index'

import { callHandler } from './utils'

describe('render and polymorphic contracts', () => {
  test('custom target receives onClick', () => {
    let supplied: unknown
    const Custom = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => {
      supplied = untrack(() => props.onClick)
      return <button {...props}>Action</button>
    }
    render(() => <Button as={Custom} onClick={vi.fn()} />)
    expect(typeof supplied).toBe('function')
  })

  test('custom target owns whether onClick is forwarded', () => {
    const click = vi.fn()
    const Custom = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button ref={props.ref}>Action</button>
    )
    const view = render(() => <Button as={Custom} onClick={click} />)
    fireEvent.click(view.getByText('Action'))
    expect(click).not.toHaveBeenCalled()
  })

  test('custom targets can wrap and programmatically invoke their click handler', () => {
    const calls: string[] = []
    let invoke!: () => void
    const Custom = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => {
      const handler = untrack(() => props.onClick)
      invoke = () => callHandler(new MouseEvent('click'), handler)
      return (
        <button
          {...props}
          onClick={(event) => {
            calls.push('custom')
            callHandler(event, props.onClick)
          }}
        >
          Action
        </button>
      )
    }
    const view = render(() => <Button as={Custom} onClick={() => calls.push('consumer')} />)
    invoke()
    fireEvent.click(view.getByText('Action'))
    expect(calls).toEqual(['consumer', 'custom', 'consumer'])
  })

  test('Progress replaces renderer A with B and cleans up A', () => {
    const cleanup = vi.fn()
    const A = () => {
      onCleanup(cleanup)
      return <span>A</span>
    }
    const B = () => <span>B</span>
    const [renderer, setRenderer] = createSignal(A)
    const view = render(() => <Progress value={1} max={['One', 'Two']} stepRender={renderer()} />)
    expect(view.getAllByText('A')).toHaveLength(2)
    setRenderer(() => B)
    expect(view.queryAllByText('A')).toHaveLength(0)
    expect(view.getAllByText('B')).toHaveLength(2)
    expect(cleanup).toHaveBeenCalledTimes(2)
  })

  test('MultiSelect replaces tag renderer A with B', () => {
    const A = () => <span>A</span>
    const B = () => <span>B</span>
    const [renderer, setRenderer] = createSignal(A)
    const view = render(() => (
      <MultiSelect items={[{ value: 'x', label: 'X' }]} value={['x']} tagRender={renderer()} />
    ))
    expect(view.getByText('A')).toBeTruthy()
    setRenderer(() => B)
    expect(view.queryByText('A')).toBeNull()
    expect(view.getByText('B')).toBeTruthy()
  })

  test('Select replaces item renderer A with B', async () => {
    const A = () => <span>A</span>
    const B = () => <span>B</span>
    const [renderer, setRenderer] = createSignal(A)
    render(() => <Select defaultOpen items={['x']} itemRender={renderer()} />)
    await waitFor(() => expect(screen.getByText('A')).toBeTruthy())
    setRenderer(() => B)
    expect(screen.queryByText('A')).toBeNull()
    expect(screen.getByText('B')).toBeTruthy()
  })

  test.each([
    [
      'Combobox',
      (props: { emptyRender?: () => JSX.Element }) => (
        <Combobox defaultOpen items={[]} emptyRender={props.emptyRender} />
      ),
    ],
    [
      'MultiSelect',
      (props: { emptyRender?: () => JSX.Element }) => (
        <MultiSelect defaultOpen items={[]} emptyRender={props.emptyRender} />
      ),
    ],
  ] as const)('%s replaces empty renderers and restores the default content', (_name, Control) => {
    const cleanedA = vi.fn()
    const cleanedB = vi.fn()
    const A = () => {
      onCleanup(cleanedA)
      return <span>Empty A</span>
    }
    const B = () => {
      onCleanup(cleanedB)
      return <span>Empty B</span>
    }
    const [emptyRender, setEmptyRender] = createSignal<(() => JSX.Element) | undefined>(A)
    render(() => <Control emptyRender={emptyRender()} />)
    expect(screen.getByText('Empty A')).toBeTruthy()

    setEmptyRender(() => B)
    expect(screen.queryByText('Empty A')).toBeNull()
    expect(screen.getByText('Empty B')).toBeTruthy()
    expect(cleanedA).toHaveBeenCalledTimes(1)

    setEmptyRender(undefined)
    expect(screen.queryByText('Empty B')).toBeNull()
    expect(screen.getByText('No items')).toBeTruthy()
    expect(cleanedB).toHaveBeenCalledTimes(1)
  })

  test('CommandPalette replaces item renderer A with B', () => {
    const A = () => <span>A</span>
    const B = () => <span>B</span>
    const [renderer, setRenderer] = createSignal(A)
    const view = render(() => (
      <CommandPalette groups={[{ id: 'g', items: [{ value: 'x' }] }]} itemRender={renderer()} />
    ))
    expect(view.getByText('A')).toBeTruthy()
    setRenderer(() => B)
    expect(view.queryByText('A')).toBeNull()
    expect(view.getByText('B')).toBeTruthy()
  })

  test('DropdownMenu replaces item renderer A with B', async () => {
    const A = () => <span>A</span>
    const B = () => <span>B</span>
    const [renderer, setRenderer] = createSignal(A)
    render(() => (
      <DropdownMenu defaultOpen>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Content items={[{ label: 'x' }]} itemRender={renderer()} />
      </DropdownMenu>
    ))
    await waitFor(() => expect(screen.getByText('A')).toBeTruthy())
    setRenderer(() => B)
    expect(screen.queryByText('A')).toBeNull()
    expect(screen.getByText('B')).toBeTruthy()
  })

  test.each([
    [
      'Breadcrumb',
      (props: { renderer: () => JSX.Element }) => (
        <Breadcrumb items={[{ label: 'x' }, { label: 'y' }]} itemRender={props.renderer} />
      ),
    ],
    [
      'Combobox',
      (props: { renderer: () => JSX.Element }) => (
        <Combobox defaultOpen items={['x', 'y']} itemRender={props.renderer} />
      ),
    ],
    [
      'MultiSelect options',
      (props: { renderer: () => JSX.Element }) => (
        <MultiSelect
          defaultOpen
          items={[
            { value: 'x', label: 'X' },
            { value: 'y', label: 'Y' },
          ]}
          itemRender={props.renderer}
        />
      ),
    ],
    [
      'ContextMenu',
      (props: { renderer: () => JSX.Element }) => (
        <ContextMenu defaultOpen>
          <ContextMenu.Trigger>Open</ContextMenu.Trigger>
          <ContextMenu.Content
            items={[{ label: 'x' }, { label: 'y' }]}
            itemRender={props.renderer}
          />
        </ContextMenu>
      ),
    ],
  ] as const)('%s replaces and cleans up each renderer instance', async (_name, fixture) => {
    const cleanupA = vi.fn()
    const cleanupB = vi.fn()
    const A = () => {
      onCleanup(cleanupA)
      return <span>A</span>
    }
    const B = () => {
      onCleanup(cleanupB)
      return <span>B</span>
    }
    const [renderer, setRenderer] = createSignal(A)
    const view = render(() =>
      createComponent(fixture, {
        get renderer() {
          return renderer()
        },
      }),
    )
    await waitFor(() => expect(screen.getAllByText('A')).toHaveLength(2))
    setRenderer(() => B)
    expect(screen.queryAllByText('A')).toHaveLength(0)
    expect(screen.getAllByText('B')).toHaveLength(2)
    expect(cleanupA).toHaveBeenCalledTimes(2)
    view.unmount()
    expect(cleanupB).toHaveBeenCalledTimes(2)
  })

  test('custom Button inside a trigger cancels before the outer activation', () => {
    const onOpenChange = vi.fn()
    const Native = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />
    const Custom = (props: ButtonProps) => (
      <Button {...props} as={Native} onClick={(event) => event.preventDefault()} />
    )
    const view = render(() => (
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger as={Custom}>Open</DropdownMenu.Trigger>
        <DropdownMenu.Content items={[{ label: 'x' }]} />
      </DropdownMenu>
    ))
    fireEvent.click(view.getByText('Open'))
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('nested custom overlay triggers cancel before outer activation', () => {
    const onOpenChange = vi.fn()
    const Native = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />
    const Custom = (
      props: Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> & {
        style?: JSX.CSSProperties
      },
    ) => (
      <Popover>
        <Popover.Trigger {...props} as={Native} onClick={(event) => event.preventDefault()} />
      </Popover>
    )
    const view = render(() => (
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger as={Custom}>Open</DropdownMenu.Trigger>
      </DropdownMenu>
    ))
    fireEvent.click(view.getByText('Open'))
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('foreign custom root cancels keyboard before activation', () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const host = iframe.contentDocument!.createElement('div')
    iframe.contentDocument!.body.append(host)
    const onOpenChange = vi.fn()
    const Custom = (props: JSX.HTMLAttributes<HTMLDivElement>) => (
      <div {...props} onKeyDown={(event) => event.preventDefault()} />
    )
    const view = render(
      () => (
        <DropdownMenu onOpenChange={onOpenChange}>
          <DropdownMenu.Trigger as={Custom}>Open</DropdownMenu.Trigger>
          <DropdownMenu.Content items={[{ label: 'x' }]} />
        </DropdownMenu>
      ),
      { container: host },
    )
    try {
      fireEvent.keyDown(host.firstElementChild!, { key: 'Enter' })
      expect(onOpenChange).not.toHaveBeenCalled()
    } finally {
      view.unmount()
      iframe.remove()
    }
  })

  test.each(['main', 'iframe'] as const)(
    'custom trigger keyboard cancellation works in %s',
    (realm) => {
      const iframe = document.createElement('iframe')
      document.body.append(iframe)
      const ownerDocument = realm === 'iframe' ? iframe.contentDocument! : document
      const host = ownerDocument.createElement('div')
      ownerDocument.body.append(host)
      const onOpenChange = vi.fn()
      const customKeyDown = vi.fn()
      const Custom = (props: JSX.HTMLAttributes<HTMLDivElement>) => (
        <div
          {...props}
          onKeyDown={(event) => {
            customKeyDown()
            event.preventDefault()
            callHandler(event, props.onKeyDown)
          }}
        />
      )
      const view = render(
        () => (
          <>
            <Modal onOpenChange={onOpenChange}>
              <Modal.Trigger as={Custom}>Modal</Modal.Trigger>
            </Modal>
            <Popover onOpenChange={onOpenChange}>
              <Popover.Trigger as={Custom}>Popover</Popover.Trigger>
            </Popover>
            <DropdownMenu onOpenChange={onOpenChange}>
              <DropdownMenu.Trigger as={Custom}>DropdownMenu</DropdownMenu.Trigger>
            </DropdownMenu>
            <ContextMenu onOpenChange={onOpenChange}>
              <ContextMenu.Trigger as={Custom}>ContextMenu</ContextMenu.Trigger>
            </ContextMenu>
            <BaseSelect items={[{ value: 'x', label: 'X' }]} onOpenChange={onOpenChange}>
              <BaseSelect.Trigger as={Custom}>BaseSelect</BaseSelect.Trigger>
            </BaseSelect>
          </>
        ),
        { container: host },
      )
      try {
        for (const trigger of host.querySelectorAll('[aria-haspopup]')) {
          const keys = trigger.textContent === 'ContextMenu' ? ['ContextMenu'] : ['Enter', ' ']
          for (const key of keys) {
            fireEvent.keyDown(trigger, { key })
            fireEvent.keyUp(trigger, { key })
          }
          expect(trigger.getAttribute('aria-expanded')).toBe('false')
        }
        expect(customKeyDown).toHaveBeenCalledTimes(9)
        expect(onOpenChange).not.toHaveBeenCalled()
      } finally {
        view.unmount()
        host.remove()
        iframe.remove()
      }
    },
  )

  test.each(['main', 'iframe'] as const)('custom keyup can cancel Space in %s', (realm) => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const ownerDocument = realm === 'iframe' ? iframe.contentDocument! : document
    const host = ownerDocument.createElement('div')
    ownerDocument.body.append(host)
    const onOpenChange = vi.fn()
    const customKeyUp = vi.fn()
    const Custom = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button
        {...props}
        onKeyUp={(event) => {
          customKeyUp()
          event.preventDefault()
          callHandler(event, props.onKeyUp)
        }}
      />
    )
    const view = render(
      () => (
        <DropdownMenu onOpenChange={onOpenChange}>
          <DropdownMenu.Trigger as={Custom}>Open</DropdownMenu.Trigger>
        </DropdownMenu>
      ),
      { container: host },
    )
    try {
      fireEvent.keyDown(host.firstElementChild!, { key: ' ' })
      fireEvent.keyUp(host.firstElementChild!, { key: ' ' })
      expect(customKeyUp).toHaveBeenCalledOnce()
      expect(onOpenChange).not.toHaveBeenCalled()
    } finally {
      view.unmount()
      host.remove()
      iframe.remove()
    }
  })

  test('normal forwarded keyboard events work without a forwarded ref', () => {
    const keyDown = vi.fn()
    const Custom = (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => {
      const [, attributes] = splitProps(props, ['ref'])
      return <button {...attributes}>Action</button>
    }
    const view = render(() => <Button as={Custom} onKeyDown={keyDown} />)
    fireEvent.keyDown(view.getByText('Action'), { key: 'Escape' })
    expect(keyDown).toHaveBeenCalledOnce()
  })

  test('Button custom input preserves the custom root input type', () => {
    const Input = (props: JSX.InputHTMLAttributes<HTMLInputElement>) => (
      <input type="file" {...props} />
    )
    const view = render(() => <Button as={Input} />)
    expect((view.container.firstChild as HTMLInputElement).type).toBe('file')
  })

  test('native string Button custom input preserves explicit type', () => {
    const view = render(() => <Button as="input" type="file" />)
    expect((view.container.firstChild as HTMLInputElement).type).toBe('file')
  })
})
