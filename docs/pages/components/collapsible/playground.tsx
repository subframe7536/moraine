import { Button, Card, Collapsible } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function CollapsiblePlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'transition', label: 'Transition', defaultValue: true },
      ]}
    >
      {(props) => (
        <div class="max-w-md min-h-64 w-full">
          <Card>
            <Card.Body>
              <Collapsible transition={props.transition} disabled={props.disabled}>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">@solidjs starred 3 repositories</span>
                  <Collapsible.Trigger
                    as={Button}
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Toggle repositories"
                    leading="i-lucide:chevrons-up-down"
                    disabled={props.disabled}
                  />
                </div>
                <div class="text-sm font-mono mt-2 px-3 py-2 border border-border rounded-lg">
                  @solidjs/router
                </div>
                <Collapsible.Content>
                  <div class="pt-2 space-y-2">
                    <div class="text-sm font-mono px-3 py-2 border border-border rounded-lg">
                      @solidjs/testing-library
                    </div>
                    <div class="text-sm font-mono px-3 py-2 border border-border rounded-lg">
                      subframe7536/moraine
                    </div>
                  </div>
                </Collapsible.Content>
              </Collapsible>
            </Card.Body>
          </Card>
        </div>
      )}
    </DocsPlayground>
  )
}
