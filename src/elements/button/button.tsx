import type { JSX, ValidComponent } from 'solid-js'
import { Show, children as resolveChildren, createMemo, splitProps, useContext } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useButtonInteraction } from '../../shared/use-button-interaction.ts'
import { useLoadingAutoClick } from '../../shared/use-loading-auto.ts'
import { Icon } from '../icon/index.ts'
import type { IconT } from '../icon/index.ts'

import { ButtonGroupContext } from './button-group-context.ts'
import type { ButtonProps, ButtonT } from './button.types.ts'

export * from './button.types.ts'

/**
 * Button component with polymorphic `as` support and loading state.
 */
export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
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

  const { isLoading, onClick } = useLoadingAutoClick<ButtonT.ElementFor<T>>({
    loading: () => local.loading,
    loadingAuto: () => local.loadingAuto,
    get onClick() {
      return rest.onClick as JSX.EventHandlerUnion<ButtonT.ElementFor<T>, MouseEvent> | undefined
    },
  })

  const tag = createMemo(() => (local.as as ValidComponent) ?? 'button')
  const design = useMoraineDesign()
  const buttonDesign = () => design().button

  const isDisabledOrLoading = () => isLoading() || Boolean(local.disabled)
  const size = () =>
    (local.size ?? group?.size ?? buttonDesign()?.defaultVariants?.size ?? 'md') as NonNullable<
      ButtonT.Variant['size']
    >
  const variant = () =>
    (local.variant ??
      group?.variant ??
      buttonDesign()?.defaultVariants?.variant ??
      'default') as NonNullable<ButtonT.Variant['variant']>
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

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return buttonDesign()?.recipe({ variant: variant(), size: size() })
      },
    },
    get group() {
      return group
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  return (
    <Dynamic
      data-slot={local.slotName || 'root'}
      data-size={size()}
      data-variant={variant()}
      aria-busy={isLoading() ? true : undefined}
      data-loading={isLoading() ? '' : undefined}
      data-disabled={local.disabled ? '' : undefined}
      {...interactionProps}
      component={tag()}
      {...resolved.rootClassAndStyle()}
    >
      <Show when={resolvedLeading()}>
        {(leading) => (
          <Icon
            name={leading()}
            slotName="leading"
            {...resolved.slotClassAndStyle('leading', {
              get state() {
                return isLeadingLoading()
                  ? {
                      class: resolved.slotClass('loading'),
                      style: resolved.slotStyle('loading'),
                    }
                  : undefined
              },
            })}
            aria-hidden={isLeadingLoading() ? true : undefined}
          />
        )}
      </Show>

      <Show when={hasResolvedChildren()}>
        <span data-slot="label" {...resolved.slotClassAndStyle('label')}>
          {resolvedChildren()}
        </span>
      </Show>

      <Show when={resolvedTrailing()}>
        {(trailing) => (
          <Icon
            name={trailing()}
            slotName="trailing"
            {...resolved.slotClassAndStyle('trailing', {
              get state() {
                return isTrailingLoading()
                  ? {
                      class: resolved.slotClass('loading'),
                      style: resolved.slotStyle('loading'),
                    }
                  : undefined
              },
            })}
            aria-hidden={isTrailingLoading() ? true : undefined}
          />
        )}
      </Show>
    </Dynamic>
  )
}
