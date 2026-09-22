import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createMemo,
  createSignal,
  onCleanup,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { ValidComponent } from '../../shared/types.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { useLoadingAutoClick } from '../../shared/use-loading-auto'
import { callRef } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import { useButtonGroupContext } from './button-group-context'
import { buttonDataAttributes, buttonRecipe } from './button.recipe'
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
  const [rootElement, setRootElement] = createSignal<HTMLElement>()

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
      element: rootElement,
      focusableWhenDisabled: () => isLoading() && !local.disabled,
      onClickOverride: onClick,
      tag,
    },
    rest,
  )

  const child = resolveChildren(() => local.children)
  const resolvedChildren = createMemo(() =>
    renderComponentOrElement(child(), {
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
      {...buttonDataAttributes.root({
        loading: isLoading,
        disabled: () => local.disabled,
      })}
      {...interactionProps}
      component={tag()}
      ref={(element: HTMLElement) => {
        setRootElement(element)
        callRef(local.ref, element)
        onCleanup(() => {
          if (rootElement() === element) {
            setRootElement(undefined)
          }
          callRef(local.ref, undefined)
        })
      }}
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
