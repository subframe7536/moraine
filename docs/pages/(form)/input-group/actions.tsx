import { Button, Icon, Input, InputGroup } from '@src'
import { createSignal, Show } from 'solid-js'

const targetURL = 'https://github.com/subframe7536/moraine'

export function Actions() {
  const [copied, setCopied] = createSignal(false)
  const [favorite, setFavorite] = createSignal(false)

  const copyUrl = () => {
    void navigator.clipboard?.writeText(targetURL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div class="gap-4 grid max-w-md w-full">
      <InputGroup>
        <Input aria-label="Profile URL" value={targetURL} readOnly />
        <InputGroup.Trailing compact>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="Copy URL"
            onClick={copyUrl}
          >
            <Icon name={copied() ? 'i-lucide:check' : 'i-lucide:copy'} />
          </Button>
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <InputGroup.Leading compact>https://</InputGroup.Leading>
        <Input aria-label="Secure URL" placeholder="example.com" />
        <InputGroup.Trailing compact>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="Toggle favorite"
            aria-pressed={favorite()}
            onClick={() => setFavorite((value) => !value)}
          >
            <Show when={favorite()} fallback={<Icon name="i-lucide:star" />}>
              <Icon name="i-lucide:star" class="text-primary fill-primary" />
            </Show>
          </Button>
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <Input aria-label="Search" placeholder="Type to search..." />
        <InputGroup.Trailing compact>
          <Button type="button" size="xs" variant="secondary">
            Search
          </Button>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
