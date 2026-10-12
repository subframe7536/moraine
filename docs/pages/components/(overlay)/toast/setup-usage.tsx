import { Button, Toast } from '@src'

export function SetupUsage() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Toast id="setup-custom" placement="bottom" align="start" />
      <Button onClick={() => Toast.success({ title: 'Changes saved!' })}>
        Trigger Default Toast
      </Button>
      <Button
        variant="outline"
        onClick={() => Toast.info({ title: 'Custom bottom-left!', toastId: 'setup-custom' })}
      >
        Trigger Custom Toast
      </Button>
    </div>
  )
}
