import type { JSX } from 'solid-js'
import { Show, createEffect, mergeProps, on, onCleanup, splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasJsxContent } from '../../shared/jsx-content'
import { applyDataAttributes } from '../../shared/style-contract.ts'
import type { ValidComponent } from '../../shared/types.ts'
import { callRef } from '../../shared/utils'
import { createContentRegistration, useRegisteredContentId } from '../base/content-registration'
import { createShorthandContent } from '../base/shorthand-content'
import { Modal, ModalRoot } from '../modal/modal'
import { ModalSurface } from '../modal/modal-content'
import { useModalContext } from '../modal/modal-context'
import { ModalPortal } from '../modal/modal-portal'

import { SheetContentProvider, useSheetConfig, useSheetContent } from './sheet-context'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetProps, SheetT } from './sheet.types'

/** Sheet state and presentation, sharing the Modal root context. */
export function Sheet(props: SheetProps): JSX.Element {
  return <ModalRoot configuration={{ kind: 'sheet', props }} />
}

function SheetTrigger<T extends ValidComponent = 'button'>(
  props: SheetT.TriggerProps<T>,
): JSX.Element {
  const family = useModalContext()
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
    'title',
    'description',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const config = useSheetConfig()
  const family = useModalContext()
  const merged = mergeProps({ overlay: true, transition: true, close: true }, config)
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'content',
    inheritedVariants: () => ({ side: config.side, inset: config.inset }),
    inheritedStyles: () => family.presentation,
  })
  const registration = createContentRegistration()

  let shorthand: ReturnType<typeof createShorthandContent> | undefined
  const hasHeader = () => registration.hasExplicitHeader() || Boolean(shorthand?.hasContent())

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
      <ModalPortal>
        <ModalSurface
          {...rest}
          trapFocus={config.trapFocus}
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
            const contentShorthand = createShorthandContent(local)
            shorthand = contentShorthand
            onCleanup(() => {
              if (shorthand === contentShorthand) {
                shorthand = undefined
              }
            })
            const explicitChildren = createLazyMemo(() => untrack(() => local.children))
            const closeContent = createLazyMemo(() => merged.close)
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
                    <Show when={!registration.hasExplicitHeader() && contentShorthand.hasContent()}>
                      <SheetHeader shorthand>
                        <Show when={hasJsxContent(contentShorthand.title())}>
                          <SheetTitle>{contentShorthand.title()}</SheetTitle>
                        </Show>
                        <Show when={hasJsxContent(contentShorthand.description())}>
                          <SheetDescription>{contentShorthand.description()}</SheetDescription>
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
              },
            }
          }}
        />
      </ModalPortal>
    </SheetContentProvider>
  )
}

function SheetHeader<T extends ValidComponent = 'div'>(
  props: SheetT.HeaderProps<T> & { shorthand?: boolean },
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'children', 'shorthand'])
  const family = useModalContext()
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
  const family = useModalContext()
  const content = useSheetContent()
  const id = useRegisteredContentId(() => local.id, content.registerTitle)
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
  const family = useModalContext()
  const content = useSheetContent()
  const id = useRegisteredContentId(() => local.id, content.registerDescription)
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
  const family = useModalContext()
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
  const family = useModalContext()
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
  const family = useModalContext()
  const content = useSheetContent()
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
