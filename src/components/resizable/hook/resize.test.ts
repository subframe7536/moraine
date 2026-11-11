import { describe, expect, test } from 'vitest'

import {
  RESIZE_FLAG_BOTH,
  RESIZE_FLAG_FOLLOWING,
  RESIZE_FLAG_PRECEDING,
  collapsePanel,
  expandPanel,
  resizeFromHandle,
  resizePanelToSize,
  toggleHandleNearestPanel,
} from './resize'
import type { ResizableResolvedPanel } from './types'

function panel(
  input: Pick<ResizableResolvedPanel, 'panelId'> & Partial<ResizableResolvedPanel>,
): ResizableResolvedPanel {
  return {
    min: 0,
    max: 1,
    resizable: true,
    collapsible: false,
    collapsedSize: 0,
    ...input,
  }
}

describe('resize', () => {
  test('resizePanelToSize(strategy=following) keeps collapsible neighbor above min', () => {
    const panels = [
      { panelId: 'left', min: 0.2 },
      { panelId: 'center', min: 0.2, max: 1 },
      {
        panelId: 'right',
        min: 0.2,
        collapsible: true,
      },
    ].map(panel)

    const nextSizes = resizePanelToSize({
      panelIndex: 1,
      size: 0.6,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0.4, 0.3, 0.3],
      panels,
    })

    expect(nextSizes[1]).toBeCloseTo(0.4, 6)
    expect(nextSizes[2]).toBeCloseTo(0.2, 6)
  })

  test('resizePanelToSize(strategy=preceding) keeps collapsible neighbor above min', () => {
    const panels = [
      {
        panelId: 'left',
        min: 0.2,
        collapsible: true,
      },
      { panelId: 'center', min: 0.2, max: 1 },
      { panelId: 'right', min: 0.2 },
    ].map(panel)

    const nextSizes = resizePanelToSize({
      panelIndex: 1,
      size: 0.6,
      strategy: RESIZE_FLAG_PRECEDING,
      initialSizes: [0.3, 0.3, 0.4],
      panels,
    })

    expect(nextSizes[0]).toBeCloseTo(0.2, 6)
    expect(nextSizes[1]).toBeCloseTo(0.4, 6)
  })

  test('resizePanelToSize(strategy=both) keeps both collapsible neighbors above min', () => {
    const panels = [
      {
        panelId: 'left',
        min: 0.2,
        collapsible: true,
      },
      { panelId: 'center', min: 0.2, max: 1 },
      {
        panelId: 'right',
        min: 0.2,
        collapsible: true,
      },
    ].map(panel)

    const nextSizes = resizePanelToSize({
      panelIndex: 1,
      size: 0.8,
      strategy: RESIZE_FLAG_BOTH,
      initialSizes: [0.3, 0.3, 0.4],
      panels,
    })

    expect(nextSizes[0]).toBeCloseTo(0.2, 6)
    expect(nextSizes[1]).toBeCloseTo(0.5, 6)
    expect(nextSizes[2]).toBeCloseTo(0.3, 6)
  })

  test('collapsePanel returns unchanged sizes for non-collapsible or already-collapsed panel', () => {
    const nonCollapsiblePanels = [
      { panelId: 'left', min: 0.2, collapsible: false },
      { panelId: 'right', min: 0.2 },
    ].map(panel)

    const unchangedNonCollapsible = collapsePanel({
      panelIndex: 0,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0.4, 0.6],
      panels: nonCollapsiblePanels,
    })

    expect(unchangedNonCollapsible).toEqual([0.4, 0.6])

    const collapsiblePanels = [
      { panelId: 'left', min: 0.2, collapsible: true },
      { panelId: 'right', min: 0.2 },
    ].map(panel)

    const unchangedCollapsed = collapsePanel({
      panelIndex: 0,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0, 1],
      panels: collapsiblePanels,
    })

    expect(unchangedCollapsed).toEqual([0, 1])
  })

  test('collapsePanel collapses to collapsedSize when configured', () => {
    const panels = [
      { panelId: 'left', min: 0.2, collapsible: true, collapsedSize: 0.1 },
      { panelId: 'right', min: 0.2 },
    ].map(panel)

    const nextSizes = collapsePanel({
      panelIndex: 0,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0.4, 0.6],
      panels,
    })

    expect(nextSizes[0]).toBeCloseTo(0.1, 6)
    expect(nextSizes[1]).toBeCloseTo(0.9, 6)
  })

  test('expandPanel expands collapsed panel to max when defaultSize is missing', () => {
    const panels = [
      { panelId: 'left', min: 0.2, collapsible: true },
      { panelId: 'right', min: 0.2 },
    ].map(panel)

    const nextSizes = expandPanel({
      panelIndex: 0,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0, 1],
      panels,
    })

    expect(nextSizes[0]).toBeCloseTo(0.8, 6)
    expect(nextSizes[1]).toBeCloseTo(0.2, 6)
  })

  test('expandPanel prefers defaultSize when panel is collapsed', () => {
    const panels = [
      {
        panelId: 'left',
        min: 0.2,
        collapsible: true,
        collapsedSize: 0.1,
      },
      { panelId: 'right', min: 0.2 },
    ].map(panel)

    const nextSizes = expandPanel({
      panelIndex: 0,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0.1, 0.9],
      panels,
      expandedSize: 0.35,
    })

    expect(nextSizes[0]).toBeCloseTo(0.35, 6)
    expect(nextSizes[1]).toBeCloseTo(0.65, 6)
  })

  test('toggleHandleNearestPanel handles no-collapsible, collapse and expand cases', () => {
    const nonCollapsiblePanels = [
      { panelId: 'left', min: 0.2, collapsible: false },
      { panelId: 'right', min: 0.2, collapsible: false },
    ].map(panel)

    const unchanged = toggleHandleNearestPanel({
      handleIndex: 0,
      initialSizes: [0.5, 0.5],
      panels: nonCollapsiblePanels,
    })

    expect(unchanged).toEqual([0.5, 0.5])

    const collapsiblePanels = [
      { panelId: 'left', min: 0.2, collapsible: true },
      { panelId: 'right', min: 0.2 },
    ].map(panel)

    const collapsed = toggleHandleNearestPanel({
      handleIndex: 0,
      initialSizes: [0.2, 0.8],
      panels: collapsiblePanels,
    })
    expect(collapsed[0]).toBeCloseTo(0, 6)
    expect(collapsed[1]).toBeCloseTo(1, 6)

    const expanded = toggleHandleNearestPanel({
      handleIndex: 0,
      initialSizes: [0, 1],
      panels: collapsiblePanels,
      expandedSizes: [0.35],
    })
    expect(expanded[0]).toBeCloseTo(0.35, 6)
    expect(expanded[1]).toBeCloseTo(0.65, 6)
  })

  test('resizeFromHandle(altKey) keeps first-handle reverse path equivalent to mirrored center handle', () => {
    const panels = [
      { panelId: 'left', min: 0.2, max: 0.8 },
      { panelId: 'center', min: 0.2, max: 0.9 },
      { panelId: 'right', min: 0.2, max: 0.8 },
    ].map(panel)

    const initialSizes = [0.3, 0.4, 0.3]

    const fromFirstHandle = resizeFromHandle({
      handleIndex: 0,
      deltaPercentage: 0.08,
      altKey: true,
      initialSizes,
      panels,
    })

    const fromCenterHandle = resizeFromHandle({
      handleIndex: 1,
      deltaPercentage: -0.08,
      altKey: true,
      initialSizes,
      panels,
    })

    expect(fromFirstHandle).toEqual(fromCenterHandle)
  })

  test('resizePanelToSize keeps strategy behavior stable around epsilon neighborhood', () => {
    const panels = [
      {
        panelId: 'left',
        min: 0.24,
        collapsible: true,
      },
      { panelId: 'center', min: 0.2, max: 1 },
      {
        panelId: 'right',
        min: 0.24,
        collapsible: true,
      },
    ].map(panel)

    const initialSizes = [0.24, 0.52, 0.24]

    const following = resizePanelToSize({
      panelIndex: 1,
      size: 0.559999,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes,
      panels,
    })

    const preceding = resizePanelToSize({
      panelIndex: 1,
      size: 0.559999,
      strategy: RESIZE_FLAG_PRECEDING,
      initialSizes,
      panels,
    })

    const both = resizePanelToSize({
      panelIndex: 1,
      size: 0.559999,
      strategy: RESIZE_FLAG_BOTH,
      initialSizes,
      panels,
    })

    expect(following).toEqual(initialSizes)
    expect(preceding).toEqual(initialSizes)
    expect(both).toEqual(initialSizes)
  })

  test('resizeFromHandle never collapses panels through dragging', () => {
    const panels = [
      { panelId: 'left', min: 0.2, max: 1, collapsible: true },
      {
        panelId: 'right',
        min: 0.2,
        collapsible: true,
      },
    ].map(panel)

    const initialSizes = [0.7, 0.3]

    const nextSizes = resizeFromHandle({
      handleIndex: 0,
      deltaPercentage: 0.2,
      altKey: false,
      initialSizes,
      panels,
    })
    expect(nextSizes[0]).toBeCloseTo(0.8, 6)
    expect(nextSizes[1]).toBeCloseTo(0.2, 6)
  })

  test('resizeFromHandle keeps a collapsed panel pinned at collapsedSize when dragging further out', () => {
    const panels = [
      { panelId: 'left', min: 0.2, max: 1, collapsible: true, collapsedSize: 0.1 },
      { panelId: 'right', min: 0.2, max: 1, collapsible: true },
    ].map(panel)

    const initialSizes = [0.1, 0.9]

    const draggedOutside = resizeFromHandle({
      handleIndex: 0,
      deltaPercentage: -0.2,
      altKey: false,
      initialSizes,
      panels,
    })

    expect(draggedOutside[0]).toBeCloseTo(0.1, 6)
    expect(draggedOutside[1]).toBeCloseTo(0.9, 6)
  })

  test('resizeFromHandle expands from collapsedSize without snapping to min', () => {
    const panels = [
      { panelId: 'left', min: 0.2, max: 1, collapsible: true, collapsedSize: 0.1 },
      { panelId: 'right', min: 0.2, max: 1, collapsible: true },
    ].map(panel)

    const initialSizes = [0.1, 0.9]

    const expanded = resizeFromHandle({
      handleIndex: 0,
      deltaPercentage: 0.05,
      altKey: false,
      initialSizes,
      panels,
    })

    expect(expanded[0]).toBeCloseTo(0.15, 6)
    expect(expanded[1]).toBeCloseTo(0.85, 6)
  })

  test('locks non-resizable panel size during resize', () => {
    const panels = [
      { panelId: 'left', min: 0.1, max: 0.8, resizable: true },
      { panelId: 'middle', min: 0.1, max: 0.8, resizable: false },
      { panelId: 'right', min: 0.1, max: 0.8, resizable: true },
    ].map(panel)

    const initialSizes = [0.3, 0.4, 0.3]

    // Drag handle 1 (between middle and right) pushing left
    const nextSizes = resizeFromHandle({
      handleIndex: 1,
      deltaPercentage: -0.1,
      altKey: false,
      initialSizes,
      panels,
    })

    // Middle panel must remain locked at 0.4
    expect(nextSizes[1]).toBeCloseTo(0.4, 6)
  })
})
