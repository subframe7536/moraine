import * as KobalteSeparator from '@kobalte/core/separator'
import type { JSX } from 'solid-js'
import { Show, mergeProps } from 'solid-js'

import type { SlotClasses } from '../../shared/slot-class'

import type { SeparatorVariantProps } from './separator.class'
import {
  separatorBorderVariants,
  separatorContainerVariants,
  separatorRootVariants,
} from './separator.class'

type SeparatorSlots = 'root' | 'border' | 'container'

export type SeparatorClasses = SlotClasses<SeparatorSlots>

export interface SeparatorBaseProps extends Pick<
  SeparatorVariantProps,
  'orientation' | 'size' | 'type'
> {
  decorative?: boolean
  classes?: SeparatorClasses
  children?: JSX.Element
}

export type SeparatorProps = SeparatorBaseProps &
  Omit<KobalteSeparator.SeparatorRootProps<HTMLDivElement>, keyof SeparatorBaseProps | 'class'>

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
      class={separatorRootVariants(
        {
          orientation: merged.orientation,
        },
        merged.classes?.root,
      )}
    >
      <div
        data-slot="border"
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
