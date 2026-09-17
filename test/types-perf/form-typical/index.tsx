import { createForm } from 'moraine'
import * as v from 'valibot'

const schema = v.object({
  profile: v.object({
    name: v.string(),
    contact: v.object({ email: v.string(), phone: v.string() }),
  }),
  tags: v.array(v.object({ label: v.string() })),
})
const form = createForm({ schema })

;<form.Field name="profile" />
;<form.Field name={['profile', 'name']} />
;<form.Field name={['profile', 'contact', 'email']} />
;<form.Field name={['tags', 0, 'label']} />
;<form.Field name={['profile', 'contact', 'phone']} />
;<form.Field name={['profile', 'name']} />
;<form.Field name={['profile', 'contact', 'email']} />
;<form.Field name={['tags', 0, 'label']} />
;<form.Field name={['profile', 'contact', 'phone']} />
;<form.Field name={['profile', 'name']} />
;<form.Field name={['profile', 'contact', 'email']} />
;<form.Field name={['tags', 0, 'label']} />
// @ts-expect-error Unknown paths are rejected.
;<form.Field name={['profile', 'missing']} />
