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
import { createContentRegistration } from '../base/content-registration'
import { Modal, ModalRoot } from '../modal/modal'
import { ModalSurface } from '../modal/modal-content'

import {
  SheetContentProvider,
  SheetPresentationProvider,
  useSheetContent,
  useSheetPresentation,
} from './sheet-context'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetProps, SheetT } from './sheet.types'

/** Sheet state and context. Trigger, Content, and Close own their respective DOM. */
export function Sheet(props: SheetProps): JSX.Element {
  const [local, rest] = splitProps(props, ['classes', 'styles', 'children'])
  return (
    <SheetPresentationProvider
      value={{
        get presentation() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <ModalRoot {...rest} slotOwner="sheet">
        {local.children}
      </ModalRoot>
    </SheetPresentationProvider>
  )
}

function SheetTrigger<T extends ValidComponent = 'button'>(
  props: SheetT.TriggerProps<T>,
): JSX.Element {
  const family = useSheetPresentation()
  const resolved = createStyles(sheetRecipe, props, {
    rootSlot: 'trigger',
    inheritedStyles: () => family.presentation,
  })
  return <Modal.Trigger {...props} {...resolved.styles.trigger} />
}

function SheetClose<T extends ValidComponent = 'button'>(props: SheetT.CloseProps<T>): JSX.Element {
  return <Modal.Close {...props} data-slot="sheet-close" />
}

function SheetContent(props: SheetT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'overlay',
    'ariaLabel',
    'title',
    'description',
    'side',
    'inset',
    'transition',
    'close',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const family = useSheetPresentation()
  const merged = mergeProps({ overlay: true, transition: true, close: true }, local)
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => family.presentation,
  })
  const registration = createContentRegistration()

  const hasShorthand = () => hasJsxContent(merged.title) || hasJsxContent(merged.description)
  const hasHeader = () => registration.hasExplicitHeader() || hasShorthand()

  return (
    <SheetContentProvider
      value={{
        ...registration,
        get variants() {
          return resolved.variants
        },

        hasHeader,
      }}
    >
      <ModalSurface
        {...rest}
        {...sheetDataAttributes.content({
          closed: undefined,
          expanded: undefined,
          transition: () => merged.transition,
        })}
        overlay={merged.overlay}
        overlayClass={resolved.styles.overlay.class}
        overlayStyle={resolved.styles.overlay.style}
        {...resolved.styles.content}
        surfaceRender={() => {
          const explicitChildren = createLazyMemo(() => untrack(() => local.children))
          const title = createLazyMemo(() => merged.title)
          const description = createLazyMemo(() => merged.description)
          const closeContent = createLazyMemo(() => merged.close)
          return {
            ariaLabel: merged.ariaLabel,
            get ariaLabelledBy() {
              return registration.titleIds().join(' ') || undefined
            },
            get ariaDescribedBy() {
              return registration.descriptionIds().join(' ') || undefined
            },
            children: () => (
              <>
                {(() => {
                  const content = explicitChildren()
                  return (
                    <>
                      <Show when={!registration.hasExplicitHeader() && hasShorthand()}>
                        <SheetHeader shorthand>
                          <Show when={hasJsxContent(title())}>
                            <SheetTitle>{title()}</SheetTitle>
                          </Show>
                          <Show when={hasJsxContent(description())}>
                            <SheetDescription>{description()}</SheetDescription>
                          </Show>
                        </SheetHeader>
                      </Show>
                      <Show when={closeContent() !== false}>
                        <Modal.Close
                          data-slot="sheet-content-close"
                          aria-label="Close"
                          {...resolved.styles.contentClose}
                        >
                          <Show when={closeContent() === true} fallback={closeContent()}>
                            <Icon name="icon-close" />
                          </Show>
                        </Modal.Close>
                      </Show>
                      {content}
                    </>
                  )
                })()}
              </>
            ),
          }
        }}
      />
    </SheetContentProvider>
  )
}

function SheetHeader<T extends ValidComponent = 'div'>(
  props: SheetT.HeaderProps<T> & { shorthand?: boolean },
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'shorthand'])
  const family = useSheetPresentation()
  const content = useSheetContent()
  // oxlint-disable-next-line subf/solid-reactivity -- Internal shorthand mode is fixed for this Header instance.
  if (!local.shorthand) {
    const unregister = content.registerHeader()
    onCleanup(unregister)
  }
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'header',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sheet-header"
      {...rest}
      {...resolved.styles.header}
    >
      {local.children}
    </Dynamic>
  )
}

function SheetTitle<T extends ValidComponent = 'h2'>(props: SheetT.TitleProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'id'])
  const family = useSheetPresentation()
  const content = useSheetContent()
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
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'title',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'h2'}
      data-slot="sheet-title"
      {...rest}
      id={id()}
      {...resolved.styles.title}
    >
      {local.children}
    </Dynamic>
  )
}

function SheetDescription<T extends ValidComponent = 'p'>(
  props: SheetT.DescriptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'id'])
  const family = useSheetPresentation()
  const content = useSheetContent()
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
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'description',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'p'}
      data-slot="sheet-description"
      {...rest}
      id={id()}
      {...resolved.styles.description}
    >
      {local.children}
    </Dynamic>
  )
}

function SheetAction<T extends ValidComponent = 'div'>(props: SheetT.ActionProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useSheetPresentation()
  const content = useSheetContent()
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'action',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sheet-action"
      {...rest}
      {...resolved.styles.action}
    >
      {local.children}
    </Dynamic>
  )
}

function SheetBody<T extends ValidComponent = 'div'>(props: SheetT.BodyProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useSheetPresentation()
  const content = useSheetContent()
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'body',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  let element: HTMLElement | undefined
  const bodyAttrs = sheetDataAttributes.body({ header: content.hasHeader })
  createEffect(
    on(content.hasHeader, () => {
      if (element) {
        applyDataAttributes(element, bodyAttrs)
      }
    }),
  )
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sheet-body"
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

function SheetFooter<T extends ValidComponent = 'div'>(props: SheetT.FooterProps<T>): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children'])
  const family = useSheetPresentation()
  const content = useSheetContent()
  const unregister = content.registerFooter()
  onCleanup(unregister)
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'footer',
    inheritedVariants: () => content.variants,
    inheritedStyles: () => family.presentation,
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sheet-footer"
      {...rest}
      {...resolved.styles.footer}
    >
      {local.children}
    </Dynamic>
  )
}

Sheet.Trigger = SheetTrigger
Sheet.Content = SheetContent
Sheet.Header = SheetHeader
Sheet.Title = SheetTitle
Sheet.Description = SheetDescription
Sheet.Action = SheetAction
Sheet.Body = SheetBody
Sheet.Footer = SheetFooter
Sheet.Close = SheetClose
