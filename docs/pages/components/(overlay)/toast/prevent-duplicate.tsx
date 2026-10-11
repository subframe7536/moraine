import { Button, Toaster, toast } from '@src'

export function PreventDuplicate() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Toaster id="pd" placement="top" align="end" preventDuplicate />
      <Button onClick={() => toast.success('Changes saved!', { toasterId: 'pd' })}>
        Scoped container
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.info('System update available', { preventDuplicate: true })}
      >
        Inline toast.info
      </Button>
    </div>
  )
}
