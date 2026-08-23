import 'solid-toaster/style.css'

import { Button } from '@src'
import { toast } from 'solid-toaster'

export function Duration() {
  return (
    <div class="flex flex-wrap gap-3">
      <Button
        onClick={() => toast.success('This toast closes after two seconds.', { duration: 2000 })}
      >
        Two-second toast
      </Button>
      <Button variant="outline" onClick={() => toast.dismiss()}>
        Dismiss all
      </Button>
    </div>
  )
}
