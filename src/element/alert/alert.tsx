import type { JSX } from 'solid-js'
import { createMemo, onCleanup, Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { hasJsxContent } from '../../shared/jsx-content'
import { createTransitionPresence } from '../../shared/transition-presence'
import type { ValidComponent } from '../../shared/types'
import { callRef } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import { defaultAlertMessages } from './alert.messages'
import { alertDataAttributes, alertRecipe } from './alert.recipe'
import type { AlertT } from './alert.types'

const ALERT_TYPE_ICONS: Record<string, IconT.Name> = {
  info: 'icon-info',
  success: 'icon-success',
  warning: 'icon-warning',
  error: 'icon-error',
}

/** Non-floating contextual feedback and status banner. */
export function Alert<T extends ValidComponent = 'div'>(props: AlertT.Props<T>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'title',
    'description',
    'actions',
    'icon',
    'closable',
    'closeIcon',
    'fullWidth',
    'open',
    'defaultOpen',
    'onOpenChange',
    'onExitComplete',
    'type',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'children',
    'translations',
  ])

  const messages = useMessages('alert', defaultAlertMessages, () => local.translations)

  const [open, setOpen] = createControllableValue<boolean>({
    value: () => local.open,
    defaultValue: () => local.defaultOpen ?? true,
    onChange: (next) => local.onOpenChange?.(next),
  })

  const presence = createTransitionPresence({
    open,
    onExitComplete: () => local.onExitComplete?.(),
  })

  const title = createMemo(() => local.title)
  const description = createMemo(() => local.description)
  const actions = createMemo(() => local.actions)
  const hasTitle = createMemo(() => hasJsxContent(title()))
  const hasDescription = createMemo(() => hasJsxContent(description()))
  const hasActions = createMemo(() => hasJsxContent(actions()))
  const isFullWidth = () => Boolean(local.fullWidth)
  const hasClose = () => Boolean(local.closable)
  const resolvedType = () => local.type ?? 'primary'

  const resolvedIcon = createMemo(() => {
    const custom = local.icon
    if (custom === false || custom === null) {
      return undefined
    }
    if (typeof custom === 'string' || typeof custom === 'object') {
      return custom
    }
    const t = resolvedType()
    return ALERT_TYPE_ICONS[t]
  })

  const hasIcon = () => resolvedIcon() !== undefined

  const { slots } = useRecipe(alertRecipe, local, {
    contextVariants: () => ({
      hasDescription: hasDescription(),
    }),
  })

  const isUrgent = () => resolvedType() === 'error' || resolvedType() === 'warning'
  const defaultRole = () => (isUrgent() ? 'alert' : 'status')
  const defaultAriaLive = () => (isUrgent() ? 'assertive' : 'polite')

  return (
    <Show when={presence.present()}>
      <Dynamic
        component={local.as ?? 'div'}
        data-slot="alert"
        role={defaultRole()}
        aria-live={defaultAriaLive()}
        {...alertDataAttributes.root({
          close: hasClose(),
          closed: presence.dataAttrs['data-closed'] !== undefined,
          expanded: presence.dataAttrs['data-expanded'] !== undefined,
          fullWidth: isFullWidth(),
          hasDescription: hasDescription(),
          type: resolvedType(),
        })}
        {...rest}
        ref={(element: HTMLElement) => {
          callRef(props.ref, element)
          if (element) {
            onCleanup(presence.registerElement(element))
          }
        }}
        {...slots.root}
      >
        <Show when={hasIcon()}>
          <div data-slot="alert-icon" {...slots.icon}>
            <Show
              when={typeof resolvedIcon() === 'string'}
              fallback={resolvedIcon() as JSX.Element}
            >
              <Icon name={resolvedIcon() as IconT.Name} />
            </Show>
          </div>
        </Show>
        <div data-slot="alert-content" {...slots.content}>
          <Show when={hasTitle()}>
            <div data-slot="alert-title" {...slots.title}>
              {title()}
            </div>
          </Show>
          <Show when={hasDescription()}>
            <div data-slot="alert-description" {...slots.description}>
              {description()}
            </div>
          </Show>
          {local.children}
        </div>
        <Show when={hasActions()}>
          <div data-slot="alert-actions" {...slots.actions}>
            {actions()}
          </div>
        </Show>
        <Show when={hasClose()}>
          <button
            data-slot="alert-close"
            aria-label={messages().close}
            onClick={() => setOpen(false)}
            {...slots.close}
          >
            <Icon name={local.closeIcon ?? 'icon-close'} />
          </button>
        </Show>
      </Dynamic>
    </Show>
  )
}
