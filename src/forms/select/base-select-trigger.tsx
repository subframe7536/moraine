import type { JSX, ValidComponent } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../elements/icon'
import { useCn } from '../../shared/provider'
import { callHandler, callRef } from '../../shared/utils'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectTrigger<T extends ValidComponent = 'button'>(
  props: BaseSelectT.TriggerProps<T>,
): JSX.Element {
  const context = useBaseSelectContext()
  const cn = useCn()
  type RuntimeProps = BaseSelectT.TriggerProps<T> & {
    ref?: (element: BaseSelectT.TriggerElementFor<T> | undefined) => void
    onClick?: JSX.EventHandlerUnion<BaseSelectT.TriggerElementFor<T>, MouseEvent>
    onPointerDown?: JSX.EventHandlerUnion<BaseSelectT.TriggerElementFor<T>, PointerEvent>
    onKeyDown?: JSX.EventHandlerUnion<BaseSelectT.TriggerElementFor<T>, KeyboardEvent>
  }
  const [local, rest] = splitProps(props as unknown as RuntimeProps, [
    'as',
    'children',
    'class',
    'style',
    'disabled',
    'ref',
    'onClick',
    'onPointerDown',
    'onKeyDown',
  ])
  const triggerResolved = () => context.resolved.slot('trigger')
  const isDisabled = () =>
    Boolean(local.disabled) || context.field.disabled() || context.field.readOnly()

  const resolvedChildren = () => {
    const ch = local.children
    return typeof ch === 'function' ? ch(context.controlApi) : ch
  }

  return (
    <Dynamic
      component={(local.as as ValidComponent) ?? 'button'}
      type={local.as === undefined || local.as === 'button' ? 'button' : undefined}
      data-slot="trigger"
      aria-haspopup="listbox"
      aria-expanded={context.isOpen() ? 'true' : 'false'}
      aria-controls={context.listboxId()}
      aria-activedescendant={
        context.highlightedKey() ? context.getOptionId(context.highlightedKey()!) : undefined
      }
      tabIndex={context.hasControlRef() ? -1 : 0}
      disabled={isDisabled() || undefined}
      ref={(element: any) => {
        if (!context.hasControlRef()) {
          context.setControlRef(element)
        }
        callRef(local.ref, element)
      }}
      {...rest}
      class={cn(triggerResolved().class, local.class)}
      style={{
        ...toStyleObject(triggerResolved().style),
        ...toStyleObject(local.style),
      }}
      onPointerDown={(event: PointerEvent) => {
        if (isDisabled()) {
          return
        }
        callHandler(event, local.onPointerDown as any)
        if (!event.defaultPrevented) {
          event.preventDefault()
          event.stopPropagation()
          context.focusInput()
        }
      }}
      onClick={(event: MouseEvent) => {
        event.stopPropagation()
        if (isDisabled()) {
          return
        }
        context.toggle()
        callHandler(event, local.onClick as any)
      }}
      onKeyDown={(event: KeyboardEvent) => {
        callHandler(event, local.onKeyDown as any)
        if (event.defaultPrevented || isDisabled()) {
          return
        }

        context.onKeyDown(event)
        if (event.key === 'Enter') {
          event.preventDefault()
        }
      }}
    >
      {resolvedChildren() ?? <Icon name="icon-chevron-down" />}
    </Dynamic>
  )
}
