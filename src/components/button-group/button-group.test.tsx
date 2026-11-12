import { render } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'
import { Button } from '../button/button'
import { DropdownMenu } from '../dropdown-menu'
import { Popover } from '../popover'

import { ButtonGroup } from './button-group'

describe('ButtonGroup', () => {
  test('renders related buttons with group semantics', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup aria-label="History controls">
          <Button>Back</Button>
          <Button>Forward</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group', { name: 'History controls' })
    expect(group.getAttribute('data-slot')).toBe('button-group')
    expect(group.hasAttribute('data-orientation')).toBe(false)
    expect(group.querySelectorAll('[data-slot="button-group-separator"]')).toHaveLength(0)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('renders a standalone vertical separator', () => {
    const screen = render(() => <ButtonGroup.Separator />)
    const separator = screen.getByRole('separator')

    expect(separator.getAttribute('data-slot')).toBe('button-group-separator')
    expect(separator.getAttribute('aria-orientation')).toBe('vertical')
  })

  test('renders an explicit separator with generic separator semantics', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup aria-label="Clipboard actions">
          <Button>Copy</Button>
          <ButtonGroup.Separator />
          <Button>Paste</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const group = screen.getByRole('group', { name: 'Clipboard actions' })
    const separator = screen.getByRole('separator')

    expect(group.querySelectorAll('[data-slot="button-group-separator"]')).toHaveLength(1)
    expect(separator.parentElement).toBe(group)
    expect(separator.getAttribute('data-slot')).toBe('button-group-separator')
    expect(separator.getAttribute('role')).toBe('separator')
    expect(separator.getAttribute('aria-orientation')).toBe('vertical')
    expect(separator.getAttribute('data-orientation')).toBe('vertical')
  })

  test('derives ButtonGroup.Separator orientation from the parent ButtonGroup', () => {
    const screen = render(() => (
      <div>
        <ButtonGroup orientation="horizontal" data-testid="horizontal-group">
          <Button>First</Button>
          <ButtonGroup.Separator />
          <Button>Second</Button>
        </ButtonGroup>
        <ButtonGroup orientation="vertical" data-testid="vertical-group">
          <Button>First</Button>
          <ButtonGroup.Separator />
          <Button>Second</Button>
        </ButtonGroup>
      </div>
    ))
    const separators = screen.getAllByRole('separator')
    expect(separators[0]?.getAttribute('aria-orientation')).toBe('vertical')
    expect(separators[0]?.getAttribute('data-orientation')).toBe('vertical')

    expect(separators[1]?.getAttribute('aria-orientation')).toBe('horizontal')
    expect(separators[1]?.getAttribute('data-orientation')).toBe('horizontal')
  })

  test('applies ButtonGroup separator theme and local slot overrides', () => {
    const theme = defineTheme({
      buttonGroup: { base: { separator: 'theme-separator' } },
    })
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <ButtonGroup classes={{ separator: 'group-separator' }}>
          <Button>Copy</Button>
          <ButtonGroup.Separator class="instance-separator" />
          <Button>Paste</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))
    const separator = screen.getByRole('separator')

    expect(separator.className).toContain('theme-separator')
    expect(separator.className).toContain('group-separator')
    expect(separator.className).toContain('instance-separator')
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

  test('joins overlay trigger roots as direct children', () => {
    const screen = render(() => (
      <MoraineProvider>
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
    expect(group.querySelector('[data-slot="dropdown-menu-trigger"]')?.parentElement).toBe(group)
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
          <Popover.Content>
            <div>Save options</div>
          </Popover.Content>
        </Popover>
      </ButtonGroup>
    ))

    const group = screen.getByRole('group')
    const trigger = group.querySelector('[data-slot="popover-trigger"]')
    expect(trigger?.parentElement).toBe(group)
    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.querySelector('button')).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('keeps a separator as the vertical action boundary', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ButtonGroup orientation="vertical" aria-label="Move actions">
          <Button>Move up</Button>
          <ButtonGroup.Separator />
          <Button>Move down</Button>
        </ButtonGroup>
      </MoraineProvider>
    ))

    const separator = screen.getByRole('separator')

    expect(screen.getByRole('group', { name: 'Move actions' })).not.toBeNull()
    expect(separator.getAttribute('aria-orientation')).toBe('horizontal')
  })

  test('joins overlay trigger roots as direct children vertically', () => {
    const screen = render(() => (
      <MoraineProvider>
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
    expect(group.querySelector('[data-slot="dropdown-menu-trigger"]')?.parentElement).toBe(group)
    expect(screen.getAllByRole('button')).toHaveLength(2)
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
