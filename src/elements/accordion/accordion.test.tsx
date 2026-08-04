import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Accordion } from './accordion.tsx'
import type { AccordionT } from './accordion.tsx'

const BASE_ITEMS: [AccordionT.Item, AccordionT.Item, AccordionT.Item] = [
  {
    value: 'one',
    label: 'One',
    leading: 'icon-house',
    content: <span>Content one</span>,
  },
  {
    value: 'two',
    label: 'Two',
    content: <span>Content two</span>,
  },
  {
    value: 'three',
    label: 'Three',
    content: <span>Content three</span>,
  },
]

describe('Accordion', () => {
  test('renders default expanded item in single mode', () => {
    const screen = render(() => <Accordion items={BASE_ITEMS} defaultValue={['one']} />)

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const headings = screen.getAllByRole('heading')

    expect(headings).toHaveLength(3)
    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Content one')).not.toBeNull()
  })

  test('single mode toggles same item and emits [] when collapsible=true', async () => {
    const onChange = vi.fn()

    const screen = render(() => (
      <Accordion items={BASE_ITEMS} collapsible defaultValue={['one']} onChange={onChange} />
    ))

    const triggerOne = screen.getByRole('button', { name: 'One' })

    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')

    await fireEvent.click(triggerOne)
    await Promise.resolve()

    expect(triggerOne.getAttribute('aria-expanded')).toBe('false')
    expect(onChange).toHaveBeenCalledWith([])

    await fireEvent.click(triggerOne)
    await Promise.resolve()

    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')
    expect(onChange).toHaveBeenLastCalledWith(['one'])
  })

  test('single mode does not close same item when collapsible=false', async () => {
    const screen = render(() => (
      <Accordion items={BASE_ITEMS} collapsible={false} defaultValue={['one']} />
    ))

    const triggerOne = screen.getByRole('button', { name: 'One' })

    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')

    await fireEvent.click(triggerOne)
    await Promise.resolve()

    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')
  })

  test('multiple mode allows expanding multiple items', async () => {
    const screen = render(() => <Accordion items={BASE_ITEMS} multiple defaultValue={['one']} />)

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const triggerTwo = screen.getByRole('button', { name: 'Two' })

    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')
    expect(triggerTwo.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.click(triggerTwo)
    await Promise.resolve()

    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')
    expect(triggerTwo.getAttribute('aria-expanded')).toBe('true')
  })

  test('collapsible mode toggles with Enter on the focused trigger', async () => {
    const screen = render(() => <Accordion items={BASE_ITEMS} collapsible defaultValue={['one']} />)

    const triggerOne = screen.getByRole('button', { name: 'One' })

    triggerOne.focus()

    await fireEvent.keyDown(triggerOne, { key: 'Enter' })
    expect(triggerOne.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.keyDown(triggerOne, { key: 'Enter' })
    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')
  })

  test('multiple mode toggles with Space on the focused trigger', async () => {
    const screen = render(() => <Accordion items={BASE_ITEMS} multiple defaultValue={['one']} />)

    const triggerOne = screen.getByRole('button', { name: 'One' })

    triggerOne.focus()

    await fireEvent.keyDown(triggerOne, { key: ' ' })
    expect(triggerOne.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.keyDown(triggerOne, { key: ' ' })
    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')
  })

  test('navigates triggers with ArrowDown, ArrowUp, Home, and End', async () => {
    const screen = render(() => <Accordion items={BASE_ITEMS} />)

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const triggerTwo = screen.getByRole('button', { name: 'Two' })
    const triggerThree = screen.getByRole('button', { name: 'Three' })

    triggerOne.focus()

    await fireEvent.keyDown(triggerOne, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(triggerTwo)

    await fireEvent.keyDown(triggerTwo, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(triggerThree)

    await fireEvent.keyDown(triggerThree, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(triggerOne)

    await fireEvent.keyDown(triggerOne, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(triggerThree)

    await fireEvent.keyDown(triggerThree, { key: 'Home' })
    expect(document.activeElement).toBe(triggerOne)

    await fireEvent.keyDown(triggerOne, { key: 'End' })
    expect(document.activeElement).toBe(triggerThree)
  })

  test('does not wrap trigger focus when loopFocus=false', async () => {
    const screen = render(() => <Accordion items={BASE_ITEMS} loopFocus={false} />)

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const triggerThree = screen.getByRole('button', { name: 'Three' })

    triggerOne.focus()

    await fireEvent.keyDown(triggerOne, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(triggerOne)

    triggerThree.focus()

    await fireEvent.keyDown(triggerThree, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(triggerThree)
  })

  test('keyboard navigation skips disabled triggers and tolerates all disabled items', async () => {
    const screen = render(() => (
      <Accordion
        items={[
          BASE_ITEMS[0],
          {
            ...BASE_ITEMS[1],
            disabled: true,
          },
          BASE_ITEMS[2],
        ]}
      />
    ))

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const triggerThree = screen.getByRole('button', { name: 'Three' })

    triggerOne.focus()

    await fireEvent.keyDown(triggerOne, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(triggerThree)

    await fireEvent.keyDown(triggerThree, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(triggerOne)

    const disabledScreen = render(() => <Accordion items={BASE_ITEMS} disabled />)
    const disabledTriggerOne = disabledScreen.getByRole('button', { name: 'One' })

    expect(() => fireEvent.keyDown(disabledTriggerOne, { key: 'ArrowDown' })).not.toThrow()
  })

  test('uses stable aria ids for trigger and content relationships', () => {
    const screen = render(() => (
      <Accordion id="settings" items={BASE_ITEMS} defaultValue={['one']} />
    ))

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const contentOne = screen.getByRole('region', { name: 'One' })

    expect(triggerOne.id).toBe('settings-one-trigger')
    expect(contentOne.id).toBe('settings-one-content')
    expect(triggerOne.getAttribute('aria-controls')).toBe(contentOne.id)
    expect(contentOne.getAttribute('aria-labelledby')).toBe(triggerOne.id)
  })

  test('omits aria-controls while closed, including during exit animation', async () => {
    const screen = render(() => <Accordion id="settings" items={BASE_ITEMS} />)

    const triggerOne = screen.getByRole('button', { name: 'One' })

    expect(triggerOne.hasAttribute('aria-controls')).toBe(false)

    await fireEvent.click(triggerOne)

    const contentOne = screen.getByRole('region', { name: 'One' })

    expect(triggerOne.getAttribute('aria-controls')).toBe('settings-one-content')
    expect(contentOne.id).toBe('settings-one-content')

    await fireEvent.click(triggerOne)
    await Promise.resolve()

    expect(triggerOne.hasAttribute('aria-controls')).toBe(false)
    expect(contentOne.getAttribute('data-closed')).toBe('')

    await fireEvent.transitionEnd(contentOne, { propertyName: 'height' })

    expect(triggerOne.hasAttribute('aria-controls')).toBe(false)
  })

  test('single controlled mode emits onChange and keeps controlled UI state', async () => {
    const onChange = vi.fn()

    const screen = render(() => (
      <Accordion items={BASE_ITEMS} value={['one']} onChange={onChange} />
    ))

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const triggerTwo = screen.getByRole('button', { name: 'Two' })

    await fireEvent.click(triggerTwo)
    await Promise.resolve()

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['two'])
    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')
    expect(triggerTwo.getAttribute('aria-expanded')).toBe('false')
  })

  test('multiple controlled mode emits onChange and keeps controlled UI state', async () => {
    const onChange = vi.fn()

    const screen = render(() => (
      <Accordion items={BASE_ITEMS} multiple value={['one']} onChange={onChange} />
    ))

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const triggerTwo = screen.getByRole('button', { name: 'Two' })

    await fireEvent.click(triggerTwo)
    await Promise.resolve()

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['one', 'two'])
    expect(triggerOne.getAttribute('aria-expanded')).toBe('true')
    expect(triggerTwo.getAttribute('aria-expanded')).toBe('false')
  })

  test('root disabled prevents toggling', async () => {
    const onChange = vi.fn()

    const screen = render(() => <Accordion items={BASE_ITEMS} disabled onChange={onChange} />)

    const triggerOne = screen.getByRole('button', { name: 'One' })

    await fireEvent.click(triggerOne)
    await Promise.resolve()

    expect(triggerOne.getAttribute('aria-expanded')).toBe('false')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('disabled state applies data-disabled to root and disabled item parts', () => {
    const rootDisabledScreen = render(() => (
      <Accordion items={BASE_ITEMS} disabled defaultValue={['one']} />
    ))

    const root = rootDisabledScreen.container.querySelector('[data-slot="root"]')
    const item = rootDisabledScreen.container.querySelector('[data-slot="item"]')
    const header = rootDisabledScreen.container.querySelector('[data-slot="header"]')
    const trigger = rootDisabledScreen.getByRole('button', { name: 'One' })
    const content = rootDisabledScreen.getByRole('region', { name: 'One' })

    expect(root?.getAttribute('data-disabled')).toBe('')
    expect(item?.getAttribute('data-disabled')).toBe('')
    expect(header?.getAttribute('data-disabled')).toBe('')
    expect(trigger.getAttribute('data-disabled')).toBe('')
    expect(content.getAttribute('data-disabled')).toBe('')

    const itemDisabledScreen = render(() => (
      <Accordion
        items={[
          {
            ...BASE_ITEMS[0],
            disabled: true,
          },
          BASE_ITEMS[1],
        ]}
        defaultValue={['one']}
      />
    ))

    const itemNodes = itemDisabledScreen.container.querySelectorAll('[data-slot="item"]')
    const headerNodes = itemDisabledScreen.container.querySelectorAll('[data-slot="header"]')
    const triggerOne = itemDisabledScreen.getByRole('button', { name: 'One' })
    const triggerTwo = itemDisabledScreen.getByRole('button', { name: 'Two' })
    const contentOne = itemDisabledScreen.getByRole('region', { name: 'One' })

    expect(itemNodes[0]?.getAttribute('data-disabled')).toBe('')
    expect(headerNodes[0]?.getAttribute('data-disabled')).toBe('')
    expect(triggerOne.getAttribute('data-disabled')).toBe('')
    expect(contentOne.getAttribute('data-disabled')).toBe('')
    expect(itemNodes[1]?.hasAttribute('data-disabled')).toBe(false)
    expect(headerNodes[1]?.hasAttribute('data-disabled')).toBe(false)
    expect(triggerTwo.hasAttribute('data-disabled')).toBe(false)
  })

  test('disabled item cannot be toggled while other items still work', async () => {
    const onChange = vi.fn()

    const screen = render(() => (
      <Accordion
        items={[
          BASE_ITEMS[0],
          {
            ...BASE_ITEMS[1],
            disabled: true,
          },
        ]}
        onChange={onChange}
      />
    ))

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const triggerTwo = screen.getByRole('button', { name: 'Two' })

    await fireEvent.click(triggerTwo)
    await Promise.resolve()

    expect(triggerTwo.getAttribute('aria-expanded')).toBe('false')
    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.click(triggerOne)
    await Promise.resolve()

    expect(onChange).toHaveBeenCalledWith(['one'])
  })

  test('respects unmountOnHide=true/false', () => {
    const unmountScreen = render(() => (
      <Accordion items={BASE_ITEMS} defaultValue={undefined} unmountOnHide />
    ))

    expect(unmountScreen.queryByText('Content one')).toBeNull()

    const keepMountedScreen = render(() => (
      <Accordion items={BASE_ITEMS} defaultValue={undefined} unmountOnHide={false} />
    ))

    expect(keepMountedScreen.queryByText('Content one')).not.toBeNull()
  })

  test('controlled item opens from empty value with measured height', async () => {
    const scrollHeight = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(48)

    try {
      const ControlledAccordion = () => {
        const [openValue, setOpenValue] = createSignal<string[]>([])

        return (
          <>
            <Accordion
              id="settings"
              items={BASE_ITEMS}
              value={openValue()}
              onChange={setOpenValue}
            />
            <span data-testid="open-value">{openValue()[0] ?? 'none'}</span>
          </>
        )
      }

      const screen = render(() => <ControlledAccordion />)
      const triggerOne = screen.getByRole('button', { name: 'One' })

      expect(screen.getByTestId('open-value').textContent).toBe('none')
      expect(screen.queryByRole('region', { name: 'One' })).toBeNull()

      await fireEvent.click(triggerOne)
      await Promise.resolve()

      const contentOne = screen.getByRole('region', { name: 'One' })

      expect(screen.getByTestId('open-value').textContent).toBe('one')
      await waitFor(() => {
        expect(contentOne.getAttribute('data-expanded')).toBe('')
        expect(contentOne.className).toContain('transition-[height]')
        expect(contentOne.className).not.toContain('animate-accordion-down')
        expect(contentOne.getAttribute('style')).toContain('--mo-collapsible-content-height: 48px')
      })

      await fireEvent.click(triggerOne)
      await Promise.resolve()

      expect(screen.getByTestId('open-value').textContent).toBe('none')
      expect(contentOne.getAttribute('data-closed')).toBe('')
      expect(contentOne.hasAttribute('data-collapsed')).toBe(false)

      await fireEvent.transitionEnd(contentOne, { propertyName: 'height' })

      expect(screen.queryByRole('region', { name: 'One' })).toBeNull()
    } finally {
      scrollHeight.mockRestore()
    }
  })

  test('expands the next same-height item without a delayed collapsed frame', async () => {
    const scrollHeight = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(48)

    try {
      const screen = render(() => (
        <Accordion id="settings" items={BASE_ITEMS} defaultValue={['one']} />
      ))

      const triggerTwo = screen.getByRole('button', { name: 'Two' })

      await waitFor(() => {
        expect(screen.getByRole('region', { name: 'One' }).getAttribute('style')).toContain(
          '--mo-collapsible-content-height: 48px',
        )
      })

      await fireEvent.click(triggerTwo)
      await Promise.resolve()

      const contentOne = screen.getByRole('region', { name: 'One' })
      const contentTwo = screen.getByRole('region', { name: 'Two' })

      expect(contentOne.getAttribute('data-closed')).toBe('')
      expect(contentTwo.getAttribute('data-expanded')).toBe('')
      expect(contentTwo.getAttribute('style')).toContain('--mo-collapsible-content-height: 48px')
    } finally {
      scrollHeight.mockRestore()
    }
  })

  test('keeps content mounted until the close transition ends', async () => {
    const screen = render(() => (
      <Accordion id="settings" items={BASE_ITEMS} defaultValue={['one']} unmountOnHide />
    ))

    const triggerOne = screen.getByRole('button', { name: 'One' })
    const contentOne = screen.getByRole('region', { name: 'One' })

    await fireEvent.click(triggerOne)
    await Promise.resolve()

    expect(triggerOne.hasAttribute('aria-controls')).toBe(false)
    expect(contentOne.getAttribute('data-closed')).toBe('')
    expect(screen.container.querySelector('[data-collapsed]')).toBeNull()
    expect(screen.getByText('Content one')).not.toBeNull()

    await fireEvent.transitionEnd(contentOne, { propertyName: 'height' })

    expect(triggerOne.hasAttribute('aria-controls')).toBe(false)
    expect(screen.queryByText('Content one')).toBeNull()
  })

  test('applies classes overrides', () => {
    const screen = render(() => (
      <Accordion
        items={[BASE_ITEMS[0]]}
        defaultValue={['one']}
        classes={{
          root: 'root-override',
          item: 'item-override',
          header: 'header-override',
          trigger: 'trigger-override',
          leading: 'leading-override',
          label: 'label-override',
          trailing: 'trailing-override',
          content: 'content-override',
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const item = screen.container.querySelector('[data-slot="item"]')
    const header = screen.container.querySelector('[data-slot="header"]')
    const trigger = screen.container.querySelector('[data-slot="trigger"]')
    const leading = screen.container.querySelector('[data-slot="leading"]')
    const label = screen.container.querySelector('[data-slot="label"]')
    const trailing = screen.container.querySelector('[data-slot="trailing"]')
    const content = screen.container.querySelector('[data-slot="content"]')

    expect(root?.className).toContain('root-override')
    expect(item?.className).toContain('item-override')
    expect(header?.className).toContain('header-override')
    expect(trigger?.className).toContain('trigger-override')
    expect(leading?.className).toContain('leading-override')
    expect(label?.className).toContain('label-override')
    expect(trailing?.className).toContain('trailing-override')
    expect(content?.className).toContain('content-override')
  })

  test('applies styles overrides', () => {
    const screen = render(() => (
      <Accordion
        items={[BASE_ITEMS[0]]}
        defaultValue={['one']}
        styles={{
          root: { width: '200px' },
          item: { width: '200px' },
          header: { width: '200px' },
          trigger: { width: '200px' },
          leading: { width: '200px' },
          label: { width: '200px' },
          trailing: { width: '200px' },
          content: { width: '200px' },
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const item = screen.container.querySelector('[data-slot="item"]') as HTMLElement | null
    const header = screen.container.querySelector('[data-slot="header"]') as HTMLElement | null
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement | null
    const leading = screen.container.querySelector('[data-slot="leading"]') as HTMLElement | null
    const label = screen.container.querySelector('[data-slot="label"]') as HTMLElement | null
    const trailing = screen.container.querySelector('[data-slot="trailing"]') as HTMLElement | null
    const content = screen.container.querySelector('[data-slot="content"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(item?.style.width).toBe('200px')
    expect(header?.style.width).toBe('200px')
    expect(trigger?.style.width).toBe('200px')
    expect(leading?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
    expect(trailing?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })
})
