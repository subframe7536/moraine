---
apiDocOverride:
  component:
    key: toast
    name: Toast
    category: overlays
    description: solid-toaster integration guide with real runtime examples, including promise and scoped instances.
    polymorphic: false
  slots: []
  props:
    own: []
    inherited: []
---

## Setup

Install solid-toaster, import styles, mount one or more Toaster instances.

:::code-tabs
package: solid-toaster
:::

```tsx
import 'solid-toaster/style.css'

import { Toaster, toast } from 'solid-toaster'

export default function App() {
  return (
    <>
      <button onClick={() => toast.success('Saved!')}>Toast</button>
      <Toaster />
    </>
  )
}
```

## Basic Toasts

Send status toasts to the global toaster instance, including loading to success update.

:::example
name: BasicToasts
:::

## Promise + Scoped Instances

Use toast.promise for async lifecycle and route toasts by toasterId.

:::example
name: PromiseScopedInstances
:::
:::widget
name: toast-hosts
:::
