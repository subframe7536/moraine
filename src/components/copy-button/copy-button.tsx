import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler } from '../../shared/utils'
import { useButtonGroupContext } from '../button-group/button-group-context'
import { Icon } from '../icon'

import { defaultCopyButtonMessages } from './copy-button.messages'
import { copyButtonDataAttributes, copyButtonRecipe } from './copy-button.recipe'
import type { CopyButtonStyleVariants } from './copy-button.style-types'
import type { CopyButtonProps, CopyButtonT } from './copy-button.types'
import { createCopy } from './create-copy'

/** Copy button with auto fallback to command and icon opacity transitions. */
export function CopyButton<T extends ValidComponent = 'button'>(
  props: CopyButtonProps<T>,
): JSX.Element {
  const group = useButtonGroupContext()
  const messages = useMessages('copyButton', defaultCopyButtonMessages)

  const [local, variantProps, rest] = splitProps(
    props as CopyButtonProps<T> & {
      ref?: unknown
      onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
      'aria-label'?: string
    },
    [
      'ref',
      'as',
      'value',
      'copiedDuration',
      'disabled',
      'slotName',
      'icon',
      'copiedIcon',
      'iconPosition',
      'onCopy',
      'onError',
      'onStatusChange',
      'variant',
      'tone',
      'classes',
      'styles',
      'class',
      'style',
      'onClick',
      'children',
      'aria-label',
    ],
    ['size'],
  )

  const clipboard = createCopy({
    value: () => (typeof local.value === 'function' ? local.value() : local.value),
    copiedDuration: () => local.copiedDuration,
    onCopy: (data) => local.onCopy?.(data),
    onError: (err) => local.onError?.(err),
    onStatusChange: (status) => local.onStatusChange?.(status),
  })

  const tag = createMemo<ValidComponent>(() => local.as ?? 'button')
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })

  const child = resolveChildren(() => local.children)
  const resolvedChildren = createMemo(() => {
    const value = child() as CopyButtonT.Base['children']
    if (typeof value !== 'function') {
      return value
    }
    return renderWithProps(value, {
      get isCopied() {
        return clipboard.isCopied()
      },
      get isError() {
        return clipboard.isError()
      },
      get state() {
        return clipboard.state()
      },
      get copy() {
        return clipboard.copy
      },
      get isSupported() {
        return clipboard.isSupported()
      },
      get loading() {
        return false
      },
    })
  })

  const hasIcon = () => local.icon !== false && local.icon !== null

  const { slots } = useRecipe(copyButtonRecipe, local, {
    contextVariants: () => {
      const s = String(variantProps.size ?? group?.size ?? 'md')
      const resolvedSize =
        hasIcon() && !hasContent(resolvedChildren())
          ? s.startsWith('icon-')
            ? s
            : `icon-${s}`
          : s.replace(/^icon-/, '')

      return {
        get size() {
          return resolvedSize as CopyButtonStyleVariants['size']
        },
        get variant() {
          return group?.variant !== 'link' ? group?.variant : undefined
        },
        get tone() {
          return group?.tone
        },
      }
    },
  })

  async function handleClick(event: MouseEvent & { currentTarget: HTMLElement }): Promise<unknown> {
    const { defaultPrevented, result } = callHandler(event, local.onClick)
    if (!defaultPrevented && !local.disabled) {
      const data = typeof local.value === 'function' ? local.value() : local.value
      await clipboard.copy(data)
    }
    return result
  }

  const interactionProps = useButtonInteraction(
    {
      disabled: () => Boolean(local.disabled),
      disabledForComponent: true,
      element: root.element,
      onClickOverride: handleClick,
      tag,
    },
    rest,
  )

  const binding = root.bind(interactionProps)

  function Indicator(): JSX.Element {
    const icon = createMemo(() =>
      clipboard.isCopied()
        ? (local.copiedIcon ?? 'icon-check')
        : local.icon === true || local.icon === undefined
          ? 'icon-copy'
          : local.icon,
    )

    return (
      <Icon
        name={icon()}
        data-slot="copy-button-icon"
        {...copyButtonDataAttributes.icon({
          copied: clipboard.isCopied,
        })}
        {...slots.icon}
      />
    )
  }

  return (
    <Dynamic
      component={tag()}
      data-slot={local.slotName || 'copy-button'}
      {...copyButtonDataAttributes.root({
        copied: clipboard.isCopied,
        disabled: () => local.disabled,
      })}
      {...binding}
      {...slots.root}
      aria-invalid={clipboard.isError() ? true : undefined}
      aria-label={
        local['aria-label'] ?? (clipboard.isCopied() ? messages().copied : messages().copy)
      }
    >
      <Show when={hasIcon() && local.iconPosition !== 'trailing'}>
        <Indicator />
      </Show>

      <Show when={hasContent(resolvedChildren())}>
        <span data-slot="copy-button-label" {...slots.label}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={hasIcon() && local.iconPosition === 'trailing'}>
        <Indicator />
      </Show>
    </Dynamic>
  )
}
