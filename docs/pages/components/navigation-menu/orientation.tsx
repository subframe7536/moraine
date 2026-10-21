import { NavigationMenu } from '@src'

export function Orientation() {
  return (
    <div class="min-h-56 w-full">
      <NavigationMenu aria-label="Vertical navigation" orientation="vertical" placement="right">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div class="w-40">
                <NavigationMenu.Link href="#overview" closeOnClick>
                  Overview
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#features" closeOnClick>
                  Features
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="resources">
            <NavigationMenu.Trigger>Resources</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div class="w-40">
                <NavigationMenu.Link href="#guides" closeOnClick>
                  Guides
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#support" closeOnClick>
                  Support
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    </div>
  )
}
