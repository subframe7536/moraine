import { renderToString } from 'solid-js/web'

import { NavigationMenu } from './navigation-menu'

export function NavigationMenuFixture(props: { initiallyOpen?: boolean }) {
  return (
    <NavigationMenu
      id="ssr-navigation-menu"
      aria-label="Server navigation"
      defaultValue={props.initiallyOpen ? 'products' : undefined}
    >
      <NavigationMenu.List>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="#server">Server link</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Guides</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="#guides">Server guide</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#docs">Documentation</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  )
}

export function renderClosedNavigationMenuFixture(): string {
  return renderToString(() => <NavigationMenuFixture />)
}

export function renderOpenNavigationMenuFixture(): string {
  return renderToString(() => <NavigationMenuFixture initiallyOpen />)
}
