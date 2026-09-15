import { TagsInput } from '@src'

export function Separators() {
  return (
    <TagsInput
      class="max-w-xs"
      tokenSeparators={[',', ';']}
      placeholder="Type or paste comma-separated tags"
    />
  )
}
