import type { Component, JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'

import { useRecipe } from '../../provider'
import type { OverlayAlign } from '../../theme/style-types'

import { ToastItem } from './toast-item'
import { resolveToastOptions } from './toast-store'
import type { ToastHostDefaults, ToastRecord, ToastStore } from './toast-store'
import { toastDataAttributes, toastRecipe } from './toast.recipe'
import type { ToastT } from './toast.types'

const TOAST_FALLBACK_HEIGHT = 58

export interface ToastListProps {
  positionKey: string
  filteredToasts: ToastRecord[]
  host: ToastHostDefaults
  store: ToastStore
  expand?: boolean
  hostPaused: boolean
  heights: Record<string | number, number>
  gap: number
  visibleToasts: number
  itemRender?: Component<ToastT.ItemRenderProps>
  onHeight: (id: ToastT.Id, height: number) => void
}

export function ToastList(props: ToastListProps): JSX.Element {
  const [isHovered, setIsHovered] = createSignal(false)
  const [isInteracting, setIsInteracting] = createSignal(false)
  const position = createMemo<Partial<ToastT.Variants>>(() => {
    const [placement, align] = props.positionKey.split('-')
    return {
      placement: placement as ToastT.Variants['placement'],
      align: align as OverlayAlign,
    }
  })

  const groupToasts = createMemo(() =>
    props.filteredToasts.filter((toast) => {
      const options = resolveToastOptions(toast.options, props.host)
      return `${options.placement}-${options.align}` === props.positionKey
    }),
  )

  const layoutExpanded = () => Boolean(props.expand) || isHovered()

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
        const height = props.heights[toast.id] || frontmostHeight() || TOAST_FALLBACK_HEIGHT
        offsetY += height + props.gap
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
    const gap = props.gap
    const frontHeight = frontmostHeight() || TOAST_FALLBACK_HEIGHT
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

  const {
    slots: { list: listSlot },
  } = useRecipe(
    toastRecipe,
    {},
    {
      varsSlot: 'list',
      data: { list: toastDataAttributes.list(() => ({ expanded: layoutExpanded })) },
      context: () => ({
        variants: position(),
        classes: props.host.classes,
        styles: props.host.styles,
      }),
      own: {
        list: () => {
          const height = listHeight()
          return {
            style: {
              height: height > 0 ? `${height}px` : 'auto',
              '--toast-gap': `${props.gap}px`,
            },
          }
        },
      },
    },
  )

  return (
    <Show when={groupToasts().length > 0}>
      <ul
        data-slot="toast-list"
        tabIndex={-1}
        {...listSlot}
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
                paused={isHovered() || isInteracting() || props.hostPaused}
                host={props.host}
                store={props.store}
                itemRender={props.itemRender}
                gap={props.gap}
                onHeight={props.onHeight}
              />
            )
          }}
        </For>
      </ul>
    </Show>
  )
}
