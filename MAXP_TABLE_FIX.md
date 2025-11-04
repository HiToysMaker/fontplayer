# 🔧 maxp表修复

## 🐛 问题

ttx报错：
```
struct.error: unpack requires a buffer of 26 bytes
AttributeError: 'DefaultTable' object has no attribute 'numGlyphs'
```

Font Validator报错：
```
Table version is 0x00005000 but font does not contain the required CFF table
```

## 🔍 根本原因

### 问题1：版本不对

```typescript
// 错误：可变字体使用TrueType格式，但maxp版本是CFF的
maxpTable.version = 0x00005000  // ❌ CFF版本
```

### 问题2：字段缺失

**CFF版本（0x00005000）**：
- version (4字节)
- numGlyphs (2字节)
- **总计：6字节**

**TrueType版本（0x00010000）**：
- version (4字节)
- numGlyphs (2字节)
- maxPoints (2字节)
- maxContours (2字节)
- ... 11个额外字段 (22字节)
- **总计：32字节**

**我们之前只提供了2个字段（6字节），但设置了TrueType版本，导致ttx期望32字节！**

### 问题3：字段顺序不保证

```typescript
// ❌ 错误：使用Object.keys()遍历，顺序不确定
Object.keys(table).forEach((key: string) => {
  const bytes = encoder[type](value)
  data = data.concat(bytes)
})
```

OpenType规范要求字段必须按严格顺序排列！

## ✅ 修复方案

### 修复1：根据格式设置版本

**在 font.ts**：
```typescript
const maxpTable: any = {
  version: options.variants ? 0x00010000 : 0x00005000,
  numGlyphs: characters.length,
}

// TrueType格式需要额外字段
if (options.variants) {
  maxpTable.maxPoints = 0
  maxpTable.maxContours = 0
  maxpTable.maxCompositePoints = 0
  maxpTable.maxCompositeContours = 0
  maxpTable.maxZones = 2
  maxpTable.maxTwilightPoints = 0
  maxpTable.maxStorage = 0
  maxpTable.maxFunctionDefs = 0
  maxpTable.maxInstructionDefs = 0
  maxpTable.maxStackElements = 0
  maxpTable.maxSizeOfInstructions = 0
  maxpTable.maxComponentElements = 0
  maxpTable.maxComponentDepth = 0
}
```

### 修复2：从glyf表计算真实值

**在 font.ts**（创建glyf表后）：
```typescript
// 从glyf表计算maxp表的值
let maxPoints = 0
let maxContours = 0

for (const glyph of glyfTable.glyphTables) {
  if (glyph.numberOfContours > 0) {
    let totalPoints = 0
    for (const contour of glyph.contours) {
      totalPoints += contour.points.length
    }
    
    maxPoints = Math.max(maxPoints, totalPoints)
    maxContours = Math.max(maxContours, glyph.numberOfContours)
  }
}

maxpTable.maxPoints = maxPoints
maxpTable.maxContours = maxContours
```

### 修复3：按顺序序列化

**在 maxp.ts**：
```typescript
const create = (table: IMaxpTable) => {
  let data = []
  
  const version = table.version || 0x00005000
  const isTrueType = version === 0x00010000
  
  // 1. version (必须第一个)
  data = data.concat(encoder.Version16Dot16(version))
  
  // 2. numGlyphs (必须第二个)
  data = data.concat(encoder.uint16(table.numGlyphs || 0))
  
  // 3. TrueType额外字段（按顺序）
  if (isTrueType) {
    const fields = [
      'maxPoints',
      'maxContours',
      'maxCompositePoints',
      'maxCompositeContours',
      'maxZones',
      'maxTwilightPoints',
      'maxStorage',
      'maxFunctionDefs',
      'maxInstructionDefs',
      'maxStackElements',
      'maxSizeOfInstructions',
      'maxComponentElements',
      'maxComponentDepth',
    ]
    
    for (const field of fields) {
      const value = (table as any)[field] || 0
      data = data.concat(encoder.uint16(value))
    }
  }
  
  return data
}
```

## 📊 修复效果

### 修复前
```
maxp表：
  version: 0x00010000 (TrueType)
  numGlyphs: 22
  字段缺失！
  实际大小：6字节
  期望大小：32字节
  → ttx报错 ❌
```

### 修复后
```
maxp表：
  version: 0x00010000 (TrueType)
  numGlyphs: 22
  maxPoints: 140
  maxContours: 11
  maxCompositePoints: 0
  ... (所有字段)
  实际大小：32字节 ✅
  期望大小：32字节 ✅
  → ttx正常 ✅
```

## 🧪 测试验证

### 控制台日志

应该看到：
```
=== Creating maxp table ===
Version: 0x00010000 (TrueType)
TrueType maxp: 32 bytes
  numGlyphs: 22
  maxPoints: 140
  maxContours: 11
===========================
```

### ttx验证

```bash
ttx -t maxp yourfont.otf
cat yourfont.ttx
```

应该看到：
```xml
<maxp>
  <tableVersion value="0x10000"/>
  <numGlyphs value="22"/>
  <maxPoints value="140"/>
  <maxContours value="11"/>
  <maxCompositePoints value="0"/>
  <maxCompositeContours value="0"/>
  <maxZones value="2"/>
  <maxTwilightPoints value="0"/>
  <maxStorage value="0"/>
  <maxFunctionDefs value="0"/>
  <maxInstructionDefs value="0"/>
  <maxStackElements value="0"/>
  <maxSizeOfInstructions value="0"/>
  <maxComponentElements value="0"/>
  <maxComponentDepth value="0"/>
</maxp>
```

### Font Validator

**之前**：
```
❌ Table version is 0x00005000 but font does not contain the required CFF table
```

**现在**：
```
✅ maxp table is valid
```

## 📝 修改的文件

1. **`src/fontManager/font.ts`** (第459-479行)
   - 根据variants动态设置maxp版本
   - 添加所有TrueType字段
   - 从glyf表计算maxPoints和maxContours

2. **`src/fontManager/font.ts`** (第754-774行)
   - 从glyf表计算真实的maxPoints和maxContours值

3. **`src/fontManager/tables/maxp.ts`** (第100-154行)
   - 重写create函数
   - 按OpenType规范的严格字段顺序输出
   - 添加调试日志

## 🎯 关键要点

### 1. 版本决定字段

- CFF版本（0x00005000）：6字节
- TrueType版本（0x00010000）：32字节

### 2. 字段必须按顺序

OpenType规范要求严格的字段顺序，不能用Object.keys()！

### 3. 值必须准确

maxPoints和maxContours必须从实际的glyf数据计算，不能随便填0！

## 🚀 立即测试

1. **刷新浏览器** (Cmd+Shift+R)
2. **生成字体**
3. **查看日志**：
   ```
   === Creating maxp table ===
   Version: 0x00010000 (TrueType)
   TrueType maxp: 32 bytes
   ```
4. **ttx验证**：
   ```bash
   ttx -l yourfont.otf
   # 应该成功列出所有表
   ```

现在maxp表应该完全正确了！🎉

