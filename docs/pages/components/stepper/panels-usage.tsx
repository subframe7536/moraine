import { Stepper } from '@src'
export function PanelsUsage() {
  return (
    <div class="max-w-md w-full">
      <Stepper
        defaultValue="details"
        navigation="free"
        items={[
          {
            value: 'details',
            label: 'Project details',
            content: (
              <div class="text-xs text-muted-foreground p-4">
                Configure project name and workspace root.
              </div>
            ),
          },
          {
            value: 'target',
            label: 'Deploy target',
            content: (
              <div class="text-xs text-muted-foreground p-4">
                Select cloud provider and cluster region.
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
