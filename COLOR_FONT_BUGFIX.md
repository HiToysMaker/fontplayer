# 彩色字体 Bug 修复总结

## 问题描述

生成的彩色字体在 Font Validator 和 TTX 中报错：

### Font Validator 错误
1. **hhea 表**: `E1404 - numberOfHMetrics 值与 hmtx 表长度不一致`
2. **hmtx 表**: `E1500 - 表大小与计算大小不匹配`

### TTX 错误
```
ERROR: Error in charstring 22
IndexError: list index out of range
```

## 根本原因

当为彩色字体添加图层字形时，我们：
- ✅ 更新了 `CFF` 表（包含所有字形的轮廓数据）
- ✅ 更新了 `maxp.numGlyphs`（总字形数）
- ❌ **忘记更新** `hmtx` 表（字形度量信息）
- ❌ **忘记更新** `hhea.numberOfHMetrics`（度量数量）
- ❌ **图层字形缺少** 完整的度量字段（xMin, xMax, yMin, yMax等）

## 修复内容

### 1. 更新 hmtx 表（`font.ts:922-929`）

为每个图层字形添加水平度量信息：

```typescript
// 更新 hmtx 表 - 为图层字形添加度量信息
console.log('⏳ Updating hmtx table with layer glyph metrics...')
for (const layerGlyph of layerGlyphs) {
  hmtxTable.hMetrics.push({
    advanceWidth: layerGlyph.advanceWidth || 0,
    lsb: Math.round(layerGlyph.leftSideBearing || 0),
  })
}
console.log(`✅ Updated hmtx table with ${hmtxTable.hMetrics.length} total metrics`)
```

### 2. 更新 hhea 表（`font.ts:931-933`）

同步更新度量数量：

```typescript
// 更新 hhea 表的 numberOfHMetrics
hheaTable.numberOfHMetrics = hmtxTable.hMetrics.length
console.log(`✅ Updated hhea.numberOfHMetrics to ${hheaTable.numberOfHMetrics}`)
```

### 3. 为图层字形计算完整度量（`font.ts:879-902`）

使用 `getMetrics` 函数计算所有必需的度量字段：

```typescript
// 计算图层的度量信息
const layerMetrics = getMetrics({
  unicode: 0,
  contours: layerContours,
  contourNum: layerContourNum,
  advanceWidth: char.advanceWidth || options.unitsPerEm,
  leftSideBearing: char.leftSideBearing || 0,
})

// 每个图层都是一个独立的字形
layerGlyphs.push({
  unicode: 0,
  name: `layer_${layerGlyphs.length}`,
  contours: layerContours,
  contourNum: layerContourNum,
  advanceWidth: char.advanceWidth || options.unitsPerEm,
  leftSideBearing: layerMetrics.leftSideBearing,  // ← 新增
  rightSideBearing: layerMetrics.rightSideBearing, // ← 新增
  xMin: layerMetrics.xMin,                         // ← 新增
  xMax: layerMetrics.xMax,                         // ← 新增
  yMin: layerMetrics.yMin,                         // ← 新增
  yMax: layerMetrics.yMax,                         // ← 新增
})
```

### 4. 添加空轮廓保护（`font.ts:875-877`）

防止图层轮廓为空导致的错误：

```typescript
// 确保图层有有效的轮廓数据
const layerContours = layer.contours || [[]]
const layerContourNum = layerContours.length
```

## 验证方法

修复后，生成的彩色字体应该：

1. ✅ 在 Font Validator 中通过 hhea 和 hmtx 表验证
2. ✅ 可以用 TTX 成功导出为 XML
3. ✅ 字形数量正确：`原始字符数 + 图层数`
4. ✅ 所有表的大小和数据一致性正确

## 测试命令

```bash
# 使用 Font Validator 验证
# (在 Font Validator GUI 中打开字体文件)

# 使用 TTX 导出测试
ttx "彩色字体测试一.otf"

# 成功输出应该类似：
# Dumping "彩色字体测试一.otf" to "彩色字体测试一.ttx"...
# Dumping 'GlyphOrder' table...
# Dumping 'head' table...
# ... (所有表成功导出)
```

## TypeScript 类型错误修复

### 问题 4: encoder 返回值类型错误

**问题**:
- CPAL 表中有 10 个 TypeScript 类型错误
- `encoder` 函数返回 `false | number[]`，但 `concat` 不能接受 `false`

**原因**:
直接使用 `data.concat(encoder.uint16(...))` 时，TypeScript 无法确定返回值不是 `false`

**修复方案**:
为每个 encoder 调用添加类型检查：

```typescript
// 修复前
data = data.concat(encoder.uint16(table.version))

// 修复后
const versionBytes = encoder.uint16(table.version)
if (versionBytes) data = data.concat(versionBytes)
```

**影响的文件**:
- ✅ `src/fontManager/tables/cpal.ts` - 修复所有 10 个类型错误
- ✅ `src/fontManager/tables/colr.ts` - 已验证无错误

## 影响的文件

- ✅ `src/fontManager/font.ts` - 主要修复位置
- ✅ `src/fontManager/tables/cpal.ts` - 修复类型错误
- ✅ `COLOR_FONT_IMPLEMENTATION.md` - 更新文档

## 后续问题修复

### 问题 5: 图层 x 坐标丢失

**问题**:
所有图层的 x 坐标都变为 0，但 y 坐标正常

**原因**:
在 `generateLayers` 函数中，错误地传递了 `{x: 0, y: 0}` 作为 offset 参数给 `componentsToContours`

**修复方案**:
移除 offset 参数，让函数使用组件自身的位置

```typescript
// ❌ 修复前 - 强制 offset 为 0
const contours = componentsToContours([component], {
  unitsPerEm: ...,
  descender: ...,
  advanceWidth: ...,
}, {x: 0, y: 0}, false, false, false)

// ✅ 修复后 - 使用组件自身位置
const contours = componentsToContours([component], {
  unitsPerEm: ...,
  descender: ...,
  advanceWidth: ...,
})
```

### 问题 6: 彩色图层显示为黑色

**问题**:
设置了红色的组件在字体册和 PS 中显示为黑色

**原因**:
COLR 表和 CPAL 表使用了不同的颜色映射逻辑，导致颜色索引不匹配

**修复方案**:

1. 在 CPAL 表中导出共享的 `buildColorMap` 函数
2. 在 COLR 表中导入并使用相同的颜色映射

```typescript
// cpal.ts
export function buildColorMap(characters: Array<any>) {
  const colorMap = new Map<string, number>()
  const colorRecords: IColorRecord[] = []
  
  for (const char of characters) {
    if (!char.layers) continue
    for (const layer of char.layers) {
      const rgbaStr = layer.fillColor || 'rgba(0, 0, 0, 1)'
      if (!colorMap.has(rgbaStr)) {
        colorMap.set(rgbaStr, colorRecords.length)
        colorRecords.push(parseRgba(rgbaStr))
      }
    }
  }
  
  return { colorMap, colorRecords }
}

// colr.ts
import { buildColorMap } from './cpal'

export function createFromCharactersV0(...) {
  // 使用与 CPAL 表相同的颜色映射
  const { colorMap } = buildColorMap(characters)
  
  for (const layer of char.layers) {
    const rgbaStr = layer.fillColor || 'rgba(0, 0, 0, 1)'
    const paletteIndex = colorMap.get(rgbaStr) || 0 // 现在索引匹配了
    
    layerRecords.push({
      glyphID: layerGlyphID++,
      paletteIndex // 正确的颜色索引
    })
  }
}
```

**调试输出**:
添加了详细的颜色映射调试输出，便于验证：
- CPAL 表显示所有颜色记录及其 RGBA 值
- COLR 表显示每个图层的颜色字符串到索引的映射

## 后续建议

1. 添加单元测试验证图层字形的度量信息完整性
2. 在字体生成后自动验证表的一致性
3. 考虑添加调试模式，输出详细的字形信息用于排查问题
4. 验证不同颜色（红、绿、蓝、透明度等）的正确显示


