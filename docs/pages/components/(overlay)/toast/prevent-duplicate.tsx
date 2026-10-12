import { Button, Toast } from '@src'

export function PreventDuplicate() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Toast id="pd" placement="top" align="end" preventDuplicate />
      <Button onClick={() => Toast.success({ title: 'Changes saved!', toastId: 'pd' })}>
        Scoped container
      </Button>
      <Button
        variant="outline"
        onClick={() => Toast.info({ title: 'System update available', preventDuplicate: true })}
      >
        Inline Toast.info
      </Button>
    </div>
  )
}
