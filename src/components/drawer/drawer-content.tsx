import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { bindElement } from '../../shared/element-binding'
import { createEventListener } from '../../shared/event-listener'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { isAndroidUserAgent } from '../../shared/utils'
import { Icon } from '../icon'
import { Modal } from '../modal/modal'
import { createModalContentBinding } from '../modal/modal-content-binding'
import { useModalContext } from '../modal/modal-context'
import { ModalPortal } from '../modal/modal-portal'
import { createKeyboardInset } from '../shared/overlay/keyboard-inset'
import { createShorthandContent } from '../shared/overlay/shorthand-content'

import {
  createDrawerContentRegistration,
  DrawerContentProvider,
  useDrawerContext,
} from './drawer-context'
import { DrawerDescription } from './drawer-description'
import { DrawerShorthandHeader } from './drawer-header'
import { createDrawerSwipe } from './drawer-swipe'
import { DrawerTitle } from './drawer-title'
import { defaultDrawerMessages } from './drawer.messages'
import { DRAWER_MOTION, drawerDataAttributes, drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'

export function DrawerContent<T extends ValidComponent = 'div'>(
  props: DrawerT.ContentProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as DrawerT.ContentProps<T> & { ref?: unknown }, [
    'as',
    'ref',
    'title',
    'description',
    'children',
    'class',
    'style',
  ])
  const drawer = useDrawerContext()
  const messages = useMessages('drawer', defaultDrawerMessages, () => drawer.translations)
  const direction = useLocale().dir
  const family = useModalContext()
  const merged = mergeProps(
    { overlay: true, closable: false, closeIcon: 'icon-close' as const, handle: true },
    drawer,
  )
  const isOverlay = () => merged.overlay !== false
  const keyboardInset = createKeyboardInset(family.open, family.contentElement)
  const {
    slots: {
      content: contentSlot,
      contentClose: contentCloseSlot,
      overlay: overlaySlot,
      handle: handleSlot,
    },
    variants,
  } = useRecipe(drawerRecipe, local, {
    slot: 'content',
    data: {
      content: drawerDataAttributes.content({
        closed: () => !family.open(),
        expanded: family.open,
        swiping: () => swipe.swiping(),
        nestedOpen: () => drawer.nested.openCount() > 0,
        nestedSwiping: drawer.nested.swiping,
        handle: () => hasHandle(),
      }),
      overlay: drawerDataAttributes.overlay({
        closed: () => !family.open(),
        expanded: family.open,
        swiping: () => swipe.swiping(),
      }),
    },
    context: () => ({ variants: { side: drawer.side }, ...drawer.slotOverrides }),
    own: {
      content: () => ({
        style: {
          '--drawer-swipe-movement': `${swipe.movement()}px`,
          '--drawer-snap-point-offset': swipe.snapPointOffsetCss(),
          '--drawer-keyboard-inset': `${keyboardInset()}px`,
          '--nested-drawers': `${drawer.nested.activeCount()}`,
          '--drawer-nested-progress': `${drawer.nested.progress()}`,
          '--drawer-frontmost-height': `${drawer.nested.frontmostHeight()}px`,
        },
      }),
      overlay: () => {
        const progress = swipe.progress()
        return {
          style: {
            ...DRAWER_MOTION,
            opacity: progress > 0 ? 1 - progress : undefined,
          },
        }
      },
    },
  })
  const vertical = (): boolean => variants.side === 'bottom' || variants.side === 'top'
  const hasHandle = () => merged.handle !== false && vertical()
  const swipe = createDrawerSwipe(drawer, family, () => variants.side)
  const registration = createDrawerContentRegistration()

  const ariaLabel = () => (rest as { 'aria-label'?: string })['aria-label']
  const ariaLabelledBy = () =>
    ariaLabel() === undefined ? registration.titleIds().join(' ') || undefined : undefined
  const ariaDescribedBy = () => registration.descriptionIds().join(' ') || undefined

  function RenderDrawerOverlay(): JSX.Element {
    const [overlay, setOverlay] = createSignal<HTMLDivElement>()
    // The backdrop must be a sibling: its swipe opacity would fade the content too.
    bindElement(() => isOverlay() && overlay(), family.presence.registerElement)
    return <div data-slot="drawer-overlay" {...overlaySlot} ref={setOverlay} />
  }

  function RenderDrawerContent(): JSX.Element {
    // The portal branch owns the content binding, so it releases when the content unmounts.
    const binding = createModalContentBinding(family, {
      ref: () => local.ref,
      onKeyDown: () =>
        rest.onKeyDown as JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined,
    })
    // The gesture binds in this owner and releases with the content.
    bindElement(family.contentElement, (element) => swipe.attach(element))

    // While mounted (open or exiting) this drawer reports its state to the
    // ambient parent drawer so ancestors recede into the stack visual. The
    // mounted count keeps ancestors marked stacked for the whole exit; the
    // open reports drop as soon as this drawer starts closing so ancestors
    // settle toward the next frontmost popup concurrently with the exit.
    const parent = drawer.nested.parent
    if (parent) {
      createEffect(
        on(
          [
            drawer.nested.openCount,
            drawer.nested.activeCount,
            drawer.nested.frontmostHeight,
            family.open,
            swipe.swiping,
            swipe.progress,
          ],
          ([openCount, activeCount, frontmostHeight, isOpen, swiping, progress]) => {
            parent.report({
              open: openCount + 1,
              active: isOpen ? activeCount + 1 : 0,
              frontmostHeight: isOpen ? frontmostHeight : 0,
            })
            parent.reportSwipe(isOpen && swiping, isOpen ? progress : 0)
          },
        ),
      )
      onCleanup(() => {
        parent.report({ open: 0, active: 0, frontmostHeight: 0 })
        parent.reportSwipe(false, 0)
      })
    }

    // Android back gesture: CloseWatcher mirrors native <dialog> dismissal. Each open
    // drawer owns a watcher, so the browser's stack hands the gesture to the topmost one.
    createEffect(
      on([family.open, family.contentElement], ([isOpen, element]) => {
        const ownerWindow = element?.ownerDocument.defaultView
        const CloseWatcherCtor = (
          ownerWindow as
            | (Window & { CloseWatcher?: new () => EventTarget & { destroy: () => void } })
            | null
        )?.CloseWatcher
        if (!isOpen || !element || !isAndroidUserAgent() || !CloseWatcherCtor) {
          return
        }

        const watcher = new CloseWatcherCtor()
        createEventListener(watcher, 'cancel', (event) => {
          if (drawer.closeOnEscape === false && event.cancelable) {
            // Keeps the watcher active for the next close request.
            event.preventDefault()
            drawer.onClosePrevent?.()
            return
          }
          // A non-cancelable request closes regardless (one prevented request per
          // user activation), like a native <dialog>.
          family.updateOpen(false)
        })
        onCleanup(() => watcher.destroy())
      }),
    )
    const contentShorthand = createShorthandContent(local)
    const child = resolveChildren(() => local.children)
    const explicitChildren = createMemo(() =>
      renderWithProps(child(), {
        close: () => family.updateOpen(false),
      }),
    )
    const closeIcon = createLazyMemo(() => merged.closeIcon)
    const tag = (): ValidComponent => local.as ?? 'div'

    return (
      <Dynamic
        component={tag()}
        data-slot="drawer-content"
        role="dialog"
        dir={direction()}
        id={family.contentId()}
        tabIndex={binding.tabIndex}
        aria-modal={binding.ariaModal()}
        aria-labelledby={ariaLabelledBy()}
        aria-describedby={ariaDescribedBy()}
        {...contentSlot}
        {...rest}
        ref={binding.ref}
        onKeyDown={binding.onKeyDown}
      >
        <Show when={hasHandle()}>
          <div data-slot="drawer-handle" aria-hidden="true" {...handleSlot} />
        </Show>
        <Show when={!registration.hasExplicitHeader() && contentShorthand.hasContent()}>
          <DrawerShorthandHeader>
            <Show when={hasContent(contentShorthand.title())}>
              <DrawerTitle>{contentShorthand.title()}</DrawerTitle>
            </Show>
            <Show when={hasContent(contentShorthand.description())}>
              <DrawerDescription>{contentShorthand.description()}</DrawerDescription>
            </Show>
          </DrawerShorthandHeader>
        </Show>
        <Show when={merged.closable}>
          <Modal.Close
            data-slot="drawer-content-close"
            aria-label={messages().close}
            {...contentCloseSlot}
          >
            <Icon name={closeIcon()} />
          </Modal.Close>
        </Show>
        {explicitChildren()}
      </Dynamic>
    )
  }

  return (
    <DrawerContentProvider
      value={{
        ...registration,
        get variants() {
          return variants
        },
      }}
    >
      <ModalPortal>
        <Show when={isOverlay()}>
          <RenderDrawerOverlay />
        </Show>
        <RenderDrawerContent />
      </ModalPortal>
    </DrawerContentProvider>
  )
}
