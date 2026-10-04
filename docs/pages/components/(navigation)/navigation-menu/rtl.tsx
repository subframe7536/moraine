import { NavigationMenu } from '@src'

export function Rtl() {
  return (
    <div dir="rtl" class="min-h-56 w-full">
      <NavigationMenu aria-label="RTL navigation">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>المنتجات</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div class="w-40">
                <NavigationMenu.Link href="#overview" closeOnClick>
                  نظرة عامة
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#features" closeOnClick>
                  الميزات
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="resources">
            <NavigationMenu.Trigger>الموارد</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#guides" closeOnClick>
                الأدلة
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    </div>
  )
}
