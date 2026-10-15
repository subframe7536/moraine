import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'

import { useRecipe } from '../../provider'
import type { OverlayAlign } from '../../theme/style-types'
import type { FeedbackCloseReason } from '../base/feedback/feedback.types'

import { ToastItem } from './toast-item'
import { resolveToastOptions } from './toast-store'
import type { ToastHostDefaults, ToastRecord } from './toast-store'
import { toastDataAttributes, toastRecipe } from './toast.recipe'
import type { ToastT } from './toast.types'

export interface ToastListProps {
  positionKey: string
  filteredToasts: ToastRecord[]
  host: ToastHostDefaults
  expand?: boolean
  hostPaused: boolean
  heights: Record<string | number, number>
  gapSize: number
  visibleToasts: number
  itemRender?: ToastT.Render
  onHeight: (id: ToastT.Id, height: number) => void
  requestClose: (id: ToastT.Id, reason: FeedbackCloseReason) => void
  onRemove: (id: ToastT.Id) => void
  onUpdate: (id: ToastT.Id, options: ToastT.UpdateOptions) => void
  onBump: (listener: (id: ToastT.Id) => void) => () => void
}

export function ToastList(props: ToastListProps): JSX.Element {
  const [isHovered, setIsHovered] = createSignal(false)
  const [isInteracting, setIsInteracting] = createSignal(false)
  const placement = () => props.positionKey.split('-')[0] as ToastT.Placement
  const align = () => props.positionKey.split('-')[1] as OverlayAlign

  const groupToasts = createMemo(() =>
    props.filteredToasts.filter((toast) => {
      const options = resolveToastOptions(toast.options, props.host)
      return `${options.placement}-${options.align}` === props.positionKey
    }),
  )

  const layoutExpanded = () => Boolean(props.expand) || isHovered()
  const timerPaused = () => isHovered() || isInteracting() || props.hostPaused

  const frontmostHeight = createMemo(() => {
    const currentHeights = props.heights
    for (const toast of groupToasts()) {
      if (!toast.closed) {
        const height = currentHeights[toast.id]
        if (height && height > 0) {
          return height
        }
      }
    }
    return 0
  })

  const toastMeta = createMemo(() => {
    const toasts = groupToasts()
    const currentHeights = props.heights
    const gap = props.gapSize
    const meta = new Map<ToastT.Id, { index: number; offsetY: number }>()
    let visibleIndex = 0
    let offsetY = 0

    toasts.forEach((toast, domIndex) => {
      const isEnding = Boolean(toast.closed)
      meta.set(toast.id, {
        index: isEnding ? domIndex : visibleIndex,
        offsetY,
      })
      if (!isEnding) {
        visibleIndex += 1
        const height = currentHeights[toast.id] || frontmostHeight() || 58
        offsetY += height + gap
      }
    })
    return meta
  })

  const activeCount = createMemo(() => groupToasts().filter((toast) => !toast.closed).length)
  const listHeight = createMemo(() => {
    const toasts = groupToasts().filter((toast) => !toast.closed)
    if (toasts.length === 0) {
      return 0
    }
    const count = Math.min(toasts.length, props.visibleToasts)
    const gap = props.gapSize
    const frontHeight = frontmostHeight() || 58
    if (!layoutExpanded()) {
      return frontHeight + (count > 1 ? (count - 1) * gap : 0)
    }
    let total = 0
    for (let index = 0; index < count; index += 1) {
      const toast = toasts[index]
      total += (toast ? props.heights[toast.id] : 0) || frontHeight
    }
    return total + (count > 1 ? (count - 1) * gap : 0)
  })

  const { slots } = useRecipe(
    toastRecipe,
    {},
    {
      slot: 'list',
      varsSlot: 'list',
      contextVariants: () => ({
        placement: placement(),
        align: align(),
      }),
      contextSlots: () => ({
        classes: props.host.classes,
        styles: props.host.styles,
      }),
      own: () => ({
        list: {
          style: { height: listHeight() > 0 ? `${listHeight()}px` : 'auto' },
        },
      }),
      vars: () => ({
        '--toast-gap': `${props.gapSize}px`,
      }),
    },
  )

  return (
    <Show when={groupToasts().length > 0}>
      <ul
        data-slot="toast-list"
        tabIndex={-1}
        {...toastDataAttributes.list({ expanded: layoutExpanded })}
        {...slots.list}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget) {
            setIsInteracting(true)
          }
        }}
        onPointerUp={() => setIsInteracting(false)}
      >
        <For each={groupToasts()}>
          {(item) => {
            const meta = () => toastMeta().get(item.id) ?? { index: 0, offsetY: 0 }
            return (
              <ToastItem
                toast={item}
                index={meta().index}
                offsetY={meta().offsetY}
                toastsCount={activeCount()}
                visibleToasts={props.visibleToasts}
                expanded={layoutExpanded()}
                paused={timerPaused()}
                host={props.host}
                itemRender={props.itemRender}
                gap={props.gapSize}
                onHeight={props.onHeight}
                requestClose={props.requestClose}
                onRemove={props.onRemove}
                onUpdate={props.onUpdate}
                onBump={props.onBump}
              />
            )
          }}
        </For>
      </ul>
    </Show>
  )
}
