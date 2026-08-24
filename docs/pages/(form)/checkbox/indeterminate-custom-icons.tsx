import { Checkbox } from '@src'
import { createMemo, createSignal, For } from 'solid-js'

export function IndeterminateCustomIcons() {
  const [tasks, setTasks] = createSignal([
    { id: 'tests', label: 'Run unit and integration test suites', checked: true },
    { id: 'build', label: 'Build static assets and server bundle', checked: true },
    { id: 'migrate', label: 'Apply pending database migrations', checked: false },
  ])

  const checkedCount = createMemo(() => tasks().filter((t) => t.checked).length)
  const allChecked = createMemo(() => checkedCount() === tasks().length)
  const isIndeterminate = createMemo(() => checkedCount() > 0 && checkedCount() < tasks().length)

  const parentState = createMemo<'indeterminate' | boolean>(() => {
    if (isIndeterminate()) {
      return 'indeterminate'
    }
    return allChecked()
  })

  const toggleAll = () => {
    const nextState = !allChecked()
    setTasks((current) => current.map((task) => ({ ...task, checked: nextState })))
  }

  const toggleTask = (id: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, checked: !task.checked } : task)),
    )
  }

  return (
    <div class="p-4 b-(1 border) rounded-xl max-w-xl space-y-4">
      <Checkbox
        label="Production deployment checklist"
        description={`${checkedCount()} of ${tasks().length} tasks completed`}
        checked={parentState()}
        onChange={toggleAll}
        checkedIcon="i-lucide:check-check"
        indeterminateIcon="i-lucide:minus"
      />

      <div class="pl-6 border-l-2 border-border space-y-2">
        <For each={tasks()}>
          {(task) => (
            <Checkbox
              size="sm"
              label={task.label}
              checked={task.checked}
              onChange={() => toggleTask(task.id)}
            />
          )}
        </For>
      </div>
    </div>
  )
}
