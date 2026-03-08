import { describe, expect, test } from 'vitest'

import {
  collapsePanel,
  expandPanel,
  normalizePanelSizes,
  normalizeSizeVector,
  resolvePanels,
  resizeFromHandle,
  resizePanelToSize,
  toggleHandleNearestPanel,
} from '.'

const ROOT_SIZE = 1000

describe('resizable-core', () => {
  test('resizePanelToSize(strategy=following) keeps collapsible neighbor above minSize', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', minSize: 0.2 },
        { panelId: 'center', minSize: 0.2, maxSize: 1 },
        {
          panelId: 'right',
          minSize: 0.2,
          collapsible: true,
          collapsedSize: 0,
          collapseThreshold: 0.05,
        },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const nextSizes = resizePanelToSize({
      panelIndex: 1,
      size: 0.6,
      strategy: 'following',
      initialSizes: [0.4, 0.3, 0.3],
      panels,
      rootSize: ROOT_SIZE,
    })

    expect(nextSizes[1]).toBeCloseTo(0.4, 6)
    expect(nextSizes[2]).toBeCloseTo(0.2, 6)
  })

  test('resizePanelToSize(strategy=preceding) keeps collapsible neighbor above minSize', () => {
    const panels = resolvePanels(
      [
        {
          panelId: 'left',
          minSize: 0.2,
          collapsible: true,
          collapsedSize: 0,
          collapseThreshold: 0.05,
        },
        { panelId: 'center', minSize: 0.2, maxSize: 1 },
        { panelId: 'right', minSize: 0.2 },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const nextSizes = resizePanelToSize({
      panelIndex: 1,
      size: 0.6,
      strategy: 'preceding',
      initialSizes: [0.3, 0.3, 0.4],
      panels,
      rootSize: ROOT_SIZE,
    })

    expect(nextSizes[0]).toBeCloseTo(0.2, 6)
    expect(nextSizes[1]).toBeCloseTo(0.4, 6)
  })

  test('resizePanelToSize(strategy=both) keeps both collapsible neighbors above minSize', () => {
    const panels = resolvePanels(
      [
        {
          panelId: 'left',
          minSize: 0.2,
          collapsible: true,
          collapsedSize: 0,
          collapseThreshold: 0.05,
        },
        { panelId: 'center', minSize: 0.2, maxSize: 1 },
        {
          panelId: 'right',
          minSize: 0.2,
          collapsible: true,
          collapsedSize: 0,
          collapseThreshold: 0.05,
        },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const nextSizes = resizePanelToSize({
      panelIndex: 1,
      size: 0.8,
      strategy: 'both',
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
        { panelId: 'left', minSize: 0.2, collapsible: false },
        { panelId: 'right', minSize: 0.2 },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const unchangedNonCollapsible = collapsePanel({
      panelIndex: 0,
      strategy: 'following',
      initialSizes: [0.4, 0.6],
      panels: nonCollapsiblePanels,
    })

    expect(unchangedNonCollapsible).toEqual([0.4, 0.6])

    const collapsiblePanels = resolvePanels(
      [
        { panelId: 'left', minSize: 0.2, collapsible: true, collapsedSize: 0 },
        { panelId: 'right', minSize: 0.2 },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const unchangedCollapsed = collapsePanel({
      panelIndex: 0,
      strategy: 'following',
      initialSizes: [0, 1],
      panels: collapsiblePanels,
    })

    expect(unchangedCollapsed).toEqual([0, 1])
  })

  test('expandPanel expands collapsed panel to at least minSize', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', minSize: 0.2, collapsible: true, collapsedSize: 0 },
        { panelId: 'right', minSize: 0.2 },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const nextSizes = expandPanel({
      panelIndex: 0,
      strategy: 'following',
      initialSizes: [0, 1],
      panels,
    })

    expect(nextSizes[0]).toBeCloseTo(0.2, 6)
    expect(nextSizes[1]).toBeCloseTo(0.8, 6)
  })

  test('toggleHandleNearestPanel handles no-collapsible, collapse and expand cases', () => {
    const nonCollapsiblePanels = resolvePanels(
      [
        { panelId: 'left', minSize: 0.2, collapsible: false },
        { panelId: 'right', minSize: 0.2, collapsible: false },
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
        { panelId: 'left', minSize: 0.2, collapsible: true, collapsedSize: 0 },
        { panelId: 'right', minSize: 0.2 },
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
    expect(expanded[0]).toBeCloseTo(0.2, 6)
    expect(expanded[1]).toBeCloseTo(0.8, 6)
  })

  test('resizeFromHandle(altKey) keeps first-handle reverse path equivalent to mirrored center handle', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', minSize: 0.2, maxSize: 0.8 },
        { panelId: 'center', minSize: 0.2, maxSize: 0.9 },
        { panelId: 'right', minSize: 0.2, maxSize: 0.8 },
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

  test('resizePanelToSize keeps strategy behavior stable below collapse threshold around epsilon neighborhood', () => {
    const panels = resolvePanels(
      [
        {
          panelId: 'left',
          minSize: 0.24,
          collapsible: true,
          collapsedSize: 0,
          collapseThreshold: 0.04,
        },
        { panelId: 'center', minSize: 0.2, maxSize: 1 },
        {
          panelId: 'right',
          minSize: 0.24,
          collapsible: true,
          collapsedSize: 0,
          collapseThreshold: 0.04,
        },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const initialSizes = [0.24, 0.52, 0.24]

    const following = resizePanelToSize({
      panelIndex: 1,
      size: 0.559999,
      strategy: 'following',
      initialSizes,
      panels,
      rootSize: ROOT_SIZE,
    })

    const preceding = resizePanelToSize({
      panelIndex: 1,
      size: 0.559999,
      strategy: 'preceding',
      initialSizes,
      panels,
      rootSize: ROOT_SIZE,
    })

    const both = resizePanelToSize({
      panelIndex: 1,
      size: 0.559999,
      strategy: 'both',
      initialSizes,
      panels,
      rootSize: ROOT_SIZE,
    })

    expect(following).toEqual(initialSizes)
    expect(preceding).toEqual(initialSizes)
    expect(both).toEqual(initialSizes)
  })

  test('resizeFromHandle collapses only when collapseThreshold is reached', () => {
    const panels = resolvePanels(
      [
        { panelId: 'left', minSize: 0.2, maxSize: 1 },
        {
          panelId: 'right',
          minSize: 0.24,
          collapsible: true,
          collapsedSize: 0,
          collapseThreshold: 0.04,
        },
      ],
      ROOT_SIZE,
      'resizable-test',
    )

    const initialSizes = [0.76, 0.24]

    const belowThreshold = resizeFromHandle({
      handleIndex: 0,
      deltaPercentage: 0.039999,
      altKey: false,
      initialSizes,
      panels,
    })
    expect(belowThreshold).toEqual(initialSizes)

    const atThreshold = resizeFromHandle({
      handleIndex: 0,
      deltaPercentage: 0.04,
      altKey: false,
      initialSizes,
      panels,
    })

    expect(atThreshold[0]).toBeCloseTo(1, 6)
    expect(atThreshold[1]).toBeCloseTo(0, 6)
  })

  test('normalizeSizeVector handles zero, negative and non-finite inputs', () => {
    expect(normalizeSizeVector([0, 0, 0])).toEqual([0.333333, 0.333333, 0.333334])
    expect(normalizeSizeVector([1, -1, Number.NaN, Number.POSITIVE_INFINITY])).toEqual([1, 0, 0, 0])
    expect(normalizeSizeVector([Number.NaN, Number.POSITIVE_INFINITY])).toEqual([0.5, 0.5])
  })

  test('normalizePanelSizes keeps provided controlled sizes and fills undefined sizes with remainder', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        rootSize: ROOT_SIZE,
        panelInitialSizes: [undefined, undefined, undefined],
        controlledSizes: [0.2, undefined, undefined],
      }),
    ).toEqual([0.2, 0.4, 0.4])
  })

  test('normalizePanelSizes falls back undefined controlled sizes to zero when provided sum exceeds one', () => {
    expect(
      normalizePanelSizes({
        panelCount: 3,
        rootSize: ROOT_SIZE,
        panelInitialSizes: [undefined, undefined, undefined],
        controlledSizes: [0.8, 0.6, undefined],
      }),
    ).toEqual([0.571429, 0.428571, 0])
  })
})
