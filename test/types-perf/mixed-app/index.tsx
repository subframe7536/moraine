import { Button, Combobox, Dialog, Field, Input, MultiSelect, Select, createForm } from 'moraine'
import { defineTheme } from 'moraine/theme'
import type { JSX } from 'solid-js'
import * as v from 'valibot'

const theme = defineTheme({
  button: { defaultVariants: { size: 'sm' } },
  field: { base: { root: 'gap-2' } },
  select: { defaultVariants: { size: 'md' } },
})
void theme

const schema = v.object({ profile: v.object({ email: v.string(), name: v.string() }) })
const form = createForm({ schema })
const Link = (props: { requiredProp: string; children?: JSX.Element }) => <a>{props.children}</a>
const items = [
  { value: 1, label: 'One', meta: 'first' },
  { value: 2, label: 'Two', meta: 'second' },
]

;<Button variant="ghost">Save</Button>
;<Button as="a" href="/docs">
  Docs
</Button>
;<Button as={Link} requiredProp="ok">
  Custom
</Button>
;<Dialog.Trigger as={Button} variant="outline">
  Open
</Dialog.Trigger>
;<Field label="Email">
  <Input />
</Field>
;<form.Field name={['profile', 'email']}>
  <Input />
</form.Field>
;<Select items={items} itemRender={({ item }) => item.meta} />
;<Combobox items={items} filterItem={(query, item) => item.meta.includes(query)} />
;<MultiSelect items={items} value={[1, 99]} onChange={(value) => value.map(Number)} />
