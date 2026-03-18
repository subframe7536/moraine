import { clamp } from '@kobalte/utils'

import { fixToPrecision, nearlyEqual, resolveSize } from './size'
import type { ResizableHandleAria, ResizablePanelItem, ResizableResolvedPanel } from './types'

export function resolvePanels(
  panels: ResizablePanelItem[] | undefined,
  rootSize: number,
  panelIdPrefix: string,
): ResizableResolvedPanel[] {
  return (panels ?? []).map((panel, index) => {
    const min = clamp(resolveSize(panel.min ?? 0, rootSize), 0, 1)
    const max = clamp(resolveSize(panel.max ?? '100%', rootSize), min, 1)
    const collapsibleMin = clamp(resolveSize(panel.collapsibleMin ?? 0, rootSize), 0, min)

    return {
      panelId: panel.panelId ?? `${panelIdPrefix}-panel-${index + 1}`,
      defaultSize: panel.defaultSize,
      min,
      max,
      resizable: panel.resizable !== false,
      collapsible: panel.collapsible === true,
      collapsibleMin,
      onResize: panel.onResize,
      onCollapse: panel.onCollapse,
      onExpand: panel.onExpand,
      class: panel.class,
      style: panel.style,
      content: panel.content,
    }
  })
}

export function isPanelCollapsed(size: number, panel: ResizableResolvedPanel): boolean {
  return (
    panel.collapsible && (size < panel.collapsibleMin || nearlyEqual(size, panel.collapsibleMin))
  )
}

export function getHandleAria(input: {
  handleIndex: number
  sizes: number[]
  panels: ResizableResolvedPanel[]
}): ResizableHandleAria {
  const { handleIndex, sizes, panels } = input
  let valueNow = 0
  let valueMin = 0
  let followingMin = 0

  for (let index = 0; index <= handleIndex; index += 1) {
    valueNow += sizes[index] ?? 0
    valueMin += panels[index]?.min ?? 0
  }

  for (let index = handleIndex + 1; index < panels.length; index += 1) {
    followingMin += panels[index]?.min ?? 0
  }

  return {
    controls: panels[handleIndex]?.panelId,
    valueNow: fixToPrecision(valueNow),
    valueMin: fixToPrecision(valueMin),
    valueMax: fixToPrecision(1 - followingMin),
  }
}
