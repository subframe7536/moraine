import { Button, ModalContent, ModalRoot, ModalTrigger } from '@src'

export function Basic() {
  return (
    <ModalRoot hasOverlay hasContent>
      <ModalTrigger>{(props) => <Button {...props}>Open modal</Button>}</ModalTrigger>
      <ModalContent
        overlay
        ariaLabel="Custom modal"
        overlayClass="bg-black/10 p-4 grid place-items-center inset-0 fixed z-50 backdrop-blur-xs"
        class="p-6 outline-none surface-overlay rounded-xl bg-background max-w-md w-full z-50"
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
    </ModalRoot>
  )
}
