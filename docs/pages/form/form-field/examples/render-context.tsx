import { Button, Form, FormField, Input } from '@src'
import { createSignal } from 'solid-js'

export function RenderContext() {
  const [state, setState] = createSignal({
    releaseTitle: '',
  })

  return (
    <Form
      state={state()}
      validate={(value) => {
        if (!value?.releaseTitle?.trim()) {
          return [{ name: 'releaseTitle', message: 'Release title is required.' }]
        }
        return []
      }}
      classes={{ root: 'mx-auto max-w-xl w-full space-y-4' }}
    >
      <FormField name="releaseTitle" label="Release Title" required>
        {({ error }) => (
          <Input
            value={state().releaseTitle}
            onValueChange={(value) =>
              setState((prev) => ({ ...prev, releaseTitle: String(value) }))
            }
            placeholder={error ? 'Title is required' : 'v2.14.0'}
          />
        )}
      </FormField>

      <Button type="submit">Create Draft</Button>
    </Form>
  )
}
