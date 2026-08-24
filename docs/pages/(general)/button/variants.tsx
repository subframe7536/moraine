import { Button } from '@src'

export function Variants() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button variant="default" leading="i-lucide:rocket">
        Deploy Now
      </Button>
      <Button variant="secondary" leading="i-lucide:save">
        Save Draft
      </Button>
      <Button variant="outline" leading="i-lucide:eye">
        Preview
      </Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive" leading="i-lucide:trash-2">
        Delete Project
      </Button>
      <Button variant="link" trailing="i-lucide:arrow-right">
        Documentation
      </Button>
    </div>
  )
}
