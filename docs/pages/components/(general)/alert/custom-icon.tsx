import { Alert } from '@src'

export function CustomIconExample() {
  return (
    <div class="flex flex-col gap-3 max-w-xl w-full">
      <Alert
        type="default"
        icon="icon-tip"
        title="Pro tip"
        description="You can press Ctrl + K to quickly open the command palette from anywhere."
      />
      <Alert
        type="info"
        icon={false}
        title="No icon alert"
        description="This alert has icon={false} to suppress the default status icon."
      />
    </div>
  )
}
