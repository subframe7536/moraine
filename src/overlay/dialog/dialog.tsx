import type { JSX } from 'solid-js'
import { Show, mergeProps, onCleanup, splitProps, untrack } from 'solid-js'

import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasJsxContent } from '../../shared/jsx-content'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../base/content-anatomy'
import { ModalAnatomyPart } from '../base/modal-anatomy'
import { createShorthandContent } from '../base/shorthand-content'
import { Modal, ModalInternal } from '../modal/modal'
import { ModalSurface } from '../modal/modal-content'
import { useModalContext } from '../modal/modal-context'
import { ModalPortal } from '../modal/modal-portal'

import {
  DialogContentProvider,
  createDialogContentRegistration,
  useDialogConfig,
  useDialogContent,
} from './dialog-context'
import { dialogDataAttributes, dialogRecipe } from './dialog.recipe'
import type { DialogProps, DialogT } from './dialog.types'

/** Dialog state and presentation, sharing the Modal root context. */
export function Dialog(props: DialogProps): JSX.Element {
  return <ModalInternal kind="dialog" {...props} />
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
  const messages = useMessages()
  const direction = useLocale().dir
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

  return (
    <DialogContentProvider
      value={{
        ...registration,
        get variants() {
          return resolved.variants
        },
        overlayScroll,
      }}
    >
      <ModalPortal>
        <ModalSurface
          {...rest}
          dir={rest.dir ?? direction()}
          composite
          overlayScroll={overlayScroll()}
          overlay={merged.overlay}
          overlayClass={resolved.styles.overlay.class}
          overlayStyle={resolved.styles.overlay.style}
          {...resolved.styles.content}
          ariaLabel={merged.ariaLabel}
          ariaLabelledBy={
            (rest['aria-label'] ?? merged.ariaLabel) === undefined
              ? registration.titleIds().join(' ') || undefined
              : undefined
          }
          ariaDescribedBy={registration.descriptionIds().join(' ') || undefined}
        >
          {() => {
            const contentShorthand = createShorthandContent(local)
            const explicitChildren = createLazyMemo(() => untrack(() => local.children))
            const closeIcon = createLazyMemo(() => merged.closeIcon)
            const content = explicitChildren()
            return (
              <>
                <Show when={!registration.hasExplicitHeader() && contentShorthand.hasContent()}>
                  <DialogShorthandHeader>
                    <Show when={hasJsxContent(contentShorthand.title())}>
                      <DialogTitle>{contentShorthand.title()}</DialogTitle>
                    </Show>
                    <Show when={hasJsxContent(contentShorthand.description())}>
                      <DialogDescription>{contentShorthand.description()}</DialogDescription>
                    </Show>
                  </DialogShorthandHeader>
                </Show>
                <Show when={merged.close}>
                  <Modal.Close
                    data-slot="dialog-content-close"
                    aria-label={messages().dialog.close}
                    {...resolved.styles.contentClose}
                  >
                    <Icon name={closeIcon()} />
                  </Modal.Close>
                </Show>
                {content}
              </>
            )
          }}
        </ModalSurface>
      </ModalPortal>
    </DialogContentProvider>
  )
}

function DialogHeader<T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
): JSX.Element {
  return <DialogHeaderRoot {...props} headerKind="explicit" />
}

function DialogShorthandHeader<T extends ValidComponent = 'div'>(
  props: DialogT.HeaderProps<T>,
): JSX.Element {
  return <DialogHeaderRoot {...props} headerKind="shorthand" />
}

function DialogHeaderRoot<T extends ValidComponent>(
  props: DialogT.HeaderProps<T> & { headerKind: 'explicit' | 'shorthand' },
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'headerKind'])
  const family = useModalContext()
  const content = useDialogContent()
  const unregister = content.registerHeader(untrack(() => local.headerKind))
  onCleanup(unregister)
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'header',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="div"
      slot="dialog-header"
      attributes={rest}
      binding={resolved.styles.header}
    >
      {local.children}
    </ModalAnatomyPart>
  )
}

function DialogTitle<T extends ValidComponent = 'h2'>(props: DialogT.TitleProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'id'])
  const family = useModalContext()
  const content = useDialogContent()
  const id = useRegisteredContentId(() => local.id, content.registerTitle)
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'title',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="h2"
      slot="dialog-title"
      attributes={rest}
      binding={resolved.styles.title}
      id={id()}
    >
      {local.children}
    </ModalAnatomyPart>
  )
}

function DialogDescription<T extends ValidComponent = 'p'>(
  props: DialogT.DescriptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'id'])
  const family = useModalContext()
  const content = useDialogContent()
  const id = useRegisteredContentId(() => local.id, content.registerDescription)
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'description',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="p"
      slot="dialog-description"
      attributes={rest}
      binding={resolved.styles.description}
      id={id()}
    >
      {local.children}
    </ModalAnatomyPart>
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
    <ModalAnatomyPart
      as={local.as}
      defaultAs="div"
      slot="dialog-action"
      attributes={rest}
      binding={resolved.styles.action}
    >
      {local.children}
    </ModalAnatomyPart>
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
  const bodyAttrs = dialogDataAttributes.body({
    header: content.hasHeader,
    footer: content.hasFooter,
    scroll: () => !content.overlayScroll(),
  })
  return (
    <ModalAnatomyPart
      as={local.as}
      defaultAs="div"
      slot="dialog-body"
      attributes={rest}
      additionalAttributes={bodyAttrs}
      binding={resolved.styles.body}
    >
      {local.children}
    </ModalAnatomyPart>
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
    <ModalAnatomyPart
      as={local.as}
      defaultAs="div"
      slot="dialog-footer"
      attributes={rest}
      binding={resolved.styles.footer}
    >
      {local.children}
    </ModalAnatomyPart>
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
