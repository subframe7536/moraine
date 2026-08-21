import { Button, Modal } from '@src'

export function Basic() {
  return (
    <Modal>
      <Modal.Trigger>{(props) => <Button {...props}>Open modal</Button>}</Modal.Trigger>
      <Modal.Content
        overlay
        ariaLabel="Custom modal"
        contentRender={(context) => (
          <div class="p-4 gap-4 grid">
            <p class="text-sm text-foreground">
              Compose a custom modal surface from the low-level primitives.
            </p>
            <Button class="justify-self-end" onClick={context.close}>
              Close
            </Button>
          </div>
        )}
      />
    </Modal>
  )
}
