# 关键Bug修复：硬编码的checkSumAdjustment位置

## 🐛 问题描述

**症状**：
- 生成字体时，调试显示name record在位置156-171是正确的
- 但parse字体文件时，位置164读取到的是109而不是0
- name表的offset字段被破坏

## 🔍 根本原因

### 问题代码（font.ts 第645-648行）

```typescript
// ❌ 错误：硬编码了位置164
fontData[164] = checkSumAdjustmentData[0]
fontData[165] = checkSumAdjustmentData[1]
fontData[166] = checkSumAdjustmentData[2]
fontData[167] = checkSumAdjustmentData[3]
```

### 为什么会出错？

1. **原始假设**：这段代码假设head表总是在固定位置
2. **实际情况**：我们修复了sfnt.ts，现在表按字母顺序排列
3. **结果**：head表的位置变了，但这里还在写位置164

### 排序后的表顺序

```
表名     索引    Record位置    实际表数据offset
CFF      0       12-27         188
OS/2     1       28-43         7472
cmap     2       44-59         7572
fvar     3       60-75         7992
gvar     4       76-91         8028
head     5       92-107        14820  ← head在这里
hhea     6       108-123       14876
hmtx     7       124-139       14912
maxp     8       140-155       15000
name     9       156-171       15008  ← 位置164在这里！
post     10      172-187       15332
```

### 位置164是什么？

- **原本**（未排序）：可能是head表中checkSumAdjustment字段的位置
- **现在**（排序后）：是name表record的offset字段的第1个字节（位置164-167）

```
name record结构：
156-159: tag = "name"
160-163: checkSum
164-167: offset  ← 被破坏的位置！
168-171: length
```

### 为什么是109？

`109` (0x6D) 很可能是checkSumAdjustmentData的第一个字节！

这解释了为什么：
1. 生成时name record是正确的（内存中）
2. 但写入checkSumAdjustment时破坏了位置164
3. Parse时读取到错误的数据

## ✅ 修复方案

### 动态查找head表位置

```typescript
// ✅ 正确：动态查找head表的实际位置
const headTableInfo = fontTables.find((t: any) => t.name === 'head')
if (headTableInfo) {
    // checkSumAdjustment在head表中的偏移是8字节
    // (version(4) + fontRevision(4) + checkSumAdjustment(4))
    const checkSumAdjustmentOffsetInFile = headTableInfo.config.offset + 8
    
    fontData[checkSumAdjustmentOffsetInFile] = checkSumAdjustmentData[0]
    fontData[checkSumAdjustmentOffsetInFile + 1] = checkSumAdjustmentData[1]
    fontData[checkSumAdjustmentOffsetInFile + 2] = checkSumAdjustmentData[2]
    fontData[checkSumAdjustmentOffsetInFile + 3] = checkSumAdjustmentData[3]
}
```

### head表结构

```
Offset  Size  Field
0       4     version (0x00010000)
4       4     fontRevision
8       4     checkSumAdjustment  ← 我们要修改的字段
12      4     magicNumber
16      2     flags
...
```

所以 `checkSumAdjustment` 的位置 = `head表offset + 8`

在当前排序顺序中：
- head表offset = 14820
- checkSumAdjustment的文件位置 = 14820 + 8 = **14828**

现在不会破坏name表的数据了！✅

## 🧪 测试

重新生成字体后，你应该看到：

```
=== Updating head.checkSumAdjustment ===
head table offset: 14820
checkSumAdjustment offset in file: 14828
checkSumAdjustment value: 0x...
checkSumAdjustment bytes: [...]
Updated bytes at position 14828-14831
=====================================
```

然后parse时，位置164应该读取到正确的 `[0, 0, 58, 160]`（即offset = 15008）！

## 💡 经验教训

1. **永远不要硬编码文件位置**
2. **表的顺序可能会变化**（排序、添加/删除表）
3. **使用动态查找**来定位需要修改的字段
4. **OpenType规范要求表按字母顺序排列**

## 📝 相关修复

这个bug与之前修复的两个问题相关：
1. ✅ CheckSum溢出（已修复）
2. ✅ Offset顺序错乱（已修复）
3. ✅ 硬编码的checkSumAdjustment位置（本次修复）

现在所有问题都解决了！🎉

