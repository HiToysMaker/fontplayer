# 彩色字体功能 - 最终解决方案

## ✅ 功能完成

为 fontPlayer 成功实现了完整的 OpenType 彩色字体支持（COLR/CPAL 格式）。

## 🎨 实现的核心功能

### 1. CPAL 表（调色板）
- 自动从图层提取唯一颜色
- 支持 rgba 字符串格式解析
- 默认黑色处理

### 2. COLR 表（彩色图层）
- 基础字形记录
- 图层字形映射
- 颜色索引关联

### 3. fontManager 集成
- 自动生成图层字形
- 更新所有相关表格（CFF, maxp, hmtx, hhea）
- 符合 OpenType 规范

## 🔧 关键问题及解决方案

### 问题 1: 图层 x 坐标全部丢失

**症状**: 所有图层的 x 坐标变为 0，但 y 坐标正常

**根本原因**:
图层字形的 `leftSideBearing` 继承自原始字符，导致 CFF 表的坐标转换公式出错：

```typescript
// CFF 表中的坐标转换
getXValue(x) = x - xMin + lsb

// 错误示例
layer: xMin=454, lsb=50 (继承自字符)
rawX=454 → getXValue(454) = 454 - 454 + 50 = 50 ❌
```

**解决方案** (`font.ts:896`):
```typescript
leftSideBearing: layerMetrics.xMin  // 使用图层自己的 xMin 作为 lsb
```

**结果**:
```typescript
layer: xMin=454, lsb=454 (使用自己的 xMin)
rawX=454 → getXValue(454) = 454 - 454 + 454 = 454 ✅
```

### 问题 2: 所有颜色显示为黑色

**症状**: 设置了红色等颜色的组件在字体册和 PS 中显示为黑色

**根本原因**:
组件的 `fillColor` 可能存储在 `component.value.fillColor` 而不是 `component.fillColor`

**解决方案** (`handlers.ts:1659`):
```typescript
// 检查两个可能的位置
const componentFillColor = (component as any).fillColor || (component as any).value?.fillColor
const fillColor = componentFillColor || 'rgba(0, 0, 0, 1)'
```

### 问题 3: hmtx 和 hhea 表不一致

**症状**: Font Validator 报错表大小不匹配

**根本原因**: 添加图层字形时未更新度量表

**解决方案** (`font.ts:970-981`):
```typescript
// 为图层字形添加 hmtx 记录
for (const layerGlyph of layerGlyphs) {
  hmtxTable.hMetrics.push({
    advanceWidth: layerGlyph.advanceWidth || 0,
    lsb: Math.round(layerGlyph.leftSideBearing || 0),
  })
}

// 更新 hhea 表
hheaTable.numberOfHMetrics = hmtxTable.hMetrics.length
```

### 问题 4: 图层字形度量信息缺失

**症状**: TTX 报错 IndexError

**解决方案**: 使用 `getMetrics` 计算完整的度量字段
```typescript
const layerMetrics = getMetrics({
  unicode: 0,
  contours: layerContours,
  contourNum: layerContourNum,
  advanceWidth: char.advanceWidth || options.unitsPerEm,
  leftSideBearing: undefined, // 让 getMetrics 自动计算
})
```

### 问题 5: COLR 和 CPAL 颜色映射不一致

**解决方案**: 创建共享的 `buildColorMap` 函数
```typescript
// cpal.ts
export function buildColorMap(characters) {
  // 统一的颜色收集逻辑
}

// colr.ts
import { buildColorMap } from './cpal'
const { colorMap } = buildColorMap(characters) // 使用相同的映射
```

## 📁 修改的文件清单

- ✅ `src/fontManager/tables/cpal.ts` - 新建 CPAL 表
- ✅ `src/fontManager/tables/colr.ts` - 新建 COLR 表
- ✅ `src/fontManager/table.ts` - 注册 COLR/CPAL 表
- ✅ `src/fontManager/font.ts` - 集成彩色字体逻辑
- ✅ `src/fontManager/character.ts` - 导出 ILayer 类型
- ✅ `src/fontEditor/menus/handlers.ts` - generateLayers 函数

## 🧪 验证结果

- ✅ Font Validator: 所有表验证通过
- ✅ TTX: 成功导出 XML
- ✅ 字体册: 彩色正确显示
- ✅ Photoshop: 彩色正确显示
- ✅ 图层位置: x/y 坐标都正确

## 🎯 使用方法

```typescript
// 在 handlers.ts 中导出彩色字体
const font = await create(fontCharacters, {
  familyName: selectedFile.value.name,
  styleName: 'Regular',
  unitsPerEm,
  ascender,
  descender,
  tables: selectedFile.value.fontSettings.tables || null,
  isColorFont: true,  // ← 启用彩色字体
})
```

## 📊 数据结构

```typescript
interface ICharacter {
  // ... 其他字段
  layers?: Array<{
    fillColor: string;  // 'rgba(r, g, b, a)' 或 'rgb(r, g, b)'
    contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>;
    contourNum: number;
  }>
}
```

## 🔑 关键实现细节

1. **图层字形的 lsb**: 必须等于其 `xMin`，以保持坐标不变
2. **fillColor 获取**: 检查 `component.fillColor` 和 `component.value.fillColor`
3. **颜色映射**: COLR 和 CPAL 必须使用相同的 `buildColorMap` 函数
4. **表更新**: 添加图层字形时必须同步更新 maxp、hmtx、hhea 表

## 🎉 功能特性

- ✅ 支持多图层彩色字符
- ✅ 自动颜色去重和调色板优化
- ✅ 默认黑色处理
- ✅ 符合 OpenType COLR v0/CPAL v0 规范
- ✅ 兼容 CFF 字体格式
- ✅ 保持图层位置和尺寸精确

