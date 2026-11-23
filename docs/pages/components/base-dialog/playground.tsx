import { Button, BaseDialog } from '@src'
import { Show } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function BaseDialogPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'switch',
          prop: 'closeOnOutsideClick',
          label: 'Close on outside click',
          defaultValue: true,
        },
        { kind: 'switch', prop: 'closeOnEscape', label: 'Close on Escape', defaultValue: true },
        { kind: 'switch', prop: 'overlay', label: 'Overlay', defaultValue: true },
      ]}
    >
      {(props) => (
        <BaseDialog
          closeOnOutsideClick={props.closeOnOutsideClick}
          closeOnEscape={props.closeOnEscape}
        >
          <BaseDialog.Trigger as={Button} variant="outline">
            Open Modal
          </BaseDialog.Trigger>
          <BaseDialog.Portal>
            <Show when={props.overlay}>
              <BaseDialog.Overlay />
            </Show>
            <BaseDialog.Content aria-label="Project details">
              {() => (
                <div class="p-5 gap-4 grid">
                  <div>
                    <h4 class="text-sm text-foreground font-semibold">Custom Modal Surface</h4>
                    <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                      BaseDialog provides focus management, scroll locking, dismissal, and
                      overridable default surface styles.
                    </p>
                  </div>
                  <div class="flex gap-2 justify-end">
                    <BaseDialog.Close as={Button} size="sm" variant="outline">
                      Got it
                    </BaseDialog.Close>
                  </div>
                </div>
              )}
            </BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      )}
    </DocsPlayground>
  )
}
