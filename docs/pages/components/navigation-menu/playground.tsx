import { Icon, NavigationMenu } from '@src'
import { For } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function NavigationMenuPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        {
          kind: 'select',
          prop: 'orientation',
          label: 'Orientation',
          defaultValue: 'horizontal',
          options: [
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Vertical', value: 'vertical' },
          ],
        },
      ]}
    >
      {(props) => (
        <div class="flex min-h-72 w-full items-center justify-center">
          <NavigationMenu
            aria-label="Playground navigation"
            disabled={props.disabled}
            orientation={props.orientation}
            placement={props.orientation === 'vertical' ? 'right' : 'bottom'}
          >
            <NavigationMenu.List>
              <NavigationMenu.Item value="getting-started">
                <NavigationMenu.Trigger>Getting started</NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  <ul class="m-0 p-0 list-none w-[min(24rem,calc(100vw-2rem))]">
                    <li>
                      <NavigationMenu.Link href="/docs/getting-started" closeOnClick>
                        <span class="font-medium">Introduction</span>
                        <span class="text-muted-foreground leading-snug">
                          Composable SolidJS components for your application.
                        </span>
                      </NavigationMenu.Link>
                    </li>
                    <li>
                      <NavigationMenu.Link href="/docs/installation" closeOnClick>
                        <span class="font-medium">Installation</span>
                        <span class="text-muted-foreground leading-snug">
                          Set up Moraine and your styling tools.
                        </span>
                      </NavigationMenu.Link>
                    </li>
                    <li>
                      <NavigationMenu.Link href="/docs/theming" closeOnClick>
                        <span class="font-medium">Theming</span>
                        <span class="text-muted-foreground leading-snug">
                          Customize colors, design tokens, and component recipes.
                        </span>
                      </NavigationMenu.Link>
                    </li>
                  </ul>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item value="components">
                <NavigationMenu.Trigger>Components</NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  <ul class="m-0 p-0 list-none gap-2 grid w-[min(36rem,calc(100vw-2rem))] sm:grid-cols-2">
                    <For
                      each={[
                        {
                          title: 'Modal',
                          href: '/components/modal',
                          description:
                            'Present a focused dialog with a title, content, and actions.',
                        },
                        {
                          title: 'Popover',
                          href: '/components/popover',
                          description: 'Show additional content in a panel beside its trigger.',
                        },
                        {
                          title: 'Progress',
                          href: '/components/progress',
                          description: 'Communicate how much of a task has been completed.',
                        },
                        {
                          title: 'ScrollArea',
                          href: '/components/scroll-area',
                          description:
                            'Keep overflowing content accessible with custom scrollbars.',
                        },
                        {
                          title: 'Tabs',
                          href: '/components/tabs',
                          description: 'Organize related content into selectable panels.',
                        },
                        {
                          title: 'Tooltip',
                          href: '/components/tooltip',
                          description: 'Add a short explanation to a control on hover or focus.',
                        },
                      ]}
                    >
                      {(component) => (
                        <li>
                          <NavigationMenu.Link href={component.href} closeOnClick>
                            <span class="font-medium">{component.title}</span>
                            <span class="text-muted-foreground leading-snug line-clamp-2">
                              {component.description}
                            </span>
                          </NavigationMenu.Link>
                        </li>
                      )}
                    </For>
                  </ul>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item value="with-icon">
                <NavigationMenu.Trigger>With Icon</NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  <ul class="m-0 p-0 list-none w-48">
                    <li>
                      <NavigationMenu.Link href="/components/command-palette" closeOnClick>
                        <span class="flex gap-2 items-center">
                          <Icon name="i-lucide:circle-alert" />
                          Backlog
                        </span>
                      </NavigationMenu.Link>
                    </li>
                    <li>
                      <NavigationMenu.Link href="/components/checkbox" closeOnClick>
                        <span class="flex gap-2 items-center">
                          <Icon name="i-lucide:circle-dashed" />
                          To Do
                        </span>
                      </NavigationMenu.Link>
                    </li>
                    <li>
                      <NavigationMenu.Link href="/components/progress" closeOnClick>
                        <span class="flex gap-2 items-center">
                          <Icon name="i-lucide:circle-check" />
                          Done
                        </span>
                      </NavigationMenu.Link>
                    </li>
                  </ul>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link href="/docs/getting-started">Docs</NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
          </NavigationMenu>
        </div>
      )}
    </DocsPlayground>
  )
}
