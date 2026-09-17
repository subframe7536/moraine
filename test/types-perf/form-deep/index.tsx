import { createForm } from 'moraine'
import * as v from 'valibot'

const schema = v.object({
  l1: v.object({
    l2: v.object({
      l3: v.object({
        l4: v.object({
          l5: v.object({
            l6: v.object({
              l7: v.object({
                l8: v.object({ leaf: v.string() }),
              }),
            }),
          }),
        }),
      }),
    }),
  }),
})
const form = createForm({ schema })
const path = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'leaf'] as const

;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
;<form.Field name={path} />
