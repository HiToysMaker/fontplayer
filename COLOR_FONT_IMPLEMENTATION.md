# 彩色字体支持功能实现总结

## 概述

本次实现为 fontPlayer 添加了完整的彩色字体支持，使用 OpenType COLR/CPAL 表格格式。

## 实现的功能

### 1. CPAL 表（Color Palette Table）

**文件**: `src/fontManager/tables/cpal.ts`

- **功能**: 定义彩色字体的调色板
- **主要接口**:
  - `ICPALTable`: CPAL 表数据结构
  - `IColorRecord`: 颜色记录（BGRA 格式）
  
- **主要函数**:
  - `parseRgba(rgba: string)`: 解析 'rgba(r, g, b, a)' 字符串为颜色记录
  - `create(table: ICPALTable)`: 创建 CPAL 表的字节数组
  - `createFromLayers(characters)`: 从字符的 layers 数组自动提取唯一颜色并创建调色板

- **特性**:
  - 自动收集所有图层中的唯一颜色
  - 支持 rgba 字符串格式解析
  - 默认黑色：`rgba(0, 0, 0, 1)`

### 2. COLR 表（Color Table）

**文件**: `src/fontManager/tables/colr.ts`

- **功能**: 定义彩色字形的图层结构
- **主要接口**:
  - `ICOLRTable`: COLR 表数据结构
  - `IBaseGlyphRecord`: 基础字形记录（记录每个字形的图层索引和数量）
  - `ILayerRecord`: 图层记录（记录每个图层的字形 ID 和颜色索引）

- **主要函数**:
  - `create(table: ICOLRTable)`: 创建 COLR 表的字节数组
  - `createFromCharactersV0(characters, totalGlyphs)`: 从字符数组创建 COLR 表（版本 0）

- **实现方式**:
  - 每个彩色字符的图层被存储为独立的字形
  - 基础字形记录指向其图层字形
  - 图层字形引用调色板中的颜色索引

### 3. fontManager 集成

**文件**: `src/fontManager/font.ts`

- **修改点**:
  - 添加了 COLR 和 CPAL 表的导入
  - 在 `IOption` 接口中添加了 `isColorFont` 选项
  - 在 `createFont` 函数中添加了彩色字体处理逻辑

- **处理流程**:
  1. 检查 `options.isColorFont` 标志
  2. 遍历所有字符，检查是否有图层
  3. 为每个图层创建独立的字形
  4. 创建 CPAL 表（从图层颜色自动生成调色板）
  5. 创建 COLR 表（定义字形和图层的映射关系）
  6. 更新 CFF 表包含图层字形
  7. 更新 maxp 表的字形数量

### 4. tableTool 注册

**文件**: `src/fontManager/table.ts`

- **修改点**:
  - 导入 `colrTable` 和 `cpalTable` 模块
  - 在 `tableTool` 对象中注册 `COLR` 和 `CPAL` 表

### 5. fontEditor 改进

**文件**: `src/fontEditor/menus/handlers.ts`

- **generateLayers 函数改进**:
  - 为每个组件生成独立的图层
  - 每个图层包含自己的 `fillColor`、`contours` 和 `contourNum`
  - 如果 `fillColor` 为空或未定义，自动使用默认黑色 `rgba(0, 0, 0, 1)`
  - 正确传递组件数组给 `componentsToContours` 函数

- **createColorFont 函数**:
  - 为每个字符调用 `generateLayers` 生成图层数组
  - 将图层数组传递给 fontManager 的 `create` 函数

### 6. character 接口改进

**文件**: `src/fontManager/character.ts`

- **修改点**:
  - `ICharacter` 接口已包含 `layers?: Array<ILayer>` 字段
  - `ILayer` 接口定义了图层的完整数据结构
  - 导出 `ILayer` 类型供其他模块使用

## 数据流

```
fontEditor (handlers.ts)
  └─> generateLayers(character)
       ├─> 遍历字符的每个组件
       ├─> 为每个组件生成 contours
       ├─> 提取 fillColor（默认黑色）
       └─> 返回 layers 数组
  
  └─> createColorFont(options)
       ├─> 为每个字符生成 layers
       └─> 调用 fontManager.create({ ..., isColorFont: true })

fontManager (font.ts)
  └─> createFont(characters, options)
       ├─> 检查 options.isColorFont
       ├─> 为图层创建独立字形
       ├─> createCpalTable(characters) → CPAL 表
       ├─> createColrTable(characters, totalGlyphs) → COLR 表
       ├─> 更新 CFF 表包含图层字形
       └─> 生成最终字体文件
```

## 颜色格式

- **输入格式**: `rgba(r, g, b, a)` 或 `rgb(r, g, b)` 字符串
  - r, g, b: 0-255
  - a: 0-1（浮点数）

- **存储格式**: BGRA 字节序
  - blue: 0-255
  - green: 0-255
  - red: 0-255
  - alpha: 0-255

- **默认值**: `rgba(0, 0, 0, 1)` (不透明黑色)

## OpenType 规范符合性

本实现遵循 OpenType 规范：
- **COLR 版本**: 0（基础图层支持）
- **CPAL 版本**: 0（基础调色板支持）
- **字体格式**: CFF（PostScript 轮廓）

## 使用方法

### 在 fontEditor 中创建彩色字体

```typescript
const font = await createColorFont({
  remove_overlap: false,
  is_color_font: true  // 启用彩色字体
})
```

### 字符的 layers 数据结构

```typescript
interface ICharacter {
  // ... 其他字段
  layers?: Array<{
    fillColor: string;  // 'rgba(r, g, b, a)'
    contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>;
    contourNum: number;
  }>
}
```

## 注意事项

1. **图层顺序**: 图层按组件顺序渲染，后面的图层会覆盖前面的图层
2. **颜色去重**: CPAL 表会自动去除重复颜色，优化调色板大小
3. **字形数量**: 彩色字体的总字形数 = 原始字符数 + 所有图层数
4. **兼容性**: 使用 COLR/CPAL 格式，兼容现代浏览器和操作系统

## 测试建议

1. 创建包含多个图层和不同颜色的字符
2. 测试默认黑色（不设置 fillColor）
3. 测试透明度（alpha 值）
4. 验证生成的字体文件可以在浏览器/操作系统中正确显示
5. 检查字形数量和调色板颜色数是否正确

## 问题修复记录

### 修复 1: hmtx 和 hhea 表不一致错误

**问题**: 
- Font Validator 报错: `E1404 - numberOfHMetrics 值与 hmtx 表长度不一致`
- Font Validator 报错: `E1500 - hmtx 表大小与计算大小不匹配`

**原因**: 
添加图层字形时，更新了 `maxp.numGlyphs`，但没有相应更新 `hmtx` 表和 `hhea.numberOfHMetrics`

**修复方案**:
1. 为每个图层字形在 `hmtx` 表中添加度量信息（advanceWidth, lsb）
2. 更新 `hhea.numberOfHMetrics` 为新的总字形数

```typescript
// 更新 hmtx 表
for (const layerGlyph of layerGlyphs) {
  hmtxTable.hMetrics.push({
    advanceWidth: layerGlyph.advanceWidth || 0,
    lsb: Math.round(layerGlyph.leftSideBearing || 0),
  })
}

// 更新 hhea 表
hheaTable.numberOfHMetrics = hmtxTable.hMetrics.length
```

### 修复 2: CFF 表字形度量信息缺失

**问题**:
- TTX 报错: `Error in charstring 22 - IndexError: list index out of range`

**原因**:
图层字形缺少必要的度量字段（xMin, xMax, yMin, yMax, rightSideBearing等）

**修复方案**:
使用 `getMetrics` 函数为每个图层字形计算完整的度量信息

```typescript
const layerMetrics = getMetrics({
  unicode: 0,
  contours: layerContours,
  contourNum: layerContourNum,
  advanceWidth: char.advanceWidth || options.unitsPerEm,
  leftSideBearing: char.leftSideBearing || 0,
})

layerGlyphs.push({
  // ... 其他字段
  leftSideBearing: layerMetrics.leftSideBearing,
  rightSideBearing: layerMetrics.rightSideBearing,
  xMin: layerMetrics.xMin,
  xMax: layerMetrics.xMax,
  yMin: layerMetrics.yMin,
  yMax: layerMetrics.yMax,
})
```

### 修复 3: 空轮廓处理

**问题**:
某些图层可能没有轮廓数据，导致字体生成失败

**修复方案**:
为图层轮廓添加默认值处理

```typescript
const layerContours = layer.contours || [[]]
const layerContourNum = layerContours.length
```

## 未来改进方向

1. **COLR v1 支持**: 支持渐变、变换等高级特性
2. **多调色板**: 支持多个主题调色板
3. **图层优化**: 自动合并相同颜色的相邻图层
4. **预览功能**: 在编辑器中实时预览彩色效果

