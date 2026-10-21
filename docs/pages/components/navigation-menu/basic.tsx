import { NavigationMenu } from '@src'

export function Basic() {
  return (
    <div class="pt-4 flex min-h-64 w-full justify-center">
      <NavigationMenu aria-label="Example navigation">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div class="gap-2 grid w-[min(28rem,calc(100vw-2rem))] sm:grid-cols-2">
                <NavigationMenu.Link href="#overview" closeOnClick>
                  <span class="font-medium">Overview</span>
                  <span class="text-muted-foreground">Explore the component library.</span>
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#themes" closeOnClick>
                  <span class="font-medium">Themes</span>
                  <span class="text-muted-foreground">Make the library fit your product.</span>
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#accessibility" closeOnClick>
                  <span class="font-medium">Accessibility</span>
                  <span class="text-muted-foreground">Keyboard and screen reader support.</span>
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#getting-started" closeOnClick>
                  <span class="font-medium">Getting started</span>
                  <span class="text-muted-foreground">Install your first component.</span>
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="guides">
            <NavigationMenu.Trigger>Guides</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div class="w-48">
                <NavigationMenu.Link href="#installation" closeOnClick>
                  Installation
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#composition" closeOnClick>
                  Composition
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#styling" closeOnClick>
                  Styling
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="#documentation" active>
              Documentation
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    </div>
  )
}
