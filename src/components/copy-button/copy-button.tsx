import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { Show, children as resolveChildren, createMemo, merge, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler, pick } from '../../shared/utils'
import { useButtonGroupContext } from '../button-group/button-group-context'
import { Icon } from '../icon'

import { defaultCopyButtonMessages } from './copy-button.messages'
import { copyButtonDataAttributes, copyButtonRecipe } from './copy-button.recipe'
import type { CopyButtonStyleVariants } from './copy-button.style-types'
import type { CopyButtonProps, CopyButtonT } from './copy-button.types'
import { createCopy } from './create-copy'
/** Message used as the default `aria-label` of an icon-only button in each copy status. */
const STATUS_MESSAGE_KEYS = {
  idle: 'copy',
  copied: 'copied',
  error: 'failed',
} as const satisfies Record<CopyButtonT.Status, keyof typeof defaultCopyButtonMessages>

/**
 * Button that copies a string or `ClipboardItem` (`value`) to the clipboard and briefly shows a
 * copied state. It writes through `navigator.clipboard` and falls back to
 * `document.execCommand('copy')` when the API is missing or fails. Pass children for a labeled
 * button; without children it renders a square icon-only button. It renders a `button` by default
 * and accepts `as`.
 *
 * @example
 * ```tsx
 * import { CopyButton } from 'moraine'
 *
 * <CopyButton value="npm i moraine">Copy install command</CopyButton>
 * ```
 */
export function CopyButton<T extends ValidComponent = 'button'>(
  props: CopyButtonProps<T>,
): JSX.Element {
  const group = useButtonGroupContext()

  const local = pick(
    props as CopyButtonProps<T> & {
      ref?: unknown
      onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
      'aria-label'?: string
    },
    'ref',
    'as',
    'value',
    'resetDelay',
    'disabled',
    'icon',
    'copiedIcon',
    'iconPosition',
    'onCopySuccess',
    'onCopyError',
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
    'translations',
    'size',
  )
  const rest = omit(
    props as CopyButtonProps<T> & {
      ref?: unknown
      onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
      'aria-label'?: string
    },
    'ref',
    'as',
    'value',
    'resetDelay',
    'disabled',
    'icon',
    'copiedIcon',
    'iconPosition',
    'onCopySuccess',
    'onCopyError',
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
    'translations',
    'size',
  )

  const messages = useMessages('copyButton', defaultCopyButtonMessages, () => local.translations)

  const clipboard = createCopy({
    ownerDocument: () => root.element()?.ownerDocument,
    value: () => (typeof local.value === 'function' ? local.value() : local.value),
    resetDelay: () => local.resetDelay,
    onCopySuccess: (data) => local.onCopySuccess?.(data),
    onCopyError: (err) => local.onCopyError?.(err),
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
      get copied() {
        return clipboard.isCopied()
      },
      get error() {
        return clipboard.isError()
      },
      get status() {
        return clipboard.status()
      },
      get copy() {
        return clipboard.copy
      },
      get supported() {
        return clipboard.isSupported()
      },
    })
  })

  const hasIcon = () => local.icon !== false && local.icon !== null
  const hasLabel = () => hasContent(resolvedChildren())
  const size = (): CopyButtonStyleVariants['size'] => {
    const base = String(local.size ?? group?.size ?? 'md').replace(/^icon-/, '')
    return (hasIcon() && !hasLabel() ? `icon-${base}` : base) as CopyButtonStyleVariants['size']
  }

  const recipeProps = merge(local, {
    get size() {
      return size()
    },
  })
  const {
    slots: { root: rootSlot, icon: iconSlot, label: labelSlot },
  } = useRecipe(copyButtonRecipe, recipeProps, {
    data: {
      root: copyButtonDataAttributes.root(() => ({
        copied: clipboard.isCopied,
        disabled: () => local.disabled,
      })),
      icon: copyButtonDataAttributes.icon(() => ({
        copied: clipboard.isCopied,
      })),
    },
    context: () => ({
      variants: {
        variant: group?.variant !== 'link' ? group?.variant : undefined,
        tone: group?.tone,
      },
    }),
  })

  async function handleClick(event: MouseEvent & { currentTarget: HTMLElement }): Promise<unknown> {
    const { defaultPrevented, result } = callHandler(event, local.onClick)
    if (!defaultPrevented && !local.disabled) {
      await clipboard.copy()
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

    return <Icon name={icon()} data-slot="copy-button-icon" {...iconSlot} />
  }

  return (
    <Dynamic
      component={tag()}
      data-slot="copy-button"
      {...rootSlot}
      {...binding}
      aria-invalid={clipboard.isError() ? 'true' : undefined}
      aria-label={
        local['aria-label'] ??
        (hasLabel() ? undefined : messages()[STATUS_MESSAGE_KEYS[clipboard.status()]])
      }
    >
      <Show when={hasIcon() && local.iconPosition !== 'trailing'}>
        <Indicator />
      </Show>

      <Show when={hasLabel()}>
        <span data-slot="copy-button-label" {...labelSlot}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={hasIcon() && local.iconPosition === 'trailing'}>
        <Indicator />
      </Show>
    </Dynamic>
  )
}
