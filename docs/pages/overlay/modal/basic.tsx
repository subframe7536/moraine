import { Button, Modal } from '@src'

export function Basic() {
  return (
    <Modal>
      <Modal.Trigger>{(props) => <Button {...props}>Open modal</Button>}</Modal.Trigger>
      <Modal.Overlay class="bg-black/10 inset-0 fixed z-50 backdrop-blur-xs" />
      <Modal.Content
        ariaLabel="Custom modal"
        class="p-6 outline-none surface-overlay rounded-xl bg-background max-w-md w-full left-1/2 top-1/2 fixed z-50 -translate-x-1/2 -translate-y-1/2"
        contentRender={(context) => (
          <div class="gap-4 grid">
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
