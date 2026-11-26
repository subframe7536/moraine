import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { Show, createMemo, createRenderEffect, createSignal, onCleanup, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale } from '../../provider/locale/locale-context'
import type { KeyBindingOptions } from '../../shared/keyboard'
import { createKeyDownHandler } from '../../shared/keyboard'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { createTransitionPresence } from '../../shared/transition-presence'
import { publishElement } from '../../shared/utils'
import { resolveDirection } from '../shared/overlay/direction'
import { focusWithoutScrolling, getFocusableElements } from '../shared/overlay/focus'
import { mergePopperElementProps } from '../shared/overlay/popper'
import { scrollIntoViewWithin } from '../shared/overlay/scroll-into-view'

import { useNavigationMenuContext, useNavigationMenuItemContext } from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'
/**
 * Panel of links that opens when the sibling `NavigationMenu.Trigger` of the same
 * `NavigationMenu.Item` is active. It must be placed inside `NavigationMenu.Item`; its content is
 * shown in the menu's shared, animated panel. Renders a `div` with `role="region"`, and arrow
 * keys move focus between its `NavigationMenu.Link` children.
 *
 * @example
 * ```tsx
 * import { NavigationMenu } from 'moraine'
 *
 * <NavigationMenu aria-label="Main navigation">
 *   <NavigationMenu.List>
 *     <NavigationMenu.Item value="products">
 *       <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
 *       <NavigationMenu.Content>
 *         <NavigationMenu.Link href="/overview" closeOnSelect>
 *           Overview
 *         </NavigationMenu.Link>
 *         <NavigationMenu.Link href="/pricing" closeOnSelect>
 *           Pricing
 *         </NavigationMenu.Link>
 *       </NavigationMenu.Content>
 *     </NavigationMenu.Item>
 *   </NavigationMenu.List>
 * </NavigationMenu>
 * ```
 */
export function NavigationMenuContent(props: NavigationMenuT.ContentProps): JSX.Element {
  const context = useNavigationMenuContext()
  const direction = useLocale().dir
  const item = useNavigationMenuItemContext()
  if (!item) {
    throw new Error('NavigationMenu.Content must be used within NavigationMenu.Item')
  }
  const rest = omit(props, 'class', 'style')
  const {
    slots: { content: contentSlot },
  } = useRecipe(navigationMenuRecipe, props, {
    slot: 'content',
    varsSlot: 'content',
    data: {
      content: navigationMenuDataAttributes.content(() => ({
        expanded: displayed,
        closed: () => !displayed(),
        orientation: context.orientation,
      })),
    },
    context: () => ({
      variants: { orientation: context.orientation() },
      classes: context.options.classes,
      styles: context.options.styles,
    }),
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

  const currentLink = (): HTMLElement | undefined => {
    const current = item.content()?.ownerDocument.activeElement
    return links().find((element) => element === current)
  }

  const navigateLink = (orientation: 'horizontal' | 'vertical'): KeyBindingOptions => ({
    preventDefault: false,
    when: (event) =>
      !event.target.closest(
        'input,textarea,select,[contenteditable]:not([contenteditable="false"])',
      ) && currentLink() !== undefined,
    handle: (event) => {
      const link = currentLink()
      if (link) {
        navigation.onNavigationKeyDown(event, link, orientation)
      }
    },
  })

  const onKeyDown = createKeyDownHandler<HTMLDivElement>({
    disabled: () => !item.content(),
    keys: {
      Tab: {
        preventDefault: false,
        handle: (event) => {
          const content = item.content()
          if (!content) {
            return
          }
          const current = content.ownerDocument.activeElement
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
        },
      },
      ArrowUp: navigateLink('vertical'),
      ArrowDown: navigateLink('vertical'),
      ArrowLeft: navigateLink('horizontal'),
      ArrowRight: navigateLink('horizontal'),
      Home: navigateLink('horizontal'),
      End: navigateLink('horizontal'),
    },
  })

  // Keep the lazy tree in the item's owner while the shared panel consumes it.
  const contentTree = (
    <Show
      when={context.panelElement() && switchPresence.present() && (context.open() || displayed())}
    >
      {(_present) => {
        const [element, setElement] = createSignal<HTMLDivElement>()
        createRenderEffect(element, (current) => {
          if (!current) {
            return
          }
          const unpublish = publishElement(item.content, item.setContent)(current)
          const release = switchPresence.registerElement(current)
          return () => {
            release()
            unpublish()
          }
        })
        const attributes = mergePopperElementProps<HTMLDivElement>(
          {
            ref: setElement,
            onKeyDown,
          },
          rest,
        )
        return (
          <div
            data-slot="navigation-menu-content"
            {...contentSlot}
            {...attributes}
            id={`${context.id()}-${item.value()}-content`}
            role={rest.role ?? 'region'}
            aria-labelledby={item.trigger()?.id}
            aria-hidden={!expanded() ? 'true' : undefined}
            {...{ 'prop:inert': !expanded() ? true : undefined }}
            tabindex={-1}
          />
        )
      }}
    </Show>
  )
  onCleanup(item.registerContent(contentTree))
  // Pin the region: while the shared panel's render prop re-renders, the For's
  // insert is briefly the only subscriber — without a stable read Solid 2
  // disposes the Show's lazy memo and freezes the retained tree's reactivity.
  createRenderEffect(
    () => (contentTree as unknown as Accessor<unknown>)(),
    () => {},
  )
  return null
}
