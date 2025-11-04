# 可变字体实例（Named Instances）说明

## 问题背景

Adobe Photoshop 和其他 Adobe 应用**需要可变字体包含至少一个命名实例**才能在字体列表中正确显示。

---

## 什么是命名实例（Named Instance）？

命名实例是可变字体中预定义的样式点。例如：
- **Regular**：所有轴都在默认值
- **Bold**：字重轴在最大值
- **Light**：字重轴在最小值

即使你想让用户自由调整轴参数，也需要至少定义一个默认实例。

---

## 修复内容

### 自动创建默认实例

修改了 `src/fontManager/tables/fvar.ts` 中的 `createFvarTable` 函数：

**如果用户没有提供 instances**：
```typescript
// 自动创建一个指向所有轴默认值的实例
{
  subfamilyNameID: 2,        // 指向 "Regular"（nameID=2）
  flags: 0,
  coordinates: [60, 100],    // 所有轴的默认值（示例）
  postScriptNameID: 6        // 指向 PostScript Name（nameID=6）
}
```

**如果用户提供了 instances**：
- 使用用户提供的配置

---

## 实例数据结构

### fvar 表中的 Instance Record

```typescript
interface InstanceRecord {
  subfamilyNameID: number      // 指向 name 表中的子族名称（如 "Regular", "Bold"）
  flags: number                 // 通常为 0
  coordinates: number[]         // 每个轴的坐标值（数组）
  postScriptNameID?: number     // 可选：指向 PostScript 名称的 nameID
}
```

### 示例：单轴可变字体（字重轴）

```typescript
fvarTable.instances = [
  {
    subfamilyNameID: 256,        // "Light"
    flags: 0,
    coordinates: [40],           // 字重=40
    postScriptNameID: 257
  },
  {
    subfamilyNameID: 2,          // "Regular"
    flags: 0,
    coordinates: [60],           // 字重=60（默认）
    postScriptNameID: 6
  },
  {
    subfamilyNameID: 258,        // "Bold"
    flags: 0,
    coordinates: [100],          // 字重=100
    postScriptNameID: 259
  }
]
```

### 示例：双轴可变字体（字重+宽度）

```typescript
fvarTable.instances = [
  {
    subfamilyNameID: 256,        // "Light Condensed"
    flags: 0,
    coordinates: [40, 75],       // 字重=40, 宽度=75
    postScriptNameID: 257
  },
  {
    subfamilyNameID: 2,          // "Regular"
    flags: 0,
    coordinates: [60, 100],      // 字重=60, 宽度=100（默认）
    postScriptNameID: 6
  },
  {
    subfamilyNameID: 258,        // "Bold Extended"
    flags: 0,
    coordinates: [100, 125],     // 字重=100, 宽度=125
    postScriptNameID: 259
  }
]
```

---

## Name 表中的对应名称

每个实例需要在 name 表中有对应的名称记录：

### 必需的 nameID

| nameID | 用途 | 示例 | 备注 |
|--------|------|------|------|
| 2 | Subfamily Name | `Regular` | 默认实例通常使用 nameID=2 |
| 6 | PostScript Name | `MyFont-Regular` | 默认实例通常使用 nameID=6 |
| 256+ | Instance Subfamily | `Light`, `Bold` | 其他实例使用 256 以上的 nameID |

### 完整示例

```javascript
// name 表记录
nameTable.names = [
  // 基础名称
  { nameID: 1, value: "MyFont" },           // Family Name
  { nameID: 2, value: "Regular" },          // Subfamily Name
  { nameID: 4, value: "MyFont Regular" },   // Full Name
  { nameID: 6, value: "MyFont-Regular" },   // PostScript Name
  
  // 实例名称
  { nameID: 256, value: "Light" },          // Light 实例子族名
  { nameID: 257, value: "MyFont-Light" },   // Light 实例 PS 名称
  { nameID: 258, value: "Bold" },           // Bold 实例子族名
  { nameID: 259, value: "MyFont-Bold" },    // Bold 实例 PS 名称
]
```

---

## 代码修改详情

### 修改 1：自动创建默认实例

**文件**：`src/fontManager/tables/fvar.ts`

**位置**：`createFvarTable` 函数

**变更**：
```typescript
if (variants.instances && variants.instances.length > 0) {
  // 使用用户提供的 instances
  table.instances = variants.instances.map(...)
} else {
  // 自动创建默认实例
  console.warn('⚠️ No instances provided. Creating default instance for Adobe app compatibility.')
  
  const defaultCoordinates = table.axes.map(axis => axis.defaultValue || 0)
  
  table.instances = [{
    subfamilyNameID: 2,
    flags: 0,
    coordinates: defaultCoordinates,
    postScriptNameID: 6
  }]
}
```

### 修改 2：修正 instanceSize 计算

**文件**：`src/fontManager/tables/fvar.ts`

**位置**：`create` 函数

**变更**：
```typescript
// 之前（错误）
const instanceSizeBytes = encoder.uint16(table.instanceSize || (16 + (table.axisCount || 0) * 4))

// 之后（正确）
// instanceSize = subfamilyNameID(2) + flags(2) + coordinates(axisCount*4) + postScriptNameID(2)
const calculatedInstanceSize = 2 + 2 + (table.axisCount || 0) * 4 + 2
const instanceSizeBytes = encoder.uint16(table.instanceSize || calculatedInstanceSize)
```

---

## 测试步骤

### 1. 导出可变字体

在控制台中应该看到：
```
⚠️ No instances provided. Creating default instance for Adobe app compatibility.
✅ Created default instance: subfamilyNameID=2, coordinates=[60], postScriptNameID=6
```

### 2. 验证 fvar 表

```bash
ttx -t fvar 你的字体.otf
cat 你的字体.ttx
```

应该看到：
```xml
<fvar>
  <Version value="1.0"/>
  <Axis>
    <AxisTag>wght</AxisTag>
    <MinValue value="40.0"/>
    <DefaultValue value="60.0"/>
    <MaxValue value="100.0"/>
    <AxisNameID value="256"/>
  </Axis>
  <NamedInstance subfamilyNameID="2">
    <coord axis="wght" value="60.0"/>
    <postscriptNameID value="6"/>
  </NamedInstance>
</fvar>
```

### 3. 在 Photoshop 中测试

1. 清除 PS 缓存：`bash /tmp/clear_ps_cache.sh`
2. 重新安装字体
3. 启动 Photoshop
4. 在字体列表中搜索字体名称
5. **应该能找到了！** ✅

---

## 常见问题

### Q1: 为什么需要实例？

**A**: Adobe 应用使用实例来：
- 在字体列表中显示可变字体
- 提供默认样式选择
- 识别字体族关系

即使你不想预定义样式，也需要至少一个指向默认值的实例。

### Q2: 可以不创建实例吗？

**A**: 技术上可以，但：
- ❌ Photoshop 不会显示该字体
- ❌ Illustrator 可能也不识别
- ⚠️ 只有支持 OpenType 1.8+ 的新版应用才能正常工作

**建议**：始终创建至少一个默认实例。

### Q3: 实例的 coordinates 必须是默认值吗？

**A**: 不必须。你可以创建指向任意轴坐标的实例：
```typescript
[
  { coordinates: [40] },    // Light
  { coordinates: [60] },    // Regular（默认）
  { coordinates: [80] },    // Medium
  { coordinates: [100] }    // Bold
]
```

但至少应该有一个实例指向默认值。

### Q4: postScriptNameID 可以省略吗？

**A**: 可以，但不推荐。Adobe 应用使用 PostScript Name 来识别字体。如果省略，可能导致：
- 字体在 PS 中的显示名称不正确
- 保存文档后重新打开时找不到字体

**建议**：始终提供 postScriptNameID。

---

## OpenType 规范参考

- [fvar — Font Variations Table](https://docs.microsoft.com/en-us/typography/opentype/spec/fvar)
- [Instance Record](https://docs.microsoft.com/en-us/typography/opentype/spec/fvar#instanceRecord)

---

## 总结

✅ **已修复**：自动为没有实例的可变字体创建默认实例  
✅ **兼容性**：确保 Adobe Photoshop 和其他应用能正确识别  
✅ **灵活性**：用户可以自定义实例，或使用自动生成的默认实例  

现在重新导出可变字体，应该能在 Photoshop 中找到了！🎉

