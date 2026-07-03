import { Resizable } from '@src'

export function VerticalDisable() {
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
