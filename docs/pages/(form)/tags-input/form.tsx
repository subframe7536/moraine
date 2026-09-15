import { TagsInput } from '@src'

export function Form() {
  return (
    <form class="max-w-xs space-y-2">
      <TagsInput
        name="skills"
        required
        maxCount={4}
        defaultValue={['typescript']}
        tagRender={({ value, onClose }) => (
          <button type="button" onClick={onClose}>
            {value}
          </button>
        )}
        placeholder="Add skills"
      />
      <button type="reset">Reset</button>
    </form>
  )
}
