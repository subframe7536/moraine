import type { JSX, ValidComponent } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, mergeProps, on, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { AvatarGroupProvider, useAvatarGroupContext } from '../avatar-group/avatar-group-context'
import type { AvatarSize } from '../avatar-group/avatar-group-context'
import { Chip } from '../chip'
import type { ChipProps } from '../chip/chip'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import { cn } from '../shared/utils'

import type { AvatarVariantProps } from './avatar.class'
import {
  avatarFallbackVariants,
  avatarIconVariants,
  avatarImageVariants,
  avatarRootVariants,
} from './avatar.class'

type AvatarAs = ValidComponent | { root?: ValidComponent; img?: ValidComponent }

const AVATAR_SIZE_TO_PX: Record<AvatarSize, number> = {
  '3xs': 16,
  '2xs': 20,
  xs: 24,
  sm: 28,
  md: 32,
  lg: 36,
  xl: 40,
  '2xl': 44,
  '3xl': 48,
}

export interface AvatarClasses {
  root?: string
  image?: string
  fallback?: string
  icon?: string
}

export interface AvatarBaseProps extends Pick<AvatarVariantProps, 'size'> {
  as?: AvatarAs
  src?: string
  alt?: string
  icon?: IconName
  text?: string
  chip?: boolean | Omit<ChipProps, 'children'>
  class?: string
  style?: JSX.CSSProperties | string
  classes?: AvatarClasses
  children?: JSX.Element
}

export type AvatarProps = AvatarBaseProps &
  Omit<JSX.HTMLAttributes<HTMLElement>, keyof AvatarBaseProps | 'children'>

function normalizeAvatarSize(value?: string): AvatarSize {
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

function resolveFallbackText(text?: string, alt?: string): string {
  if (text) {
    return text
  }

  if (!alt) {
    return ''
  }

  return alt
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
}

function isAvatarAsObject(
  value: AvatarAs | undefined,
): value is { root?: ValidComponent; img?: ValidComponent } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resolveAs(as?: AvatarAs): { root: ValidComponent; img?: ValidComponent } {
  if (isAvatarAsObject(as)) {
    const objectAs = as
    return {
      root: objectAs.root ?? 'span',
      img: objectAs.img,
    }
  }

  return {
    root: (as as ValidComponent | undefined) ?? 'span',
  }
}

export function Avatar(props: AvatarProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'span' as ValidComponent,
    },
    props,
  )

  const [local, rest] = splitProps(merged as AvatarProps, [
    'as',
    'src',
    'alt',
    'icon',
    'text',
    'size',
    'chip',
    'class',
    'style',
    'classes',
    'children',
  ])

  const avatarGroup = useAvatarGroupContext()
  const [hasError, setHasError] = createSignal(false)

  const resolvedAs = createMemo(() => resolveAs(local.as))
  const resolvedSize = createMemo(() => normalizeAvatarSize(local.size ?? avatarGroup?.size?.()))
  const sizePx = createMemo(() => AVATAR_SIZE_TO_PX[resolvedSize()])
  const fallbackText = createMemo(() => resolveFallbackText(local.text, local.alt))
  const rootClass = createMemo(() =>
    cn(
      avatarRootVariants({
        size: resolvedSize(),
      }),
      local.classes?.root,
      local.class,
    ),
  )

  const chipProps = createMemo<Partial<ChipProps>>(() => {
    if (!local.chip) {
      return {}
    }

    if (local.chip === true) {
      return {
        inset: true,
        size: resolvedSize(),
      }
    }

    return {
      inset: true,
      size: resolvedSize(),
      ...local.chip,
    }
  })

  const mergedChipProps = createMemo<Partial<ChipProps>>(() => {
    const base = chipProps()

    return {
      ...base,
      class: cn(rootClass(), (base as { class?: string } | undefined)?.class),
    }
  })

  function content(): JSX.Element {
    return (
      <Show
        when={Boolean(local.src) && !hasError()}
        fallback={
          <Show
            when={local.children !== undefined && local.children !== null}
            fallback={
              <Show
                when={local.icon}
                fallback={
                  <span
                    data-slot="fallback"
                    class={cn(avatarFallbackVariants(), local.classes?.fallback)}
                  >
                    {fallbackText() || ' '}
                  </span>
                }
              >
                {(iconName) => (
                  <Icon
                    name={iconName()}
                    data-slot="icon"
                    class={cn(avatarIconVariants(), local.classes?.icon)}
                  />
                )}
              </Show>
            }
          >
            {local.children}
          </Show>
        }
      >
        <Dynamic
          component={resolvedAs().img ?? 'img'}
          src={local.src}
          alt={local.alt}
          width={sizePx()}
          height={sizePx()}
          data-slot="image"
          class={cn(avatarImageVariants(), local.classes?.image)}
          onError={() => setHasError(true)}
        />
      </Show>
    )
  }

  createEffect(
    on(
      () => local.src,
      () => {
        setHasError(false)
      },
    ),
  )

  return (
    <AvatarGroupProvider value={{ size: resolvedSize }}>
      <Show
        when={local.chip}
        fallback={
          <Dynamic
            component={resolvedAs().root}
            data-slot="root"
            class={rootClass()}
            style={local.style}
            {...rest}
          >
            {content()}
          </Dynamic>
        }
      >
        <Chip
          {...(mergedChipProps() as ChipProps)}
          as={resolvedAs().root}
          data-slot="root"
          style={local.style}
          {...rest}
        >
          {content()}
        </Chip>
      </Show>
    </AvatarGroupProvider>
  )
}
