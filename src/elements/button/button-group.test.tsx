import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { createDesign } from '../../design.ts'
import { DropdownMenu } from '../../overlays/dropdown-menu/index'
import { Popover } from '../../overlays/popover/index'
import { MoraineProvider } from '../../shared/provider/index.ts'

import { Button } from './button'
import { ButtonGroup } from './button-group'

const officialDesign = createDesign()

describe('ButtonGroup', () => {
  test('renders unstyled when provider is absent', () => {
    const screen = render(() => (
      <ButtonGroup aria-label="History controls">
        <Button>Back</Button>
        <Button>Forward</Button>
      </ButtonGroup>
    ))

    const group = screen.getByRole('group', { name: 'History controls' })
    expect(group.className).toBe('')
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]?.className).toBe('')
    expect(buttons[1]?.className).toBe('')
  })

  test('renders related buttons with group semantics and joined horizontal edges', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <ButtonGroup aria-label="History controls">
          <Button>Back</Button>
          <Button>Forward</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group', { name: 'History controls' })
    expect(group.getAttribute('data-slot')).toBe('root')
    expect(group.getAttribute('data-orientation')).toBe('horizontal')
    expect(group.className).toContain('[&>*:not(:first-child)]:border-s-0')
    expect(group.className).toContain('[&>*:not(:first-child)]:rounded-s-none')
    expect(group.className).toContain('[&>*:not(:last-child)]:rounded-e-none')
    expect(group.querySelectorAll('[data-slot="separator"]')).toHaveLength(0)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('reuses resolved getter-backed children without a separator', () => {
    let reads = 0
    const screen = render(() =>
      createComponent(ButtonGroup, {
        get children() {
          reads += 1
          return [<Button>Back</Button>, <Button>Forward</Button>]
        },
      }),
    )

    expect(reads).toBe(1)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('renders decorative separators between horizontal children', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <ButtonGroup separator>
          <Button>Back</Button>
          <Button>Forward</Button>
          <Button>Reset</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const separators = screen.container.querySelectorAll('[data-slot="separator"]')
    expect(separators).toHaveLength(2)
    for (const separator of separators) {
      expect(separator.getAttribute('aria-hidden')).toBe('true')
      expect(separator.getAttribute('data-orientation')).toBe('vertical')
      expect(separator.className).toContain('h-full w-px')
    }
  })

  test('forwards separator classes and styles', () => {
    const screen = render(() => (
      <ButtonGroup
        separator
        classes={{ separator: 'separator-override' }}
        styles={{ separator: { color: 'red' } }}
      >
        <Button>Back</Button>
        <Button>Forward</Button>
      </ButtonGroup>
    ))

    const separator = screen.container.querySelector('[data-slot="separator"]') as HTMLElement
    expect(separator.className).toContain('separator-override')
    expect(separator.style.color).toBe('red')
  })

  test('does not render a separator for a single child', () => {
    const screen = render(() => (
      <ButtonGroup separator>
        <Button>Only action</Button>
      </ButtonGroup>
    ))

    expect(screen.container.querySelectorAll('[data-slot="separator"]')).toHaveLength(0)
  })

  test('inserts separators between overlay trigger roots', () => {
    const screen = render(() => (
      <ButtonGroup separator>
        <Button>Export</Button>
        <DropdownMenu>
          <DropdownMenu.Trigger as="button" type="button">
            Open export options
          </DropdownMenu.Trigger>
          <DropdownMenu.Content items={[{ label: 'Open options' }]} />
        </DropdownMenu>
      </ButtonGroup>
    ))

    expect(screen.container.querySelectorAll('[data-slot="separator"]')).toHaveLength(1)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('does not add a trailing separator for fragment-based children', () => {
    const screen = render(() => (
      <ButtonGroup separator>
        <Button>Export</Button>
        <DropdownMenu>
          <DropdownMenu.Trigger as="button" type="button">
            Open export options
          </DropdownMenu.Trigger>
          <DropdownMenu.Content items={[{ label: 'Open options' }]} />
        </DropdownMenu>
      </ButtonGroup>
    ))

    const group = screen.getByRole('group')
    expect(group.querySelectorAll('[data-slot="separator"]')).toHaveLength(1)
    expect(group.lastElementChild?.getAttribute('data-slot')).toBe('trigger')
  })

  test('does not add a trailing separator when a dropdown opens', async () => {
    const screen = render(() => (
      <ButtonGroup separator>
        <Button>Export</Button>
        <DropdownMenu>
          <DropdownMenu.Trigger as="button" type="button">
            Open export options
          </DropdownMenu.Trigger>
          <DropdownMenu.Content items={[{ label: 'Open options' }]} />
        </DropdownMenu>
      </ButtonGroup>
    ))

    const group = screen.getByRole('group')
    fireEvent.click(screen.getByRole('button', { name: 'Open export options' }))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    expect(group.querySelectorAll('[data-slot="separator"]')).toHaveLength(1)
    expect(group.lastElementChild?.getAttribute('data-slot')).toBe('trigger')
  })

  test('joins overlay trigger roots as direct children', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <ButtonGroup>
          <Button>Export</Button>
          <DropdownMenu>
            <DropdownMenu.Trigger as="button" type="button">
              Open export options
            </DropdownMenu.Trigger>
            <DropdownMenu.Content items={[{ label: 'Open options' }]} />
          </DropdownMenu>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group')
    expect(group.className).toContain('[&>*:not(:first-child)]:border-s-0')
    expect(group.className).toContain('[&>*:not(:first-child)]:rounded-s-none')
    expect(group.className).toContain('[&>*:not(:last-child)]:rounded-e-none')
    expect(group.querySelector('[data-slot="trigger"]')?.parentElement).toBe(group)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('joins a polymorphic popover trigger root as a direct child', () => {
    const screen = render(() => (
      <ButtonGroup>
        <Button>Save</Button>
        <Popover>
          <Popover.Trigger as={Button} size="icon-md" aria-label="Open save options">
            Options
          </Popover.Trigger>
          <Popover.Content content={<div>Save options</div>} />
        </Popover>
      </ButtonGroup>
    ))

    const group = screen.getByRole('group')
    const trigger = group.querySelector('[data-slot="trigger"]')
    expect(trigger?.parentElement).toBe(group)
    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.querySelector('button')).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test.each([
    ['sm', 'h-7'],
    ['md', 'h-8'],
    ['lg', 'h-9'],
  ] as const)('provides the %s size to nested buttons', (size, expectedClass) => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <ButtonGroup size={size}>
          <Button>{size}</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group')
    const button = screen.getByRole('button', { name: size })
    expect(group.getAttribute('data-size')).toBe(size)
    expect(button.className).toContain(expectedClass)
  })

  test.each([
    ['default', 'bg-primary'],
    ['secondary', 'bg-secondary'],
    ['outline', 'border-border'],
    ['ghost', 'hover:text-foreground'],
    ['link', 'hover:underline'],
    ['destructive', 'bg-destructive'],
  ] as const)('provides the %s variant to nested buttons', (variant, expectedClass) => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <ButtonGroup variant={variant}>
          <Button>{variant}</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group')
    const button = screen.getByRole('button', { name: variant })
    expect(group.getAttribute('data-variant')).toBe(variant)
    expect(button.className).toContain(expectedClass)
  })

  test('allows a nested button to override group size and variant defaults', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <ButtonGroup size="lg" variant="secondary">
          <Button size="sm" variant="destructive">
            Remove
          </Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const button = screen.getByRole('button', { name: 'Remove' })
    expect(button.className).toContain('h-7')
    expect(button.className).toContain('bg-destructive')
  })

  test('supports a cohesive vertical orientation', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <ButtonGroup orientation="vertical">
          <Button>Up</Button>
          <Button>Down</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group')
    expect(group.getAttribute('data-orientation')).toBe('vertical')
    expect(group.className).toContain('flex-col')
    expect(group.className).toContain('[&>*:not(:first-child)]:border-t-0')
    expect(group.className).toContain('[&>*:not(:first-child)]:rounded-t-none')
    expect(group.className).toContain('[&>*:not(:last-child)]:rounded-b-none')
  })

  test('renders horizontal separators between vertical children', () => {
    const screen = render(() => (
      <ButtonGroup orientation="vertical" separator>
        <Button>Up</Button>
        <Button>Down</Button>
      </ButtonGroup>
    ))

    const separator = screen.container.querySelector('[data-slot="separator"]')
    expect(separator?.getAttribute('aria-hidden')).toBe('true')
    expect(separator?.getAttribute('data-orientation')).toBe('horizontal')
  })

  test('joins overlay trigger roots as direct children vertically', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <ButtonGroup orientation="vertical">
          <Button>Export</Button>
          <DropdownMenu>
            <DropdownMenu.Trigger as="button" type="button">
              Open export options
            </DropdownMenu.Trigger>
            <DropdownMenu.Content items={[{ label: 'Open options' }]} />
          </DropdownMenu>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group')
    expect(group.className).toContain('[&>*:not(:first-child)]:border-t-0')
    expect(group.className).toContain('[&>*:not(:first-child)]:rounded-t-none')
    expect(group.className).toContain('[&>*:not(:last-child)]:rounded-b-none')
    expect(group.querySelector('[data-slot="trigger"]')?.parentElement).toBe(group)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('keeps inherited button defaults reactive', () => {
    const [size, setSize] = createSignal<'sm' | 'lg'>('sm')
    const [variant, setVariant] = createSignal<'outline' | 'secondary'>('outline')
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <ButtonGroup size={size()} variant={variant()}>
          <Button>Action</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))
    const button = screen.getByRole('button', { name: 'Action' })

    expect(button.className).toContain('h-7')
    expect(button.className).toContain('border-border')

    setSize('lg')
    setVariant('secondary')

    expect(button.className).toContain('h-9')
    expect(button.className).toContain('bg-secondary')
  })

  test('merges root classes and styles while forwarding div attributes', () => {
    const screen = render(() => (
      <ButtonGroup
        id="actions"
        class="root-override"
        classes={{ root: 'slot-override' }}
        style={{ width: '200px' }}
        styles={{ root: { height: '40px' } }}
      >
        <Button>Action</Button>
      </ButtonGroup>
    ))

    const group = screen.getByRole('group')
    expect(group.id).toBe('actions')
    expect(group.className).toContain('root-override')
    expect(group.className).toContain('slot-override')
    expect(group.style.width).toBe('200px')
    expect(group.style.height).toBe('40px')
  })
})
