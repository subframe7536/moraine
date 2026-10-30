import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { useButtonGroupContext } from '../button-group/button-group-context'
import { Icon } from '../icon'

import { BUTTON_LOADING_ICON_CLASS, buttonDataAttributes, buttonRecipe } from './button.recipe'
import type { ButtonProps } from './button.types'

/**
 * Button component with polymorphic `as` support and loading state.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const group = useButtonGroupContext()
  const [local, rest] = splitProps(props as ButtonProps<T> & { ref?: unknown }, [
    'as',
    'variant',
    'tone',
    'size',
    'activeEffect',
    'classes',
    'styles',
    'class',
    'style',
    'slotName',
    'ref',
    'disabled',
    'loading',
    'loadingAuto',
    'loadingIcon',
    'leading',
    'trailing',
    'children',
  ])

  const { isLoading, onClick } = useLoadingAutoClick<HTMLElement>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    get onClick() {
      return rest.onClick as JSX.EventHandlerUnion<HTMLElement, MouseEvent> | undefined
    },
  })

  const tag = createMemo<ValidComponent>(() => local.as ?? 'button')
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })

  function customActiveEffectClass() {
    const effect = local.activeEffect
    if (typeof effect !== 'function') {
      return
    }
    const el = root.element()
    return el ? effect(el) : undefined
  }

  const isDisabledOrLoading = () => isLoading() || Boolean(local.disabled)
  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)

  const isLeadingLoading = createMemo(() => isLoading() && (leading() || !trailing()))
  const isTrailingLoading = createMemo(() => isLoading() && (!leading() || !trailing()))

  const { slots } = useRecipe(buttonRecipe, local, {
    contextVariants: () => group ?? undefined,
    own: {
      root: () => ({ class: customActiveEffectClass() }),
      leading: () => ({ class: isLeadingLoading() ? BUTTON_LOADING_ICON_CLASS : undefined }),
      trailing: () => ({ class: isTrailingLoading() ? BUTTON_LOADING_ICON_CLASS : undefined }),
    },
  })

  const resolvedLeading = createMemo(() => {
    if (!isLoading()) {
      return leading()
    }

    if (leading() || !trailing()) {
      return local.loadingIcon ?? 'icon-loading'
    }

    return undefined
  })

  const resolvedTrailing = createMemo(() => {
    if (!isLoading()) {
      return trailing()
    }

    if (!leading() && trailing()) {
      return local.loadingIcon ?? 'icon-loading'
    }

    return trailing()
  })

  const interactionProps = useButtonInteraction(
    {
      disabled: isDisabledOrLoading,
      disabledForComponent: true,
      element: root.element,
      focusableWhenDisabled: () => isLoading() && !local.disabled,
      onClickOverride: onClick,
      tag,
    },
    rest,
  )

  const binding = root.bind(interactionProps)
  const child = resolveChildren(() => local.children)
  const resolvedChildren = createMemo(() =>
    renderWithProps(child(), {
      get loading() {
        return isLoading()
      },
    }),
  )
  const hasChildren = () => hasContent(resolvedChildren())

  return (
    <Dynamic
      component={tag()}
      data-slot={local.slotName || 'button'}
      aria-busy={isLoading() ? true : undefined}
      {...buttonDataAttributes.root({
        loading: isLoading,
        disabled: () => local.disabled,
      })}
      {...binding}
      {...slots.root}
    >
      <Show when={resolvedLeading()}>
        {(leading) => (
          <Icon
            name={leading()}
            data-slot="button-leading"
            aria-hidden={isLeadingLoading() ? true : undefined}
            {...slots.leading}
          />
        )}
      </Show>

      <Show when={hasChildren()}>
        <span data-slot="button-label" {...slots.label}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={resolvedTrailing()}>
        {(trailing) => (
          <Icon
            name={trailing()}
            data-slot="button-trailing"
            aria-hidden={isTrailingLoading() ? true : undefined}
            {...slots.trailing}
          />
        )}
      </Show>
    </Dynamic>
  )
}
