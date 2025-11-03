# PostScript名称自动生成功能

## 新增功能 ✨

为可变字体实例（instances）**自动生成**PostScript兼容的名称，遵循OpenType规范和现有的postScriptName生成规则。

## 功能特性

✅ **自动生成**：无需手动指定postScriptName  
✅ **规范兼容**：符合PostScript命名规范（无空格，最多63字符）  
✅ **一致性**：与主字体postScriptName使用相同的生成规则  
✅ **可覆盖**：仍支持手动指定自定义postScriptName  
✅ **自动分配nameID**：postScriptNameID自动分配到name表  

## 快速示例

### 之前（手动指定）

```typescript
const instances: IVariationInstance[] = [
  {
    subfamilyName: 'Bold',
    coordinates: [700],
    postScriptName: 'MyFont-Bold',  // ❌ 需要手动指定
  },
  {
    subfamilyName: 'Bold Wide',
    coordinates: [700, 125],
    postScriptName: 'MyFont-BoldWide',  // ❌ 需要手动移除空格
  }
]
```

### 现在（自动生成）

```typescript
const instances: IVariationInstance[] = [
  {
    subfamilyName: 'Bold',
    coordinates: [700],
    // ✅ postScriptName自动生成为：'MyFont-Bold'
  },
  {
    subfamilyName: 'Bold Wide',
    coordinates: [700, 125],
    // ✅ postScriptName自动生成为：'MyFont-BoldWide'（空格自动移除）
  }
]

const font = await createFont(characters, {
  familyName: 'MyFont',
  variants: { axes, instances }
})

// 检查自动生成的结果
console.log(instances[0].postScriptName)  // 'MyFont-Bold'
console.log(instances[1].postScriptName)  // 'MyFont-BoldWide'
```

## 生成规则

### 规则说明

与主字体postScriptName生成规则一致（参考`font.ts`第195行）：

```typescript
postScriptName = (familyName + '-' + subfamilyName)
  .replace(/\s/g, '')  // 移除所有空格
  .slice(0, 63)        // 限制为63个字符
```

### 生成示例

| familyName | subfamilyName | 生成的postScriptName |
|------------|---------------|---------------------|
| MyFont | Bold | `MyFont-Bold` |
| MyFont | Light Italic | `MyFont-LightItalic` |
| MyFont | Extra Bold Condensed | `MyFont-ExtraBoldCondensed` |
| My Variable Font | Bold | `MyVariableFont-Bold` |
| 我的字体 | Bold | `我的字体-Bold` |

## 使用方法

### 方法1：完全自动（推荐）⭐

只提供`subfamilyName`，一切自动完成：

```typescript
const instances: IVariationInstance[] = [
  { subfamilyName: 'Thin', coordinates: [100] },
  { subfamilyName: 'Light', coordinates: [300] },
  { subfamilyName: 'Regular', coordinates: [400] },
  { subfamilyName: 'Bold', coordinates: [700] },
  { subfamilyName: 'Black', coordinates: [900] }
]

const font = await createFont(characters, {
  familyName: 'MyFont',
  variants: { axes, instances }
})

// postScriptName已自动生成：
// instances[0].postScriptName = 'MyFont-Thin'
// instances[1].postScriptName = 'MyFont-Light'
// instances[2].postScriptName = 'MyFont-Regular'
// instances[3].postScriptName = 'MyFont-Bold'
// instances[4].postScriptName = 'MyFont-Black'
```

### 方法2：混合使用

部分自动生成，部分手动指定：

```typescript
const instances: IVariationInstance[] = [
  {
    subfamilyName: 'Bold',
    coordinates: [700],
    // 自动生成：'MyFont-Bold'
  },
  {
    subfamilyName: 'Special Style',
    coordinates: [500, 110],
    postScriptName: 'MyFont-Special',  // 手动指定（覆盖自动生成）
  }
]
```

### 方法3：完全手动

如果需要完全控制：

```typescript
const instances: IVariationInstance[] = [
  {
    subfamilyName: 'Bold',
    coordinates: [700],
    postScriptName: 'CustomFont-B',  // 完全自定义
  }
]
```

## 实现细节

### 修改的代码

**`src/fontManager/tables/name.ts`**

新增函数：
```typescript
const generatePostScriptName = (
  familyName: string, 
  subfamilyName: string
): string => {
  return (familyName + '-' + subfamilyName)
    .replace(/\s/g, '')
    .slice(0, 63)
}
```

更新函数：
```typescript
const addInstanceNamesToTable = (
  instances: Array<any>,
  names: Array<any>,
  stringPool: Array<any>,
  familyName?: string  // 新增参数
): Array<any> => {
  // ...
  
  for (const instance of instances) {
    // 自动生成或使用提供的postScriptName
    let postScriptName = instance.postScriptName
    if (!postScriptName && familyName) {
      postScriptName = generatePostScriptName(familyName, instance.subfamilyName)
      instance.postScriptName = postScriptName  // 保存到instance对象
    }
    
    // 分配postScriptNameID并添加到name表
    // ...
  }
}
```

### familyName的获取

系统会自动从name表中获取familyName（nameID=1）：

```typescript
// 在createTable2中
if (variants && variants.instances) {
  let familyName = ''
  const familyNameRecord = names.find(n => n.nameID === 1 && n.langID === 0x409)
  if (familyNameRecord) {
    familyName = familyNameRecord.value
  }
  addInstanceNamesToTable(variants.instances, names, stringPool, familyName)
}
```

## 完整示例

```typescript
import { 
  createFont, 
  type IVariationAxis, 
  type IVariationInstance 
} from './fontManager/font'

// 定义轴
const axes: IVariationAxis[] = [
  {
    tag: 'wght',
    name: 'Weight',
    minValue: 100,
    defaultValue: 400,
    maxValue: 900,
  }
]

// 定义实例（无需手动指定postScriptName）
const instances: IVariationInstance[] = [
  { subfamilyName: 'Thin', coordinates: [100] },
  { subfamilyName: 'Extra Light', coordinates: [200] },
  { subfamilyName: 'Light', coordinates: [300] },
  { subfamilyName: 'Regular', coordinates: [400] },
  { subfamilyName: 'Medium', coordinates: [500] },
  { subfamilyName: 'Semi Bold', coordinates: [600] },
  { subfamilyName: 'Bold', coordinates: [700] },
  { subfamilyName: 'Extra Bold', coordinates: [800] },
  { subfamilyName: 'Black', coordinates: [900] }
]

// 创建字体
const font = await createFont(characters, {
  familyName: 'MyVariableFont',
  styleName: 'Regular',
  unitsPerEm: 1000,
  ascender: 800,
  descender: -200,
  
  variants: {
    axes: axes,
    instances: instances
  },
  
  tables: {
    name: [
      {
        nameID: 1,
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: 'MyVariableFont',
      }
      // ... 其他name表条目
    ]
  }
})

// 查看自动生成的postScriptName
instances.forEach(inst => {
  console.log(`${inst.subfamilyName} → ${inst.postScriptName}`)
})

// 输出：
// Thin → MyVariableFont-Thin
// Extra Light → MyVariableFont-ExtraLight
// Light → MyVariableFont-Light
// Regular → MyVariableFont-Regular
// Medium → MyVariableFont-Medium
// Semi Bold → MyVariableFont-SemiBold
// Bold → MyVariableFont-Bold
// Extra Bold → MyVariableFont-ExtraBold
// Black → MyVariableFont-Black
```

## 生成的name表

| nameID | languageID | 值 | 说明 |
|--------|------------|-----|------|
| 256 | 0x409 | Weight | axis名称 |
| 257 | 0x409 | Thin | instance subfamily |
| 257 | 0x804 | Thin | instance subfamily中文 |
| **258** | 0x409 | **MyVariableFont-Thin** | **自动生成的PostScript名** |
| 259 | 0x409 | Extra Light | instance subfamily |
| 259 | 0x804 | Extra Light | instance subfamily中文 |
| **260** | 0x409 | **MyVariableFont-ExtraLight** | **自动生成的PostScript名** |
| ... | ... | ... | ... |

## 对比subfamilyName和postScriptName

| Instance | subfamilyName | 自动生成的postScriptName |
|----------|---------------|-------------------------|
| 1 | `Light Italic` | `MyFont-LightItalic` |
| 2 | `Bold Condensed` | `MyFont-BoldCondensed` |
| 3 | `Extra Bold Extended` | `MyFont-ExtraBoldExtended` |

**区别**：
- subfamilyName：保留空格，用于UI显示
- postScriptName：移除空格，用于PostScript/PDF

## 优势

✅ **减少错误**：不需要手动移除空格  
✅ **提高效率**：批量创建实例时无需逐个指定  
✅ **一致性**：与主字体postScriptName规则一致  
✅ **灵活性**：仍支持手动覆盖  
✅ **规范兼容**：自动符合PostScript命名规范  

## 注意事项

1. **familyName获取**
   - 自动从name表的nameID=1获取
   - 如果name表中没有，将无法自动生成

2. **字符限制**
   - 自动限制为63个字符
   - 超长的会被截断

3. **空格处理**
   - 所有空格自动移除
   - 例如：`Bold Italic` → `BoldItalic`

4. **手动覆盖**
   - 如果手动指定了postScriptName，不会自动生成
   - 手动指定的值会被直接使用

## 相关文档

- [PostScript名称详细说明](./docs/POSTSCRIPT_NAME_EXPLANATION.md)
- [实例名称管理](./docs/INSTANCE_NAME_FEATURE.md)
- [完整示例](./src/fontManager/examples/createVariableFontWithInstances.example.ts)

## 版本

**v1.1.0** - 新增PostScript名称自动生成
- ✅ 自动生成postScriptName
- ✅ 自动移除空格
- ✅ 自动限制长度
- ✅ 支持手动覆盖
- ✅ 与现有规则一致

