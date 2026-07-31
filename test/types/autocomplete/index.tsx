import { Badge, Button, Card, Icon } from 'moraine'
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
