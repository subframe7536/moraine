import { Stepper } from '@src'

export function PanelsUsage() {
  return (
    <div class="max-w-md w-full">
      <Stepper
        defaultValue="details"
        items={[
          {
            value: 'details',
            title: 'Project details',
            content: (
              <div class="text-muted-foreground p-4 text-xs">
                Configure project name and workspace root.
              </div>
            ),
          },
          {
            value: 'target',
            title: 'Deploy target',
            content: (
              <div class="text-muted-foreground p-4 text-xs">
                Select cloud provider and cluster region.
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
