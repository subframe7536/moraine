import { Button, Empty, Icon } from '@src'

export function CustomContainer() {
  return (
    <Empty
      as="section"
      aria-label="Saved reports"
      class="border border-border rounded-xl border-dashed bg-muted/30"
      classes={{ description: 'max-w-xs' }}
    >
      <Empty.Media>
        <Icon name="i-lucide-chart-no-axes-combined" class="text-muted-foreground size-8" />
      </Empty.Media>
      <Empty.Title as="h2">No saved reports</Empty.Title>
      <Empty.Description>
        Save a report to revisit the metrics that matter to you.
      </Empty.Description>
      <Empty.Actions>
        <Button variant="outline">Create report</Button>
      </Empty.Actions>
    </Empty>
  )
}
