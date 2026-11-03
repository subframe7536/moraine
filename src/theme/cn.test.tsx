import { createCn as upstreamCreateCn } from 'cn/config'
import { describe, expect, test } from 'vitest'

import { cn, createCn } from './cn'

describe('createCn', () => {
  test.each(['surface', 'overlay', 'input'])(
    'merges %s shadows with standard shadows while retaining shadow colors',
    (role) => {
      expect(cn('shadow-md', `shadow-${role}`, 'shadow-red-500')).toBe(
        `shadow-${role} shadow-red-500`,
      )
      expect(cn(`shadow-${role}`, 'shadow-none')).toBe('shadow-none')
      expect(cn('shadow-surface', 'shadow-overlay', `shadow-${role}`)).toBe(`shadow-${role}`)
    },
  )

  test('extends new and existing groups in independent instances without mutating input', () => {
    const config = {
      extend: { classGroups: { density: ['density-roomy', 'density-compact'], z: ['z-app'] } },
    }
    const before = structuredClone(config)
    const appCn = createCn(config)
    const otherCn = createCn({ override: { classGroups: { p: [] } } })
    expect(appCn('density-roomy density-compact z-floating z-app')).toBe('density-compact z-app')
    expect(appCn('p-2 p-4')).toBe('p-4')
    expect(otherCn('p-2 p-4')).toBe('p-2 p-4')
    expect(cn('density-roomy density-compact')).toBe('density-roomy density-compact')
    expect(config).toEqual(before)
    expect(appCn()).toBeUndefined()
  })

  test('applies user override after Moraine rules, then appends user extend', () => {
    const appCn = createCn({
      override: { classGroups: { z: ['z-first'] } },
      extend: { classGroups: { z: ['z-last'] } },
    })
    expect(appCn('z-overlay z-floating z-first z-last')).toBe('z-overlay z-floating z-last')
    expect(cn('z-overlay', 'z-floating')).toBe('z-floating')
  })

  test('supports native prefix parsing', () => {
    const appCn = createCn({ prefix: 'tw' })
    expect(appCn('tw:p-2 tw:p-4')).toBe('tw:p-4')
    expect(appCn('p-2 p-4')).toBe('p-2 p-4')
    expect(appCn('tw:z-overlay tw:z-floating')).toBe('tw:z-floating')
  })

  test('preserves default postfix behavior and existing merge grouping', () => {
    const upstream = upstreamCreateCn()
    const classes = ['leading-6', 'text-lg/7', 'text-sm']
    expect(cn(...classes)).toBe(upstream(...classes))
    expect(cn(cn(...classes.slice(0, 2)), classes[2])).toBe(
      upstream(upstream(...classes.slice(0, 2)), classes[2]),
    )
    expect(cn(...classes)).toBe('text-sm')
  })

  test('treats text-tiny as font size without conflicting with text colors', () => {
    expect(cn('text-primary-foreground', 'text-tiny')).toBe('text-primary-foreground text-tiny')
    expect(cn('text-sm', 'text-tiny')).toBe('text-tiny')
  })

  test('merges accent-fg channel colors over resting text colors', () => {
    expect(cn('text-muted-foreground', 'accent-fg-muted-foreground')).toBe(
      'accent-fg-muted-foreground',
    )
    expect(cn('text-foreground', 'accent-fg-foreground')).toBe('accent-fg-foreground')
    expect(cn('placeholder:text-muted-foreground', 'placeholder:accent-fg-muted-foreground')).toBe(
      'placeholder:accent-fg-muted-foreground',
    )
    expect(
      cn('data-placeholder:text-muted-foreground', 'data-placeholder:accent-fg-muted-foreground'),
    ).toBe('data-placeholder:accent-fg-muted-foreground')
    expect(cn('text-danger', 'accent-fg-muted-foreground')).toBe('accent-fg-muted-foreground')
    expect(cn('accent-fg-muted-foreground', 'text-danger')).toBe('text-danger')
  })

  test('dedupes tone channel classes by merge order without touching tone colors', () => {
    expect(cn('tone-primary', 'tone-danger')).toBe('tone-danger')
    expect(cn('tone-danger', 'tone-primary')).toBe('tone-primary')
    expect(cn('bg-tone', 'tone-danger')).toBe('bg-tone tone-danger')
    expect(cn('tone-danger', 'text-tone-ink')).toBe('tone-danger text-tone-ink')
  })
})
