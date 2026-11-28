import { Avatar, HoverCard, Icon } from '@src'
const profiles = {
  ananya: {
    name: 'Ananya Rao',
    bio: 'Maintains the overlay primitives and the positioning layer.',
    joined: 'Joined March 2022',
  },
  jules: {
    name: 'Jules Ferreira',
    bio: 'Works on recipes, tokens, and theme compilation.',
    joined: 'Joined June 2022',
  },
  nico: {
    name: 'Nico Tanaka',
    bio: 'Keeps the docs site and the component examples current.',
    joined: 'Joined January 2023',
  },
} as const

export function MultipleTriggers() {
  return (
    <HoverCard openDelay={300}>
      <p class="text-sm text-foreground leading-6 max-w-xs">
        This release was reviewed by{' '}
        <HoverCard.Trigger value="ananya" href="/u/ananya" class="font-medium">
          @ananya
        </HoverCard.Trigger>
        {', '}
        <HoverCard.Trigger value="jules" href="/u/jules" class="font-medium">
          @jules
        </HoverCard.Trigger>
        {', and '}
        <HoverCard.Trigger value="nico" href="/u/nico" class="font-medium">
          @nico
        </HoverCard.Trigger>
        .
      </p>
      <HoverCard.Content>
        {(context) => {
          const profile = () => profiles[(context.value() ?? 'ananya') as keyof typeof profiles]
          return (
            <div class="flex gap-4">
              <Avatar text={profile().name.slice(0, 2).toUpperCase()} alt={profile().name} />
              <div class="space-y-1">
                <h4 class="text-sm font-semibold">{profile().name}</h4>
                <p class="text-sm">{profile().bio}</p>
                <div class="pt-2 flex gap-2 items-center">
                  <Icon name="i-lucide:calendar-days" class="opacity-70 size-4" />
                  <span class="text-xs text-muted-foreground">{profile().joined}</span>
                </div>
              </div>
            </div>
          )
        }}
      </HoverCard.Content>
    </HoverCard>
  )
}
