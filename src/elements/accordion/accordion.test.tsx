import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Accordion } from './accordion'

const BASE_ITEMS = [
  {
    value: 'one',
    label: 'One',
    leading: 'icon-house',
    content: <span>Content one</span>,
  },
  {
    value: 'two',
    label: 'Two',
    trailing: 'icon-plus',
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
        styles={
          {
            root: { width: '200px' },
            item: { width: '200px' },
            header: { width: '200px' },
            trigger: { width: '200px' },
            leading: { width: '200px' },
            label: { width: '200px' },
            trailing: { width: '200px' },
            content: { width: '200px' },
          } as any
        }
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
