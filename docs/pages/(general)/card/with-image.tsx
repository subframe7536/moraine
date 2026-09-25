import { Button, Card } from '@src'

export function WithImage() {
  return (
    <Card class="max-w-sm w-full overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Landscape by mymind on Unsplash"
        class="w-full aspect-video object-cover brightness-60 grayscale"
      />
      <Card.Body>
        <Card.Title as="h3">Beautiful Landscape</Card.Title>
        <Card.Description class="mt-1">
          A full-bleed image can sit directly inside Card.
        </Card.Description>
      </Card.Body>
      <Card.Footer>
        <Button class="w-full">Open</Button>
      </Card.Footer>
    </Card>
  )
}
