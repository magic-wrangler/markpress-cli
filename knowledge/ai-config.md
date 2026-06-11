# AI 模型与 DeepSeek 配置

> **重要区分**：本页的「模型」指 **DeepSeek 大语言模型**（如 `deepseek-v4-flash`），**不是**文档主题 JSON。用户说「模型列表」「模型新增」等时，**不要**修改主题 JSON，应引导其使用下方**指定命令**。

## 指定命令（mpr ai 对话内）

在 `mpr ai` 输入框**原样发送**以下命令，由 CLI 本地执行：

| 操作 | 指定命令（中文） | 英文别名 |
|------|------------------|----------|
| **查看列表** | `模型列表` | `model list` |
| **新增模型** | `模型新增` | `model add` |
| **修改/切换** | `模型修改` | `model switch` |
| **删除模型** | `模型删除` | `model delete` |
| **快速切换** | `模型使用1` / `模型使用2` … | `model use 1` |
| **命令帮助** | `模型帮助` | `model help` |

### 使用示例

```
> 模型新增          # 添加 deepseek-v4-pro 到 savedModels
> 模型新增          # 可多次执行，保存多个模型
> 模型列表          # 查看 1. xxx  2. yyy 带序号列表
> 模型修改          # 交互选择当前使用的模型
> 模型使用2         # 一键切换到第 2 个
> 模型删除          # 从列表移除（至少保留 1 个）
> 模型帮助          # 显示本命令表
```

完整 API 密钥、temperature 等：`配置` 或 `mpr ai config`

## 配置文件

| 项 | 说明 |
|----|------|
| 路径 | `~/.markpress/ai-config.json` |
| 内容 | API 密钥、当前 `model`、`savedModels` 数组、地址、temperature |

```json
{
  "provider": "deepseek",
  "deepseek": {
    "apiKey": "sk-...",
    "model": "deepseek-v4-flash",
    "baseUrl": "https://api.deepseek.com",
    "temperature": 0.7,
    "savedModels": [
      "deepseek-v4-flash",
      "deepseek-v4-pro"
    ]
  }
}
```

- `model`：当前实际调用
- `savedModels`：已保存的多个模型（可新增多个）

## 预设模型

| 模型名 | 说明 |
|--------|------|
| `deepseek-v4-flash` | **推荐**，快速 |
| `deepseek-v4-pro` | 更强 |
| `deepseek-chat` | 将于 2026/07/24 弃用 |
| `deepseek-reasoner` | 将于 2026/07/24 弃用 |

`模型新增` 时可选「自定义输入…」填写官方新模型名。

## 环境变量（优先级高于配置文件）

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | API 密钥 |
| `DEEPSEEK_MODEL` | 覆盖当前 model |
| `DEEPSEEK_BASE_URL` | API 地址 |

## AI 回答原则（模型相关）

1. 用户发送 `模型列表`、`模型新增`、`模型修改`、`模型删除` 等 → **本地 CLI 指令**，用文字引导使用上述命令，**禁止输出主题 JSON**
2. 用户问「怎么新增/修改/删除模型」→ 列出上表指定命令
3. 「模型」单独一词若未匹配本地指令，提示发送 **`模型列表`** 或 **`模型帮助`**
