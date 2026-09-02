import { describe, expect, test } from 'vitest'

import { resolvePanels } from './panel'
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

const ROOT_SIZE = 1000

describe('resize', () => {
  test('resizePanelToSize(strategy=following) keeps collapsible neighbor above min', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', min: '20%' },
        { panelId: 'center', min: '20%', max: '100%' },
        {
          panelId: 'right',
          min: '20%',
          collapsible: true,
        },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const nextSizes = resizePanelToSize({
      panelIndex: 1,
      size: '60%',
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0.4, 0.3, 0.3],
      panels,
      rootSize: ROOT_SIZE,
    })

    expect(nextSizes[1]).toBeCloseTo(0.4, 6)
    expect(nextSizes[2]).toBeCloseTo(0.2, 6)
  })

  test('resizePanelToSize(strategy=preceding) keeps collapsible neighbor above min', () => {
    const panels = resolvePanels(
      [
        {
          panelId: 'left',
          min: '20%',
          collapsible: true,
        },
        { panelId: 'center', min: '20%', max: '100%' },
        { panelId: 'right', min: '20%' },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const nextSizes = resizePanelToSize({
      panelIndex: 1,
      size: '60%',
      strategy: RESIZE_FLAG_PRECEDING,
      initialSizes: [0.3, 0.3, 0.4],
      panels,
      rootSize: ROOT_SIZE,
    })

    expect(nextSizes[0]).toBeCloseTo(0.2, 6)
    expect(nextSizes[1]).toBeCloseTo(0.4, 6)
  })

  test('resizePanelToSize(strategy=both) keeps both collapsible neighbors above min', () => {
    const panels = resolvePanels(
      [
        {
          panelId: 'left',
          min: '20%',
          collapsible: true,
        },
        { panelId: 'center', min: '20%', max: '100%' },
        {
          panelId: 'right',
          min: '20%',
          collapsible: true,
        },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const nextSizes = resizePanelToSize({
      panelIndex: 1,
      size: '80%',
      strategy: RESIZE_FLAG_BOTH,
      initialSizes: [0.3, 0.3, 0.4],
      panels,
      rootSize: ROOT_SIZE,
    })

    expect(nextSizes[0]).toBeCloseTo(0.2, 6)
    expect(nextSizes[1]).toBeCloseTo(0.5, 6)
    expect(nextSizes[2]).toBeCloseTo(0.3, 6)
  })

  test('collapsePanel returns unchanged sizes for non-collapsible or already-collapsed panel', () => {
    const nonCollapsiblePanels = resolvePanels(
      [
        { panelId: 'left', min: '20%', collapsible: false },
        { panelId: 'right', min: '20%' },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const unchangedNonCollapsible = collapsePanel({
      panelIndex: 0,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0.4, 0.6],
      panels: nonCollapsiblePanels,
    })

    expect(unchangedNonCollapsible).toEqual([0.4, 0.6])

    const collapsiblePanels = resolvePanels(
      [
        { panelId: 'left', min: '20%', collapsible: true },
        { panelId: 'right', min: '20%' },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const unchangedCollapsed = collapsePanel({
      panelIndex: 0,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0, 1],
      panels: collapsiblePanels,
    })

    expect(unchangedCollapsed).toEqual([0, 1])
  })

  test('collapsePanel collapses to collapsibleMin when configured', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', min: '20%', collapsible: true, collapsibleMin: '10%' },
        { panelId: 'right', min: '20%' },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

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
    const panels = resolvePanels(
      [
        { panelId: 'left', min: '20%', collapsible: true },
        { panelId: 'right', min: '20%' },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

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
    const panels = resolvePanels(
      [
        {
          panelId: 'left',
          min: '20%',
          defaultSize: '35%',
          collapsible: true,
          collapsibleMin: '10%',
        },
        { panelId: 'right', min: '20%' },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const nextSizes = expandPanel({
      panelIndex: 0,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: [0.1, 0.9],
      panels,
    })

    expect(nextSizes[0]).toBeCloseTo(0.35, 6)
    expect(nextSizes[1]).toBeCloseTo(0.65, 6)
  })

  test('toggleHandleNearestPanel handles no-collapsible, collapse and expand cases', () => {
    const nonCollapsiblePanels = resolvePanels(
      [
        { panelId: 'left', min: '20%', collapsible: false },
        { panelId: 'right', min: '20%', collapsible: false },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const unchanged = toggleHandleNearestPanel({
      handleIndex: 0,
      initialSizes: [0.5, 0.5],
      panels: nonCollapsiblePanels,
    })

    expect(unchanged).toEqual([0.5, 0.5])

    const collapsiblePanels = resolvePanels(
      [
        { panelId: 'left', min: '20%', defaultSize: '35%', collapsible: true },
        { panelId: 'right', min: '20%' },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

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
    })
    expect(expanded[0]).toBeCloseTo(0.35, 6)
    expect(expanded[1]).toBeCloseTo(0.65, 6)
  })

  test('resizeFromHandle(altKey) keeps first-handle reverse path equivalent to mirrored center handle', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', min: '20%', max: '80%' },
        { panelId: 'center', min: '20%', max: '90%' },
        { panelId: 'right', min: '20%', max: '80%' },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

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
    const panels = resolvePanels(
      [
        {
          panelId: 'left',
          min: '24%',
          collapsible: true,
        },
        { panelId: 'center', min: '20%', max: '100%' },
        {
          panelId: 'right',
          min: '24%',
          collapsible: true,
        },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const initialSizes = [0.24, 0.52, 0.24]

    const following = resizePanelToSize({
      panelIndex: 1,
      size: '55.9999%',
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes,
      panels,
      rootSize: ROOT_SIZE,
    })

    const preceding = resizePanelToSize({
      panelIndex: 1,
      size: '55.9999%',
      strategy: RESIZE_FLAG_PRECEDING,
      initialSizes,
      panels,
      rootSize: ROOT_SIZE,
    })

    const both = resizePanelToSize({
      panelIndex: 1,
      size: '55.9999%',
      strategy: RESIZE_FLAG_BOTH,
      initialSizes,
      panels,
      rootSize: ROOT_SIZE,
    })

    expect(following).toEqual(initialSizes)
    expect(preceding).toEqual(initialSizes)
    expect(both).toEqual(initialSizes)
  })

  test('resizeFromHandle never collapses panels through dragging', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', min: '20%', max: '100%', collapsible: true },
        {
          panelId: 'right',
          min: '20%',
          collapsible: true,
        },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

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

  test('resizeFromHandle keeps a collapsed panel pinned at collapsibleMin when dragging further out', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', min: '20%', max: '100%', collapsible: true, collapsibleMin: '10%' },
        { panelId: 'right', min: '20%', max: '100%', collapsible: true },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

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

  test('resizeFromHandle expands from collapsibleMin without snapping to min', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', min: '20%', max: '100%', collapsible: true, collapsibleMin: '10%' },
        { panelId: 'right', min: '20%', max: '100%', collapsible: true },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

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
})
