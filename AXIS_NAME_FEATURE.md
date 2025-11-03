# 可变字体轴名称自动管理功能

## 功能概述

自动将可变字体的轴名称添加到name表的string pool中，并为每个轴分配唯一的nameID。

## 快速开始

```typescript
import { createFont, type IVariationAxis } from './src/fontManager/font'

// 1. 定义可变字体轴
const axes: IVariationAxis[] = [
  {
    tag: 'wght',
    name: 'Weight',
    minValue: 100,
    defaultValue: 400,
    maxValue: 900,
  }
]

// 2. 创建字体时传入variants
const font = await createFont(characters, {
  familyName: 'MyFont',
  unitsPerEm: 1000,
  ascender: 800,
  descender: -200,
  
  variants: {
    axes: axes  // 传入axes
  },
  
  tables: { /* ... */ }
})

// 3. nameID已自动分配
console.log(axes[0].nameID)  // 256 (自动分配)
```

## 修改的文件

### 核心代码
- ✅ `src/fontManager/font.ts` - 添加IVariationAxis和IVariants接口
- ✅ `src/fontManager/tables/name.ts` - 实现addAxisNamesToTable函数

### 文档
- 📄 `docs/VARIATION_FONT_AXIS_NAMING.md` - 详细使用指南
- 📄 `docs/AXIS_NAME_IMPLEMENTATION_SUMMARY.md` - 实现总结
- 📄 `src/fontManager/examples/createVariableFont.example.ts` - 使用示例

## 主要特性

✅ **自动分配nameID**：从256开始自动分配  
✅ **类型安全**：完整的TypeScript类型定义  
✅ **多语言支持**：自动创建英文和中文条目  
✅ **向后兼容**：不影响现有代码  
✅ **零配置**：只需传入axes数组即可  

## 工作原理

```
用户定义axes → createFont → createNameTable2 → addAxisNamesToTable
                                                      ↓
                                        分配nameID并添加到name表
                                                      ↓
                                        自动修改axes[].nameID
```

## 使用场景

1. **创建可变字体**：为fvar表的axes提供nameID
2. **字体编辑器**：显示轴的用户友好名称
3. **字体检视工具**：解析和显示轴信息

## 示例

详细示例请查看：
- `src/fontManager/examples/createVariableFont.example.ts`
- `docs/VARIATION_FONT_AXIS_NAMING.md`

## API

### IVariationAxis

```typescript
interface IVariationAxis {
  tag: string;           // 轴标签，如 'wght'
  name: string;          // 轴名称，如 'Weight'
  minValue: number;      // 最小值
  defaultValue: number;  // 默认值
  maxValue: number;      // 最大值
  nameID?: number;       // 自动分配的nameID
}
```

### IVariants

```typescript
interface IVariants {
  axes: Array<IVariationAxis>;
  instances?: Array<any>;
}
```

## 注意事项

1. 每个axis必须有`name`字段
2. nameID从256开始分配（0-255为预定义）
3. axes数组会被直接修改（添加nameID字段）
4. 目前为每个axis创建英文和中文两个name条目

## 相关规范

- [OpenType Font Variations](https://docs.microsoft.com/en-us/typography/opentype/spec/otvaroverview)
- [fvar Table](https://docs.microsoft.com/en-us/typography/opentype/spec/fvar)
- [name Table](https://docs.microsoft.com/en-us/typography/opentype/spec/name)

## 版本

v1.0.0 - 初始实现

