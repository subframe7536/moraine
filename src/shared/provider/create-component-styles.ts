import type { JSX } from 'solid-js'
import { createMemo, mergeProps } from 'solid-js'

import type { ThemeName, ThemeSlots, ThemeVariants } from '../../theme/types'
import type { SlotClassValue } from '../types'

import { useCn } from './cn-context'
import { useTheme } from './theme-context'

const EMPTY_DEFAULTS = Object.freeze({})
const EMPTY_OUTPUTS = Object.freeze([])

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

/** Resolves variant defaults and reactive class/style bindings for each slot. */
export function createComponentStyles<Name extends ThemeName>(
  name: Name,
  props: VariantInput<ThemeVariants<Name>> &
    StyleLayer<ThemeSlots<Name>> & {
      class?: SlotClassValue
      style?: JSX.CSSProperties
    },
  options: CreateComponentStylesOptions<ThemeSlots<Name>, ThemeVariants<Name>> = {},
) {
  const cn = useCn()
  const theme = useTheme()
  const entry = createMemo(() => theme()[name])
  const variants = mergeProps(
    // oxlint-disable-next-line subf/solid-reactivity -- mergeProps tracks function sources on property reads.
    () => entry()?.defaults ?? EMPTY_DEFAULTS,
    () => options.inheritedVariants?.() ?? EMPTY_DEFAULTS,
    props,
  )
  const outputs = createMemo(
    () => entry()?.recipes.map((recipe) => recipe.resolve(variants, cn)) ?? EMPTY_OUTPUTS,
  )
  const rootSlot = (options.rootSlot ?? 'root') as ThemeSlots<Name>

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
