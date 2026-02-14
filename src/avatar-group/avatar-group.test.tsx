import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Avatar } from '../avatar'

import { AvatarGroup } from './avatar-group'

describe('AvatarGroup', () => {
  test('renders root and visible avatars', () => {
    const screen = render(() => (
      <AvatarGroup>
        <Avatar text="A" />
        <Avatar text="B" />
        <Avatar text="C" />
      </AvatarGroup>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const bases = screen.container.querySelectorAll('[data-slot="base"]')

    expect(root).not.toBeNull()
    expect(root?.className).toContain('inline-flex')
    expect(bases.length).toBe(3)
  })

  test('renders hidden counter when max is a number', () => {
    const screen = render(() => (
      <AvatarGroup max={2}>
        <Avatar text="A" />
        <Avatar text="B" />
        <Avatar text="C" />
      </AvatarGroup>
    ))

    expect(screen.getByText('+1').textContent).toBe('+1')
    expect(screen.container.querySelectorAll('[data-slot="base"]').length).toBe(3)
  })

  test('renders hidden counter when max is a string', () => {
    const screen = render(() => (
      <AvatarGroup max="1">
        <Avatar text="A" />
        <Avatar text="B" />
        <Avatar text="C" />
      </AvatarGroup>
    ))

    expect(screen.getByText('+2').textContent).toBe('+2')
    expect(screen.container.querySelectorAll('[data-slot="base"]').length).toBe(2)
  })

  test('does not hide avatars when max is zero', () => {
    const screen = render(() => (
      <AvatarGroup max={0}>
        <Avatar text="A" />
        <Avatar text="B" />
      </AvatarGroup>
    ))

    expect(screen.queryByText('+1')).toBeNull()
    expect(screen.container.querySelectorAll('[data-slot="base"]').length).toBe(2)
  })

  test('propagates size to child avatars via context', () => {
    const screen = render(() => (
      <AvatarGroup size="xl">
        <Avatar text="A" />
      </AvatarGroup>
    ))

    const avatarRoot = screen.getByText('A').closest('[data-slot="root"]')
    expect(avatarRoot?.className).toContain('size-10')
  })

  test('supports custom as prop on root', () => {
    const screen = render(() => (
      <AvatarGroup as="section">
        <Avatar text="A" />
      </AvatarGroup>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.tagName).toBe('SECTION')
  })

  test('applies classes overrides', () => {
    const screen = render(() => (
      <AvatarGroup
        classes={{
          root: 'root-override',
          base: 'base-override',
        }}
      >
        <Avatar text="A" />
      </AvatarGroup>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const base = screen.container.querySelector('[data-slot="base"]')

    expect(root?.className).toContain('root-override')
    expect(base?.className).toContain('base-override')
  })
})
