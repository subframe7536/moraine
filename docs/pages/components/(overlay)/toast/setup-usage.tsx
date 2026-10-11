import { Button, Toaster, toast } from '@src'

export function SetupUsage() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Toaster visibleToasts={4} />
      <Toaster id="custom" placement="bottom" align="start" />
      <Button onClick={() => toast.success('Changes saved!')}>Trigger Success Toast</Button>
    </div>
  )
}
