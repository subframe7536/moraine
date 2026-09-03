import type { JSX } from 'solid-js'

import type { VariantMatch, VariantSchema, VariantSelection } from './recipe.ts'

export type StyleVarValue = string | number | undefined | null
export type StyleVarRecord = Record<string, StyleVarValue>

/**
 * Converts a flat key-value dictionary into prefixed CSS custom properties.
 * Automatically prepends '--' and filters out nullish values.
 *
 * @example
 * formatCssVars({ size: '20px', len: '14px' }, 's')
 * // => { '--s-size': '20px', '--s-len': '14px' }
 */
export function formatCssVars(vars: StyleVarRecord, prefix?: string): JSX.CSSProperties {
  const result: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined && value !== null) {
      const varName = key.startsWith('--') ? key : prefix ? `--${prefix}-${key}` : `--${key}`
      result[varName] = value
    }
  }
  return result
}

function toVariantString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`
  }
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : ''
}

export interface StyleVarsOptions<V extends VariantSchema> {
  prefix?: string
  base?: StyleVarRecord
  variants?: {
    [K in keyof V]?: {
      [Val in keyof V[K]]?: StyleVarRecord
    }
  }
  compoundVariants?: Array<{
    variants: VariantMatch<V>
    vars: StyleVarRecord
  }>
  defaultVariants?: VariantSelection<V>
}

export type StyleVarsFn<V extends VariantSchema> = (
  variants?: VariantSelection<V>,
  ...extraStyles: Array<JSX.CSSProperties | undefined>
) => JSX.CSSProperties

/**
 * Creates a variant-driven CSS custom properties resolver for component root elements.
 * Eliminates compound variant explosion across child slots and keeps HTML classes pristine.
 */
export function defineStyleVars<V extends VariantSchema>(
  options: StyleVarsOptions<V>,
): StyleVarsFn<V> {
  const prefix = options.prefix

  return (
    variants?: VariantSelection<V>,
    ...extraStyles: Array<JSX.CSSProperties | undefined>
  ): JSX.CSSProperties => {
    const activeVariants: Record<string, unknown> = { ...options.defaultVariants }
    if (variants) {
      for (const [key, value] of Object.entries(variants)) {
        if (value !== undefined && value !== null) {
          activeVariants[key] = value
        }
      }
    }

    const resolved: StyleVarRecord = { ...options.base }

    if (options.variants) {
      for (const [variantName, variantMap] of Object.entries(options.variants)) {
        const selectedValue = activeVariants[variantName]
        if (selectedValue !== undefined && selectedValue !== null) {
          const selectedVars = (variantMap as Record<string, StyleVarRecord>)[
            toVariantString(selectedValue)
          ]
          if (selectedVars) {
            Object.assign(resolved, selectedVars)
          }
        }
      }
    }

    for (const compoundVariant of options.compoundVariants ?? []) {
      const matches = Object.entries(compoundVariant.variants).every(([name, expected]) => {
        const actual = activeVariants[name]
        if (actual === undefined || actual === null) {
          return false
        }
        return Array.isArray(expected)
          ? expected.some((value) => toVariantString(value) === toVariantString(actual))
          : toVariantString(expected) === toVariantString(actual)
      })
      if (matches) {
        Object.assign(resolved, compoundVariant.vars)
      }
    }

    const finalStyle: JSX.CSSProperties = formatCssVars(resolved, prefix)
    for (const style of extraStyles) {
      if (style) {
        Object.assign(finalStyle, style)
      }
    }

    return finalStyle
  }
}
