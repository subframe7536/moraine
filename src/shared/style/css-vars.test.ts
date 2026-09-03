import { describe, expect, test } from 'vitest'

import { defineStyleVars, formatCssVars } from './css-vars.ts'

describe('formatCssVars', () => {
  test('prefixes keys with -- and handles custom prefix', () => {
    expect(formatCssVars({ size: '20px', len: '14px' }, 's')).toEqual({
      '--s-size': '20px',
      '--s-len': '14px',
    })
  })

  test('prefixes keys with -- without prefix', () => {
    expect(formatCssVars({ size: '20px', count: 5 })).toEqual({
      '--size': '20px',
      '--count': 5,
    })
  })

  test('preserves already-prefixed keys', () => {
    expect(
      formatCssVars({ '--custom-key': '100px', 'another-key': '200px' }, 's'),
    ).toEqual({
      '--custom-key': '100px',
      '--s-another-key': '200px',
    })
  })

  test('filters out null and undefined values', () => {
    expect(
      formatCssVars({
        valid: '10px',
        invalidNull: null,
        invalidUndefined: undefined,
      }),
    ).toEqual({
      '--valid': '10px',
    })
  })
})

describe('defineStyleVars', () => {
  const sliderStyleVars = defineStyleVars({
    prefix: 's',
    base: {
      size: '4px',
      offset: '0px',
    },
    variants: {
      size: {
        sm: { size: '4px', len: '4px' },
        md: { size: '6px', len: '6px' },
        lg: { size: '8px', len: '8px' },
      },
      orientation: {
        horizontal: { dir: 'row' },
        vertical: { dir: 'column' },
      },
    },
    compoundVariants: [
      {
        variants: { size: ['md', 'lg'], orientation: 'vertical' },
        vars: { offset: '2px' },
      },
    ],
    defaultVariants: {
      size: 'sm',
      orientation: 'horizontal',
    },
  })

  test('applies defaults correctly', () => {
    expect(sliderStyleVars()).toEqual({
      '--s-size': '4px',
      '--s-offset': '0px',
      '--s-len': '4px',
      '--s-dir': 'row',
    })
  })

  test('preserves defaultVariants when undefined or null is passed', () => {
    expect(sliderStyleVars({ size: undefined })).toEqual({
      '--s-size': '4px',
      '--s-offset': '0px',
      '--s-len': '4px',
      '--s-dir': 'row',
    })

    expect(sliderStyleVars({ size: null, orientation: undefined })).toEqual({
      '--s-size': '4px',
      '--s-offset': '0px',
      '--s-len': '4px',
      '--s-dir': 'row',
    })
  })

  test('applies explicit variants', () => {
    expect(sliderStyleVars({ size: 'md' })).toEqual({
      '--s-size': '6px',
      '--s-offset': '0px',
      '--s-len': '6px',
      '--s-dir': 'row',
    })
  })

  test('matches array compound variants', () => {
    expect(sliderStyleVars({ size: 'md', orientation: 'vertical' })).toEqual({
      '--s-size': '6px',
      '--s-offset': '2px',
      '--s-len': '6px',
      '--s-dir': 'column',
    })

    expect(sliderStyleVars({ size: 'lg', orientation: 'vertical' })).toEqual({
      '--s-size': '8px',
      '--s-offset': '2px',
      '--s-len': '8px',
      '--s-dir': 'column',
    })
  })

  test('merges extra style objects with property-level precedence', () => {
    const customStyle = {
      '--s-size': '12px',
      '--extra-prop': 'test',
      color: 'red',
    }
    const anotherStyle = {
      color: 'blue',
      opacity: 0.8,
    }

    const result = sliderStyleVars({ size: 'sm' }, customStyle, undefined, anotherStyle)
    expect(result).toEqual({
      '--s-size': '12px',
      '--s-offset': '0px',
      '--s-len': '4px',
      '--s-dir': 'row',
      '--extra-prop': 'test',
      color: 'blue',
      opacity: 0.8,
    })
  })

  test('returns fresh object on each invocation without caching', () => {
    const res1 = sliderStyleVars({ size: 'sm' })
    const res2 = sliderStyleVars({ size: 'sm' })
    expect(res1).not.toBe(res2)
    expect(res1).toEqual(res2)
  })
})
