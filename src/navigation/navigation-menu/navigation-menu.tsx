import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createMemo,
  createSignal,
  onCleanup,
  splitProps,
  mergeProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../element/icon'
import { PopperTrigger, mergePopperElementProps } from '../../overlay/base/popper'
import {
  focusWithoutScrolling,
  getFocusableElements,
  resolveDirection,
  scrollIntoViewWithin,
} from '../../overlay/base/utils'
import { createStyles } from '../../provider'
import { useLocale } from '../../provider/locale/locale-context'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { createTransitionPresence } from '../../shared/transition-presence'
import { createId } from '../../shared/utils'

import {
  NavigationMenuItemProvider,
  NavigationMenuProvider,
  createNavigationMenuState,
  isMousePointer,
  useNavigationMenuContext,
  useNavigationMenuItemContext,
  useOptionalNavigationMenuItemContext,
} from './navigation-menu-context'
import type { NavigationMenuItemContextValue } from './navigation-menu-context'
import { NavigationMenuPanel } from './navigation-menu-panel'
import {
  NAVIGATION_MENU_FOCUS_GUARD_CLASS,
  navigationMenuDataAttributes,
  navigationMenuRecipe,
} from './navigation-menu.recipe'
import type { NavigationMenuProps, NavigationMenuT } from './navigation-menu.types'

/** Website navigation with a shared, animated content panel. */
export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'value',
    'defaultValue',
    'onValueChange',
    'disabled',
    'orientation',
    'openDelay',
    'closeDelay',
    'placement',
    'align',
    'gutter',
    'shift',
    'overflowPadding',
    'flip',
    'slide',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const presentation = createStyles(navigationMenuRecipe, local)
  const context = createNavigationMenuState(local, () => presentation.variants.orientation)
  const attributes = mergePopperElementProps<HTMLElement>(
    {
      ref: context.setRootElement,
      onPointerEnter: (event) => {
        if (isMousePointer(event)) {
          context.keepOpen()
        }
      },
      onPointerLeave: (event) => {
        if (isMousePointer(event)) {
          context.scheduleClose(event)
        }
      },
    },
    rest,
  )
  return (
    <NavigationMenuProvider value={context}>
      <nav
        {...attributes}
        id={context.id()}
        data-slot="navigation-menu"
        {...navigationMenuDataAttributes.root({
          disabled: () => local.disabled,
          orientation: context.orientation,
        })}
        {...presentation.styles.root}
      >
        {local.children}
        <NavigationMenuPanel />
      </nav>
    </NavigationMenuProvider>
  )
}

function NavigationMenuList(props: NavigationMenuT.ListProps): JSX.Element {
  const context = useNavigationMenuContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'classes', 'styles'])
  const resolved = createStyles(navigationMenuRecipe, local, {
    rootSlot: 'list',
    inheritedStyles: () => context.options,
    inheritedVariants: () => ({ orientation: context.orientation() }),
  })
  return (
    <ul
      {...rest}
      data-slot="navigation-menu-list"
      {...navigationMenuDataAttributes.list({ orientation: context.orientation })}
      {...resolved.styles.list}
    >
      {local.children}
    </ul>
  )
}

function NavigationMenuItem(props: NavigationMenuT.ItemProps): JSX.Element {
  const context = useNavigationMenuContext()
  const [local, rest] = splitProps(props, [
    'value',
    'disabled',
    'children',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const resolved = createStyles(navigationMenuRecipe, local, {
    rootSlot: 'item',
    inheritedStyles: () => context.options,
  })
  const value = createId(() => local.value, 'navigation-menu-item')
  const [trigger, setTrigger] = createSignal<HTMLButtonElement>()
  const [content, setContent] = createSignal<HTMLDivElement>()
  const [contentTrees, setContentTrees] = createSignal<JSX.Element[]>([])
  const [triggerOptions, setTriggerOptions] = createSignal<NavigationMenuT.TriggerProps>()
  const item: NavigationMenuItemContextValue = {
    value,
    disabled: () =>
      Boolean(context.options.disabled || local.disabled || triggerOptions()?.disabled),
    trigger,
    setTrigger,
    content,
    setContent,
    contentTrees,
    registerContent: (tree) => {
      setContentTrees((trees) => [...trees, tree])
      return () =>
        queueMicrotask(() => setContentTrees((trees) => trees.filter((node) => node !== tree)))
    },
    setTriggerOptions,
  }
  context.registerItem(item)
  return (
    <NavigationMenuItemProvider value={item}>
      <li
        {...rest}
        data-slot="navigation-menu-item"
        {...navigationMenuDataAttributes.item({
          disabled: item.disabled,
          expanded: () => context.open() && context.activeItem() === item,
        })}
        {...resolved.styles.item}
      >
        {local.children}
      </li>
    </NavigationMenuItemProvider>
  )
}

function NavigationMenuTrigger(props: NavigationMenuT.TriggerProps): JSX.Element {
  const context = useNavigationMenuContext()
  const direction = useLocale().dir
  const item = useNavigationMenuItemContext()
  item.setTriggerOptions(props)
  onCleanup(() => item.setTriggerOptions(undefined))
  const [local, rest] = splitProps(props, [
    'id',
    'disabled',
    'children',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const resolved = createStyles(navigationMenuRecipe, local, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.options,
    inheritedVariants: () => ({ orientation: context.orientation() }),
  })
  const triggerId = createId(() => local.id, 'navigation-menu-trigger')
  const disabled = item.disabled
  const expanded = () => context.open() && context.activeItem() === item
  const attributes = mergePopperElementProps<HTMLButtonElement>(
    {
      onPointerEnter: (event) => {
        if (isMousePointer(event) && !disabled()) {
          context.scheduleOpen(item.value())
        }
      },
      onPointerLeave: (event) => {
        if (isMousePointer(event)) {
          context.scheduleClose(event)
        }
      },
      onPointerDown: context.cancelTimers,
      onKeyDown: (event) => {
        if (disabled() || event.isComposing) {
          return
        }
        const openKey =
          context.orientation() === 'horizontal'
            ? 'ArrowDown'
            : resolveDirection(event.currentTarget, direction()) === 'rtl'
              ? 'ArrowLeft'
              : 'ArrowRight'
        if (event.key === openKey) {
          event.preventDefault()
          context.openItem(item.value(), true)
        } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault()
          if (expanded()) {
            context.close()
          } else {
            context.openItem(item.value(), true)
          }
        } else {
          context.onListKeyDown(event, event.currentTarget)
        }
      },
    },
    rest,
  )
  return (
    <>
      <PopperTrigger
        {...attributes}
        context={{
          options: context.options,
          slotName: (slot) => `navigation-menu-${slot}`,
          contentId: () => `${context.id()}-${item.value()}-content`,
          isOpen: expanded,
          setOpen: (open) => {
            if (open) {
              context.openItem(item.value())
            } else {
              context.close()
            }
          },
          triggerElement: item.trigger,
          setTriggerElement: (element) => item.setTrigger(element as HTMLButtonElement | undefined),
          contentPresence: { present: expanded },
        }}
        type="button"
        id={triggerId()}
        disabled={disabled()}
        aria-haspopup={false}
        data-moraine-navigation-menu-control=""
        {...resolved.styles.trigger}
      >
        {local.children}
        <Icon
          name="icon-chevron-down"
          data-slot="navigation-menu-trigger-icon"
          {...navigationMenuDataAttributes.triggerIcon({ expanded })}
          {...resolved.styles.triggerIcon}
        />
      </PopperTrigger>
      <Show when={expanded()}>
        <span
          tabIndex={0}
          data-moraine-navigation-menu-focus-guard=""
          aria-hidden="true"
          class={NAVIGATION_MENU_FOCUS_GUARD_CLASS}
          onFocus={context.onFocusGuard}
        />
      </Show>
    </>
  )
}

function NavigationMenuContent(props: NavigationMenuT.ContentProps): JSX.Element {
  const context = useNavigationMenuContext()
  const direction = useLocale().dir
  const item = useNavigationMenuItemContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'classes', 'styles'])
  const resolved = createStyles(navigationMenuRecipe, local, {
    rootSlot: 'content',
    variablesSlot: 'content',
    inheritedVariants: () => ({ orientation: context.orientation() }),
    inheritedStyles: () => context.options,
  })
  const expanded = createMemo(() => context.open() && context.activeItem() === item)
  // Item switches animate content; closing animates the shared panel with its content intact.
  const displayed = createMemo(() => context.displayedItem() === item)
  const switchPresence = createTransitionPresence({ open: displayed })

  const links = () => {
    const content = item.content()
    return content
      ? getFocusableElements(content).filter(
          (element) => element.getAttribute('data-slot') === 'navigation-menu-link',
        )
      : []
  }
  const navigation = createSelectableCollectionNavigation<HTMLElement, HTMLElement>({
    items: links,
    getValue: (element) => element,
    activationMode: () => 'manual',
    getDirection: () => resolveDirection(item.content(), direction()),
    focusValue: (element) => {
      focusWithoutScrolling(element)
      const content = item.content()
      if (content) {
        scrollIntoViewWithin(element, content)
      }
    },
    onSelect: () => {},
  })

  function onKeyDown(event: KeyboardEvent): void {
    const content = item.content()
    if (!content || event.isComposing) {
      return
    }
    const current = content.ownerDocument.activeElement
    if (event.key === 'Tab') {
      const candidates = getFocusableElements(content)
      const index = candidates.indexOf(current as HTMLElement)
      if (event.shiftKey && index <= 0) {
        event.preventDefault()
        focusWithoutScrolling(item.trigger())
      } else if (
        !event.shiftKey &&
        index === candidates.length - 1 &&
        context.focusAfterTrigger()
      ) {
        event.preventDefault()
      }
      return
    }
    if (
      (event.target as Element).closest(
        'input,textarea,select,[contenteditable]:not([contenteditable="false"])',
      )
    ) {
      return
    }
    const link = links().find((element) => element === current)
    if (
      link &&
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
    ) {
      navigation.onNavigationKeyDown(
        event,
        link,
        event.key === 'ArrowUp' || event.key === 'ArrowDown' ? 'vertical' : 'horizontal',
      )
    }
  }

  // Keep the lazy tree in the item's owner while the shared panel consumes it.
  const contentTree = (
    <Show
      when={context.panelElement() && switchPresence.present() && (context.open() || displayed())}
    >
      {(_present) => {
        const attributes = mergePopperElementProps<HTMLDivElement>(
          {
            ref: (element) => {
              item.setContent(element)
              onCleanup(switchPresence.registerElement(element))
              onCleanup(() => {
                item.setContent(undefined)
              })
            },
            onKeyDown,
          },
          rest,
        )
        return (
          <div
            {...attributes}
            id={`${context.id()}-${item.value()}-content`}
            role={rest.role ?? 'region'}
            aria-labelledby={item.trigger()?.id}
            aria-hidden={!expanded() ? true : undefined}
            inert={!expanded() ? true : undefined}
            tabIndex={-1}
            data-slot="navigation-menu-content"
            {...navigationMenuDataAttributes.content({
              expanded: displayed,
              closed: () => !displayed(),
              orientation: context.orientation,
            })}
            {...resolved.styles.content}
          >
            {local.children}
          </div>
        )
      }}
    </Show>
  )
  onCleanup(item.registerContent(contentTree))
  return null
}

function NavigationMenuLink(props: NavigationMenuT.LinkProps): JSX.Element {
  const context = useNavigationMenuContext()
  const item = useOptionalNavigationMenuItemContext()
  const [local, rest] = splitProps(props, [
    'id',
    'active',
    'disabled',
    'closeOnClick',
    'linkRender',
    'children',
    'href',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const resolved = createStyles(navigationMenuRecipe, local, {
    rootSlot: 'link',
    inheritedStyles: () => context.options,
  })
  const body = resolveChildren(() => local.children)
  const disabled = () => Boolean(context.options.disabled || item?.disabled() || local.disabled)
  const attributes = mergeProps(
    mergePopperElementProps<HTMLAnchorElement>(
      {
        onClick: (event) => {
          if (disabled()) {
            event.preventDefault()
          } else if (local.closeOnClick) {
            context.close()
          }
        },
        onKeyDown: (event) => {
          if (context.rootElement()?.contains(event.currentTarget)) {
            context.onListKeyDown(event, event.currentTarget)
          }
        },
      },
      rest,
    ),
    {
      get href() {
        return disabled() ? undefined : local.href
      },
      get tabIndex() {
        return disabled() ? -1 : rest.tabIndex
      },
    },
  )
  return (
    <Dynamic
      component={local.linkRender ?? 'a'}
      {...attributes}
      id={local.id}
      role={disabled() ? 'link' : rest.role}
      aria-disabled={disabled() ? true : undefined}
      aria-current={local.active ? 'page' : rest['aria-current']}
      data-slot="navigation-menu-link"
      data-moraine-navigation-menu-control=""
      {...navigationMenuDataAttributes.link({ active: () => local.active, disabled })}
      {...resolved.styles.link}
    >
      {body()}
    </Dynamic>
  )
}

NavigationMenu.List = NavigationMenuList
NavigationMenu.Item = NavigationMenuItem
NavigationMenu.Trigger = NavigationMenuTrigger
NavigationMenu.Content = NavigationMenuContent
NavigationMenu.Link = NavigationMenuLink
