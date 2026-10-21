import { Alert, Button } from '@src'

export function Actions() {
  return (
    <div class="flex flex-col gap-3 max-w-xl w-full">
      <Alert
        type="info"
        title="Software update available"
        description="Version 2.4.0 includes important performance improvements."
        actions={
          <Button size="sm" variant="outline">
            Upgrade
          </Button>
        }
        close
      />
    </div>
  )
}
