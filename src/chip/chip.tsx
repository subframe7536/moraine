import type { JSX, ValidComponent } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useAvatarGroupContext } from '../avatar-group/avatar-group-context'
import { cn } from '../shared/utils'

import type { ChipVariantProps } from './chip.class'
import { chipBaseVariants, chipRootVariants } from './chip.class'

type ChipColor = NonNullable<ChipBaseProps['color']>
type ChipSize = NonNullable<ChipBaseProps['size']>
type ChipPosition = NonNullable<ChipBaseProps['position']>

export interface ChipClasses {
  root?: string
  base?: string
}

export interface ChipBaseProps extends Pick<
  ChipVariantProps,
  'color' | 'size' | 'position' | 'inset' | 'standalone'
> {
  as?: ValidComponent
  text?: string | number
  show?: boolean
  content?: JSX.Element
  class?: string
  classes?: ChipClasses
  children?: JSX.Element
}

export type ChipProps = ChipBaseProps &
  Omit<JSX.HTMLAttributes<HTMLElement>, keyof ChipBaseProps | 'children'>

function normalizeChipColor(value?: string): ChipColor {
  if (
    value === 'secondary' ||
    value === 'success' ||
    value === 'info' ||
    value === 'warning' ||
    value === 'error' ||
    value === 'neutral'
  ) {
    return value
  }

  return 'primary'
}

function normalizeChipSize(value?: string): ChipSize {
  if (
    value === '3xs' ||
    value === '2xs' ||
    value === 'xs' ||
    value === 'sm' ||
    value === 'lg' ||
    value === 'xl' ||
    value === '2xl' ||
    value === '3xl'
  ) {
    return value
  }

  return 'md'
}

function normalizeChipPosition(value?: string): ChipPosition {
  if (value === 'bottom-right' || value === 'top-left' || value === 'bottom-left') {
    return value
  }

  return 'top-right'
}

function resolveChipInsetOffset(position: ChipPosition, inset?: boolean): string | undefined {
  if (inset) {
    return undefined
  }

  if (position === 'bottom-right') {
    return 'translate-y-1/2 translate-x-1/2 transform'
  }

  if (position === 'top-left') {
    return '-translate-y-1/2 -translate-x-1/2 transform'
  }

  if (position === 'bottom-left') {
    return 'translate-y-1/2 -translate-x-1/2 transform'
  }

  return '-translate-y-1/2 translate-x-1/2 transform'
}

export function Chip(props: ChipProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      color: 'primary' as const,
      size: 'md' as const,
      position: 'top-right' as const,
      inset: false,
      standalone: false,
      show: true,
    },
    props,
  )

  const [local, rest] = splitProps(merged as ChipProps, [
    'as',
    'color',
    'size',
    'position',
    'inset',
    'standalone',
    'text',
    'show',
    'content',
    'class',
    'classes',
    'children',
  ])

  const avatarGroup = useAvatarGroupContext()
  const resolvedSize = createMemo(() => normalizeChipSize(local.size ?? avatarGroup?.size?.()))
  const resolvedColor = createMemo(() => normalizeChipColor(local.color))
  const resolvedPosition = createMemo(() => normalizeChipPosition(local.position))

  return (
    <Dynamic
      component={local.as}
      data-slot="root"
      class={cn(chipRootVariants(), local.classes?.root, local.class)}
      {...rest}
    >
      {local.children}

      <Show when={local.show}>
        <span
          data-slot="base"
          class={cn(
            chipBaseVariants({
              color: resolvedColor(),
              size: resolvedSize(),
              position: resolvedPosition(),
              inset: local.inset,
              standalone: local.standalone,
            }),
            resolveChipInsetOffset(resolvedPosition(), local.inset),
            local.classes?.base,
          )}
        >
          {local.content ?? local.text}
        </span>
      </Show>
    </Dynamic>
  )
}
