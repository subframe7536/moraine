import type { Accessor, JSX } from 'solid-js'
import { createMemo, getOwner, runWithOwner } from 'solid-js'

import type { ThemeName, ThemeSlots, ThemeVariants } from '../../theme/types.ts'
import type { SlotClassValue } from '../types.ts'
import { cn } from '../utils.ts'

import { useThemeLayers } from './theme-context.tsx'

interface StyleLayer<S extends string> {
  classes?: Partial<Record<S, SlotClassValue>>
  styles?: Partial<Record<S, JSX.CSSProperties>>
}

type VariantInput<V> = [V] extends [never] ? object : Partial<V>

interface CreateComponentStylesOptions<S extends string, V> {
  rootSlot?: S
  inheritedVariants?: () => VariantInput<V> | undefined
  groupStyles?: () => StyleLayer<S> | undefined
  dynamicStyles?: () => Partial<Record<S, JSX.CSSProperties>> | undefined
}

export interface SlotBinding {
  readonly class: string | undefined
  readonly style: JSX.CSSProperties
}

/** Resolves presentation without reading content or changing component ownership. */
export function createComponentStyles<Name extends ThemeName>(
  name: Name,
  props: VariantInput<ThemeVariants<Name>> &
    StyleLayer<ThemeSlots<Name>> & {
      class?: SlotClassValue
      style?: JSX.CSSProperties
    },
  options: CreateComponentStylesOptions<ThemeSlots<Name>, ThemeVariants<Name>> = {},
) {
  const layers = useThemeLayers()
  const owner = getOwner()
  const variantValues = new Map<string, Accessor<unknown>>()
  const variants = new Proxy<VariantInput<ThemeVariants<Name>>>(
    {},
    {
      get(_target, key: string) {
        let value = variantValues.get(key)
        if (!value) {
          value = runWithOwner(owner, () => {
            const resolvedValue = createMemo(() => {
              const instance = (props as Record<string, unknown>)[key]
              if (instance !== undefined) {
                return instance
              }
              const inherited = options.inheritedVariants?.() as Record<string, unknown> | undefined
              if (inherited?.[key] !== undefined) {
                return inherited[key]
              }
              const active = layers()
              for (let index = active.length - 1; index >= 0; index--) {
                const value = active[index]?.[name]?.defaults?.[key]
                if (value !== undefined) {
                  return value
                }
              }
              return undefined
            })
            return resolvedValue
          })!
          variantValues.set(key, value)
        }
        return value()
      },
    },
  )
  const outputs = createMemo(() =>
    layers().flatMap((layer) => {
      const entry = layer[name]
      return entry ? [entry.recipe(variants)] : []
    }),
  )
  const rootSlot = options.rootSlot ?? 'root'

  function slot(name: ThemeSlots<Name>): SlotBinding {
    return {
      get class() {
        return cn(
          ...outputs().map((output) => output[name]),
          options.groupStyles?.()?.classes?.[name],
          props.classes?.[name],
          name === rootSlot ? props.class : undefined,
        )
      },
      get style() {
        return {
          ...options.dynamicStyles?.()?.[name],
          ...options.groupStyles?.()?.styles?.[name],
          ...props.styles?.[name],
          ...(name === rootSlot ? props.style : undefined),
        }
      },
    }
  }

  return { variants, root: slot(rootSlot), slot }
}
