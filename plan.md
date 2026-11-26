# Moraine SolidJS 2.0 最佳实践深度重构计划

基于 `solid-js@2.0.3`（`CHEATSHEET.md`、`skills/solid-2.0/SKILL.md`、`skills/reactivity-diagnostics/SKILL.md`）与 `@solidjs/web@2.0.3` 官方规范，对 `feat/solid-2-migration` 分支中由机械迁移产生的 1.x 兼容包装层进行系统清理，并按 Solid 2 原生响应式模型重构 `src/shared/`、`src/utils.ts`、`src/components/shared/`、`src/data-table/` 及上层组件。

## 一、两个核心架构决策

### 1. `createSelector`：不需要重新实现，全面移除

- **现状问题**：`src/shared/utils.ts` 中的 `createSelector` shim 为每个访问过的 `key` 在父 `owner` 上创建永久 `createMemo` 且 `memos` Map 从不回收。当前被用于 5 个文件（`base-select-context.tsx`、`command-palette.tsx`、`menu.utils.ts`、`tree-state.ts`），在动态搜索、过滤和虚拟列表场景下既存在无界内存泄漏，又将更新退化为 $O(N_{\text{历史总 key}})$。
- **Solid 2 官方替代**：`solid-js` 2.0 官方明确给出 `createSelector` → **`createProjection`**（或 `createStore(fn)`）。
- **落地方案**：
  - **单值选中/高亮（`activeKey`、`highlightedItemId`、`highlightedValue`）**：使用 `createProjection<Record<string, boolean>>` 仅 diff 旧值与新值两个键，消费侧读 `Boolean(highlighted[key])`——原生属性级细粒度追踪、真正 $O(1)$ 更新、零内存泄漏。
  - **集合成员判断（`selectedSet`、`expandedSet`）**：
    - 大列表/树（`Tree`、`BaseSelect`）：用 `createProjection` 记录前后 `Set` 差集（$O(\Delta)$ 更新，零泄漏）；
    - 小规模或已按项拆分的子组件：直接在项组件内写 `createMemo(() => ctx.selectedSet().has(props.value))`，随 `<For>` 项 owner 自动释放。
  - **结论**：删除 `src/shared/utils.ts` 中的 `createSelector`，同步迁移 4 处业务调用方。

### 2. `bindElement`：没有必要，直接移除

- **现状问题**：`src/shared/element-binding.ts` 在 23 个非测试文件中被使用，且为了适配 Solid 2 ownerless apply 回调，在 `createRenderEffect` 的 **compute 阶段** 调用了 `bindDispose?.()` 与 `createRoot(...)`——这既违背 Solid 2 compute 纯追踪原则，又反转了清理顺序（`scope` 内副作用先于 `bind` 返回的 `cleanup` 被销毁）。
- **逐一盘点 23 处调用**：
  - **21 / 23 处**完全不使用 `scope` 参数，本质只是「元素存在时注册、变化或卸载时清理」，等价于 Solid 2 原生双参 `createEffect`（或仅在必须首帧同步测量/注册时用 `createRenderEffect`）：

```ts
createEffect(element, (el) => {
  if (!el) return
  return presence.registerElement(el)
})
```

  - **仅 2 / 23 处**（`accordion.tsx:439`、`drawer-content.tsx:172`）使用了 `scope`，原因是在绑定回调里动态创建内部 `createEffect` / 事件监听。按 Solid 2 官方 **Two-phase directive** 规范（`CHEATSHEET.md` Refs and directives 节），副作用应直接声明在组件/分支 owner 下，在 `compute` 中读取 `element()`，在 `apply` 中执行 DOM 操作并返回 cleanup，无需嵌套 `createRoot`。
  - **`publishElement`（8 处）**：仅用于在子组件把 DOM 节点发布给父 Context 的 signal，可直接收口为 5 行工具函数（或直接写 `createEffect` 返回条件重置 cleanup），无需依赖 `bindElement`。
  - **原生 `ref` 组合**：Solid 2 原生支持 `ref={[setEl, directiveA, directiveB]}`；仅对来自外部的动态 `props.ref` 保留轻量的 `callRef`。
- **结论**：删除 `bindElement`，将 23 处调用改为原生 `createEffect` / `createRenderEffect` 或 Two-phase `ref` directive，并同步更新 `build/oxlint-plugin-moraine.ts` 中 `moraine/ref-callback-assign-only` 的提示文案与 `oxlint.config.ts` 的 `customReactiveFunctions`。

## 二、现有包装层与 1.x 兼容代码处置清单

| 模块 / 符号 | 当前引用数（非测试） | 现状问题（对比 Solid 2.0 官方规范） | 处置决策 | 目标实现 |
| :--- | :---: | :--- | :--- | :--- |
| `settle()` (`src/shared/utils.ts`) | 50 文件 | 注释误判“unowned 写入会永远停滞”；强行同步 `flush()` 破坏 Solid 2 默认微任务批处理，且 `catch {}` 静默吞掉所有业务异常 | **彻底删除** | 信任 Solid 2 默认微任务自动 flush；仅在同 tick DOM 同步校验（如 `requestSubmit` / `focus`）处显式调用无吞错的 `flush()`；关闭浮层等防过渡阻塞场景改用 **`onFlush()`** |
| `pick()` (`src/shared/utils.ts`) | 151 文件 | 机械替换 `splitProps` 的产物；每个组件挂载额外分配 Proxy，且引入额外追踪层导致 `resolvePropsChildren` 复杂化 | **彻底删除** | 组件内直接读取 `props.xxx`，仅用 `solid-js` 原生 `omit(props, ...)` 生成 `rest` |
| `createSelector()` (`src/shared/utils.ts`) | 5 文件 | 父 owner 常驻 memo Map 无界内存泄漏 + $O(N)$ 退化 | **彻底删除** | 改用原生 `createProjection` 或项内 `createMemo` |
| `bindElement()` (`src/shared/element-binding.ts`) | 23 文件 | 在 `createRenderEffect` compute 中执行 `createRoot` 与 `dispose` | **彻底删除** | 改用原生 `createEffect(el, (node) => ...)` 或 Two-phase `ref` directive |
| `mergeDefaults()` (`src/shared/utils.ts`) | 4 文件 | 自定义 Proxy 存在 `get` 与 `getOwnPropertyDescriptor` 行为不一致 | **彻底删除** | 直接在读取点使用 `props.x ?? defaultVal`（共享派生用 `createMemo`） |
| `createContextProvider()` (`src/shared/create-context-provider.tsx`) | 内部多处 | 刻意传 `null` 默认值绕过 Solid 2 原生 `ContextNotFoundError`（官方明确指出这是冗余的 React 风格样板） | **评估删除或极简化** | 直接使用 `createContext<T>(undefined, { name })` + `<Ctx value={...}>` + `useContext(Ctx)`；仅当必须维持现有自定义报错文案测试契约时保留极简包装 |
| `resolvePropsChildren()` (`src/shared/utils.ts`) | 3 文件 | `.toArray()` 绕过 pin 逻辑；移除 `pick` 后描述符绕行必要性大幅降低 | **精简并修复** | 直接基于 `children(() => props.children)`；修复 `.toArray()` 同步触发 pin，仅保留“防未订阅自动释放”职责 |
| `event-listener.ts` (`src/shared/event-listener.ts`) | 广泛 + 公开导出 | `attachEventListener` 全量包裹 `settle()` 吞错；`createEventListener` 依赖 `getOwner() !== null` 双重语义 | **重构精简** | 移除 `settle()`；内部一律使用 `attachEventListener` 返回 cleanup 并交给 `createEffect`/`onSettled` 返回；公开的 `createEventListener(Map)` 明确约定基于 `onSettled` 绑定并自动清理 |
| `createMediaQuery()` (`src/shared/media-query.ts`) | 公开导出 | 叠床架屋：`createSignal` + `createEffect` + `queueMicrotask` + `settle` + 已废弃 `addListener` | **按 Solid 2 重写** | 用 `isServer \|\| isHydrating()` 初始化 SSR 安全值，在 `createEffect` apply 中直接订阅 `matchMedia` `change` 事件并返回 `removeEventListener`（或用 `from()` 封装） |
| `createControllableValue()` (`src/shared/controllable-value.ts`) | 公开导出 | `{ ownedWrite: true }` + 手写 `pendingUncontrolled` 镜像状态 | **精简重构** | 移除不必要的 `ownedWrite: true`（写操作本就不应在 owned scope 发生）；验证 Solid 2 updater 队列组合能力，去掉或收紧 `pendingUncontrolled` 仅限严格同步链 |
| `useAutoLoadingClick()` (`src/shared/use-auto-loading.ts`) | 内部 | 使用 `settle()` 包裹计数变更 | **去包装** | 移除 `settle()`，直接读写 signal（或结合 Solid 2 `action` / `createOptimistic` 评估异步边界） |
| `createSolidReactivity()` (`src/data-table/solid-table.ts`) | `createTable` 核心 | `batch: flush` 反向强刷、`createWritableAtom` 全量套 `settle()` 与函数形态 `createSignal(() => init)` + `ownedWrite: true`、apply 内冗余 `untrack()`、`createTable` 的 `queueMicrotask` + `flush(resolvedTable)` hack | **深度重构** | 回归 Solid 2 默认微任务批处理，按值/函数区分普通 `createSignal`、去掉 `settle()` 与冗余 `untrack()`、用 `onSettled` / `onHydrationEnd` 替代 `queueMicrotask` 与 `flush(resolvedTable)` |
| `createLazyMemo()` (`src/shared/create-lazy-memo.ts`) | 10 文件 | 承担 `useRecipe` SSR/hydration ID 对齐职责 | **保留** | 保留 `getNextChildId` 预留机制，补充单测确保不误替换为 `createMemo(..., { lazy: true })` |
| `createId()` / `renderWithProps()` / `createPolymorphicRoot()` | 核心基础设施 | 仍承担真实业务职责 | **保留并清理内部依赖** | 移除内部对 `bindElement` / `settle` 的依赖，`createPolymorphicRoot` 内部改用原生 `createEffect` |

## 三、分域重构细则

### 1. Public Hooks（`src/utils.ts` → `moraine/utils`）

逐个检查 10 个公开导出，确保对外 API 签名兼容（不破坏 1.0.0 契约）同时内部完全符合 Solid 2 范式：

1. **`createId`**（`src/shared/utils.ts`）：保持现状，已对齐 `createUniqueId()` + 响应式 `prefix`。
2. **`createControllableValue`**（`src/shared/controllable-value.ts`）：移除 `{ ownedWrite: true }`，改用标准 signal 写入与 `createMemo` 派生；调用方如存在 owned scope 写入，修复调用方而非放宽底层。
3. **`createDisclosureState`**（`src/shared/disclosure-state.ts`）：
   - 清理内部 3 个 `{ ownedWrite: true }` signal（`contentHeight`、`triggerElement`、`contentElement`）与手动 `runWithOwner(stateOwner, () => createRoot(...))`；
   - `beforematch` 监听移除 `settle`，`hidden` 属性同步直接放在 `createEffect(element, ...)` 中并返回 cleanup；
   - `initialOpen` 中的可变闭包 `let everClosed` 需确认在 SSR 多次请求与响应式重跑下无副作用。
4. **`createEventListener` / `createEventListenerMap`**（`src/shared/event-listener.ts`）：去掉 `settle()`，明确区分“带 owner 的 `createEventListener`（内部 `onSettled`）”与“纯命令式 `attachEventListener`（返回 detach）”。
5. **`createMediaQuery`**（`src/shared/media-query.ts`）：移除 `queueMicrotask`、`settle`、废弃的 `addListener`/`removeListener`，按 Solid 2 Hydration 安全模式实现。
6. **`createSelectableCollectionNavigation`**（`src/shared/selectable-collection-navigation.ts`）：移除 `settle`，确保 `onNavigationKeyDown` 与 `registerRoot` 依赖原生微任务 flush。
7. **`createTransitionPresence`**（`src/shared/transition-presence.ts`）：移除 `settle`，用 `createEffect` 返回 cleanup 管理动画监听与 fallback timer，不再混用独立 `onCleanup`。
8. **`createBaseSelectSearchInput`**（`src/components/base-select/base-select-search-input.ts`）：移除 `bindElement` + `publishElement` 包装，改为直接 `createEffect`。
9. **`createSlider`**（`src/components/slider/hook/slider.ts`）：去掉 `settle`；将散落的 `onCleanup` 与 `createEffect` 收口为对应 effect 的返回 cleanup；清理 codemod 遗留的 `(() => ...)()` IIFE。
10. **`createCopy`**（`src/components/copy-button/create-copy.ts`）：移除 `settle`，定时器清理由 `onSettled` 返回 cleanup 接管。

### 2. 共享表单层（`src/components/shared/form/`）

- **`use-form-value.ts`**：
  - 修复机械迁移残留：`() => [(() => options.value?.())(), (() => options.field?.value())()]` → `() => [options.value?.(), options.field?.value()] as const`。
  - 移除 `settle()` 与 `{ ownedWrite: true }`。
- **`use-text-control-value.ts`**：
  - 对齐 Solid 2 表单输入规范（`CHEATSHEET.md` Form inputs）：非受控走 `defaultValue`；输入转换/拒收场景显式回写 `e.currentTarget.value = next`；避免受控绑定覆盖未提交输入（`UNCOMMITTED_INPUT_OVERWRITTEN`）。
- **`form-reset-scheduler.ts` / `use-form-reset.ts` / `use-hidden-input-validation.ts`**：
  - 审查 `flush(() => ...)` 是否仍必要（仅在 `form.reset()` / `requestSubmit()` 需要同 tick 生效时保留无吞错 `flush()`）；移除 `ownedWrite: true`。

### 3. 共享浮层与菜单层（`src/components/shared/overlay/`）

- **用 `onFlush` 替代关闭时序 hack**：在 `menu-item.tsx`、`menu-submenu-item.tsx`、`popper.tsx`、`base-select` 等点击选项后需要“先关闭浮层、再触发用户 `onSelect`（可能触发路由导航或 async transition）”的位置，统一采用 Solid 2 原生 **`onFlush(() => setOpen(false))`**，避免被上游过渡 hold 住。
- **清理 `ownedWrite: true`（当前 46 处中近一半在 overlay/drawer/dialog/nav-menu）**：
  - `content-anatomy.ts`（`headers`、`explicitHeaders`、`titles`、`descriptions`）、`dialog-context.ts`、`drawer-context.ts`、`drawer-swipe.ts`、`navigation-menu-context.ts`、`menu-layer.tsx`：
  - 将子部件在组件体中同步写入父 Context 的注册逻辑改为在 **`onSettled`** 中注册并返回注销 cleanup，或通过 `createEffect` apply 阶段同步，将 `ownedWrite: true` 压减至接近于 0。
- **`floating.ts` / `interaction.ts` / `outside-press.ts` / `scroll-lock.ts` / `aria-hide.ts` / `hover-delay.ts`**：
  - 全面移除 `settle()`；所有监听器与 observer 统一通过 `createEffect` 返回 cleanup 销毁；注意 Solid 2 中 `createEffect` **不做值比较**，凡依赖派生布尔/对象结果的 effect，先经 `createMemo` 截断再传入 `compute`，防止无关重跑。

### 4. 外部生态集成层（`src/data-table/`、`src/virtualizer/`、`src/dnd/`）

- **`src/data-table/solid-table.ts`（`createSolidReactivity` & `createTable`）与 `create-data-table.tsx`**：
  - **`batch` 语义修正**：当前 `batch: flush` 与 `@tanstack/table-core` 的批处理意图相反——Solid 2 更新本身按微任务自动批处理，把 `flush` 当 `batch` 会强制同步刷盘，且在 `onSettled` / `action` 中抛错或在 effect apply 中触发 `FLUSH_IN_EFFECT_CALLBACK`。重构为 `(fn) => fn()`（信任 Solid 2 默认微任务批处理），仅在经实测确需同 tick 读取派生值的测试/交互边界使用显式 `flush()`。
  - **`createWritableAtom` 重构**：
    - 去掉 `settle()` 包装，避免吞掉下游 memo/effect 异常并恢复批量更新；
    - 当前统一用 `createSignal(() => initialValue)` 会在每个原子上分配一个 writable derived 计算节点，改为直接 `createSignal(initialValue)`（仅当 `typeof initialValue === 'function'` 时用 `() => initialValue`）；
    - 仅对真正由 `constructTable` 初始化写入的内部状态评估最小化 `ownedWrite`，不再对所有 writable atom 无差别开启 `ownedWrite: true`。
  - **`subscribeToSignal` 精简**：
    - Solid 2 `createEffect` 的 apply 回调本身已是 untracked，移除内部冗余的 `untrack(() => cb(val))`；
    - 清理手动 `disposed` 布尔标志，依赖 `createRoot` 的 `dispose()` 终止订阅；保留 `{ transparent: true }` 以避免客户端订阅偏移 hydration ID，并评估接入 `addSubscription` 与 `unmount` 的统一回收。
  - **`createTable` 与 `create-data-table.tsx` 的初始化/水合重构**：
    - 修正 `merge(defaultOptions, resolvedOptions)` 语义漂移：Solid 2 的 `merge` 会把显式 `undefined` 视为有效覆盖（原注释“getter 返回 `undefined` 回退到 feature default”已失效），需显式按 `undefined` 回退处理默认值，避免 `options` 中可选字段把 TanStack feature 默认值覆盖成 `undefined`；
    - 将 `if (hydrating) queueMicrotask(() => { mutableTable.options = liveOptions })` 改为基于 Solid 2 生命周期的 **`onSettled`**（或 `onHydrationEnd`），并确保在组件已卸载时不再写入；
    - 移除 `src/data-table/create-data-table.tsx:270` 在组件体中调用 `flush(resolvedTable)` 的反模式，改为让 `constructTable` 的初始选项同步与 hydration 声明天然对齐。
- **`src/virtualizer/controller.ts`**：
  - 审查 `virtualItems` 是否可直接用 `createProjection` 替代 `createStore` + `reconcile` + `flush` 组合；
  - `sync()` 中的 `queueMicrotask(() => flush(() => publish(source)))` 补充卸载态（`active`）检查，避免卸载后写入。
- **`src/dnd/create-sortable.tsx`**：
  - 将 `onSettled(() => sortable.register())` 与独立的 `onCleanup(() => sortable.destroy())` 合并为 `onSettled(() => { sortable.register(); return () => sortable.destroy() })`。

## 四、组件层按 Solid 2.0 规范统一重建/对齐准则

完成底层 hooks / shared 重构后，按以下 8 条准则逐批重构 `src/components/`（60 个组件）：

1. **去 `pick`、直读 `props` + `omit`**：全面移除 151 个文件中的 `const local = pick(props, ...)`，直接读 `props.xxx`，仅用 `const rest = omit(props, ...)` 透传剩余属性。
2. **控制流与列表现代化**：
   - 固定次数数字循环（如 `PinInput` 槽位、`Skeleton` 行数、`Rating` 星级、`Pagination` 页码占位）优先改用 `<Repeat count={n}>`，不再构造临时数组喂给 `<For>`；
   - 审计所有 `<For>` / `<Show>` / `<Match>` 函数子元素，确保回调体顶层不读取任何 accessor（防止 `STRICT_READ_UNTRACKED`）。
3. **事件处理稳定绑定**：扫描并消除 `onClick={cond() ? a : b}`、`onKeyDown={disabled() ? undefined : handler}` 等动态表达式绑定（Solid 2 仅挂载时绑定一次），统一改为稳定函数内部判断。
4. **原生 `ref` 组合替代 `bindElement`**：DOM 元素绑定一律使用 `ref={[setEl, ...]` + `createEffect(el, (node) => { if (!node) return; ...; return cleanup })` 或 Two-phase `ref` directive。
5. **非 Recipe 宿主的条件 class**：若存在手动拼接 class 字符串/数组 `.filter(Boolean).join(' ')`，改为 Solid 2 原生数组/对象形式 `class={['base', props.class, { active: active() }]}`（Recipe 宿主仍沿用 `useRecipe` slot binding）。
6. **`createEffect` 截断与去 IIFE**：
   - 清理所有机械迁移产生的 `(() => expr)()` 冗余写法；
   - 对 `compute` 返回派生表达式（如 `() => open() && !disabled()`）的 effect，先提取 `createMemo` 再交给 `createEffect`，避免上游无关变化触发无意义的 cleanup + apply 重跑。
7. **`untrack()` 与 `ownedWrite: true` 逐一审计**：
   - 审计现有 100 处 `untrack()`：仅保留真正的“意图快照读取”，移除任何用于掩盖 `STRICT_READ_UNTRACKED` 的 `untrack`；
   - 审计现有 46 处 `ownedWrite: true`：除真正无法避免的底层同步状态外全部消除。
8. **工具链与规范同步**：
   - 更新 `build/oxlint-plugin-moraine.ts`（更新 `ref-callback-assign-only`、移除对 `bindElement`/`settle` 的特例依赖、新增禁止 `(() => ...)()` 冗余 compute IIFE 或 `pick` 回归的检查）；
   - 更新 `oxlint.config.ts` 中 `customReactiveFunctions`；
   - 同步更新 `AGENTS.md` 与 `.agents/skills/build-ssr-safe-component/SKILL.md` 及 `docs/pages/hooks/**` 文档。

## 五、分阶段执行路线图与验收门禁

为避免再次出现千文件级大 PR，按底层到上层拆分为 6 个可独立合入、每阶段 CI 全绿的阶段：

| 阶段 | 范围 | 核心产出 | 验收门禁 |
| :--- | :--- | :--- | :--- |
| **Phase 0：诊断基线** | 测试环境与 dev 诊断 | 在测试或 dev 脚本中开启 Solid 2 诊断（收集 `STRICT_READ_UNTRACKED`、`REACTIVE_WRITE_IN_OWNED_SCOPE`、`FLUSH_IN_EFFECT_CALLBACK`、`UNCOMMITTED_INPUT_OVERWRITTEN` 基线计数） | 记录各诊断项基线数量，后续阶段只减不增 |
| **Phase 1：移除 `createSelector` & `bindElement`** | `src/shared/element-binding.ts`、`src/shared/utils.ts`、23 处 `bindElement` 调用、4 处 `createSelector` 调用 | 全面切换为 `createProjection` + 原生 `createEffect` / Two-phase directive；更新 oxlint 插件 | `pnpm run qa` + `pnpm run test` 全绿；`createSelector` 补充动态项增删防泄漏单测 |
| **Phase 2：移除 `settle()` 并重整批处理与 `onFlush`** | `src/shared/utils.ts`、`event-listener.ts`、`media-query.ts`、`use-auto-loading.ts`、`transition-presence.ts`、`disclosure-state.ts`、50 处 `settle` 调用 | 彻底删除 `settle()`；事件监听与定时器回归 Solid 2 默认微任务 flush；浮层关闭回调切换 `onFlush`；仅在明确同 tick DOM 边界保留裸 `flush()` | `pnpm run test` 全绿；验证事件回调抛错不再被静默吞掉；`FLUSH_IN_EFFECT_CALLBACK` 归零 |
| **Phase 3：清理 `pick` / `mergeDefaults` / `resolvePropsChildren` / `createContextProvider`** | `src/shared/utils.ts`、`create-context-provider.tsx`、151 处 `pick`、4 处 `mergeDefaults` | 移除 `pick` 与 `mergeDefaults`；修复 `resolvePropsChildren().toArray()` pin 漏洞；精简 Context 样板 | `pnpm run qa` + `pnpm run test` + `pnpm run docs:build` 全绿；SSR hydration 测试零回归 |
| **Phase 4：清理 `ownedWrite` / `untrack` / 共享表单与生态适配层（含 `createSolidReactivity`）** | `src/components/shared/form/`、`overlay/`、`splitter/`、`data-table/`、`virtualizer/`、`dnd/` | `ownedWrite: true` 从 46 处压减至接近 0；清理 `(() => ...)()` 残留；完整重构 `createSolidReactivity` / `createTable`（去 `batch: flush`、`settle`、函数式 `createSignal`、`queueMicrotask` 与 `flush(resolvedTable)`）及 `virtualizer` 卸载守卫 | dev 模式诊断中 `REACTIVE_WRITE_IN_OWNED_SCOPE` 与 `STRICT_READ_UNTRACKED` 归零；`solid-table.test.tsx` 与 `data-table` SSR hydration 测试全绿 |
| **Phase 5：组件层逐类对齐 & 文档/Skill 收尾** | `src/components/` 按类别分批（通用/表单/浮层/导航/展示）+ `AGENTS.md` + `docs/` | 统一 `<Repeat>`、稳定事件处理、原生 `class` 数组/对象、memo 截断 effect；更新 hooks 文档与 SSR skill | `pnpm run qa`、`pnpm run test`、`pnpm run docs:build`、生产 preview 移动端/桌面端零控制台诊断 |
