import { Button, Dialog } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function DialogPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'input', prop: 'title', label: 'Title', defaultValue: 'Preview dialog' },
        { kind: 'switch', prop: 'fullscreen', label: 'Fullscreen', defaultValue: false },
        { kind: 'switch', prop: 'overlay', label: 'Overlay', defaultValue: true },
      ]}
    >
      {(props) => (
        <Dialog fullscreen={props.fullscreen} overlay={props.overlay}>
          <Dialog.Trigger as={Button} variant="outline">
            Open Dialog
          </Dialog.Trigger>
          <Dialog.Content
            title={props.title}
            description="Try the layout controls, then close this preview."
          >
            <Dialog.Body>
              <p class="text-sm text-muted-foreground leading-relaxed">
                Use this surface for a task that needs focused attention. Change the title,
                fullscreen layout, or overlay in the Playground controls.
              </p>
            </Dialog.Body>
            <Dialog.Footer>
              <div class="flex gap-2 w-full justify-end">
                <Dialog.Close as={Button} variant="ghost" size="sm">
                  Cancel
                </Dialog.Close>
                <Dialog.Close as={Button} size="sm">
                  Done
                </Dialog.Close>
              </div>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      )}
    </DocsPlayground>
  )
}
