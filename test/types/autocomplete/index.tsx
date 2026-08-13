import {
  Badge,
  Button,
  Card,
  ContextMenu,
  Dialog,
  DropdownMenu,
  Icon,
  Modal,
  Popover,
  Sheet,
  Tooltip,
} from 'moraine'
import type { ModalT } from 'moraine'
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
  <Modal.Overlay />
  <Modal.Content ariaLabel="Type fixture" contentRender="Modal content" />
</Modal>
;<Dialog>
  {(props) => (
    <a {...props} href="/dialog">
      Open dialog
    </a>
  )}
</Dialog>
;<Popover>{(props) => <span {...props}>Open popover</span>}</Popover>
;<Tooltip>
  {(props) => (
    <button {...props} type="button">
      Hover target
    </button>
  )}
</Tooltip>
;<DropdownMenu items={[]}>
  {(props) => (
    <button {...props} type="button">
      Open menu
    </button>
  )}
</DropdownMenu>
;<ContextMenu items={[]}>{(props) => <div {...props}>Open menu</div>}</ContextMenu>
;<Sheet>{(props) => <span {...props}>Open sheet</span>}</Sheet>

// @ts-expect-error Button<'a'> exposes anchor props and rejects button-only props.
;<Button as="a" formAction="/submit" />
// @ts-expect-error A span root rejects anchor-only attributes.
;<Badge href="/docs" />
// @ts-expect-error Lowercase event aliases are intentionally stripped.
;<Card onclick={() => undefined} />
// @ts-expect-error Solid directive prefixes are intentionally stripped.
;<Card use:foo={foo} />
// @ts-expect-error Required custom component props remain required through `as`.
;<Button as={CustomRoot} />
// @ts-expect-error Required custom component props must be supplied in the callback.
;<Dialog>{(props) => <CustomRoot {...props} />}</Dialog>
