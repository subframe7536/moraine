import * as KobalteTabs from '@kobalte/core/tabs'
import type { JSX } from 'solid-js'
import { For, Show, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { IconName } from '../../elements/icon'
import type { SlotClasses } from '../../shared/slot-class'
import { cn } from '../../shared/utils'

import {
  tabsIndicatorVariants,
  tabsLeadingVariants,
  tabsListVariants,
  tabsRootVariants,
  tabsTriggerVariants,
} from './tabs.class'
import type { TabsVariantProps } from './tabs.class'

export type TabsValue = string

export interface TabsItem {
  label?: JSX.Element
  icon?: IconName
  value?: TabsValue
  content?: JSX.Element
  disabled?: boolean
  class?: string
}

type TabsSlots =
  | 'root'
  | 'list'
  | 'indicator'
  | 'trigger'
  | 'leading'
  | 'label'
  | 'trailing'
  | 'content'

export type TabsClasses = SlotClasses<TabsSlots>

export interface TabsBaseProps extends Pick<
  TabsVariantProps,
  'orientation' | 'variant' | 'size' | 'color'
> {
  items?: TabsItem[]
  classes?: TabsClasses
}

export type TabsProps = TabsBaseProps &
  Omit<KobalteTabs.TabsRootProps, keyof TabsBaseProps | 'children' | 'class'>

function normalizeItemValue(item: TabsItem, index: number): string {
  if (item.value === undefined || item.value === null) {
    return String(index)
  }

  return String(item.value)
}

export function Tabs(props: TabsProps): JSX.Element {
  const merged = mergeProps(
    {
      orientation: 'horizontal' as const,
      variant: 'pill' as const,
      size: 'md' as const,
      color: 'primary' as const,
    },
    props,
  ) as TabsProps

  const [localProps, restProps] = splitProps(merged, [
    'orientation',
    'variant',
    'size',
    'color',
    'classes',
    'items',
  ])

  return (
    <KobalteTabs.Root
      data-slot="root"
      class={tabsRootVariants({ orientation: localProps.orientation }, localProps.classes?.root)}
      orientation={localProps.orientation}
      {...restProps}
    >
      <KobalteTabs.List
        data-slot="list"
        class={tabsListVariants(
          {
            orientation: localProps.orientation,
            variant: localProps.variant,
          },
          localProps.classes?.list,
        )}
      >
        <KobalteTabs.Indicator
          data-slot="indicator"
          class={tabsIndicatorVariants(
            {
              orientation: localProps.orientation,
              variant: localProps.variant,
            },
            localProps.classes?.indicator,
          )}
        />

        <For each={localProps.items}>
          {(item, index) => (
            <KobalteTabs.Trigger
              data-slot="trigger"
              value={normalizeItemValue(item, index())}
              disabled={item.disabled}
              class={tabsTriggerVariants(
                {
                  orientation: localProps.orientation,
                  variant: localProps.variant,
                  size: localProps.size,
                  color: localProps.color,
                },
                localProps.classes?.trigger,
              )}
            >
              <Show when={item.icon}>
                <span
                  data-slot="leading"
                  class={tabsLeadingVariants(
                    { size: localProps.size },
                    localProps.classes?.leading,
                  )}
                >
                  <Icon name={item.icon} />
                </span>
              </Show>

              <Show when={typeof item.label === 'string'} fallback={item.label}>
                <span data-slot="label" class={cn('truncate', localProps.classes?.label)}>
                  {item.label}
                </span>
              </Show>
            </KobalteTabs.Trigger>
          )}
        </For>
      </KobalteTabs.List>

      <For each={localProps.items}>
        {(item, index) => (
          <KobalteTabs.Content
            data-slot="content"
            value={normalizeItemValue(item, index())}
            class={cn('w-full outline-none', localProps.classes?.content, item.class)}
          >
            {item.content}
          </KobalteTabs.Content>
        )}
      </For>
    </KobalteTabs.Root>
  )
}
