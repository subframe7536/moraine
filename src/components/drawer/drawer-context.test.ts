import { describe, expect, test } from 'vitest'

import { createDrawerNestedChannel } from './drawer-context'

describe('createDrawerNestedChannel', () => {
  test('aggregates reports from sibling drawers instead of overwriting', () => {
    const parent = createDrawerNestedChannel()
    const first = createDrawerNestedChannel(parent)
    const second = createDrawerNestedChannel(parent)

    parent.report({ open: 1, active: 1, frontmostHeight: 200 }, first)
    parent.report({ open: 1, active: 1, frontmostHeight: 100 }, second)

    expect(parent.openCount()).toBe(2)
    expect(parent.activeCount()).toBe(2)
    expect(parent.frontmostHeight()).toBe(100)

    // Releasing one sibling keeps the other's report instead of zeroing out.
    parent.release(first)
    expect(parent.openCount()).toBe(1)
    expect(parent.activeCount()).toBe(1)
    expect(parent.frontmostHeight()).toBe(100)

    parent.release(second)
    expect(parent.openCount()).toBe(0)
    expect(parent.activeCount()).toBe(0)
  })

  test('falls back to the own popup height when no descendant reports', () => {
    const channel = createDrawerNestedChannel()
    channel.setPopupHeight(320)
    expect(channel.frontmostHeight()).toBe(320)
  })
})
