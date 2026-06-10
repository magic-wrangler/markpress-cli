/**
 * 表格单元格合并处理模块
 *
 * 合并规则：
 * - 纵向（rowspan）：所有行（thead + tbody）中，空单元格向上合并
 * - 横向（colspan）：仅表头行（thead th）中，空单元格向左合并
 * - 手动标记：^^ 强制向上合并，<< 强制向左合并（任意区域均生效）
 */

export interface TableMergeConfig {
  enableRowMerge: boolean
  enableColMerge: boolean
}

const ROW_MERGE_MARKER = '^^'
const COL_MERGE_MARKER = '<<'

function cellText(cell: HTMLTableCellElement): string {
  return cell.innerHTML.trim()
}

function isEmptyOrRowMarker(cell: HTMLTableCellElement): boolean {
  const t = cellText(cell)
  return t === '' || t === ROW_MERGE_MARKER
}

function isColMarker(cell: HTMLTableCellElement): boolean {
  return cellText(cell) === COL_MERGE_MARKER
}

function isEmptyOrColMarker(cell: HTMLTableCellElement): boolean {
  const t = cellText(cell)
  return t === '' || t === COL_MERGE_MARKER
}

/**
 * 构建表格网格矩阵
 * 返回 grid[rowIndex][colIndex] = HTMLTableCellElement | null
 * null 表示该格子被其他单元格的 rowspan/colspan 占据
 *
 * 注意：此时表格中还没有 rowspan/colspan，所以直接按 cells 顺序映射即可
 */
function buildGrid(rows: HTMLTableRowElement[]): (HTMLTableCellElement | null)[][] {
  const grid: (HTMLTableCellElement | null)[][] = rows.map(() => [])

  for (let r = 0; r < rows.length; r++) {
    let colCursor = 0
    const cells = Array.from(rows[r].cells)
    for (const cell of cells) {
      // 跳过已被占位的列
      while (grid[r][colCursor] !== undefined) colCursor++
      grid[r][colCursor] = cell
      colCursor++
    }
  }

  return grid
}

/**
 * 处理表头横向合并：thead 行中空单元格（或 << 标记）向左合并
 */
function processColMerge(table: HTMLTableElement): void {
  const theadRows = Array.from(table.querySelectorAll('thead tr')) as HTMLTableRowElement[]

  for (const row of theadRows) {
    // 快照当前 cells（从右向左，避免 remove 后索引变化）
    const cells = Array.from(row.cells)
    for (let i = cells.length - 1; i >= 1; i--) {
      const cell = cells[i]
      if (!isEmptyOrColMarker(cell)) continue

      // 向左找第一个有内容的单元格
      let targetIndex = i - 1
      while (targetIndex >= 0 && isEmptyOrColMarker(cells[targetIndex])) {
        targetIndex--
      }
      if (targetIndex >= 0) {
        const target = cells[targetIndex]
        const cur = parseInt(target.getAttribute('colspan') || '1', 10)
        target.setAttribute('colspan', String(cur + 1))
        cell.remove()
      }
    }
  }

  // tbody 中的 << 手动标记也支持横向合并
  const tbodyRows = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[]
  for (const row of tbodyRows) {
    const cells = Array.from(row.cells)
    for (let i = cells.length - 1; i >= 1; i--) {
      const cell = cells[i]
      if (!isColMarker(cell)) continue

      let targetIndex = i - 1
      while (targetIndex >= 0 && isColMarker(cells[targetIndex])) {
        targetIndex--
      }
      if (targetIndex >= 0) {
        const target = cells[targetIndex]
        const cur = parseInt(target.getAttribute('colspan') || '1', 10)
        target.setAttribute('colspan', String(cur + 1))
        cell.remove()
      }
    }
  }
}

/**
 * 处理纵向合并：全表所有行，空单元格（或 ^^ 标记）向上合并
 * 使用列索引网格正确追踪每个单元格的视觉列位置
 */
function processRowMerge(table: HTMLTableElement): void {
  const rows = Array.from(table.querySelectorAll('tr')) as HTMLTableRowElement[]
  if (rows.length < 2) return

  // 确定最大列数（取所有行 cells 数量的最大值）
  const maxCols = Math.max(...rows.map(r => r.cells.length))

  // 构建列索引映射：cellToCol[cell] = 视觉列索引
  // 按行顺序，为每个 cell 分配当前行未被占用的最小列索引
  const cellToCol = new Map<HTMLTableCellElement, number>()
  // occupied[r][c] = true 表示第 r 行第 c 列已被占用
  const occupied: boolean[][] = rows.map(() => new Array(maxCols).fill(false))

  for (let r = 0; r < rows.length; r++) {
    let col = 0
    for (const cell of Array.from(rows[r].cells)) {
      while (occupied[r][col]) col++
      cellToCol.set(cell, col)
      col++
    }
  }

  // 按列从下往上扫描，合并空单元格
  for (let colIdx = 0; colIdx < maxCols; colIdx++) {
    for (let r = rows.length - 1; r >= 1; r--) {
      // 找到该行该列的 cell
      const cell = Array.from(rows[r].cells).find(c => cellToCol.get(c) === colIdx)
      if (!cell || !isEmptyOrRowMarker(cell)) continue

      // 向上找第一个有内容的 cell（同一视觉列）
      for (let tr = r - 1; tr >= 0; tr--) {
        const target = Array.from(rows[tr].cells).find(c => cellToCol.get(c) === colIdx)
        if (target && !isEmptyOrRowMarker(target)) {
          const cur = parseInt(target.getAttribute('rowspan') || '1', 10)
          target.setAttribute('rowspan', String(cur + 1))
          cell.remove()
          break
        }
      }
    }
  }
}

/**
 * 当 thead 中存在 rowspan>1 的单元格时，将 thead 的行迁移到 tbody 顶部
 * 因为浏览器不支持 rowspan 跨越 thead/tbody 边界
 * 保留 th 标签以维持表头样式
 */
function flattenTheadIfNeeded(table: HTMLTableElement): void {
  const thead = table.querySelector('thead')
  if (!thead) return

  // 检查 thead 中是否有 rowspan>1 的 cell
  const hasRowspan = Array.from(thead.querySelectorAll('th,td')).some(c => {
    const rs = parseInt(c.getAttribute('rowspan') || '1', 10)
    return rs > 1
  })
  if (!hasRowspan) return

  let tbody = table.querySelector('tbody')
  if (!tbody) {
    tbody = table.ownerDocument.createElement('tbody')
    table.appendChild(tbody)
  }

  // 把 thead 的所有 tr 移到 tbody 顶部
  const theadRows = Array.from(thead.querySelectorAll('tr'))
  for (let i = theadRows.length - 1; i >= 0; i--) {
    tbody.insertBefore(theadRows[i], tbody.firstChild)
  }
  thead.remove()
}

/**
 * 处理表格单元格合并
 */
export function processTableMerge(html: string, config: TableMergeConfig): string {
  if (!config.enableRowMerge && !config.enableColMerge) return html

  // 仅在浏览器环境执行（DOMParser 需要 window）
  if (typeof window === 'undefined') return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const container = doc.body.firstElementChild
  if (!container) return html

  const tables = container.querySelectorAll('table')
  if (tables.length === 0) return html

  console.log('[table-merge] config:', config, 'tables count:', tables.length)

  tables.forEach((table, idx) => {
    const rowsBefore = table.querySelectorAll('tr').length
    const cellsBefore = table.querySelectorAll('th,td').length
    // 先横向（colspan），再纵向（rowspan）
    if (config.enableColMerge) processColMerge(table)
    if (config.enableRowMerge) processRowMerge(table)
    // 若 thead 有 rowspan>1，扁平化到 tbody（解决浏览器不支持 thead/tbody 跨区合并）
    flattenTheadIfNeeded(table)
    const cellsAfter = table.querySelectorAll('th,td').length
    if (cellsBefore !== cellsAfter) {
      console.log(`[table-merge] table#${idx}: rows=${rowsBefore} cells ${cellsBefore} -> ${cellsAfter}`)
      if (idx === 3) {
        console.log(`[table-merge] table#${idx} HTML:`, table.outerHTML)
      }
    }
  })

  return container.innerHTML
}

/**
 * 清除合并标记但不执行合并
 */
export function clearMergeMarkers(html: string): string {
  return html
    .replace(new RegExp(`>\\s*${ROW_MERGE_MARKER}\\s*<`, 'g'), '><')
    .replace(new RegExp(`>\\s*${COL_MERGE_MARKER}\\s*<`, 'g'), '><')
}
