import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  merge,
  onCleanup,
  omit,
  createRenderEffect,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { attachEventListenerMap } from '../../shared/event-listener'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { isAndroidUserAgent, pick } from '../../shared/utils'
import { BaseDialog } from '../base-dialog/base-dialog'
import { createBaseDialogContentBinding } from '../base-dialog/base-dialog-content-binding'
import { useBaseDialogContext } from '../base-dialog/base-dialog-context'
import { BaseDialogPortal } from '../base-dialog/base-dialog-portal'
import { Icon } from '../icon'
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
/**
 * Portaled surface of the surrounding `Drawer`, rendered with `role="dialog"` together with its
 * overlay and, for `top` and `bottom` sides, a grab handle. Pass `title` and `description` for the
 * default header, or compose `Drawer.Header`, `Drawer.Body`, and `Drawer.Footer` yourself; children
 * may also be a function receiving `close`. It handles the swipe gesture and renders a `div` by
 * default; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, Drawer } from 'moraine'
 *
 * <Drawer>
 *   <Drawer.Trigger as={Button}>Open</Drawer.Trigger>
 *   <Drawer.Content title="Settings" description="Update your account.">
 *     <Drawer.Body>Preferences</Drawer.Body>
 *   </Drawer.Content>
 * </Drawer>
 * ```
 */
export function DrawerContent<T extends ValidComponent = 'div'>(
  props: DrawerT.ContentProps<T>,
): JSX.Element {
  const local = pick(
    props as DrawerT.ContentProps<T> & { ref?: unknown; dir?: unknown },
    'as',
    'ref',
    'title',
    'description',
    'children',
    'class',
    'style',
    'dir',
  )
  const rest = omit(
    props as DrawerT.ContentProps<T> & { ref?: unknown; dir?: unknown },
    'as',
    'ref',
    'title',
    'description',
    'children',
    'class',
    'style',
    'dir',
  )
  const drawer = useDrawerContext()
  const messages = useMessages('drawer', defaultDrawerMessages, () => drawer.translations)
  const direction = useLocale().dir
  const family = useBaseDialogContext()
  const merged = merge(
    { overlay: true, closable: true, closeIcon: 'icon-close' as const, handle: true },
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
        transition: family.transition,
      }),
      overlay: drawerDataAttributes.overlay({
        closed: () => !family.open(),
        expanded: family.open,
        swiping: () => swipe.swiping(),
        transition: family.transition,
      }),
    },
    context: () => ({ variants: { side: drawer.side }, ...drawer.slotOverrides }),
    own: {
      content: () => ({
        style: {
          '--drawer-swipe-movement': `${swipe.movement()}px`,
          '--drawer-snap-point-offset': swipe.snapPointOffsetCss(),
          '--drawer-keyboard-inset': `${keyboardInset()}px`,
          '--drawer-nested-num': `${drawer.nested.activeCount()}`,
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
    createRenderEffect(
      () => (isOverlay() ? overlay() : undefined),
      (node) => {
        if (!node) {
          return
        }
        return family.presence.registerElement(node)
      },
    )
    return <div data-slot="drawer-overlay" {...overlaySlot} ref={setOverlay} />
  }

  function RenderDrawerContent(): JSX.Element {
    // The portal branch owns the content binding, so it releases when the content unmounts.
    const binding = createBaseDialogContentBinding(family, {
      ref: () => local.ref as ((element: HTMLDivElement) => void) | HTMLDivElement | undefined,
      onKeyDown: () =>
        rest.onKeyDown as JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined,
    })
    // The gesture binds in this owner and releases with the content.
    createRenderEffect(family.contentElement, (element) => {
      if (!element) {
        return
      }
      return swipe.attach(element)
    })

    // While mounted (open or exiting) this drawer reports its state to the
    // ambient parent drawer so ancestors recede into the stack visual. The
    // mounted count keeps ancestors marked stacked for the whole exit; the
    // open reports drop as soon as this drawer starts closing so ancestors
    // settle toward the next frontmost popup concurrently with the exit.
    const parent = drawer.nested.parent
    if (parent) {
      createEffect(
        () => [
          drawer.nested.openCount(),
          drawer.nested.activeCount(),
          drawer.nested.frontmostHeight(),
          family.open(),
        ],
        ([openCount, activeCount, frontmostHeight, isOpen]) => {
          parent.report(
            {
              open: openCount + 1,
              active: isOpen ? activeCount + 1 : 0,
              frontmostHeight: isOpen ? frontmostHeight : 0,
            },
            drawer.nested,
          )
        },
      )
      createEffect(
        () => [family.open(), swipe.swiping(), swipe.progress()],
        ([isOpen, swiping, progress]) => {
          parent.reportSwipe(isOpen && swiping, isOpen ? progress : 0)
        },
      )
      onCleanup(() => {
        parent.release(drawer.nested)
        parent.reportSwipe(false, 0)
      })
    }

    // Android back gesture: CloseWatcher mirrors native <dialog> dismissal. Each open
    // drawer owns a watcher, so the browser's stack hands the gesture to the topmost one.
    createEffect(
      () => [family.open(), family.contentElement()],
      ([isOpen, element]) => {
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
        const detach = attachEventListenerMap(watcher, {
          cancel: (event) => {
            if (drawer.closeOnEscape === false && event.cancelable) {
              // Keeps the watcher active for the next close request.
              event.preventDefault()
              drawer.onClosePrevented?.()
            }
          },
          close: () => {
            family.updateOpen(false)
          },
        })
        return () => {
          detach()
          watcher.destroy()
        }
      },
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
    const Root = dynamic(tag)

    return (
      <Root
        data-slot="drawer-content"
        role="dialog"
        dir={local.dir ?? direction()}
        id={family.contentId()}
        tabindex={binding.tabIndex}
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
          <BaseDialog.Close
            data-slot="drawer-content-close"
            aria-label={messages().close}
            {...contentCloseSlot}
          >
            <Icon name={closeIcon()} />
          </BaseDialog.Close>
        </Show>
        {explicitChildren()}
      </Root>
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
      <BaseDialogPortal>
        <Show when={isOverlay()}>
          <RenderDrawerOverlay />
        </Show>
        <RenderDrawerContent />
      </BaseDialogPortal>
    </DrawerContentProvider>
  )
}
