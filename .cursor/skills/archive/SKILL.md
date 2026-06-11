---
name: archive
description: >-
  将 Progress.md 中已完成的待办与需归档备注追加到 Progress.archive.md。
  在用户输入 /archive、归档进度、归档已完成待办，或 @progress-recorder 要求归档时使用。
  遵循 .claude/agents/progress-recorder.md 协议，仅写 Progress.md 与 Progress.archive.md。
disable-model-invocation: true
---

# /archive — 进度归档

## 身份

以 **Progress Recorder** 身份执行归档，**只记录不决策**。完整协议见 [.claude/agents/progress-recorder.md](../../../.claude/agents/progress-recorder.md)，执行前必须先读取该文件。

## 触发条件

- 用户输入 `/archive`
- 「归档进度」「归档已完成」「把完成的待办归档」
- `@progress-recorder` 且语境为归档（非 `/record`）

## 委派策略

1. **优先**：使用 `Task` 工具，`subagent_type: progress-recorder`，传递「执行 /archive 归档」及当前对话上下文
2. **降级**（子代理不可用或用户已授权，见 Progress.md N001）：主代理按下方流程直接写入

## 归档流程

### 1. 读取

- `Progress.md` — 待办状态、ID 编号、最后更新时间
- `Progress.archive.md` — 已有批次，避免重复归档

### 2. 筛选可归档条目

| 类型 | 条件 |
|------|------|
| 待办 T### | `status=completed` 且尚未 `archived` |
| 备注 N### | 用户显式要求归档，或标注为历史背景且不再活跃 |

**不归档**：`pending` / `in_progress` 待办；约束决策 D###（永久保留在 Progress.md，只追加不删改）。

### 3. 写入 Progress.archive.md（只增不删）

追加一个新批次，禁止修改已有批次内容：

```markdown
## [ARCH-YYYYMMDD-HHMM] 归档批次

### 归档待办
- T001 | completed | 内容 | 完成日期：YYYY-MM-DD

### 归档备注
- N001 | YYYY-MM-DD | 内容
```

若无条目可归档，删除 `Progress.archive.md` 中的 `_（尚无归档记录）_` 占位行后再追加；若仍无条目，告知用户并停止。

### 4. 更新 Progress.md

- 已归档待办：`completed` → `archived`（或保留行并标注「已归档至 ARCH-xxx」）
- 更新顶部 `> 最后更新：YYYY-MM-DD HH:mm`
- **禁止**修改或删除任何 D### 约束决策行

### 5. 返回摘要

```
Progress Recorder 摘要：
- 归档批次：ARCH-YYYYMMDD-HHMM
- 归档待办：T001, T002, …
- 归档备注：N001, …（若有）
- 跳过：T007 pending（仍进行中）
```

## 核心公理（不可违反）

1. **D### 约束决策** — 永久不可删改，不归档移出 Progress.md
2. **Progress.archive.md** — 只追加，禁止删除或修改历史条目
3. **来源可追溯** — 批次内条目与 Progress.md 原内容一致
4. **不臆造** — 无 completed 待办时如实报告，不伪造归档

## 与 /record 的区别

| 指令 | 作用 |
|------|------|
| `/record` | 从对话抽取决策/待办/备注，**写入** Progress.md |
| `/archive` | 将 Progress.md 中**已完成**条目**追加**到 Progress.archive.md |

## 快速检查清单

```
- [ ] 已读取 progress-recorder.md 与 Progress.md
- [ ] 仅归档 completed 待办（及明确要求归档的备注）
- [ ] archive 为新批次追加，未改动历史
- [ ] D### 行未被修改或删除
- [ ] Progress.md 时间戳已更新
- [ ] 已向用户返回归档摘要
```
