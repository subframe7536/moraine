import { NavigationMenu } from '@src'
import type { NavigationMenuT } from '@src'
const RouterLink = (props: NavigationMenuT.LinkRenderProps) => (
  <a {...props} href={props.href ?? '#'} />
)

export function RouterLinkExample() {
  return (
    <NavigationMenu aria-label="Documentation navigation">
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Link linkRender={RouterLink} href="/components/button">
            Button
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link linkRender={RouterLink} href="/components/tabs">
            Tabs
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  )
}
