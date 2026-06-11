---
name: record
description: >-
  从对话上下文抽取约束决策、待办与备注，高置信写入 Progress.md。
  在用户输入 /record、记录一下、记录进度，或 @progress-recorder 要求记录时使用。
  遵循 .claude/agents/progress-recorder.md 协议，仅写 Progress.md 与 Progress.archive.md。
disable-model-invocation: true
---

# /record — 进度记录

## 身份

以 **Progress Recorder** 身份执行记录，**只记录不决策**。完整协议见 [.claude/agents/progress-recorder.md](../../../.claude/agents/progress-recorder.md)，执行前必须先读取该文件。

## 触发条件

- 用户输入 `/record`
- 「记录一下」「记录进度」「补录进度」
- 对话出现高置信触发词：决定/必须/完成/TODO/备注 等
- `@progress-recorder` 且语境为记录（非 `/archive`）

## 委派策略

1. **优先**：使用 `Task` 工具，`subagent_type: progress-recorder`，传递「执行 /record」及最近对话上下文
2. **降级**（子代理不可用或用户已授权，见 Progress.md N001）：主代理按下方流程直接写入

## 记录流程

### 1. 读取

- `Progress.md` — 现有 D/T/N 编号，避免 ID 冲突与语义重复
- 最近对话上下文 — 用户指令、已完成的实现、明确决策

### 2. 语义抽取与分类

| 触发词/模式 | 分类 | 置信要求 | 动作 |
|------------|------|---------|------|
| 决定、确定、采用、选用 | 约束决策 D### | ≥0.8 | 追加行 |
| 必须、应当、不得、禁止 | 约束决策 D### | ≥0.8 | 追加行 |
| 需要、待办、TODO、下一步 | 待办 T### | ≥0.8 | 追加，status=pending |
| 完成、已完成、done | 待办状态 | ≥0.9 | 匹配相关 T### → completed |
| 备注、注意、说明 | 备注 N### | ≥0.7 | 追加行 |

置信度不足则**跳过并说明**，不臆造。

### 3. 写入 Progress.md

**约束决策**（只追加，禁止修改已有 D### 行）：

```
| D011 | 2026-06-11 | 决策内容摘要 | 来源：对话/指令摘要 |
```

**待办**：

```
| T013 | pending | 待办内容 | 2026-06-11 |
| T013 | completed | 待办内容 | 2026-06-11 |
```

**备注**：

```
| N008 | 2026-06-11 | 备注内容 |
```

- 删除 `_（暂无）_` 占位行（若存在）
- 更新顶部 `> 最后更新：YYYY-MM-DD HH:mm`
- 与现有条目语义重复时跳过

### 4. 返回摘要

```
Progress Recorder 摘要：
- 新增：D011 约束决策「...」
- 新增：T013 pending「...」
- 更新：T007 pending → completed
- 跳过：1 条（置信度不足：...）
```

## 核心公理（不可违反）

1. **D### 永久不可删改** — 只能追加新决策
2. **高置信才写入** — 未达阈值不写入
3. **来源可追溯** — 每条含来源字段
4. **不执行开发** — 只写记忆文件，不改代码

## 与 /archive 的区别

| 指令 | 作用 |
|------|------|
| `/record` | 从对话抽取决策/待办/备注，**写入** Progress.md |
| `/archive` | 将 Progress.md 中**已完成**条目**追加**到 Progress.archive.md |

## 快速检查清单

```
- [ ] 已读取 progress-recorder.md 与 Progress.md
- [ ] 分类正确（决策/待办/备注）
- [ ] ID 无冲突、无重复语义
- [ ] D### 未被修改或删除
- [ ] 置信度达标，未臆造
- [ ] 最后更新时间已刷新
- [ ] 已向用户返回记录摘要
```
