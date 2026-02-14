import type { JSX, ValidComponent } from 'solid-js'
import { For, Show, children, createMemo, mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Avatar } from '../avatar'
import { cn } from '../shared/utils'

import { AvatarGroupProvider } from './avatar-group-context'
import type { AvatarSize } from './avatar-group-context'
import type { AvatarGroupVariantProps } from './avatar-group.class'
import { avatarGroupBaseVariants, avatarGroupRootVariants } from './avatar-group.class'

type AvatarGroupSize = NonNullable<AvatarGroupVariantProps['size']>

export interface AvatarGroupClasses {
  root?: string
  base?: string
}

export interface AvatarGroupBaseProps extends Pick<AvatarGroupVariantProps, 'size'> {
  as?: ValidComponent
  max?: number | string
  class?: string
  classes?: AvatarGroupClasses
  children?: JSX.Element
}

export type AvatarGroupProps = AvatarGroupBaseProps &
  Omit<JSX.HTMLAttributes<HTMLElement>, keyof AvatarGroupBaseProps | 'children'>

function normalizeAvatarGroupSize(value?: string): AvatarGroupSize {
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

function parseMaxValue(value?: number | string): number | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)

    return Number.isFinite(parsed) ? parsed : undefined
  }

  return value
}

export function AvatarGroup(props: AvatarGroupProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      size: 'md' as const,
    },
    props,
  )

  const [local, rest] = splitProps(merged as AvatarGroupProps, [
    'as',
    'size',
    'max',
    'class',
    'classes',
    'children',
  ])

  const resolvedSize = createMemo<AvatarSize>(() => normalizeAvatarGroupSize(local.size))
  const maxValue = createMemo(() => parseMaxValue(local.max))

  function GroupContent(): JSX.Element {
    const allChildren = createMemo(() =>
      children(() => local.children)
        .toArray()
        .filter(Boolean),
    )
    const visibleAvatars = createMemo(() => {
      const currentChildren = allChildren()
      const currentMax = maxValue()

      if (!currentMax || currentMax <= 0) {
        return [...currentChildren].reverse()
      }

      return [...currentChildren].slice(0, currentMax).reverse()
    })
    const hiddenCount = createMemo(() => allChildren().length - visibleAvatars().length)

    return (
      <>
        <Show when={hiddenCount() > 0}>
          <span
            data-slot="base"
            class={cn(
              avatarGroupBaseVariants({
                size: resolvedSize(),
              }),
              local.classes?.base,
            )}
          >
            <Avatar text={`+${hiddenCount()}`} />
          </span>
        </Show>

        <For each={visibleAvatars()}>
          {(avatar) => (
            <span
              data-slot="base"
              class={cn(
                avatarGroupBaseVariants({
                  size: resolvedSize(),
                }),
                local.classes?.base,
              )}
            >
              {avatar}
            </span>
          )}
        </For>
      </>
    )
  }

  return (
    <AvatarGroupProvider value={{ size: resolvedSize }}>
      <Dynamic
        component={local.as}
        data-slot="root"
        class={cn(avatarGroupRootVariants(), local.classes?.root, local.class)}
        {...rest}
      >
        <GroupContent />
      </Dynamic>
    </AvatarGroupProvider>
  )
}
