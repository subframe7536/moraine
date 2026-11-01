import type { JSX } from 'solid-js'
import { Show, createMemo, createSignal, onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale } from '../../provider/locale/locale-context'
import { bindElement, publishElement } from '../../shared/element-binding'
import type { KeyBindingOptions } from '../../shared/keyboard'
import { createKeyDownHandler } from '../../shared/keyboard'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { createTransitionPresence } from '../../shared/transition-presence'
import { mergePopperElementProps } from '../shared/overlay/popper'
import {
  focusWithoutScrolling,
  getFocusableElements,
  resolveDirection,
  scrollIntoViewWithin,
} from '../shared/overlay/utils'

import { useNavigationMenuContext, useNavigationMenuItemContext } from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'

export function NavigationMenuContent(props: NavigationMenuT.ContentProps): JSX.Element {
  const context = useNavigationMenuContext()
  const direction = useLocale().dir
  const item = useNavigationMenuItemContext()
  if (!item) {
    throw new Error('NavigationMenu.Content must be used within NavigationMenu.Item')
  }
  const [local, rest] = splitProps(props, ['class', 'style'])
  const {
    slots: { content: contentSlot },
  } = useRecipe(navigationMenuRecipe, local, {
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
        bindElement(element, (current) => {
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
            aria-hidden={!expanded() ? true : undefined}
            inert={!expanded() ? true : undefined}
            tabIndex={-1}
          />
        )
      }}
    </Show>
  )
  onCleanup(item.registerContent(contentTree))
  return null
}
