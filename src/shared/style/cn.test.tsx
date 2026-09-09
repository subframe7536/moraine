import { createCn as upstreamCreateCn } from 'cn/config'
import { describe, expect, test, vi } from 'vitest'

import { cn, createCn } from './cn.ts'

vi.mock('cn/config', async (importOriginal) => {
  const original = await importOriginal<typeof import('cn/config')>()
  return { ...original, createCn: vi.fn(original.createCn) }
})

describe('createCn', () => {
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

  test.each([0, 7])('forwards cacheSize %i and native prefix parsing', (cacheSize) => {
    const appCn = createCn({ prefix: 'tw', cacheSize })
    expect(upstreamCreateCn).toHaveBeenLastCalledWith(
      expect.objectContaining({ cacheSize, prefix: 'tw' }),
    )
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
})
