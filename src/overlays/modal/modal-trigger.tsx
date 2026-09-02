import type { JSX, ValidComponent } from 'solid-js'
import {
  children as resolveChildren,
  Show,
  createMemo,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { renderComponentOrElement } from '../../shared/render-prop'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler, callRef } from '../../shared/utils'
import type { OverlayTriggerProps } from '../base/trigger'
import { validateOverlayTrigger } from '../base/trigger'

import type { ModalT } from './modal'
import { useModalContext } from './modal-context'

type ModalTriggerElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

function useModalTriggerBinding(
  ref: () => ((element: HTMLElement | undefined) => void) | undefined,
) {
  const context = useModalContext()

  return {
    context,
    onPress: () => context.updateOpen(true),
    ref: (element: HTMLElement | undefined) => {
      context.setTriggerElement(element)
      callRef(ref(), element)

      if (element) {
        onCleanup(() => {
          if (context.triggerElement() === element) {
            context.setTriggerElement(undefined)
          }
          callRef(ref(), undefined)
        })
      }
    },
  }
}

/** Internal callback trigger adapter retained for Dialog and Sheet. */
export function ModalTriggerRenderer(
  props: Partial<OverlayTriggerProps> & {
    children?: (props: OverlayTriggerProps) => JSX.Element
  },
): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'onClick', 'ref'])
  const triggerRender = createMemo(() => local.children)
  const binding = useModalTriggerBinding(() => local.ref)
  const triggerProps = mergeProps(
    {
      get 'aria-controls'() {
        return binding.context.contentPresent() ? binding.context.contentId() : undefined
      },
      get 'aria-expanded'() {
        return binding.context.contentPresent() ? 'true' : 'false'
      },
      'data-slot': 'trigger',
    },
    rest,
    {
      ref: binding.ref,
      onClick: (event: MouseEvent) => {
        callHandler<HTMLElement, MouseEvent>(event, local.onClick)
        if (!event.defaultPrevented) {
          binding.onPress()
        }
      },
    },
  ) as OverlayTriggerProps

  onMount(() => {
    if (triggerRender()) {
      validateOverlayTrigger(binding.context.triggerElement(), 'Modal')
    }
  })

  return (
    <Show when={triggerRender()}>
      {(render) => renderComponentOrElement(render(), triggerProps)}
    </Show>
  )
}

/** Interactive modal trigger with Button-compatible polymorphic behavior. */
export function ModalTrigger<T extends ValidComponent = 'button'>(
  props: ModalT.TriggerProps<T>,
): JSX.Element {
  type RuntimeProps = ModalT.TriggerBase<T> & {
    class?: string
    style?: JSX.CSSProperties
    ref?: (element: ModalTriggerElementFor<T> | undefined) => void
  } & Record<string, unknown>
  const [local, rest] = splitProps(props as RuntimeProps, [
    'as',
    'type',
    'disabled',
    'children',
    'class',
    'style',
    'ref',
  ])
  const tag = createMemo(() => (local.as as ValidComponent) ?? 'button')
  const disabled = () => Boolean(local.disabled)
  const binding = useModalTriggerBinding(
    () => local.ref as ((element: HTMLElement | undefined) => void) | undefined,
  )
  const interactionProps = useButtonInteraction<ModalTriggerElementFor<T>>(
    {
      disabled,
      disabledForComponent: true,
      onPress: () => binding.onPress,
      tag,
      type: () => local.type,
      typeForComponent: true,
    },
    rest,
  )
  const children = resolveChildren(() => local.children)

  onMount(() => {
    validateOverlayTrigger(binding.context.triggerElement(), 'Modal')
  })

  return (
    <Dynamic
      data-slot="trigger"
      {...interactionProps}
      component={tag()}
      style={local.style}
      class={local.class}
      aria-controls={binding.context.contentPresent() ? binding.context.contentId() : undefined}
      aria-expanded={binding.context.contentPresent() ? 'true' : 'false'}
      data-disabled={disabled() ? '' : undefined}
      ref={binding.ref}
    >
      {children()}
    </Dynamic>
  )
}
