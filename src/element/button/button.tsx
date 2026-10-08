import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { useButtonGroupContext } from '../button-group/button-group-context'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import { BUTTON_LOADING_ICON_CLASS, buttonDataAttributes, buttonRecipe } from './button.recipe'
import type { ButtonProps } from './button.types'

/**
 * Button component with polymorphic `as` support and loading state.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const cn = useCn()
  const group = useButtonGroupContext()
  const [local, rest] = splitProps(props as ButtonProps<T> & { ref?: unknown }, [
    'as',
    'variant',
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
  const resolved = createStyles(buttonRecipe, local, {
    inheritedVariants: () => group ?? undefined,
  })

  const { isLoading, onClick } = useLoadingAutoClick<HTMLElement>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    get onClick() {
      return rest.onClick as JSX.EventHandlerUnion<HTMLElement, MouseEvent> | undefined
    },
  })

  const tag = createMemo<ValidComponent>(() => local.as ?? 'button')
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })

  const isDisabledOrLoading = () => isLoading() || Boolean(local.disabled)
  const leading = createMemo(() => local.leading)
  const trailing = createMemo(() => local.trailing)

  const loadingIconName = createMemo<IconT.Name>(() => local.loadingIcon ?? 'icon-loading')

  const isLeadingLoading = createMemo(() => isLoading() && (leading() || !trailing()))
  const isTrailingLoading = createMemo(() => isLoading() && (!leading() || !trailing()))

  const resolvedLeading = createMemo(() => {
    if (!isLoading()) {
      return leading()
    }

    if (leading() || !trailing()) {
      return loadingIconName()
    }

    return undefined
  })

  const resolvedTrailing = createMemo(() => {
    if (!isLoading()) {
      return trailing()
    }

    if (!leading() && trailing()) {
      return loadingIconName()
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
  const customActiveEffectClass = () => {
    const effect = local.activeEffect
    if (typeof effect !== 'function') {
      return
    }
    const el = root.element()
    return el ? effect(el) : undefined
  }
  const resolvedChildren = createMemo(() =>
    renderWithProps(child(), {
      get loading() {
        return isLoading()
      },
    }),
  )
  const hasResolvedChildren = createMemo(() => {
    const value = resolvedChildren()
    return value === 0 || Boolean(value)
  })

  return (
    <Dynamic
      data-slot={local.slotName || 'button'}
      aria-busy={isLoading() ? true : undefined}
      {...buttonDataAttributes.root({
        loading: isLoading,
        disabled: () => local.disabled,
      })}
      {...binding}
      component={tag()}
      style={{ ...resolved.styles.root.style }}
      class={cn(resolved.styles.root.class, customActiveEffectClass())}
    >
      <Show when={resolvedLeading()}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="button-leading"
            class={cn(
              isLeadingLoading() ? BUTTON_LOADING_ICON_CLASS : undefined,
              resolved.styles.leading.class,
            )}
            style={resolved.styles.leading.style}
            aria-hidden={isLeadingLoading() ? true : undefined}
          />
        )}
      </Show>

      <Show when={hasResolvedChildren()}>
        <span data-slot="button-label" {...resolved.styles.label}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={resolvedTrailing()}>
        {(trailing) => (
          <Icon
            name={trailing()}
            slotName="button-trailing"
            class={cn(
              isTrailingLoading() ? BUTTON_LOADING_ICON_CLASS : undefined,
              resolved.styles.trailing.class,
            )}
            style={resolved.styles.trailing.style}
            aria-hidden={isTrailingLoading() ? true : undefined}
          />
        )}
      </Show>
    </Dynamic>
  )
}
