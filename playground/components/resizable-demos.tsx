import { createMemo, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'

import { Resizable } from '../../src'

import { DemoPage, DemoSection } from './common/demo-page'

function formatSizes(sizes: number[]): string {
  return sizes.map((size) => `${Math.round(size * 100)}%`).join(' / ')
}

function createPanel(title: string, description: string, tone: string) {
  return (
    <div class={`p-4 h-full ${tone}`}>
      <p class="text-sm text-zinc-800 font-semibold">{title}</p>
      <p class="text-xs text-zinc-600 mt-1">{description}</p>
    </div>
  )
}

export const ResizableDemos = () => {
  const [controlledPanels, setControlledPanels] = createStore([
    {
      size: 0.35,
      minSize: 0.2,
      content: createPanel('Logs', 'Drag handle to re-balance panel sizes.', 'bg-zinc-50'),
    },
    {
      size: 0.65,
      minSize: 0.25,
      content: createPanel('Preview', 'Current ratio is live-updated below.', 'bg-zinc-100'),
    },
  ])
  const controlledSizes = createMemo(() =>
    controlledPanels.map((panel) => (typeof panel.size === 'number' ? panel.size : 0)),
  )
  const [handleIcon, setHandleIcon] = createSignal<'grip' | 'dots'>('grip')
  const [collapseThreshold, setCollapseThreshold] = createSignal(0.08)
  const [collapsedSize, setCollapsedSize] = createSignal(0.06)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = createSignal(false)

  const handleIconClass = createMemo(() =>
    handleIcon() === 'grip' ? 'i-lucide-grip-vertical' : 'i-lucide-grip',
  )

  function handleControlledSizesChange(nextSizes: number[]): void {
    nextSizes.forEach((nextSize, index) => {
      if (typeof nextSize === 'number' && Number.isFinite(nextSize)) {
        setControlledPanels(index, 'size', nextSize)
      }
    })
  }

  return (
    <DemoPage
      eyebrow="Rock UI Playground"
      title="Resizable"
      description="Panel splitter layout powered by panels array, with auto handles between panels."
    >
      <DemoSection
        title="Basic Horizontal"
        description="Two panels with auto-inserted handle and optional handle icon."
      >
        <div class="border border-zinc-200 rounded-xl h-52 overflow-hidden">
          <Resizable
            renderHandle={true}
            panels={[
              {
                initialSize: 0.4,
                minSize: 0.2,
                content: createPanel('Navigation', 'Left panel can shrink to 20%.', 'bg-zinc-100'),
              },
              {
                initialSize: 0.6,
                minSize: 0.3,
                content: createPanel(
                  'Content',
                  'Right panel keeps enough width for details.',
                  'bg-white',
                ),
              },
            ]}
          />
        </div>
      </DemoSection>

      <DemoSection
        title="Controlled Sizes"
        description="Use panel.size + onSizesChange to sync layout state externally."
      >
        <div class="space-y-3">
          <div class="border border-zinc-200 rounded-xl h-48 overflow-hidden">
            <Resizable
              renderHandle={true}
              onSizesChange={handleControlledSizesChange}
              panels={controlledPanels}
            />
          </div>
          <p class="text-xs text-zinc-600">Current sizes: {formatSizes(controlledSizes())}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="Vertical + Per Panel Handle"
        description="Vertical orientation and selective handle rendering via panel.disableHandle."
      >
        <div class="border border-zinc-200 rounded-xl h-72 overflow-hidden">
          <Resizable
            orientation="vertical"
            renderHandle
            classes={{ divider: 'bg-zinc-300/80' }}
            panels={[
              {
                initialSize: 0.33,
                content: createPanel(
                  'Top',
                  'Default handle between top and middle.',
                  'bg-zinc-100',
                ),
              },
              {
                initialSize: 0.34,
                disableHandle: true,
                content: createPanel(
                  'Middle',
                  'disableHandle=true removes the divider after this panel.',
                  'bg-white',
                ),
              },
              {
                initialSize: 0.33,
                content: createPanel('Bottom', 'Last panel in vertical stack.', 'bg-zinc-50'),
              },
            ]}
          />
        </div>
      </DemoSection>

      <DemoSection
        title="Nested Panels"
        description="Use intersection to control whether a crossed edge becomes draggable."
      >
        <div class="gap-4 grid md:grid-cols-2">
          <div class="space-y-2">
            <p class="text-xs text-zinc-600">
              <code>intersection: true</code>
            </p>
            <div class="border border-zinc-200 rounded-xl h-80 overflow-hidden">
              <Resizable
                renderHandle
                classes={{ divider: 'bg-zinc-300/80' }}
                panels={[
                  {
                    initialSize: 0.32,
                    minSize: 0.2,
                    content: createPanel(
                      'Sidebar',
                      'Outer handle intersects the inner split.',
                      'bg-zinc-100',
                    ),
                  },
                  {
                    initialSize: 0.68,
                    minSize: 0.35,
                    content: (
                      <Resizable
                        orientation="vertical"
                        renderHandle
                        classes={{ divider: 'bg-zinc-400/80' }}
                        panels={[
                          {
                            minSize: 0.25,
                            intersection: true,
                            content: createPanel(
                              'Editor',
                              'Cross target is available in this inner handle.',
                              'bg-zinc-50',
                            ),
                          },
                          {
                            minSize: 0.2,
                            content: createPanel(
                              'Console',
                              'Drag the visible cross target for dual-axis resizing.',
                              'bg-zinc-100',
                            ),
                          },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs text-zinc-600">
              <code>intersection: false</code>
            </p>
            <div class="border border-zinc-200 rounded-xl h-80 overflow-hidden">
              <Resizable
                renderHandle
                classes={{ divider: 'bg-zinc-300/80' }}
                panels={[
                  {
                    initialSize: 0.68,
                    minSize: 0.35,
                    content: (
                      <Resizable
                        orientation="vertical"
                        renderHandle
                        classes={{ divider: 'bg-zinc-400/80' }}
                        panels={[
                          {
                            minSize: 0.25,
                            intersection: false,
                            content: createPanel(
                              'Editor',
                              'Cross target is disabled for this inner handle.',
                              'bg-zinc-50',
                            ),
                          },
                          {
                            minSize: 0.2,
                            content: createPanel(
                              'Console',
                              'Only direct dragging on the separator is active.',
                              'bg-zinc-100',
                            ),
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    initialSize: 0.32,
                    minSize: 0.2,
                    content: createPanel(
                      'Inspector',
                      'Comparison panel for nested intersection behavior.',
                      'bg-zinc-100',
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Custom Handle + Configurable Collapse"
        description="Change handle icon, animate hover/dragging line background, and tune collapse behavior live."
      >
        <div class="space-y-4">
          <div class="flex flex-wrap gap-3 items-end">
            <label class="space-y-1">
              <p class="text-xs text-zinc-600">Handle icon</p>
              <select
                class="text-xs px-2 border border-zinc-300 rounded-md bg-white h-8"
                value={handleIcon()}
                onChange={(event) =>
                  setHandleIcon((event.currentTarget.value as 'grip' | 'dots') ?? 'grip')
                }
              >
                <option value="grip">Grip Vertical</option>
                <option value="dots">Grip Dots</option>
              </select>
            </label>

            <label class="space-y-1">
              <p class="text-xs text-zinc-600">
                collapsedSize: {Math.round(collapsedSize() * 100)}%
              </p>
              <input
                class="accent-sky-600 w-40"
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={collapsedSize()}
                onInput={(event) => setCollapsedSize(Number.parseFloat(event.currentTarget.value))}
              />
            </label>

            <label class="space-y-1">
              <p class="text-xs text-zinc-600">
                collapseThreshold: {Math.round(collapseThreshold() * 100)}%
              </p>
              <input
                class="accent-sky-600 w-40"
                type="range"
                min="0.01"
                max="0.3"
                step="0.01"
                value={collapseThreshold()}
                onInput={(event) =>
                  setCollapseThreshold(Number.parseFloat(event.currentTarget.value))
                }
              />
            </label>
          </div>

          <div class="border border-zinc-200 rounded-xl h-56 overflow-hidden">
            <Resizable
              renderHandle={
                <div class={`text-zinc-600 h-3.5 w-3.5 pointer-events-none ${handleIconClass()}`} />
              }
              classes={{
                divider:
                  'w-[6px] rounded-full bg-zinc-300/45 transition-colors duration-200 hover:bg-sky-300/45 data-dragging:bg-sky-500/70',
              }}
              panels={[
                {
                  initialSize: 0.3,
                  minSize: 0.16,
                  collapsible: true,
                  collapsedSize: collapsedSize(),
                  collapseThreshold: collapseThreshold(),
                  onCollapse: () => setIsSidebarCollapsed(true),
                  onExpand: () => setIsSidebarCollapsed(false),
                  content: createPanel(
                    'Sidebar',
                    'Press Enter on handle or drag past threshold to collapse/expand.',
                    'bg-zinc-50',
                  ),
                },
                {
                  initialSize: 0.46,
                  minSize: 0.24,
                  renderHandle: (
                    <div class="i-lucide-chevrons-left-right text-zinc-600 h-3.5 w-3.5 pointer-events-none" />
                  ),
                  content: createPanel(
                    'Editor',
                    'This handle uses another icon to show per-panel customization.',
                    'bg-white',
                  ),
                },
                {
                  initialSize: 0.24,
                  minSize: 0.16,
                  content: createPanel(
                    'Preview',
                    'Hover over handles to see background transition and thicker center line.',
                    'bg-zinc-100',
                  ),
                },
              ]}
            />
          </div>

          <p class="text-xs text-zinc-600">
            Sidebar state: {isSidebarCollapsed() ? 'collapsed' : 'expanded'} · Tip: focus handle,
            then press <kbd class="px-1 py-0.5 border border-zinc-300 rounded">Enter</kbd> to toggle
            collapse.
          </p>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
