import { Button } from '@src/elements/button/button'

export function Polymorphic() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button as="a" href="https://www.solidjs.com" target="_blank" rel="noreferrer" variant="link">
        SolidJS docs
      </Button>
      <Button
        as="a"
        href="https://kobalte.dev"
        target="_blank"
        rel="noreferrer"
        variant="secondary"
      >
        Kobalte
      </Button>
    </div>
  )
}
