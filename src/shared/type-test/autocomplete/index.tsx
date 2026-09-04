import {
  Avatar,
  Badge,
  Button,
  Card,
  Collapsible,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Icon,
  Modal,
  MoraineProvider,
  Popover,
  Sheet,
  Tooltip,
  useId,
} from 'moraine'
import type { ModalT } from 'moraine'
import { defineStyleVars, recipe } from 'moraine/recipe'
import type { Component, JSX } from 'solid-js'

declare module 'moraine' {
  interface MoraineTypeConfig {
    enableRootAutocomplete: true
  }
}

const CustomRoot: Component<{ required: string; children?: JSX.Element }> = (props) => (
  <section>
    {props.required}
    {props.children}
  </section>
)
const foo = () => undefined
const classRecipe = recipe({ base: 'rounded-md' })
const generatedId = useId()
void classRecipe
void generatedId
const acceptSpan = (element: HTMLSpanElement) => element.focus()
const acceptAnchor = (element: HTMLAnchorElement) => element.focus()
const modalContentContext: ModalT.ContentContext = { close: () => undefined }
modalContentContext.close()

;<Badge
  id="badge"
  title="status"
  hidden
  data-testid="badge"
  onClick={() => undefined}
  ref={(element) => acceptSpan(element)}
/>
;<Avatar text="MR" />
;<Card id="card" title="details" onClick={() => undefined} />
;<Icon name="i-lucide-search" aria-label="Search" hidden onClick={() => undefined} />
;<Button
  as="a"
  href="/docs"
  target="_blank"
  rel="noreferrer"
  onClick={() => undefined}
  ref={(element) => acceptAnchor(element)}
/>
;<Button as={CustomRoot} required="yes" />
;<Button as="input" type="checkbox" />
;<Modal defaultOpen>
  <Modal.Content overlay ariaLabel="Type fixture">
    Modal content
  </Modal.Content>
</Modal>
;<Dialog data-testid="dialog-trigger" hidden>
  {(props) => (
    <a {...props} href="/dialog">
      Open dialog
    </a>
  )}
</Dialog>
;<Popover data-testid="popover-trigger" hidden>
  {(props) => <span {...props}>Open popover</span>}
</Popover>
;<Tooltip data-testid="tooltip-trigger" hidden>
  {(props) => (
    <button {...props} type="button">
      Hover target
    </button>
  )}
</Tooltip>
;<DropdownMenu items={[]} data-testid="dropdown-trigger" hidden>
  {(props) => (
    <button {...props} type="button">
      Open menu
    </button>
  )}
</DropdownMenu>
;<ContextMenu items={[]} data-testid="context-trigger" hidden>
  {(props) => <div {...props}>Open menu</div>}
</ContextMenu>
;<Sheet data-testid="sheet-trigger" hidden>
  {(props) => <span {...props}>Open sheet</span>}
</Sheet>

// @ts-expect-error Button<'a'> exposes anchor props and rejects button-only props.
;<Button as="a" formAction="/submit" />
// @ts-expect-error A span root rejects anchor-only attributes.
;<Badge href="/docs" />
// @ts-expect-error Avatar transition speed is no longer public.
;<Avatar transition="fast" />
// @ts-expect-error Lowercase event aliases are intentionally stripped.
;<Card onclick={() => undefined} />
// @ts-expect-error Solid directive prefixes are intentionally stripped.
;<Card use:foo={foo} />
// @ts-expect-error Required custom component props remain required through `as`.
;<Button as={CustomRoot} />
// @ts-expect-error Required custom component props must be supplied in the callback.
;<Dialog>{(props) => <CustomRoot {...props} />}</Dialog>

// @ts-expect-error String root style is rejected
;<Button style="color: red" />

// @ts-expect-error String slot style is rejected
;<Modal defaultOpen styles={{ content: 'color: red' }} />

// @ts-expect-error Modal root no longer owns named slots.
;<Modal classes={{ trigger: 'trigger' }} />

// @ts-expect-error Collapsible root no longer owns named slots.
;<Collapsible classes={{ trigger: 'trigger' }} />

// @ts-expect-error Provider variant defaults use variants, not defaultProps.
;<MoraineProvider config={{ button: { defaultProps: { size: 'sm' } } }} />

// @ts-expect-error Provider root styles use classes.root instead of class.
;<MoraineProvider config={{ button: { class: 'root' } }} />

// @ts-expect-error Provider root styles use styles.root instead of style.
;<MoraineProvider config={{ button: { style: { color: 'red' } } }} />

// @ts-expect-error Modal has no Provider configuration.
;<MoraineProvider config={{ modal: {} }} />

// @ts-expect-error Collapsible has no Provider configuration.
;<MoraineProvider config={{ collapsible: {} }} />

// @ts-expect-error String defineStyleVars extra styles are rejected
defineStyleVars({ base: { size: '1px' } })({}, 'color: red')

// @ts-expect-error String style values on MoraineProvider config are rejected
;<MoraineProvider config={{ button: { style: 'color: red' } }} />

// @ts-expect-error String styles values on MoraineProvider config are rejected
;<MoraineProvider config={{ button: { styles: { root: 'color: red' } } }} />
