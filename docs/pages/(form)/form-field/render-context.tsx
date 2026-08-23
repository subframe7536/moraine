import { Button, createForm, Form, FormField, Input } from '@src'
import * as v from 'valibot'

export function RenderContext() {
  const form = createForm({
    schema: v.object({
      releaseTitle: v.pipe(v.string(), v.nonEmpty('Release title is required.')),
    }),
    initialInput: { releaseTitle: '' },
  })

  return (
    <Form of={form} class="mx-auto max-w-xl w-full space-y-4">
      <FormField name="releaseTitle" label="Release Title" required>
        {(props) => <Input placeholder={props.error ? 'Title is required' : 'v2.14.0'} />}
      </FormField>

      <Button type="submit">Create Draft</Button>
    </Form>
  )
}
