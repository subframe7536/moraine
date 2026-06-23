import { Resizable } from '@src'

export function BasicHorizontal() {
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
