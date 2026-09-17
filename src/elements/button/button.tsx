import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { ValidComponent } from '../../shared/types.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import { useButtonGroupContext } from './button-group-context'
import { buttonRecipe } from './button.recipe'
import type { ButtonProps, ButtonT } from './button.types'

/**
 * Button component with polymorphic `as` support and loading state.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const cn = useCn()
  const group = useButtonGroupContext()
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
  const resolved = createStyles(buttonRecipe, local, {
    inheritedVariants: () => group ?? undefined,
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
      {...resolved.styles.root}
    >
      <Show when={resolvedLeading()}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="leading"
            class={cn(
              isLeadingLoading() ? resolved.styles.loading.class : undefined,
              resolved.styles.leading.class,
            )}
            style={{
              ...(isLeadingLoading() ? resolved.styles.loading.style : undefined),
              ...resolved.styles.leading.style,
            }}
            aria-hidden={isLeadingLoading() ? true : undefined}
          />
        )}
      </Show>

      <Show when={hasResolvedChildren()}>
        <span data-slot="label" {...resolved.styles.label}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={resolvedTrailing()}>
        {(trailing) => (
          <Icon
            name={trailing()}
            slotName="trailing"
            class={cn(
              isTrailingLoading() ? resolved.styles.loading.class : undefined,
              resolved.styles.trailing.class,
            )}
            style={{
              ...(isTrailingLoading() ? resolved.styles.loading.style : undefined),
              ...resolved.styles.trailing.style,
            }}
            aria-hidden={isTrailingLoading() ? true : undefined}
          />
        )}
      </Show>
    </Dynamic>
  )
}
