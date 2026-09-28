import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, on, onCleanup, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createDisclosureState } from '../../shared/disclosure-state'
import { createTransitionPresence } from '../../shared/transition-presence'
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
  })
  const { contentHeight, dataAttrs, disabled, registerElement } = createDisclosureState({
    open,
    disabled: () => Boolean(local.disabled),
  })
  const contentPresence = createTransitionPresence({ open })
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | undefined>()
  const [contentElement, setCurrentContentElement] = createSignal<HTMLElement | undefined>()
  let registeredContentElement: HTMLElement | undefined
  const transition = createMemo(() => Boolean(local.transition))
  const unmountOnHide = createMemo(() => local.unmountOnHide ?? true)
  let contentHasFocus = false
  let removeContentFocusListeners: (() => void) | undefined

  function restoreTriggerFocus(): void {
    const content = contentElement()

    if (contentHasFocus || content?.contains(content.ownerDocument.activeElement)) {
      contentHasFocus = false
      triggerElement()?.focus()
    }
  }

  createEffect(
    on(open, (isOpen) => {
      if (!isOpen) {
        restoreTriggerFocus()
      }
    }),
  )

  function registerContentElement(element: HTMLElement): () => void {
    removeContentFocusListeners?.()
    removeContentFocusListeners = undefined
    setCurrentContentElement(element)
    registeredContentElement = element

    contentHasFocus = element.contains(element.ownerDocument.activeElement)
    const onFocusIn = () => {
      contentHasFocus = true
    }
    const onFocusOut = (event: FocusEvent) => {
      if (open() && !element.contains(event.relatedTarget as Node | null)) {
        contentHasFocus = false
      }
    }
    element.addEventListener('focusin', onFocusIn)
    element.addEventListener('focusout', onFocusOut)
    const removeListeners = () => {
      element.removeEventListener('focusin', onFocusIn)
      element.removeEventListener('focusout', onFocusOut)
    }
    removeContentFocusListeners = removeListeners
    const releaseDisclosure = registerElement(element)
    return () => {
      releaseDisclosure()
      if (registeredContentElement === element) {
        removeListeners()
        removeContentFocusListeners = undefined
        registeredContentElement = undefined
        setCurrentContentElement(undefined)
      }
    }
  }

  onCleanup(() => removeContentFocusListeners?.())

  function setOpen(nextOpen: boolean): void {
    if (disabled() || nextOpen === open()) {
      return
    }

    setControlledOpen(nextOpen)
    local.onOpenChange?.(nextOpen)
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
    open,
    toggle: toggleContent,
    disabled,
    transition,
    unmountOnHide,
    dataAttrs,
    contentHeight,
    registerContentElement,
    contentPresence,
    triggerElement,
    setTriggerElement,
  }

  return (
    <CollapsibleProvider value={context}>
      <div
        id={rootId()}
        data-slot="collapsible"
        {...collapsibleDataAttributes.root({
          expanded: () => dataAttrs()['data-expanded'],
          closed: () => dataAttrs()['data-closed'],
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
