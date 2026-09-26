import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createUniqueId,
  mergeProps,
  on,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasJsxContent } from '../../shared/jsx-content'
import { applyDataAttributes } from '../../shared/style-contract.ts'
import type { ValidComponent } from '../../shared/types.ts'
import { callRef } from '../../shared/utils'
import { Modal, ModalRoot } from '../modal/modal'
import { ModalSurface } from '../modal/modal-content'
import { useModalContext } from '../modal/modal-context'
import { ModalPortal } from '../modal/modal-portal'

import {
  DialogConfigProvider,
  DialogContentProvider,
  createDialogContentRegistration,
  useDialogConfig,
  useDialogContent,
} from './dialog-context'
import { dialogDataAttributes, dialogRecipe } from './dialog.recipe'
import type { DialogProps, DialogT } from './dialog.types'

/** Dialog state and presentation, sharing the Modal root context. */
export function Dialog(props: DialogProps): JSX.Element {
  return (
    <DialogConfigProvider value={props}>
      <ModalRoot {...props} slotOwner="dialog" />
    </DialogConfigProvider>
  )
}

function DialogTrigger<T extends ValidComponent = 'button'>(
  props: DialogT.TriggerProps<T>,
): JSX.Element {
  const family = useModalContext()
  const resolved = createStyles(dialogRecipe, props, {
    rootSlot: 'trigger',
    inheritedStyles: () => family.presentation,
  })
  return <Modal.Trigger {...props} {...resolved.styles.trigger} />
}

function DialogClose<T extends ValidComponent = 'button'>(
  props: DialogT.CloseProps<T>,
): JSX.Element {
  return <Modal.Close {...props} data-slot="dialog-close" />
}

function DialogContent(props: DialogT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'title',
    'description',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const config = useDialogConfig()
  const family = useModalContext()
  const merged = mergeProps(
    { overlay: true, close: true, closeIcon: 'icon-close' as const },
    config,
  )
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'content',
    inheritedVariants: () => ({ fullscreen: config.fullscreen, scrollable: config.scrollable }),
    inheritedStyles: () => family.presentation,
  })
  const registration = createDialogContentRegistration()
  const overlayScroll = () =>
    resolved.variants.scrollable && merged.overlay && !resolved.variants.fullscreen
  const hasShorthand = () => hasJsxContent(local.title) || hasJsxContent(local.description)
  const hasHeader = () => registration.hasExplicitHeader() || hasShorthand()

  return (
    <DialogContentProvider
      value={{
        ...registration,
        get variants() {
          return resolved.variants
        },
        overlayScroll,
        hasHeader,
      }}
    >
      <ModalPortal>
        <ModalSurface
          {...rest}
          trapFocus={config.trapFocus}
          overlayScroll={overlayScroll()}
          overlay={merged.overlay}
          overlayClass={resolved.styles.overlay.class}
          overlayStyle={resolved.styles.overlay.style}
          {...resolved.styles.content}
          surfaceRender={() => {
            const explicitChildren = createLazyMemo(() => untrack(() => local.children))
            const title = createLazyMemo(() => local.title)
            const description = createLazyMemo(() => local.description)
            const closeIcon = createLazyMemo(() => merged.closeIcon)
            return {
              ariaLabel: merged.ariaLabel,
              get ariaLabelledBy() {
                return registration.titleIds().join(' ') || undefined
              },
              get ariaDescribedBy() {
                return registration.descriptionIds().join(' ') || undefined
              },
              children: () => {
                const content = explicitChildren()
                return (
                  <>
                    <Show when={!registration.hasExplicitHeader() && hasShorthand()}>
                      <DialogHeader shorthand>
                        <Show when={hasJsxContent(title())}>
                          <DialogTitle>{title()}</DialogTitle>
                        </Show>
                        <Show when={hasJsxContent(description())}>
                          <DialogDescription>{description()}</DialogDescription>
                        </Show>
                      </DialogHeader>
                    </Show>
                    <Show when={merged.close}>
                      <Modal.Close
                        data-slot="dialog-content-close"
                        aria-label="Close"
                        {...resolved.styles.contentClose}
                      >
                        <Icon name={closeIcon()} />
                      </Modal.Close>
                    </Show>
                    {content}
                  </>
                )
              },
            }
          }}
        />
      </ModalPortal>
    </DialogContentProvider>
  )
}

function DialogHeader<T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T> & { shorthand?: boolean },
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'shorthand'])
  const family = useModalContext()
  const content = useDialogContent()
  // oxlint-disable-next-line subf/solid-reactivity -- Internal shorthand mode is fixed for this Header instance.
  if (!local.shorthand) {
    const unregister = content.registerHeader()
    onCleanup(unregister)
  }
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'header',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="dialog-header"
      {...rest}
      {...resolved.styles.header}
    >
      {local.children}
    </Dynamic>
  )
}

function DialogTitle<T extends ValidComponent = 'h2'>(props: DialogT.TitleProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'id'])
  const family = useModalContext()
  const content = useDialogContent()
  const fallbackId = createUniqueId()
  const id = () => local.id ?? fallbackId
  // oxlint-disable-next-line subf/solid-reactivity -- Register the initial ID synchronously; the effect handles later changes.
  let unregister = content.registerTitle(id())
  createEffect(
    on(id, (next) => {
      unregister()
      unregister = content.registerTitle(next)
    }),
  )
  onCleanup(() => unregister())
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'title',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'h2'}
      data-slot="dialog-title"
      {...rest}
      id={id()}
      {...resolved.styles.title}
    >
      {local.children}
    </Dynamic>
  )
}

function DialogDescription<T extends ValidComponent = 'p'>(
  props: DialogT.DescriptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'id'])
  const family = useModalContext()
  const content = useDialogContent()
  const fallbackId = createUniqueId()
  const id = () => local.id ?? fallbackId
  // oxlint-disable-next-line subf/solid-reactivity -- Register the initial ID synchronously; the effect handles later changes.
  let unregister = content.registerDescription(id())
  createEffect(
    on(id, (next) => {
      unregister()
      unregister = content.registerDescription(next)
    }),
  )
  onCleanup(() => unregister())
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'description',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'p'}
      data-slot="dialog-description"
      {...rest}
      id={id()}
      {...resolved.styles.description}
    >
      {local.children}
    </Dynamic>
  )
}

function DialogAction<T extends ValidComponent = 'div'>(
  props: DialogT.ActionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useModalContext()
  const content = useDialogContent()
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'action',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="dialog-action"
      {...rest}
      {...resolved.styles.action}
    >
      {local.children}
    </Dynamic>
  )
}

function DialogBody<T extends ValidComponent = 'div'>(props: DialogT.BodyProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useModalContext()
  const content = useDialogContent()
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'body',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  let element: HTMLElement | undefined
  const bodyAttrs = dialogDataAttributes.body({
    header: content.hasHeader,
    footer: content.hasFooter,
    scroll: () => !content.overlayScroll(),
  })
  createEffect(
    on([content.hasHeader, content.hasFooter, content.overlayScroll], () => {
      if (element) {
        applyDataAttributes(element, bodyAttrs)
      }
    }),
  )
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="dialog-body"
      {...rest}
      ref={(node: HTMLElement) => {
        element = node
        callRef((props as { ref?: unknown }).ref, node)
      }}
      {...bodyAttrs}
      {...resolved.styles.body}
    >
      {local.children}
    </Dynamic>
  )
}

function DialogFooter<T extends ValidComponent = 'div'>(
  props: DialogT.FooterProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useModalContext()
  const content = useDialogContent()
  const unregister = content.registerFooter()
  onCleanup(unregister)
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'footer',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="dialog-footer"
      {...rest}
      {...resolved.styles.footer}
    >
      {local.children}
    </Dynamic>
  )
}

Dialog.Trigger = DialogTrigger
Dialog.Content = DialogContent
Dialog.Header = DialogHeader
Dialog.Title = DialogTitle
Dialog.Description = DialogDescription
Dialog.Action = DialogAction
Dialog.Body = DialogBody
Dialog.Footer = DialogFooter
Dialog.Close = DialogClose
