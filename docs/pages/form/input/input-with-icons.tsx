import { Input } from '@src'

export function InputWithIcons() {
  return (
    <div class="gap-3 grid sm:grid-cols-2">
      <Input
        leading="i-lucide-search"
        placeholder="Search..."
        classes={{ leading: 'bg-muted p-3' }}
      />
      <Input leading="i-lucide-mail" trailing="i-lucide-check" placeholder="Email" />
      <Input
        trailing={<span class="text-xs text-muted-foreground/80">.com</span>}
        placeholder="Domain"
      />
      <Input
        leading={
          <div class="text-muted-foreground flex gap-1 items-center">
            <div class="i-lucide-globe" />
            https://
          </div>
        }
        placeholder="website.com"
        classes={{
          input: 'ps-0',
        }}
      />
    </div>
  )
}
