import type { JSX } from 'solid-js'
import {
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onMount,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createContextProvider } from '../../shared/create-context-provider'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { callHandler, createId } from '../../shared/utils'
import { OverlayMenu } from '../base/menu'
import type { OverlayMenuFocusStrategy } from '../base/menu'
import { validateOverlayTrigger } from '../base/trigger'

import { dropdownMenuDataAttributes, dropdownMenuRecipe } from './dropdown-menu.recipe'
import type { DropdownMenuProps, DropdownMenuT } from './dropdown-menu.types'

/**
 * Triggered action menu anchored to its child content.
 */
function createDropdownMenu(props: DropdownMenuProps) {
  const resolvedId = createId(() => props.id, 'dropdownmenu')
  const contentId = createMemo(() => `${resolvedId()}-content`)
  const [isOpen, setOpenState] = createControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const [autoFocusStrategy, setAutoFocusStrategy] =
    createSignal<OverlayMenuFocusStrategy>('content')
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement>()

  const triggerDataAttrs = dropdownMenuDataAttributes.trigger({
    closed: () => !isOpen(),
    disabled: () => props.disabled,
    expanded: isOpen,
  })
  const triggerProps = mergeProps(triggerDataAttrs, {
    id: resolvedId(),
    get 'aria-controls'() {
      return isOpen() ? contentId() : undefined
    },
    'aria-haspopup': 'menu' as const,
    get 'aria-expanded'() {
      return isOpen() ? 'true' : 'false'
    },
    'data-slot': 'dropdown-menu-trigger',
  })

  createEffect(
    on(
      () => Boolean(props.disabled) && isOpen(),
      (shouldClose) => {
        if (shouldClose) {
          commitOpen(false)
        }
      },
    ),
  )

  function commitOpen(open: boolean): void {
    if (open && props.disabled) {
      return
    }

    if (props.open === undefined) {
      setOpenState(open)
    }

    if (!open) {
      setAutoFocusStrategy('none')
    }

    props.onOpenChange?.(open)
  }

  function openWithStrategy(strategy: OverlayMenuFocusStrategy): void {
    if (props.disabled) {
      return
    }

    setAutoFocusStrategy(strategy)
    commitOpen(true)
  }

  return {
    get presentation() {
      return { classes: props.classes, styles: props.styles }
    },
    triggerProps,
    triggerElement,
    setTriggerElement,
    disabled: () => Boolean(props.disabled),
    isOpen,
    commitOpen,
    openWithStrategy,
    menuProps: {
      get id() {
        return resolvedId()
      },
      get open() {
        return isOpen()
      },
      onClose: () => commitOpen(false),
      get triggerElement() {
        return triggerElement()
      },
      get placement() {
        return props.placement
      },
      get align() {
        return props.align
      },
      get gutter() {
        return props.gutter
      },
      get shift() {
        return props.shift
      },
      get autoFocusStrategy() {
        return autoFocusStrategy()
      },
      get preventScroll() {
        return props.preventScroll
      },
      get overflowPadding() {
        return props.overflowPadding
      },
      onAutoFocusHandled: () => setAutoFocusStrategy('none'),
    },
  }
}

const [DropdownMenuProvider, useDropdownMenuContext] =
  createContextProvider<ReturnType<typeof createDropdownMenu>>('DropdownMenu')

/** Menu state and interaction context, without a DOM root. */
export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const context = createDropdownMenu(props)
  return <DropdownMenuProvider value={context}>{props.children}</DropdownMenuProvider>
}

function DropdownMenuTrigger<T extends ValidComponent = 'button'>(
  props: DropdownMenuT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'style',
    'disabled',
    'ref' as any,
  ])
  const context = useDropdownMenuContext()

  const resolved = createStyles(dropdownMenuRecipe, local, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.presentation,
  })
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({
    tag,
    ref: () => local.ref,
    registration: { element: context.triggerElement, ref: context.setTriggerElement },
  })
  const disabled = () => Boolean(local.disabled ?? context.disabled())
  const userEvents = rest as Record<string, unknown>
  let keyboardActivation = false
  const events = mergeProps(rest, {
    onKeyDown(event: KeyboardEvent) {
      callHandler(event, userEvents.onKeyDown)
      if (event.defaultPrevented || disabled() || event.target !== event.currentTarget) {
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        context.openWithStrategy(event.key === 'ArrowDown' ? 'first' : 'last')
      } else if (event.key === 'Escape' && context.isOpen()) {
        event.preventDefault()
        context.commitOpen(false)
      } else if (event.key === 'Enter' || event.key === ' ') {
        keyboardActivation = true
      }
    },
    onKeyUp(event: KeyboardEvent) {
      callHandler(event, userEvents.onKeyUp)
      queueMicrotask(() => {
        keyboardActivation = false
      })
    },
    onBlur(event: FocusEvent) {
      keyboardActivation = false
      callHandler(event, userEvents.onBlur)
    },
    onPointerDown(event: PointerEvent) {
      keyboardActivation = false
      callHandler(event, userEvents.onPointerDown)
    },
  })
  const interaction = useButtonInteraction(
    {
      tag,
      element: root.element,
      disabled,
      disabledForComponent: true,
      manualKeyboardActivation: true,
      onPress(event) {
        const strategy = keyboardActivation && event.detail === 0 ? 'first' : 'content'
        keyboardActivation = false
        if (context.isOpen()) {
          context.commitOpen(false)
        } else {
          context.openWithStrategy(strategy)
        }
      },
    },
    events,
  )
  const triggerProps = mergeProps(context.triggerProps, interaction)
  const binding = root.bind(triggerProps)
  const children = resolveChildren(() => local.children)
  onMount(() => validateOverlayTrigger(context.triggerElement(), 'DropdownMenu'))
  return (
    <Dynamic
      component={tag()}
      {...binding}
      data-slot="dropdown-menu-trigger"
      {...resolved.styles.trigger}
    >
      {children()}
    </Dynamic>
  )
}

function DropdownMenuContent(props: DropdownMenuT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'itemRender',
    'itemProps',
    'contentTop',
    'contentBottom',
    'checkedIcon',
    'submenuIcon',
    'size',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const context = useDropdownMenuContext()

  const merged = mergeProps(
    { checkedIcon: 'icon-check', submenuIcon: 'icon-chevron-right' },

    local,
  )
  const resolved = createStyles(dropdownMenuRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => context.presentation,
  })
  return (
    <OverlayMenu<DropdownMenuT.Item>
      {...context.menuProps}
      owner="dropdown-menu"
      slotBinding={(slot) => resolved.styles[slot]}
      size={resolved.variants.size ?? undefined}
      items={merged.items}
      checkedIcon={merged.checkedIcon}
      submenuIcon={merged.submenuIcon}
      itemRender={merged.itemRender}
      contentProps={rest}
      itemProps={merged.itemProps}
      contentTop={merged.contentTop}
      contentBottom={merged.contentBottom}
    />
  )
}

DropdownMenu.Trigger = DropdownMenuTrigger
DropdownMenu.Content = DropdownMenuContent
