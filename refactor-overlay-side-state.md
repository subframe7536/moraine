# Overlay Menu Transition State 重构

## Summary

简化 `OverlayMenu` 的定位与过渡状态：以运行时 `data-side`、`data-align` 为唯一 DOM 状态来源，将方向间距、侧向动画和定位角动画集中到 `cva`，移除旧的 `data-placement`、`data-motion` 与 `usePlacementMotion` 机制，同时保持 DropdownMenu、ContextMenu 现有视觉行为。

## Implementation Changes

- 在 `src/overlays/base/menu/menu.tsx`：
  - 从当前 placement 派生 `side` 与可选的逻辑 `align`（`start`/`end`）；无对齐时省略 `data-align`。
  - 内容节点仅输出 `data-side`、可选 `data-align`、存在状态属性及现有通用属性；移除 `data-placement`、`data-motion`。
  - 将 `usePlacementMotion` 替换为明确的内部过渡模式（`side` 或 `placement`），不再把模式编码到 DOM 属性中；DropdownMenu 使用 `side`，ContextMenu 使用 `placement`，子菜单继承根菜单模式。
  - 保持定位、presence、焦点管理和 SSR 创建顺序不变；状态通过 getter/memo 读取，placement 变化时仅更新属性和 class。

- 在 `src/overlays/base/menu/menu.class.ts`：
  - 重写 `overlayMenuContentVariants`，将 `side`、`align`、过渡模式组合收敛到 `cva` 的 variants/compoundVariants。
  - `side` variant 只负责四方向 overflow 间距及普通侧向动画。
  - `placement` 模式通过 `data-side` + `data-align` 选择九种 origin 动画（无 align 使用 center），不再匹配完整 placement 字符串。
  - 保留基础 enter/exit、reduced-motion、transform-origin 等公共 class，删除长串运行时 `data-motion`/`data-placement` 选择器。

- 在 DropdownMenu、ContextMenu 及相关公开类型中：
  - 删除 `usePlacementMotion` 及旧 transition state 的公开/内部传递。
  - 更新组件调用以传递新的语义化过渡模式。
  - 不改变用户可见的 `placement`、`gutter`、`shift` 或菜单项 API。

- 更新 `todo.md`，完成该条目。

## Test Plan

- 更新 DropdownMenu/ContextMenu 过渡断言：
  - 默认菜单输出 `data-side=bottom`，无 `data-align` 时使用侧向动画。
  - `left-start`、`bottom-end`、子菜单 `right-start` 正确输出 side/align，并选择对应 cva class。
  - ContextMenu 的各方向和对齐组合继续使用正确 origin 动画。
  - 旧的 `data-placement`、`data-motion` 属性不再存在。
- 增加运行时反应测试：Floating UI placement 改变后，`data-side`、`data-align` 与 class 同步更新且内容节点不重挂载。
- 保留并运行现有关闭/重开、递归子菜单、presence exit、RTL、SSR hydration 测试。
- 验证命令：`bun run test src/overlays/dropdown-menu/dropdown-menu.test.tsx src/overlays/context-menu/context-menu.test.tsx`、`bun run qa`、`bun run test`。

## Assumptions

- `data-align` 使用逻辑值 `start`/`end`，无对齐时省略；origin 选择在 cva 中将其映射到 top/center/bottom 或 left/right。
- 仅重构 OverlayMenu；Popover、Tooltip、Sheet 保持各自的 transition API。
- 这是 pre-alpha 允许的破坏性变更，旧 DOM data 属性不提供兼容层。
- ContextMenu 保留定位角动画，DropdownMenu 保留四方向侧向动画；其他行为和视觉 token 不变。
