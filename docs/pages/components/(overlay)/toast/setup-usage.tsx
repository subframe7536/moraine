import { Button, Toaster, toast } from '@src'

export function SetupUsage() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Toaster id="custom" placement="bottom" align="start" />
      <Button onClick={() => toast.success('Changes saved!')}>Trigger Default Toast</Button>
      <Button
        variant="outline"
        onClick={() => toast.info('Custom bottom-left!', { toasterId: 'custom' })}
      >
        Trigger Custom Toast
      </Button>
    </div>
  )
}
