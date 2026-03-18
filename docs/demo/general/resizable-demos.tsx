import { createMemo, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'

import { Icon, Resizable } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function formatPixelSizes(sizes: number[]): string {
  return sizes.map((size) => `${Math.round(size)}px`).join(' / ')
}

function createPanel(title: string, description: string, tone: string) {
  return (
    <div class={`p-4 h-full ${tone}`}>
      <p class="text-sm text-zinc-800 font-semibold">{title}</p>
      <p class="text-xs text-zinc-600 mt-1">{description}</p>
    </div>
  )
}

export default () => {
  const [controlledPanels, setControlledPanels] = createStore([
    {
      size: 360,
      min: '20%' as const,
      content: createPanel(
        'Logs',
        'Drag or use arrow keys to rebalance with px callbacks.',
        'bg-zinc-50',
      ),
    },
    {
      size: 640,
      min: '25%' as const,
      content: createPanel(
        'Preview',
        'The external store writes callback px values back into panel.size.',
        'bg-zinc-100',
      ),
    },
  ])
  const controlledSizes = createMemo(() =>
    controlledPanels.map((panel) => (typeof panel.size === 'number' ? panel.size : 0)),
  )
  const [handleIcon, setHandleIcon] = createSignal<'grip' | 'dots'>('grip')
  const [externalSizes, setExternalSizes] = createSignal<[number, number]>([320, 680])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = createSignal(false)
  const [lastExpandedSize, setLastExpandedSize] = createSignal(320)

  const handleIconClass = createMemo(() =>
    handleIcon() === 'grip' ? 'i-lucide-grip-vertical' : 'i-lucide-grip',
  )

  function handleControlledResize(nextSizes: number[]): void {
    nextSizes.forEach((nextSize, index) => {
      if (Number.isFinite(nextSize)) {
        setControlledPanels(index, 'size', nextSize)
      }
    })
  }

  function handleExternalResize(nextSizes: number[]): void {
    const sidebarSize = nextSizes[0]
    const contentSize = nextSizes[1]
    if (!Number.isFinite(sidebarSize) || !Number.isFinite(contentSize)) {
      return
    }

    setExternalSizes([sidebarSize, contentSize])
    if (sidebarSize > 0) {
      setLastExpandedSize(sidebarSize)
    }
  }

  function toggleExternalSidebar(): void {
    const [sidebarSize, contentSize] = externalSizes()
    const totalSize = sidebarSize + contentSize > 0 ? sidebarSize + contentSize : 1000

    if (sidebarSize <= 0) {
      const restoredSize = Math.min(Math.max(lastExpandedSize(), totalSize * 0.16), totalSize)
      setExternalSizes([restoredSize, Math.max(totalSize - restoredSize, 0)])
      return
    }

    setLastExpandedSize(sidebarSize)
    setExternalSizes([0, totalSize])
  }

  return (
    <DemoPage componentKey="resizable">
      <DemoSection
        title="Basic Horizontal"
        description="Two panels with auto-inserted divider and root-level handle rendering."
      >
        <div class="b-1 b-border border-zinc-200 rounded-xl h-52 overflow-hidden">
          <Resizable
            renderHandle
            panels={[
              {
                defaultSize: '40%',
                min: '20%',
                content: createPanel('Navigation', 'Left panel can shrink to 20%.', 'bg-zinc-100'),
              },
              {
                defaultSize: '60%',
                min: '30%',
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
        description="Use panel.size + onResize to sync external state. The callback now returns pixel sizes."
      >
        <div class="space-y-3">
          <div class="b-1 b-border border-zinc-200 rounded-xl h-48 overflow-hidden">
            <Resizable renderHandle onResize={handleControlledResize} panels={controlledPanels} />
          </div>
          <p class="text-xs text-zinc-600">Current sizes: {formatPixelSizes(controlledSizes())}</p>
        </div>
      </DemoSection>

      <DemoSection
        title="Vertical + Disable"
        description="The root disable prop keeps dividers visible while turning off drag and keyboard resizing."
      >
        <div class="gap-4 grid md:grid-cols-2">
          <div class="space-y-2">
            <p class="text-xs text-zinc-600">
              <code>disable: false</code>
            </p>
            <div class="b-1 b-border border-zinc-200 rounded-xl h-72 overflow-hidden">
              <Resizable
                orientation="vertical"
                renderHandle
                classes={{ divider: 'bg-zinc-300/80' }}
                panels={[
                  {
                    defaultSize: '33%',
                    content: createPanel(
                      'Top',
                      'Interactive vertical divider between top and middle.',
                      'bg-zinc-100',
                    ),
                  },
                  {
                    defaultSize: '34%',
                    min: '30%',
                    content: createPanel(
                      'Middle',
                      'All dividers remain present because handle settings live on the root now.',
                      'bg-white',
                    ),
                  },
                  {
                    defaultSize: '33%',
                    content: createPanel(
                      'Bottom',
                      'Last panel in the vertical stack.',
                      'bg-zinc-50',
                    ),
                  },
                ]}
              />
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs text-zinc-600">
              <code>disable: true</code>
            </p>
            <div class="b-1 b-border border-zinc-200 rounded-xl h-72 overflow-hidden">
              <Resizable
                disable
                orientation="vertical"
                renderHandle
                classes={{ divider: 'bg-zinc-300/80 opacity-80' }}
                panels={[
                  {
                    defaultSize: '33%',
                    content: createPanel(
                      'Top',
                      'Divider stays visible but is not interactive.',
                      'bg-zinc-100',
                    ),
                  },
                  {
                    defaultSize: '34%',
                    content: createPanel(
                      'Middle',
                      'Keyboard and pointer resizing are both disabled.',
                      'bg-white',
                    ),
                  },
                  {
                    defaultSize: '33%',
                    content: createPanel('Bottom', 'Useful for read-only layouts.', 'bg-zinc-50'),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Nested Panels"
        description="Use the root intersection prop to control whether crossed dividers become draggable."
      >
        <div class="gap-4 grid md:grid-cols-2">
          <div class="space-y-2">
            <p class="text-xs text-zinc-600">
              <code>intersection: true</code>
            </p>
            <div class="b-1 b-border border-zinc-200 rounded-xl h-72 overflow-hidden">
              <Resizable
                renderHandle
                intersection
                panels={[
                  {
                    defaultSize: '32%',
                    min: '20%',
                    content: createPanel(
                      'Sidebar',
                      'Outer divider can intersect with the nested group.',
                      'bg-zinc-50',
                    ),
                  },
                  {
                    defaultSize: '68%',
                    min: '35%',
                    content: (
                      <Resizable
                        orientation="vertical"
                        renderHandle
                        intersection
                        panels={[
                          {
                            defaultSize: '50%',
                            min: '25%',
                            content: createPanel('Editor', 'Nested top panel.', 'bg-white'),
                          },
                          {
                            defaultSize: '50%',
                            min: '20%',
                            content: createPanel(
                              'Console',
                              'Nested bottom panel with cross drag enabled.',
                              'bg-zinc-100',
                            ),
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    defaultSize: '32%',
                    min: '20%',
                    content: createPanel(
                      'Sidebar',
                      'Outer divider can intersect with the nested group.',
                      'bg-zinc-50',
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
            <div class="b-1 b-border border-zinc-200 rounded-xl h-72 overflow-hidden">
              <Resizable
                renderHandle
                intersection={false}
                panels={[
                  {
                    defaultSize: '68%',
                    min: '35%',
                    content: (
                      <Resizable
                        orientation="vertical"
                        renderHandle={<Icon name="i-lucide:activity" />}
                        intersection={false}
                        panels={[
                          {
                            defaultSize: '50%',
                            min: '25%',
                            content: createPanel('Editor', 'Nested top panel.', 'bg-white'),
                          },
                          {
                            defaultSize: '50%',
                            min: '20%',
                            content: createPanel(
                              'Console',
                              'Nested bottom panel with cross drag disabled.',
                              'bg-zinc-100',
                            ),
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    defaultSize: '32%',
                    min: '20%',
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
        title="Custom Handle + External Collapse Button"
        description="Collapse is controlled by an external button and signal; no built-in collapse icon is rendered."
      >
        <div class="space-y-4">
          <div class="flex flex-wrap gap-3 items-end">
            <label class="space-y-1">
              <p class="text-xs text-zinc-600">Handle icon</p>
              <select
                class="text-xs px-2 b-1 b-border border-zinc-300 rounded-md bg-white h-8"
                value={handleIcon()}
                onChange={(event) =>
                  setHandleIcon((event.currentTarget.value as 'grip' | 'dots') ?? 'grip')
                }
              >
                <option value="grip">Grip Vertical</option>
                <option value="dots">Grip Dots</option>
              </select>
            </label>

            <button
              type="button"
              class="text-xs text-zinc-700 px-3 b-1 b-border border-zinc-300 rounded-md bg-white h-8 hover:bg-zinc-50"
              onClick={toggleExternalSidebar}
            >
              {isSidebarCollapsed() ? 'Expand Sidebar' : 'Collapse Sidebar'}
            </button>
          </div>

          <div class="b-1 b-border border-zinc-200 rounded-xl h-56 overflow-hidden">
            <Resizable
              renderHandle={
                <div class={`text-zinc-600 h-3.5 w-3.5 pointer-events-none ${handleIconClass()}`} />
              }
              onResize={handleExternalResize}
              classes={{
                divider:
                  'w-[6px] rounded-full bg-zinc-300/45 transition-colors duration-200 hover:bg-sky-300/45 data-dragging:bg-sky-500/70',
              }}
              panels={[
                {
                  size: externalSizes()[0],
                  min: '16%',
                  collapsible: true,
                  onCollapse: () => setIsSidebarCollapsed(true),
                  onExpand: () => setIsSidebarCollapsed(false),
                  content: createPanel(
                    'Sidebar',
                    'Use the external button to collapse to 0 and restore the last expanded size.',
                    'bg-zinc-50',
                  ),
                },
                {
                  size: externalSizes()[1],
                  min: '24%',
                  content: createPanel(
                    'Editor',
                    'Divider dragging still works and updates external controlled sizes.',
                    'bg-white',
                  ),
                },
              ]}
            />
          </div>

          <p class="text-xs text-zinc-600">
            Sidebar state: {isSidebarCollapsed() ? 'collapsed' : 'expanded'} · Last expanded:{' '}
            {Math.round(lastExpandedSize())}px
          </p>
        </div>
      </DemoSection>
    </DemoPage>
  )
}
