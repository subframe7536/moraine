import { Button } from '@src'

export function Sizes() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button size="xs" variant="outline">
        xs / Copy
      </Button>
      <Button size="sm" variant="outline" leading="i-lucide:filter">
        sm / Filter
      </Button>
      <Button size="md" variant="default" leading="i-lucide:check">
        md / Save Changes
      </Button>
      <Button size="lg" variant="default" leading="i-lucide:sparkles">
        lg / Create Project
      </Button>
      <Button size="xl" variant="default" leading="i-lucide:rocket">
        xl / Get Started Free
      </Button>
    </div>
  )
}
