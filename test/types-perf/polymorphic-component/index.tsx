import { Button, Dialog, DropdownMenu } from 'moraine'
import type { JSX } from 'solid-js'

interface CustomLinkProps {
  requiredProp: string
  href?: string
  ref?: (element: HTMLAnchorElement) => void
  onClick?: JSX.EventHandlerUnion<HTMLAnchorElement, MouseEvent>
  children?: JSX.Element
}

const CustomLink = (props: CustomLinkProps) => <a href={props.href}>{props.children}</a>
const acceptAnchor = (element: HTMLAnchorElement) => element.focus()

;<Button
  as={CustomLink}
  requiredProp="required"
  href="/custom"
  ref={acceptAnchor}
  onClick={(event) => event.currentTarget.focus()}
/>
// @ts-expect-error Custom component required props remain required.
;<Button as={CustomLink} href="/custom" />
// @ts-expect-error Unknown custom props are rejected.
;<Button as={CustomLink} requiredProp="required" unknownProp />

;<Dialog.Trigger as={Button} variant="ghost" size="sm">
  Open
</Dialog.Trigger>
;<DropdownMenu.Trigger as={Button} variant="outline" size="icon-sm">
  Menu
</DropdownMenu.Trigger>
// @ts-expect-error Button variants remain constrained through as={Button}.
;<Dialog.Trigger as={Button} variant="invalid" />
// @ts-expect-error Button unknown props remain rejected through polymorphic trigger composition.
;<DropdownMenu.Trigger as={Button} unknownProp="invalid" />
