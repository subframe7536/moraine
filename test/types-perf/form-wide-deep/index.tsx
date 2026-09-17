import { createForm } from 'moraine'
import * as v from 'valibot'

const branch = v.object({
  a: v.object({ a1: v.object({ a2: v.object({ a3: v.object({ leaf: v.string() }) }) }) }),
  b: v.object({ b1: v.object({ b2: v.object({ b3: v.object({ leaf: v.string() }) }) }) }),
  c: v.object({ c1: v.object({ c2: v.object({ c3: v.object({ leaf: v.string() }) }) }) }),
  list: v.array(v.object({ nested: v.object({ value: v.string(), label: v.string() }) })),
})
const schema = v.object({ first: branch, second: branch, third: branch, fourth: branch })
const form = createForm({ schema })

;<form.Field name={['first', 'a', 'a1', 'a2', 'a3', 'leaf']} />
;<form.Field name={['first', 'b', 'b1', 'b2', 'b3', 'leaf']} />
;<form.Field name={['first', 'c', 'c1', 'c2', 'c3', 'leaf']} />
;<form.Field name={['first', 'list', 0, 'nested', 'value']} />
;<form.Field name={['second', 'a', 'a1', 'a2', 'a3', 'leaf']} />
;<form.Field name={['second', 'b', 'b1', 'b2', 'b3', 'leaf']} />
;<form.Field name={['second', 'c', 'c1', 'c2', 'c3', 'leaf']} />
;<form.Field name={['second', 'list', 0, 'nested', 'label']} />
;<form.Field name={['third', 'a', 'a1', 'a2', 'a3', 'leaf']} />
;<form.Field name={['third', 'b', 'b1', 'b2', 'b3', 'leaf']} />
;<form.Field name={['third', 'c', 'c1', 'c2', 'c3', 'leaf']} />
;<form.Field name={['fourth', 'list', 0, 'nested', 'value']} />
