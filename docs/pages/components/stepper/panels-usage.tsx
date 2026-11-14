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
            contentRender: (
              <div class="text-xs text-muted-foreground p-4">
                Configure project name and workspace root.
              </div>
            ),
          },
          {
            value: 'target',
            title: 'Deploy target',
            contentRender: (
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
