import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createDisclosureState } from '../../shared/disclosure-state'
import { createId } from '../../shared/utils'

import { CollapsibleContent } from './collapsible-content'
import type { CollapsibleContext } from './collapsible-context'
import { CollapsibleProvider } from './collapsible-context'
import { CollapsibleTrigger } from './collapsible-trigger'
import { collapsibleDataAttributes, collapsibleRecipe } from './collapsible.recipe'
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
  const resolved = createStyles(collapsibleRecipe, local)
  const rootId = createId(() => local.id, 'collapsible')
  const contentId = createMemo(() => `${rootId()}-content`)
  const triggerId = createMemo(() => `${rootId()}-trigger`)
  const [open, setControlledOpen] = createControllableValue<boolean>({
    value: () => local.open,
    defaultValue: () => Boolean(local.defaultOpen),
    onChange: (nextOpen) => local.onOpenChange?.(nextOpen),
  })
  const disclosure = createDisclosureState({
    open,
    disabled: () => Boolean(local.disabled),
    transition: () => Boolean(local.transition),
    unmountOnHide: () => local.unmountOnHide,
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
    presentation: {
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
      <div
        id={rootId()}
        data-slot="collapsible"
        {...collapsibleDataAttributes.root({
          expanded: () => disclosure.dataAttrs()['data-expanded'],
          closed: () => disclosure.dataAttrs()['data-closed'],
        })}
        {...rest}
        {...resolved.styles.root}
      >
        {local.children}
      </div>
    </CollapsibleProvider>
  )
}

Collapsible.Trigger = CollapsibleTrigger
Collapsible.Content = CollapsibleContent
