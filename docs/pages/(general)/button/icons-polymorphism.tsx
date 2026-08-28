import { Button } from '@src'

export function IconsPolymorphism() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button leading="i-lucide:plus">Create Project</Button>
      <Button variant="outline" trailing="i-lucide:external-link" as="a" href="#polymorphic">
        Documentation Link
      </Button>
      <Button variant="ghost" size="xs" aria-label="Settings" leading="i-lucide:settings" />
    </div>
  )
}
