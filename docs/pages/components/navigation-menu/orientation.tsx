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
                <NavigationMenu.Link href="#overview" closeOnSelect>
                  Overview
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#features" closeOnSelect>
                  Features
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="resources">
            <NavigationMenu.Trigger>Resources</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div class="w-40">
                <NavigationMenu.Link href="#guides" closeOnSelect>
                  Guides
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#support" closeOnSelect>
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
