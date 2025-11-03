# 可变字体实例名称自动管理实现总结

## 新增功能

为可变字体的实例（instances）自动分配nameID，包括：
- **subfamilyNameID**：为每个实例的subfamilyName分配
- **postScriptNameID**：为有postScriptName的实例分配（可选）

## 修改的文件

### 1. `src/fontManager/font.ts`

#### 新增接口：IVariationInstance

```typescript
interface IVariationInstance {
  subfamilyName: string;         // 实例名称，如 'Bold', 'Light'
  coordinates: number[];         // 各轴的坐标值
  postScriptName?: string;       // PostScript名称（可选）
  subfamilyNameID?: number;      // 自动分配的nameID
  postScriptNameID?: number;     // PostScript名称的nameID（可选）
  flags?: number;
}
```

#### 更新IVariants接口

```typescript
interface IVariants {
  axes: Array<IVariationAxis>;
  instances?: Array<IVariationInstance>;  // 更新类型
}
```

#### 导出新类型

```typescript
export type {
  // ...
  IVariationInstance,  // 新增
}
```

### 2. `src/fontManager/tables/name.ts`

#### 新增函数：addInstanceNamesToTable

```typescript
const addInstanceNamesToTable = (
  instances: Array<any>,
  names: Array<any>,
  stringPool: Array<any>
): Array<any> => {
  if (!instances || instances.length === 0) return names
  
  // 找到当前最大的nameID
  let maxNameID = 255
  for (const name of names) {
    if (name.nameID > maxNameID) {
      maxNameID = name.nameID
    }
  }
  
  // 为每个instance分配nameID
  for (const instance of instances) {
    if (!instance.subfamilyName) continue
    
    // 1. 分配subfamilyNameID
    maxNameID++
    instance.subfamilyNameID = maxNameID
    
    // 添加英文名称
    names.push({
      nameID: maxNameID,
      nameLabel: `instance_subfamily_${maxNameID}`,
      platformID: 3,
      encodingID: 1,
      langID: 0x409,  // en-US
      value: instance.subfamilyName,
      default: true,
    })
    
    // 添加中文名称
    names.push({
      nameID: maxNameID,
      nameLabel: `instance_subfamily_${maxNameID}`,
      platformID: 3,
      encodingID: 1,
      langID: 0x804,  // zh-CN
      value: instance.subfamilyName,
      default: true,
    })
    
    // 2. 如果有postScriptName，也分配nameID
    if (instance.postScriptName) {
      maxNameID++
      instance.postScriptNameID = maxNameID
      
      names.push({
        nameID: maxNameID,
        nameLabel: `instance_postscript_${maxNameID}`,
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: instance.postScriptName,
        default: true,
      })
    }
  }
  
  return names
}
```

#### 在createTable2中调用

```typescript
const createTable2 = (names: Array<any>, variants?: any) => {
  // ... 前面的代码 ...
  
  // 添加axis names
  if (variants && variants.axes) {
    addAxisNamesToTable(variants.axes, names, stringPool)
  }
  
  // 添加instance names（新增）
  if (variants && variants.instances) {
    addInstanceNamesToTable(variants.instances, names, stringPool)
  }
  
  // ... 后续代码 ...
}
```

## 使用示例

### 基础示例

```typescript
const instances: IVariationInstance[] = [
  {
    subfamilyName: 'Bold',
    coordinates: [700, 100],
    postScriptName: 'MyFont-Bold',
  }
]

const font = await createFont(characters, {
  familyName: 'MyFont',
  variants: {
    axes: axes,
    instances: instances
  }
})

// 自动分配的nameID
console.log(instances[0].subfamilyNameID)    // 258
console.log(instances[0].postScriptNameID)   // 259
```

### 完整示例

```typescript
const axes: IVariationAxis[] = [
  { tag: 'wght', name: 'Weight', minValue: 100, defaultValue: 400, maxValue: 900 },
  { tag: 'wdth', name: 'Width', minValue: 75, defaultValue: 100, maxValue: 125 }
]

const instances: IVariationInstance[] = [
  {
    subfamilyName: 'Thin',
    coordinates: [100, 100],
    postScriptName: 'MyFont-Thin',
  },
  {
    subfamilyName: 'Bold',
    coordinates: [700, 100],
    postScriptName: 'MyFont-Bold',
  },
  {
    subfamilyName: 'Bold Wide',
    coordinates: [700, 125],
    postScriptName: 'MyFont-BoldWide',
  }
]

const font = await createFont(characters, {
  familyName: 'MyFont',
  variants: { axes, instances }
})

// nameID分配结果：
// axes[0].nameID = 256 (Weight)
// axes[1].nameID = 257 (Width)
// instances[0].subfamilyNameID = 258 (Thin)
// instances[0].postScriptNameID = 259 (MyFont-Thin)
// instances[1].subfamilyNameID = 260 (Bold)
// instances[1].postScriptNameID = 261 (MyFont-Bold)
// instances[2].subfamilyNameID = 262 (Bold Wide)
// instances[2].postScriptNameID = 263 (MyFont-BoldWide)
```

## nameID分配流程

```
1. 基础name表条目 (nameID 1-22)
   ↓
2. Axes names (nameID 256+)
   axes[0].nameID = 256
   axes[1].nameID = 257
   ...
   ↓
3. Instance subfamily names (继续递增)
   instances[0].subfamilyNameID = 258
   instances[0].postScriptNameID = 259 (如果有)
   instances[1].subfamilyNameID = 260
   instances[1].postScriptNameID = 261 (如果有)
   ...
```

## 生成的name表结构

| nameID | languageID | 值 | 说明 |
|--------|------------|-----|------|
| 256 | 0x409 | Weight | wght轴英文名 |
| 256 | 0x804 | Weight | wght轴中文名 |
| 257 | 0x409 | Width | wdth轴英文名 |
| 257 | 0x804 | Width | wdth轴中文名 |
| **258** | 0x409 | **Bold** | **实例subfamily英文** |
| **258** | 0x804 | **Bold** | **实例subfamily中文** |
| **259** | 0x409 | **MyFont-Bold** | **实例PostScript名** |

## 与fvar表的集成

```typescript
const fvarTable = {
  majorVersion: 1,
  minorVersion: 0,
  
  axisCount: axes.length,
  axes: axes.map(axis => ({
    axisTag: axis.tag,
    minValue: axis.minValue,
    defaultValue: axis.defaultValue,
    maxValue: axis.maxValue,
    axisNameID: axis.nameID!
  })),
  
  instanceCount: instances.length,
  instances: instances.map(instance => ({
    subfamilyNameID: instance.subfamilyNameID!,
    flags: instance.flags || 0,
    coordinates: instance.coordinates,
    postScriptNameID: instance.postScriptNameID
  }))
}
```

## 主要特性

✅ **自动分配**：subfamilyNameID和postScriptNameID自动分配  
✅ **多语言**：subfamilyName创建英文和中文两个条目  
✅ **可选PostScript名**：postScriptName是可选的  
✅ **顺序保证**：instances的nameID在axes之后  
✅ **类型安全**：完整的TypeScript类型定义  
✅ **零配置**：只需提供subfamilyName即可  

## 创建的文档

- `docs/INSTANCE_NAME_FEATURE.md` - 详细功能说明
- `src/fontManager/examples/createVariableFontWithInstances.example.ts` - 完整示例

## 测试建议

```typescript
// 验证所有nameID是否正确分配
function validateNameIDs(axes, instances) {
  // 1. 检查所有nameID >= 256
  // 2. 检查subfamilyName对应的instance有subfamilyNameID
  // 3. 检查postScriptName对应的instance有postScriptNameID
  // 4. 检查所有nameID唯一
}
```

## 相关文件

- `src/fontManager/font.ts` - IVariationInstance接口定义
- `src/fontManager/tables/name.ts` - addInstanceNamesToTable实现
- `src/fontManager/examples/createVariableFontWithInstances.example.ts` - 使用示例
- `docs/INSTANCE_NAME_FEATURE.md` - 功能文档

## 版本

v1.0.0 - 初始实现
- 自动分配subfamilyNameID
- 自动分配postScriptNameID（可选）
- 多语言支持
- 与axes名称管理集成

