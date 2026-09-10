import type { JSX } from 'solid-js'
import { createMemo, createSignal, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useDisclosureState } from '../../shared/use-disclosure-state'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { useId } from '../../shared/utils'

import { CollapsibleContent } from './collapsible-content'
import type { CollapsibleContext } from './collapsible-context'
import { CollapsibleProvider } from './collapsible-context'
import { CollapsibleTrigger } from './collapsible-trigger'
import type { CollapsibleProps } from './collapsible.types'

/** Expandable content section with optional height transitions. */
export function Collapsible(props: CollapsibleProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'transition',
    'unmountOnHide',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createComponentStyles('collapsible', local)
  const rootId = useId(() => local.id, 'collapsible')
  const contentId = createMemo(() => `${rootId()}-content`)
  const triggerId = createMemo(() => `${rootId()}-trigger`)
  const [open, setControlledOpen] = useControllableValue<boolean>({
    value: () => local.open,
    defaultValue: () => Boolean(local.defaultOpen),
  })
  const resolvedOpen = createMemo(() => Boolean(open()))
  const { contentHeight, dataAttrs, disabled, setContentElement } = useDisclosureState({
    open: resolvedOpen,
    disabled: () => Boolean(local.disabled),
  })
  const contentPresence = useTransitionPresence({ open: resolvedOpen })
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const transition = createMemo(() => Boolean(local.transition))
  const unmountOnHide = createMemo(() => local.unmountOnHide ?? true)

  function setOpen(nextOpen: boolean): void {
    if (disabled() || nextOpen === resolvedOpen()) {
      return
    }

    setControlledOpen(nextOpen)
    local.onOpenChange?.(nextOpen)
  }

  function toggleContent(): void {
    setOpen(!resolvedOpen())
  }

  const context: CollapsibleContext = {
    presentation: {
      get classes() {
        return local.classes
      },
      get styles() {
        return local.styles
      },
    },
    rootId,
    triggerId,
    contentId,
    open: resolvedOpen,
    setOpen,
    toggle: toggleContent,
    disabled,
    transition,
    unmountOnHide,
    dataAttrs,
    contentHeight,
    setContentElement: (element) => {
      if (element) {
        setContentElement(element)
      }
    },
    contentPresence,
    triggerElement,
    setTriggerElement,
  }

  return (
    <CollapsibleProvider value={context}>
      <div id={rootId()} data-slot="root" {...dataAttrs()} {...rest} {...resolved.root}>
        {local.children}
      </div>
    </CollapsibleProvider>
  )
}

Collapsible.Trigger = CollapsibleTrigger
Collapsible.Content = CollapsibleContent
