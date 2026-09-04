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

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { SlotClassValue } from '../../shared/types.ts'
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
  props: Omit<Partial<OverlayTriggerProps>, 'class' | 'style'> & {
    class?: SlotClassValue
    classes?: ModalT.Classes
    style?: JSX.CSSProperties
    styles?: ModalT.Styles
    children?: (props: OverlayTriggerProps) => JSX.Element
  },
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'children',
    'onClick',
    'ref',
    'class',
    'classes',
    'style',
    'styles',
  ])
  const triggerRender = createMemo(() => local.children)
  const binding = useModalTriggerBinding(() => local.ref)
  const config = useMoraineConfig()
  const provider = () => config().modal
  const resolved = resolveComponentStyle({
    rootSlot: 'trigger',
    get provider() {
      return provider()
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
      get class() {
        return resolved.rootClass()
      },
      get style() {
        return resolved.rootStyle()
      },
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
    class?: SlotClassValue
    classes?: ModalT.Classes
    style?: JSX.CSSProperties
    styles?: ModalT.Styles
    ref?: (element: ModalTriggerElementFor<T> | undefined) => void
  } & Record<string, unknown>

  const [local, rest] = splitProps(props as RuntimeProps, [
    'as',
    'type',
    'disabled',
    'children',
    'class',
    'classes',
    'style',
    'styles',
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
  const config = useMoraineConfig()
  const provider = () => config().modal
  const resolved = resolveComponentStyle({
    rootSlot: 'trigger',
    get provider() {
      return provider()
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

  onMount(() => {
    validateOverlayTrigger(binding.context.triggerElement(), 'Modal')
  })

  return (
    <Dynamic
      data-slot="trigger"
      {...interactionProps}
      component={tag()}
      style={resolved.rootStyle()}
      class={resolved.rootClass()}
      aria-controls={binding.context.contentPresent() ? binding.context.contentId() : undefined}
      aria-expanded={binding.context.contentPresent() ? 'true' : 'false'}
      data-disabled={disabled() ? '' : undefined}
      ref={binding.ref}
    >
      {children()}
    </Dynamic>
  )
}
