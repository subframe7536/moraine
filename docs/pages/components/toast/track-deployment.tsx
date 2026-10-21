import { Button, Toast } from '@src'

export function TrackDeployment() {
  const deploy = (shouldSucceed: boolean) => {
    const task = new Promise<{ version: string }>((resolve, reject) => {
      setTimeout(() => {
        if (shouldSucceed) {
          resolve({ version: 'v2.4.0' })
        } else {
          reject(new Error('Connection timed out'))
        }
      }, 1500)
    })

    Toast.promise(task, {
      loading: { title: 'Deploying to production...' },
      success: (data) => ({ title: `Deployed ${data.version} successfully!` }),
      error: (err) => ({ title: `Deploy failed: ${(err as Error).message}` }),
    })
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button leading="i-lucide:rocket" onClick={() => deploy(true)}>
        Deploy project
      </Button>
      <Button variant="outline" leading="i-lucide:alert-circle" onClick={() => deploy(false)}>
        Simulate deploy failure
      </Button>
    </div>
  )
}
