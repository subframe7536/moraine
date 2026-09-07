import type { JSX } from 'solid-js'
import { createMemo, createSignal, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useDisclosureState } from '../../shared/use-disclosure-state.ts'
import { useTransitionPresence } from '../../shared/use-transition-presence.ts'
import { useId } from '../../shared/utils.ts'

import { CollapsibleContent } from './collapsible-content.tsx'
import type { CollapsibleContext } from './collapsible-context.ts'
import { CollapsibleProvider } from './collapsible-context.ts'
import { CollapsibleTrigger } from './collapsible-trigger.tsx'
import type { CollapsibleProps } from './collapsible.types.ts'

export * from './collapsible.types.ts'

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
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return design().collapsible.recipe()
      },
    },
    get instance() {
      return {
        class: local.class,
        style: local.style,
        classes: local.classes,
        styles: local.styles,
      }
    },
  })
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
    resolved,
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
      <div
        id={rootId()}
        data-slot="root"
        {...dataAttrs()}
        {...rest}
        {...resolved.rootClassAndStyle()}
      >
        {local.children}
      </div>
    </CollapsibleProvider>
  )
}

Collapsible.Trigger = CollapsibleTrigger
Collapsible.Content = CollapsibleContent
