import { Stepper } from '@src'

export function Vertical() {
  const TRACKING_STEPS = [
    {
      title: 'Order Placed & Verified',
      description: 'Oct 24, 09:30 AM — Payment confirmed via Stripe',
      value: 'placed',
      icon: 'i-lucide:shopping-bag',
      content: <p class="text-muted-foreground text-xs">Order #4819 was received and verified.</p>,
    },
    {
      title: 'In Transit to Destination Hub',
      description: 'Oct 24, 02:15 PM — Scanned at Frankfurt Gateway Hub',
      value: 'transit',
      icon: 'i-lucide:truck',
      content: (
        <p class="text-muted-foreground text-xs">
          Package is currently in transit via express carrier.
        </p>
      ),
    },
    {
      title: 'Out for Delivery',
      description: 'Estimated Today by 06:00 PM',
      value: 'delivery',
      icon: 'i-lucide:package-check',
      content: (
        <p class="text-muted-foreground text-xs">
          Local courier has package on vehicle for delivery.
        </p>
      ),
    },
    {
      title: 'Delivered',
      description: 'Signature confirmation required',
      value: 'delivered',
      icon: 'i-lucide:check-circle-2',
      content: <p class="text-muted-foreground text-xs">Delivered to recipient.</p>,
    },
  ]

  return (
    <div class="p-4 b-(1 border) bg-card max-w-xl rounded-xl">
      <Stepper items={TRACKING_STEPS} orientation="vertical" defaultValue="transit" />
    </div>
  )
}
