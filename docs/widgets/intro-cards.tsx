import { Card, Icon } from '../../src'

export const IntroCardsWidget = () => {
  return (
    <section class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
      <Card
        compact
        title={
          <span class="flex gap-2 items-center">
            <Icon name="i-lucide:layers-3" />
            Composable API
          </span>
        }
      >
        <p class="text-sm text-muted-foreground">
          Slot-based APIs with class and style overrides, designed for real product surfaces.
        </p>
      </Card>

      <Card
        compact
        title={
          <span class="flex gap-2 items-center">
            <Icon name="i-lucide:sliders-horizontal" />
            Variant Coverage
          </span>
        }
      >
        <p class="text-sm text-muted-foreground">
          Visual variants, sizes, orientation, and state controls aligned across components.
        </p>
      </Card>

      <Card
        compact
        title={
          <span class="flex gap-2 items-center">
            <Icon name="i-lucide:shield-check" />
            Accessible by Default
          </span>
        }
      >
        <p class="text-sm text-muted-foreground">
          Keyboard and aria-ready primitives built on top of mature SolidJS foundations.
        </p>
      </Card>
    </section>
  )
}
