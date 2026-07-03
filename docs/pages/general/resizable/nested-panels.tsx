import { Icon, Resizable } from '@src'

export function NestedPanels() {
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
