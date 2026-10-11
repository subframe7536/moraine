import { Button, Toaster, toast } from '@src'

export function PrevientDuplicate() {
  return (
    <div class="space-y-4">
      <Toaster id="pd" placement="top" align="end" preventDuplicate />
      <Button onClick={() => toast.success('Changes saved!', { toasterId: 'pd' })}>
        Trigger Success Toast
      </Button>
    </div>
  )
}
