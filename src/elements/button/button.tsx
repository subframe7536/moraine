import type { JSX, ValidComponent } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps, useContext } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createComponentStyles } from '../../shared/provider'
import { useCn } from '../../shared/provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import { ButtonGroupContext } from './button-group-context'
import type { ButtonProps, ButtonT } from './button.types'

/**
 * Button component with polymorphic `as` support and loading state.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const cn = useCn()
  const group = useContext(ButtonGroupContext)
  const [local, rest] = splitProps(props, [
    'as',
    'type',
    'variant',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'slotName',
    'disabled',
    'loading',
    'loadingAuto',
    'loadingIcon',
    'leading',
    'trailing',
    'children',
  ])
  const resolved = createComponentStyles('button', local, {
    inheritedVariants: () => group,
  })

  const { isLoading, onClick } = useLoadingAutoClick<ButtonT.ElementFor<T>>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    get onClick() {
      return rest.onClick as JSX.EventHandlerUnion<ButtonT.ElementFor<T>, MouseEvent> | undefined
    },
  })

  const tag = createMemo(() => (local.as as ValidComponent) ?? 'button')

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

  const interactionProps = useButtonInteraction<ButtonT.ElementFor<T>>(
    {
      disabled: isDisabledOrLoading,
      onClick: () => onClick,
      tag,
      type: () => local.type,
    },
    rest,
  )

  const child = resolveChildren(() => local.children)
  const resolvedChildren = createMemo(() =>
    renderComponentOrElement(child() as ButtonT.Base['children'], {
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
      data-slot={local.slotName || 'root'}
      aria-busy={isLoading() ? true : undefined}
      data-loading={isLoading() ? '' : undefined}
      data-disabled={local.disabled ? '' : undefined}
      {...interactionProps}
      component={tag()}
      {...resolved.root}
    >
      <Show when={resolvedLeading()}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="leading"
            class={cn(
              isLeadingLoading() ? resolved.slot('loading').class : undefined,
              resolved.slot('leading').class,
            )}
            style={{
              ...(isLeadingLoading() ? resolved.slot('loading').style : undefined),
              ...resolved.slot('leading').style,
            }}
            aria-hidden={isLeadingLoading() ? true : undefined}
          />
        )}
      </Show>

      <Show when={hasResolvedChildren()}>
        <span data-slot="label" {...resolved.slot('label')}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={resolvedTrailing()}>
        {(trailing) => (
          <Icon
            name={trailing()}
            slotName="trailing"
            class={cn(
              isTrailingLoading() ? resolved.slot('loading').class : undefined,
              resolved.slot('trailing').class,
            )}
            style={{
              ...(isTrailingLoading() ? resolved.slot('loading').style : undefined),
              ...resolved.slot('trailing').style,
            }}
            aria-hidden={isTrailingLoading() ? true : undefined}
          />
        )}
      </Show>
    </Dynamic>
  )
}
