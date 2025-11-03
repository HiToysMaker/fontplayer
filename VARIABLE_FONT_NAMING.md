# 可变字体名称自动管理完整功能

## 概述

为OpenType可变字体的**轴（axes）**和**实例（instances）**提供自动名称管理功能，自动将名称写入name表的string pool并分配唯一的nameID。

## 🎯 功能特性

### ✅ 轴名称管理（Axes）
- 自动为每个axis的`name`分配`nameID`
- 支持多语言（英文+中文）
- nameID从256开始分配

### ✅ 实例名称管理（Instances）
- 自动为每个instance的`subfamilyName`分配`subfamilyNameID`
- 自动为`postScriptName`分配`postScriptNameID`（可选）
- 支持多语言（subfamily支持英文+中文）
- nameID在axes之后继续递增

## 快速示例

```typescript
import { 
  createFont, 
  type IVariationAxis, 
  type IVariationInstance 
} from './src/fontManager/font'

// 1. 定义轴
const axes: IVariationAxis[] = [
  {
    tag: 'wght',
    name: 'Weight',
    minValue: 100,
    defaultValue: 400,
    maxValue: 900,
    // nameID 会自动分配
  }
]

// 2. 定义实例
const instances: IVariationInstance[] = [
  {
    subfamilyName: 'Bold',
    coordinates: [700],
    postScriptName: 'MyFont-Bold',
    // subfamilyNameID 和 postScriptNameID 会自动分配
  }
]

// 3. 创建字体
const font = await createFont(characters, {
  familyName: 'MyFont',
  unitsPerEm: 1000,
  ascender: 800,
  descender: -200,
  
  variants: {
    axes: axes,
    instances: instances
  },
  
  tables: {
    name: [/* 基础name表条目 */]
  }
})

// 4. 自动分配的nameID
console.log(axes[0].nameID)                    // 256
console.log(instances[0].subfamilyNameID)      // 257
console.log(instances[0].postScriptNameID)     // 258
```

## nameID分配示例

完整的nameID分配流程：

```typescript
// 假设有2个轴和3个实例

const axes = [
  { tag: 'wght', name: 'Weight', ... },
  { tag: 'wdth', name: 'Width', ... }
]

const instances = [
  { subfamilyName: 'Light', coordinates: [300, 100], postScriptName: 'MyFont-Light' },
  { subfamilyName: 'Regular', coordinates: [400, 100], postScriptName: 'MyFont-Regular' },
  { subfamilyName: 'Bold', coordinates: [700, 100], postScriptName: 'MyFont-Bold' }
]

// 创建字体后，自动分配：
// axes[0].nameID = 256 (Weight)
// axes[1].nameID = 257 (Width)
// instances[0].subfamilyNameID = 258 (Light)
// instances[0].postScriptNameID = 259 (MyFont-Light)
// instances[1].subfamilyNameID = 260 (Regular)
// instances[1].postScriptNameID = 261 (MyFont-Regular)
// instances[2].subfamilyNameID = 262 (Bold)
// instances[2].postScriptNameID = 263 (MyFont-Bold)
```

## 生成的name表

| nameID | platformID | languageID | 值 | 说明 |
|--------|------------|------------|-----|------|
| 1-22 | 3 | 0x409/0x804 | ... | 标准name表条目 |
| **256** | 3 | 0x409 | Weight | wght轴英文名 |
| **256** | 3 | 0x804 | Weight | wght轴中文名 |
| **257** | 3 | 0x409 | Width | wdth轴英文名 |
| **257** | 3 | 0x804 | Width | wdth轴中文名 |
| **258** | 3 | 0x409 | Bold | 实例subfamily英文 |
| **258** | 3 | 0x804 | Bold | 实例subfamily中文 |
| **259** | 3 | 0x409 | MyFont-Bold | 实例PostScript名 |

## 与fvar表集成

```typescript
import { create as createFvarTable } from './fontManager/tables/fvar'

const fvarTable = {
  majorVersion: 1,
  minorVersion: 0,
  
  // 使用自动分配的轴nameID
  axisCount: axes.length,
  axes: axes.map(axis => ({
    axisTag: axis.tag,
    minValue: axis.minValue,
    defaultValue: axis.defaultValue,
    maxValue: axis.maxValue,
    flags: 0,
    axisNameID: axis.nameID!  // ✅ 自动分配
  })),
  
  // 使用自动分配的实例nameID
  instanceCount: instances.length,
  instances: instances.map(instance => ({
    subfamilyNameID: instance.subfamilyNameID!,  // ✅ 自动分配
    flags: instance.flags || 0,
    coordinates: instance.coordinates,
    postScriptNameID: instance.postScriptNameID  // ✅ 自动分配（如果有）
  }))
}

const fvarData = createFvarTable(fvarTable)
```

## TypeScript类型定义

### IVariationAxis

```typescript
interface IVariationAxis {
  tag: string;           // 轴标签，如 'wght', 'wdth'
  name: string;          // 轴名称，如 'Weight', 'Width'
  minValue: number;
  defaultValue: number;
  maxValue: number;
  nameID?: number;       // 自动分配
}
```

### IVariationInstance

```typescript
interface IVariationInstance {
  subfamilyName: string;        // 实例名称，如 'Bold'
  coordinates: number[];        // 轴坐标值
  postScriptName?: string;      // PostScript名称（可选）
  subfamilyNameID?: number;     // 自动分配
  postScriptNameID?: number;    // 自动分配（如果有postScriptName）
  flags?: number;
}
```

### IVariants

```typescript
interface IVariants {
  axes: Array<IVariationAxis>;
  instances?: Array<IVariationInstance>;
}
```

## 工作流程

```
1. 用户定义 variants = { axes, instances }
   ↓
2. 调用 createFont(characters, { variants, ... })
   ↓
3. createFont → createNameTable2(names, variants)
   ↓
4. addAxisNamesToTable(variants.axes, ...)
   ├─ 为每个axis分配nameID
   ├─ 添加英文name条目
   └─ 添加中文name条目
   ↓
5. addInstanceNamesToTable(variants.instances, ...)
   ├─ 为每个instance分配subfamilyNameID
   ├─ 添加英文subfamily条目
   ├─ 添加中文subfamily条目
   └─ 如果有postScriptName，分配postScriptNameID并添加条目
   ↓
6. 返回 font
   └─ axes和instances数组已包含自动分配的nameID
```

## 修改的文件

### 核心代码
- ✅ `src/fontManager/font.ts` - 类型定义
- ✅ `src/fontManager/tables/name.ts` - 实现逻辑

### 文档
- 📄 `docs/VARIATION_FONT_AXIS_NAMING.md` - 轴名称管理详细文档
- 📄 `docs/INSTANCE_NAME_FEATURE.md` - 实例名称管理详细文档
- 📄 `docs/AXIS_NAME_IMPLEMENTATION_SUMMARY.md` - 轴功能实现总结
- 📄 `INSTANCE_NAME_IMPLEMENTATION.md` - 实例功能实现总结
- 📄 `VARIABLE_FONT_NAMING.md` - 本文件

### 示例
- 💡 `src/fontManager/examples/createVariableFont.example.ts` - 轴名称示例
- 💡 `src/fontManager/examples/createVariableFontWithInstances.example.ts` - 完整示例

## 实际应用场景

### 场景1：简单粗细变化

```typescript
const variants = {
  axes: [
    { tag: 'wght', name: 'Weight', minValue: 100, defaultValue: 400, maxValue: 900 }
  ],
  instances: [
    { subfamilyName: 'Thin', coordinates: [100] },
    { subfamilyName: 'Light', coordinates: [300] },
    { subfamilyName: 'Regular', coordinates: [400] },
    { subfamilyName: 'Bold', coordinates: [700] },
    { subfamilyName: 'Black', coordinates: [900] }
  ]
}
```

### 场景2：粗细+宽度

```typescript
const variants = {
  axes: [
    { tag: 'wght', name: 'Weight', minValue: 100, defaultValue: 400, maxValue: 900 },
    { tag: 'wdth', name: 'Width', minValue: 75, defaultValue: 100, maxValue: 125 }
  ],
  instances: [
    { subfamilyName: 'Regular', coordinates: [400, 100] },
    { subfamilyName: 'Bold', coordinates: [700, 100] },
    { subfamilyName: 'Condensed', coordinates: [400, 75] },
    { subfamilyName: 'Bold Condensed', coordinates: [700, 75] },
    { subfamilyName: 'Wide', coordinates: [400, 125] },
    { subfamilyName: 'Bold Wide', coordinates: [700, 125] }
  ]
}
```

## 主要优势

✅ **零配置**：只需提供name和subfamilyName  
✅ **自动化**：nameID自动分配，无需手动管理  
✅ **类型安全**：完整的TypeScript类型支持  
✅ **多语言**：自动创建英文和中文条目  
✅ **向后兼容**：不影响现有代码  
✅ **OpenType规范**：符合OpenType可变字体规范  

## 注意事项

1. **必需字段**
   - axes: 每个axis必须有`name`
   - instances: 每个instance必须有`subfamilyName`

2. **nameID范围**
   - 从256开始分配（0-255为预定义）
   - 确保不超过uint16最大值（65535）

3. **数组修改**
   - 传入的axes和instances数组会被直接修改
   - nameID字段会被自动添加

4. **coordinates长度**
   - instances的coordinates数组长度应该与axes长度一致

## 完整示例代码

参考以下文件获取完整的使用示例：
- `src/fontManager/examples/createVariableFontWithInstances.example.ts`

运行示例：
```typescript
import { runExample } from './examples/createVariableFontWithInstances.example'

const font = await runExample(characters)
```

## 相关资源

### 文档
- [轴名称管理](./docs/VARIATION_FONT_AXIS_NAMING.md)
- [实例名称管理](./docs/INSTANCE_NAME_FEATURE.md)
- [轴功能实现](./docs/AXIS_NAME_IMPLEMENTATION_SUMMARY.md)
- [实例功能实现](./INSTANCE_NAME_IMPLEMENTATION.md)

### OpenType规范
- [Font Variations Overview](https://docs.microsoft.com/en-us/typography/opentype/spec/otvaroverview)
- [fvar Table](https://docs.microsoft.com/en-us/typography/opentype/spec/fvar)
- [name Table](https://docs.microsoft.com/en-us/typography/opentype/spec/name)

## 版本

**v1.0.0** - 完整实现
- ✅ 轴名称自动管理
- ✅ 实例名称自动管理
- ✅ 多语言支持
- ✅ 与fvar表集成
- ✅ 完整的类型定义
- ✅ 详细的文档和示例

