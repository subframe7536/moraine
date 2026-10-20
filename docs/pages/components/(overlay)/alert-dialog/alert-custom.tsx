import { AlertDialog, Button, Input } from '@src'
import { createSignal } from 'solid-js'

export function AlertCustom() {
  const remove = () => {
    void AlertDialog.custom(
      (props) => {
        const [name, setName] = createSignal('')
        return (
          <div class="flex flex-col gap-4">
            <h2 id={props.titleId} class="text-lg text-foreground font-semibold">
              {props.options.title}
            </h2>
            <p id={props.descriptionId} class="text-sm text-muted-foreground">
              {props.options.description}
            </p>
            <Input value={name()} placeholder="Repository name" onValueChange={setName} />
            <div class="flex gap-2 justify-end">
              <Button
                variant="outline"
                disabled={props.pending() !== undefined}
                onClick={(event) => void props.cancel(event)}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                tone="danger"
                disabled={name() !== 'moraine'}
                loadingAuto
                onClick={(event) => props.action(event)}
              >
                Delete
              </Button>
            </div>
          </div>
        )
      },
      {
        title: 'Delete repository?',
        description: 'Type moraine to confirm. This removes the repository and its history.',
        danger: true,
        action: {
          onClick: async () => {
            await new Promise((resolve) => setTimeout(resolve, 400))
          },
        },
      },
    )
  }

  return (
    <Button variant="solid" tone="danger" leading="i-lucide:trash-2" onClick={remove}>
      Delete repository
    </Button>
  )
}
