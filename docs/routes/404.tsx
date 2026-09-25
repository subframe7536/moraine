import { createRoute } from 'solid-file-router'

function DocsNotFound() {
  return (
    <main class="text-muted-foreground px-6 py-12">
      <h1 class="text-foreground font-semibold text-2xl">Page not found</h1>
      <p class="mt-2 text-sm">The requested documentation page does not exist.</p>
    </main>
  )
}

export default createRoute({
  component: () => <DocsNotFound />,
})
