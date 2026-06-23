import { Button, Card } from '@src'

export function WithImage() {
  return (
    <div class="max-w-sm">
      <Card
        classes={{ header: 'pb-6' }}
        header={
          <img
            src="https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Landscape by mymind on Unsplash"
            class="rounded-t-2xl w-full aspect-video object-cover brightness-60 grayscale"
          />
        }
        footer={<Button classes={{ root: 'w-full' }}>Open</Button>}
      >
        <h3 class="font-semibold">Beautiful Landscape</h3>
        <p class="text-sm text-muted-foreground mt-1">
          A compact media card style adapted to the sealed Moraine Card API.
        </p>
      </Card>
    </div>
  )
}
