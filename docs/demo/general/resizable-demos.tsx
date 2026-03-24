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
      <p class="text-sm text-foreground font-semibold">{title}</p>
      <p class="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  )
}

function BasicHorizontal() {
  function createPanel(title: string, description: string, tone: string) {
    return (
      <div class={`p-4 h-full ${tone}`}>
        <p class="text-sm text-foreground font-semibold">{title}</p>
        <p class="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    )
  }

  return (
    <div class="b-1 b-border border-border rounded-xl h-52 overflow-hidden">
      <Resizable
        renderHandle
        panels={[
          {
            defaultSize: '40%',
            min: '20%',
            content: createPanel('Navigation', 'Left panel can shrink to 20%.', 'bg-muted'),
          },
          {
            defaultSize: '60%',
            min: '30%',
            content: createPanel(
              'Content',
              'Right panel keeps enough width for details.',
              'bg-background',
            ),
          },
        ]}
      />
    </div>
  )
}

function ControlledSizes() {
  function formatPixelSizes(sizes: number[]): string {
    return sizes.map((size) => `${Math.round(size)}px`).join(' / ')
  }

  const [controlledPanels, setControlledPanels] = createStore([
    {
      size: 360,
      min: '20%' as const,
      content: createPanel(
        'Logs',
        'Drag or use arrow keys to rebalance with px callbacks.',
        'bg-muted',
      ),
    },
    {
      size: 640,
      min: '25%' as const,
      content: createPanel(
        'Preview',
        'The external store writes callback px values back into panel.size.',
        'bg-background',
      ),
    },
  ])

  const controlledSizes = createMemo(() =>
    controlledPanels.map((panel) => (typeof panel.size === 'number' ? panel.size : 0)),
  )

  function handleControlledResize(nextSizes: number[]): void {
    nextSizes.forEach((nextSize, index) => {
      if (Number.isFinite(nextSize)) {
        setControlledPanels(index, 'size', nextSize)
      }
    })
  }

  function createPanel(title: string, description: string, tone: string) {
    return (
      <div class={`p-4 h-full ${tone}`}>
        <p class="text-sm text-foreground font-semibold">{title}</p>
        <p class="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    )
  }

  return (
    <div class="space-y-3">
      <div class="b-1 b-border border-border rounded-xl h-48 overflow-hidden">
        <Resizable renderHandle onResize={handleControlledResize} panels={controlledPanels} />
      </div>
      <p class="text-xs text-muted-foreground">
        Current sizes: {formatPixelSizes(controlledSizes())}
      </p>
    </div>
  )
}

function VerticalDisable() {
  function createPanel(title: string, description: string, tone: string) {
    return (
      <div class={`p-4 h-full ${tone}`}>
        <p class="text-sm text-foreground font-semibold">{title}</p>
        <p class="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    )
  }

  return (
    <div class="gap-4 grid md:grid-cols-2">
      <div class="space-y-2">
        <p class="text-xs text-muted-foreground">
          <code>disable: false</code>
        </p>
        <div class="b-1 b-border border-border rounded-xl h-72 overflow-hidden">
          <Resizable
            orientation="vertical"
            renderHandle
            classes={{ divider: 'bg-accent/80' }}
            panels={[
              {
                defaultSize: '33%',
                content: createPanel(
                  'Top',
                  'Interactive vertical divider between top and middle.',
                  'bg-muted',
                ),
              },
              {
                defaultSize: '34%',
                min: '30%',
                content: createPanel(
                  'Middle',
                  'All dividers remain present because handle settings live on the root now.',
                  'bg-background',
                ),
              },
              {
                defaultSize: '33%',
                content: createPanel('Bottom', 'Last panel in the vertical stack.', 'bg-muted'),
              },
            ]}
          />
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-xs text-muted-foreground">
          <code>disable: true</code>
        </p>
        <div class="b-1 b-border border-border rounded-xl h-72 overflow-hidden">
          <Resizable
            disable
            orientation="vertical"
            renderHandle
            classes={{ divider: 'bg-accent/80 opacity-80' }}
            panels={[
              {
                defaultSize: '33%',
                content: createPanel(
                  'Top',
                  'Divider stays visible but is not interactive.',
                  'bg-muted',
                ),
              },
              {
                defaultSize: '34%',
                content: createPanel(
                  'Middle',
                  'Keyboard and pointer resizing are both disabled.',
                  'bg-background',
                ),
              },
              {
                defaultSize: '33%',
                content: createPanel('Bottom', 'Useful for read-only layouts.', 'bg-muted'),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function NestedPanels() {
  function createPanel(title: string, description: string, tone: string) {
    return (
      <div class={`p-4 h-full ${tone}`}>
        <p class="text-sm text-foreground font-semibold">{title}</p>
        <p class="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    )
  }

  return (
    <div class="gap-4 grid md:grid-cols-2">
      <div class="space-y-2">
        <p class="text-xs text-muted-foreground">
          <code>intersection: true</code>
        </p>
        <div class="b-1 b-border border-border rounded-xl h-72 overflow-hidden">
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
                  'bg-muted',
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
                        content: createPanel('Editor', 'Nested top panel.', 'bg-background'),
                      },
                      {
                        defaultSize: '50%',
                        min: '20%',
                        content: createPanel(
                          'Console',
                          'Nested bottom panel with cross drag enabled.',
                          'bg-muted/50',
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
                  'bg-muted',
                ),
              },
            ]}
          />
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-xs text-muted-foreground">
          <code>intersection: false</code>
        </p>
        <div class="b-1 b-border border-border rounded-xl h-72 overflow-hidden">
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
                        content: createPanel('Editor', 'Nested top panel.', 'bg-background'),
                      },
                      {
                        defaultSize: '50%',
                        min: '20%',
                        content: createPanel(
                          'Console',
                          'Nested bottom panel with cross drag disabled.',
                          'bg-muted/50',
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
                  'bg-muted',
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function CollapsibleCollapsibleMin() {
  function createPanel(title: string, description: string, tone: string) {
    return (
      <div class={`p-4 h-full ${tone}`}>
        <p class="text-sm text-foreground font-semibold">{title}</p>
        <p class="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    )
  }

  const [externalSizes, setExternalSizes] = createSignal<[number, number]>([320, 680])

  const externalPixelSizes = createMemo(() => formatPixelSizes(externalSizes()))

  function handleExternalResize(nextSizes: number[]): void {
    const sidebarSize = nextSizes[0]
    const contentSize = nextSizes[1]
    if (!Number.isFinite(sidebarSize) || !Number.isFinite(contentSize)) {
      return
    }

    setExternalSizes([sidebarSize, contentSize])
  }

  function formatPixelSizes(sizes: number[]): string {
    return sizes.map((size) => `${Math.round(size)}px`).join(' / ')
  }

  return (
    <div class="space-y-4">
      <div class="b-1 b-border border-border rounded-xl h-56 overflow-hidden">
        <Resizable
          handleAction="collapse"
          renderHandle={(state) => (
            <Icon name={state.collapsed ? 'i-lucide:align-justify' : 'i-lucide:align-left'} />
          )}
          onResize={handleExternalResize}
          classes={{
            divider:
              'w-[6px] rounded-full bg-accent/45 transition-colors duration-200 hover:bg-accent/45 data-dragging:bg-primary/70',
          }}
          panels={[
            {
              size: externalSizes()[0],
              min: '16%',
              collapsible: true,
              collapsibleMin: '10%',
              content: createPanel(
                'Sidebar',
                'Click the handle to collapse/expand. Drag the divider to resize.',
                'bg-muted',
              ),
            },
            {
              size: externalSizes()[1],
              min: '24%',
              content: createPanel(
                'Editor',
                'Dragging still works and keeps controlled px sizes in sync.',
                'bg-background',
              ),
            },
          ]}
        />
      </div>

      <p class="text-xs text-muted-foreground">
        Try: click handle to toggle, drag divider to resize.
      </p>
      <p class="text-xs text-muted-foreground">Current sizes: {externalPixelSizes()}</p>
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
        'bg-muted',
      ),
    },
    {
      size: 640,
      min: '25%' as const,
      content: createPanel(
        'Preview',
        'The external store writes callback px values back into panel.size.',
        'bg-background',
      ),
    },
  ])
  const _controlledSizes = createMemo(() =>
    controlledPanels.map((panel) => (typeof panel.size === 'number' ? panel.size : 0)),
  )
  const [externalSizes, setExternalSizes] = createSignal<[number, number]>([320, 680])
  const _externalPixelSizes = createMemo(() => formatPixelSizes(externalSizes()))

  function _handleControlledResize(nextSizes: number[]): void {
    nextSizes.forEach((nextSize, index) => {
      if (Number.isFinite(nextSize)) {
        setControlledPanels(index, 'size', nextSize)
      }
    })
  }

  function _handleExternalResize(nextSizes: number[]): void {
    const sidebarSize = nextSizes[0]
    const contentSize = nextSizes[1]
    if (!Number.isFinite(sidebarSize) || !Number.isFinite(contentSize)) {
      return
    }

    setExternalSizes([sidebarSize, contentSize])
  }

  return (
    <DemoPage componentKey="resizable">
      <DemoSection
        title="Basic Horizontal"
        description="Two panels with auto-inserted divider and root-level handle rendering."
        demo={BasicHorizontal}
      />

      <DemoSection
        title="Controlled Sizes"
        description="Use panel.size + onResize to sync external state. The callback now returns pixel sizes."
        demo={ControlledSizes}
      />

      <DemoSection
        title="Vertical + Disable"
        description="The root disable prop keeps dividers visible while turning off drag and keyboard resizing."
        demo={VerticalDisable}
      />

      <DemoSection
        title="Nested Panels"
        description="Use the root intersection prop to control whether crossed dividers become draggable."
        demo={NestedPanels}
      />

      <DemoSection
        title="Collapsible + Collapsible Min"
        description="Clicking handle toggles collapse/expand while dragging divider still resizes. The collapsibleMin rail remains visible in collapsed state."
        demo={CollapsibleCollapsibleMin}
      />
    </DemoPage>
  )
}
