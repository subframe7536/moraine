import * as KobalteCollapsible from '@kobalte/core/collapsible'
import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn } from '../../shared/utils'

type CollapsibleSlots = 'root' | 'trigger' | 'content'

export type CollapsibleClasses = SlotClasses<CollapsibleSlots>

export type CollapsibleStyles = SlotStyles<CollapsibleSlots>

export interface CollapsibleTriggerSlotProps {
  open: boolean
}

export interface CollapsibleBaseProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  forceMount?: boolean
  classes?: CollapsibleClasses
  styles?: CollapsibleStyles
  trigger?: (props: CollapsibleTriggerSlotProps) => JSX.Element
  children?: JSX.Element
}

export type CollapsibleProps = CollapsibleBaseProps &
  Omit<KobalteCollapsible.CollapsibleRootProps, keyof CollapsibleBaseProps | 'children' | 'class'>

export function Collapsible(props: CollapsibleProps): JSX.Element {
  const [contentProps, restProps] = splitProps(props as CollapsibleProps, [
    'classes',
    'styles',
    'children',
    'trigger',
  ])

  return (
    <KobalteCollapsible.Root
      data-slot="root"
      style={contentProps.styles?.root}
      class={cn(contentProps.classes?.root)}
      {...restProps}
    >
      <Show when={contentProps.trigger}>
        {(render) => {
          const context = KobalteCollapsible.useCollapsibleContext()
          return (
            <KobalteCollapsible.Trigger
              data-slot="trigger"
              style={contentProps.styles?.trigger}
              class={cn('cursor-pointer', contentProps.classes?.trigger)}
            >
              {render()({ open: context.isOpen() })}
            </KobalteCollapsible.Trigger>
          )
        }}
      </Show>

      <KobalteCollapsible.Content
        data-slot="content"
        style={contentProps.styles?.content}
        class={cn(
          'h-$kb-collapsible-content-height overflow-hidden data-closed:h-0',
          contentProps.classes?.content,
        )}
      >
        {contentProps.children}
      </KobalteCollapsible.Content>
    </KobalteCollapsible.Root>
  )
}
