import * as p from '@clack/prompts'
import {
  CUSTOM_MODEL_VALUE,
  DEFAULT_MODEL,
  DEEPSEEK_MODELS,
  isPresetModel,
} from './user-config.ts'

/** 从预设或自定义输入选择 DeepSeek 模型名 */
export async function promptPickModel(
  message = '选择模型',
  current?: string,
  exclude?: Set<string>
): Promise<string | symbol> {
  const options = DEEPSEEK_MODELS.filter((m) => !exclude?.has(m.value)).map((m) => ({
    value: m.value,
    label: m.label,
    hint: m.hint,
  }))

  if (current && !isPresetModel(current) && !exclude?.has(current)) {
    options.unshift({
      value: current,
      label: `${current}（当前）`,
      hint: '已保存的自定义模型',
    })
  }

  options.push({
    value: CUSTOM_MODEL_VALUE,
    label: '自定义输入…',
    hint: '输入 DeepSeek 官方模型名',
  })

  const selected = await p.select({
    message,
    initialValue: current || DEFAULT_MODEL,
    options,
  })
  if (p.isCancel(selected)) return selected

  if (selected !== CUSTOM_MODEL_VALUE) return selected as string

  return p.text({
    message: '模型名称',
    placeholder: 'deepseek-v4-flash',
    defaultValue: current && !isPresetModel(current) ? current : '',
    validate: (value) => {
      const v = value?.trim()
      if (!v) return '请输入模型名称'
      if (!/^[\w.-]+$/.test(v)) return '模型名仅支持字母、数字、连字符、点号'
      if (exclude?.has(v)) return '该模型已在列表中'
    },
  })
}
