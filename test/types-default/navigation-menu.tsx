import { NavigationMenu } from 'moraine'
import type { NavigationMenuT } from 'moraine'
import { defineTheme } from 'moraine/theme'

const RouterLink = (props: NavigationMenuT.LinkRenderProps) => <a {...props} />

;<NavigationMenu
  value={null}
  onValueChange={(value) => {
    const selected: string | null = value
    void selected
  }}
  orientation="vertical"
  classes={{ content: 'panel' }}
  styles={{ content: { width: '20rem' } }}
>
  <NavigationMenu.List>
    <NavigationMenu.Item value="product">
      <NavigationMenu.Trigger classes={{ triggerIcon: 'chevron' }}>Product</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link linkRender={RouterLink} href="/docs" active closeOnClick>
          Docs
        </NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
</NavigationMenu>

defineTheme({
  navigationMenu: {
    base: { content: 'custom-content' },
    variants: { orientation: { vertical: { list: 'custom-list' } } },
  },
})

// @ts-expect-error Native styles must be objects.
;<NavigationMenu style="width: 100%" />
// @ts-expect-error Custom links must accept object styles.
;<NavigationMenu.Link style="color: red" />
// @ts-expect-error Root values identify one open panel.
;<NavigationMenu value={['product']} />

// @ts-expect-error Popup is not a public style slot.
;<NavigationMenu classes={{ popup: 'surface' }} />
// @ts-expect-error Viewport is not a public style slot.
;<NavigationMenu styles={{ viewport: { overflow: 'visible' } }} />
// @ts-expect-error Popup is not a theme slot.
defineTheme({ navigationMenu: { base: { popup: 'surface' } } })
