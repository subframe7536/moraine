import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createDisclosureState } from '../../shared/disclosure-state'
import { createId } from '../../shared/utils'

import { CollapsibleContent } from './collapsible-content'
import type { CollapsibleContext } from './collapsible-context'
import { CollapsibleProvider } from './collapsible-context'
import { CollapsibleTrigger } from './collapsible-trigger'
import { collapsibleDataAttributes, collapsibleRecipe } from './collapsible.recipe'
import type { CollapsibleProps } from './collapsible.types'

/**
 * Single disclosure whose `Collapsible.Trigger` and `Collapsible.Content` belong to the surrounding
 * layout, with optional height transitions. Use `Accordion` when several disclosures share
 * selection rules. Pair `open` with `onOpenChange` for controlled state or use `defaultOpen`; the
 * content shell stays mounted so the trigger's `aria-controls` always points to a real element.
 *
 * @example
 * ```tsx
 * import { createSignal } from 'solid-js'
 * import { Collapsible } from 'moraine'
 *
 * const [open, setOpen] = createSignal(false)
 *
 * <Collapsible open={open()} onOpenChange={setOpen}>
 *   <Collapsible.Trigger>Advanced settings</Collapsible.Trigger>
 *   <Collapsible.Content>Telemetry endpoints</Collapsible.Content>
 * </Collapsible>
 * ```
 */
export function Collapsible(props: CollapsibleProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'transition',
    'forceMount',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const rootId = createId(() => local.id, 'collapsible')
  const contentId = () => `${rootId()}-content`
  const triggerId = () => `${rootId()}-trigger`
  const [open, setControlledOpen] = createControllableValue<boolean>({
    value: () => local.open,
    defaultValue: () => Boolean(local.defaultOpen),
    onChange: (nextOpen) => local.onOpenChange?.(nextOpen),
  })
  const disclosure = createDisclosureState({
    open,
    disabled: () => Boolean(local.disabled),
    transition: () => Boolean(local.transition),
    forceMount: () => local.forceMount,
    onBeforeMatch: () => {
      if (!open()) {
        toggleContent()
      }
    },
  })
  const {
    slots: { root: rootSlot },
  } = useRecipe(collapsibleRecipe, local, {
    data: {
      root: collapsibleDataAttributes.root({
        expanded: disclosure.open,
        closed: disclosure.closed,
      }),
    },
    own: {
      root: () => ({
        style: { '--mo-collapsible-content-height': `${disclosure.contentHeight()}px` },
      }),
    },
  })

  function setOpen(nextOpen: boolean): void {
    if (!disclosure.disabled()) {
      setControlledOpen(nextOpen)
    }
  }

  function toggleContent(): void {
    setOpen(!open())
  }

  const context: CollapsibleContext = {
    slotOverrides: {
      get classes() {
        return local.classes
      },
      get styles() {
        return local.styles
      },
    },
    triggerId,
    contentId,
    toggle: toggleContent,
    disclosure,
  }

  return (
    <CollapsibleProvider value={context}>
      <div id={rootId()} data-slot="collapsible" {...rootSlot} {...rest} />
    </CollapsibleProvider>
  )
}

Collapsible.Trigger = CollapsibleTrigger
Collapsible.Content = CollapsibleContent
