import * as KobalteSeparator from '@kobalte/core/separator'
import type { JSX } from 'solid-js'
import { Show, mergeProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import type { RockUIComposeProps } from '../../shared/types'

import type { SeparatorVariantProps } from './separator.class'
import {
  separatorBorderVariants,
  separatorContainerVariants,
  separatorRootVariants,
} from './separator.class'

type SeparatorSlots = 'root' | 'border' | 'container'

export type SeparatorClasses = SlotClasses<SeparatorSlots>

export type SeparatorStyles = SlotStyles<SeparatorSlots>

/**
 * Base props for the Separator component.
 */
export interface SeparatorBaseProps extends SeparatorVariantProps {
  /**
   * Whether the separator is decorative (hidden from assistive technologies).
   * @default false
   */
  decorative?: boolean

  /**
   * Slot-based class overrides.
   */
  classes?: SeparatorClasses

  /**
   * Slot-based style overrides.
   */
  styles?: SeparatorStyles

  /**
   * Additional content to render inside the separator (usually between two borders).
   */
  children?: JSX.Element
}

/**
 * Props for the Separator component.
 */
export type SeparatorProps = RockUIComposeProps<
  SeparatorBaseProps,
  KobalteSeparator.SeparatorRootProps<HTMLDivElement>
>

export function Separator(props: SeparatorProps): JSX.Element {
  const merged = mergeProps(
    {
      decorative: false,
      orientation: 'horizontal' as const,
      size: 'xs' as const,
      type: 'solid' as const,
    },
    props,
  )

  return (
    <KobalteSeparator.Root
      as="div"
      orientation={merged.orientation}
      aria-hidden={merged.decorative ? true : undefined}
      data-slot="root"
      style={merged.styles?.root}
      class={separatorRootVariants(
        {
          orientation: merged.orientation,
        },
        merged.classes?.root,
      )}
    >
      <div
        data-slot="border"
        style={merged.styles?.border}
        class={separatorBorderVariants(
          {
            orientation: merged.orientation,
            size: merged.size,
            type: merged.type,
          },
          merged.classes?.border,
        )}
      />

      <Show when={merged.children}>
        <div
          data-slot="container"
          style={merged.styles?.container}
          class={separatorContainerVariants(
            {
              orientation: merged.orientation,
            },
            merged.classes?.container,
          )}
        >
          {merged.children}
        </div>
        <div
          data-slot="border"
          style={merged.styles?.border}
          class={separatorBorderVariants(
            {
              orientation: merged.orientation,
              size: merged.size,
              type: merged.type,
            },
            merged.classes?.border,
          )}
        />
      </Show>
    </KobalteSeparator.Root>
  )
}
