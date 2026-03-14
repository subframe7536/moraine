import * as KobalteTabs from '@kobalte/core/tabs'
import type { JSX } from 'solid-js'
import { For, Show, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { IconName } from '../../elements/icon'
import type { SlotClasses, SlotStyles } from '../../shared/slot'
import type { RockUIComposeProps } from '../../shared/types'
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

/**
 * An individual tab in the tabs component.
 */
export interface TabsItem {
  /**
   * Label to display on the tab trigger.
   */
  label?: JSX.Element

  /**
   * Icon to display next to the label.
   */
  icon?: IconName

  /**
   * Unique value for the tab.
   * @default index of the item
   */
  value?: TabsValue

  /**
   * Content to display when the tab is active.
   */
  content?: JSX.Element

  /**
   * Whether the tab is disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Custom class for the tab content panel.
   */
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

export type TabsStyles = SlotStyles<TabsSlots>

/**
 * Base props for the Tabs component.
 */
export interface TabsBaseProps extends TabsVariantProps {
  /**
   * Array of tabs to display.
   */
  items?: TabsItem[]

  /**
   * Slot-based class overrides.
   */
  classes?: TabsClasses

  /**
   * Slot-based style overrides.
   */
  styles?: TabsStyles
}

/**
 * Props for the Tabs component.
 */
export type TabsProps = RockUIComposeProps<TabsBaseProps, KobalteTabs.TabsRootProps>

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
    'styles',
    'items',
  ])

  return (
    <KobalteTabs.Root
      data-slot="root"
      style={merged.styles?.root}
      class={tabsRootVariants({ orientation: localProps.orientation }, localProps.classes?.root)}
      orientation={localProps.orientation}
      {...restProps}
    >
      <KobalteTabs.List
        data-slot="list"
        style={merged.styles?.list}
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
          style={merged.styles?.indicator}
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
              style={merged.styles?.trigger}
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
                  style={merged.styles?.leading}
                  class={tabsLeadingVariants(
                    { size: localProps.size },
                    localProps.classes?.leading,
                  )}
                >
                  <Icon name={item.icon} />
                </span>
              </Show>

              <Show when={typeof item.label === 'string'} fallback={item.label}>
                <span
                  data-slot="label"
                  style={merged.styles?.label}
                  class={cn('truncate', localProps.classes?.label)}
                >
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
            style={merged.styles?.content}
            value={normalizeItemValue(item, index())}
            class={cn('outline-none w-full', localProps.classes?.content, item.class)}
          >
            {item.content}
          </KobalteTabs.Content>
        )}
      </For>
    </KobalteTabs.Root>
  )
}
