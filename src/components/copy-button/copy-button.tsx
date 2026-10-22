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
import type { CopyButtonProps, CopyButtonT } from './copy-button.types'
import { createCopy } from './create-copy'

/** Copy button with auto fallback to command and icon opacity transitions. */
export function CopyButton<T extends ValidComponent = 'button'>(
  props: CopyButtonProps<T>,
): JSX.Element {
  const group = useButtonGroupContext()
  const messages = useMessages('copyButton', defaultCopyButtonMessages)

  const [local, rest] = splitProps(
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
      'indicatorTransition',
      'onCopy',
      'onError',
      'onStatusChange',
      'variant',
      'copiedVariant',
      'tone',
      'copiedTone',
      'size',
      'classes',
      'styles',
      'class',
      'style',
      'onClick',
      'children',
      'trailing',
      'aria-label',
    ],
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

  const recipeProps = {
    get variant() {
      return clipboard.copied() ? (local.copiedVariant ?? local.variant) : local.variant
    },
    get tone() {
      return clipboard.copied() ? (local.copiedTone ?? local.tone) : local.tone
    },
    get size() {
      return local.size
    },
    get class() {
      return local.class
    },
    get style() {
      return local.style
    },
    get classes() {
      return local.classes
    },
    get styles() {
      return local.styles
    },
  }

  const { slots } = useRecipe(copyButtonRecipe, recipeProps, {
    contextVariants: () => {
      if (!group) {
        return undefined
      }
      return {
        get size() {
          return group.size
        },
        get variant() {
          return group.variant
        },
        get tone() {
          return group.tone
        },
      }
    },
    own: {
      icon: () => ({
        class:
          local.indicatorTransition !== false
            ? clipboard.copied()
              ? 'opacity-0 scale-75 pointer-events-none'
              : 'opacity-100 scale-100'
            : undefined,
      }),
      copiedIcon: () => ({
        class:
          local.indicatorTransition !== false
            ? clipboard.copied()
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-75 pointer-events-none'
            : undefined,
      }),
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

  const child = resolveChildren(() => local.children)
  const resolvedChildren = createMemo(() => {
    const value = child() as CopyButtonT.Base['children']
    if (typeof value !== 'function') {
      return value
    }
    return renderWithProps(value, {
      get copied() {
        return clipboard.copied()
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
  const hasChildren = () => hasContent(resolvedChildren())

  const defaultAriaLabel = () => (clipboard.copied() ? messages().copied : messages().copy)

  function Indicator(): JSX.Element {
    return (
      <span data-slot="copy-button-indicator" {...slots.indicator}>
        <Show
          when={local.indicatorTransition !== false}
          fallback={
            <Icon
              name={
                clipboard.copied()
                  ? (local.copiedIcon ?? 'icon-check')
                  : (local.icon ?? 'icon-copy')
              }
              slotName="copy-button-icon"
              {...slots.icon}
            />
          }
        >
          <Icon
            name={local.icon ?? 'icon-copy'}
            slotName="copy-button-icon"
            aria-hidden={clipboard.copied() ? true : undefined}
            {...slots.icon}
          />
          <Icon
            name={local.copiedIcon ?? 'icon-check'}
            slotName="copy-button-copied-icon"
            aria-hidden={!clipboard.copied() ? true : undefined}
            {...slots.copiedIcon}
          />
        </Show>
      </span>
    )
  }

  return (
    <Dynamic
      component={tag()}
      data-slot={local.slotName || 'copy-button'}
      {...copyButtonDataAttributes.root({
        copied: clipboard.copied,
        state: clipboard.state,
        disabled: () => local.disabled,
      })}
      {...binding}
      {...slots.root}
      aria-label={local['aria-label'] ?? defaultAriaLabel()}
    >
      <Show when={local.iconPosition !== 'trailing'}>
        <Indicator />
      </Show>

      <Show when={hasChildren()}>
        <span data-slot="copy-button-label" {...slots.label}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={local.iconPosition === 'trailing'}>
        <Indicator />
      </Show>

      <Show when={local.trailing}>
        <Icon name={local.trailing!} slotName="copy-button-trailing" {...slots.trailing} />
      </Show>
    </Dynamic>
  )
}
