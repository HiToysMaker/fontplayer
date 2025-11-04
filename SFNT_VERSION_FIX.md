# 🔧 sfntVersion修复 - 关键问题！

## 🐛 问题

macOS报错：
```
"untitled 198.otf"不包含可安装在macOS上的字体。
请检查所选内容并重试。
```

ttx导出显示：
```xml
<ttFont sfntVersion="OTTO" ttLibVersion="4.55">
```

## 🔍 根本原因

**格式标识符不匹配！**

```
你的字体：
  sfntVersion: "OTTO" ← 告诉系统这是CFF格式
  但实际包含: glyf + loca表 ← TrueType格式数据
  
结果：
  macOS: "这个字体说自己是CFF格式"
  macOS: "但我找不到CFF表，却看到glyf表？"
  macOS: "格式不对！拒绝安装！" ❌
```

## 📚 sfntVersion规范

### 两种格式标识符

| 格式 | sfntVersion | 轮廓表 | 用途 |
|------|-------------|--------|------|
| TrueType | `0x00010000` | glyf + loca | 可变字体 ✅ |
| CFF (PostScript) | `'OTTO'` | CFF | 普通字体 |

### 字节表示

**TrueType**：
```
0x00010000 = [0x00, 0x01, 0x00, 0x00]
或文本表示为 "\0\x01\0\0"
```

**CFF**：
```
'OTTO' = [0x4F, 0x54, 0x54, 0x4F]
ASCII字符 "OTTO"
```

## ✅ 修复方案

### 修改 sfnt.ts

**之前（错误）**：
```typescript
const configData = createConfig({
  sfntVersion: 'OTTO',  // ❌ 硬编码为CFF
  numTables,
  // ...
})
```

**现在（正确）**：
```typescript
// 根据字体格式设置sfntVersion
const hasTrueTypeOutlines = !!tables['glyf']
const hasCFFOutlines = !!tables['CFF ']
const sfntVersion = hasTrueTypeOutlines ? 0x00010000 : 'OTTO'

console.log(`=== Font Format Detection ===`)
console.log(`Has glyf table: ${hasTrueTypeOutlines}`)
console.log(`Has CFF table: ${hasCFFOutlines}`)
console.log(`sfntVersion: ${sfntVersion} (${hasTrueTypeOutlines ? 'TrueType' : 'CFF'})`)

const configData = createConfig({
  sfntVersion: sfntVersion,  // ✅ 动态设置
  numTables,
  // ...
})
```

## 📊 修复效果

### 修复前

```
ttx输出：
<ttFont sfntVersion="OTTO">

macOS识别：
  "这是CFF格式字体"
  "但找不到CFF表！"
  "拒绝安装" ❌
```

### 修复后

```
ttx输出：
<ttFont sfntVersion="\x00\x01\x00\x00">

macOS识别：
  "这是TrueType格式字体"
  "找到了glyf和loca表"
  "格式匹配，允许安装！" ✅
```

## 🧪 测试步骤

### 1. 刷新浏览器

```bash
Cmd + Shift + R  # 非常重要！
```

### 2. 重新生成字体

查看控制台，应该看到：

```
=== Font Format Detection ===
Has glyf table: true
Has CFF table: false
sfntVersion: 0x00010000 (TrueType)
==============================
```

### 3. 验证ttx

```bash
cd ~/Downloads
unzip yourfont.zip
ttx -t head yourfont.otf
cat yourfont.ttx
```

应该看到：
```xml
<ttFont sfntVersion="\x00\x01\x00\x00">
<!-- 或 -->
<ttFont sfntVersion="0x00010000">
```

**不应该再看到 `sfntVersion="OTTO"`！**

### 4. 安装字体

双击`.otf`文件，应该能够正常安装！✅

### 5. Font Book测试

```bash
open -a "Font Book" yourfont.otf
```

**成功标志**：
1. ✅ 字体成功安装
2. ✅ 双击打开预览窗口
3. ✅ **顶部有滑块！** 🎊
4. ✅ 拖动滑块，字形变化

## 💡 为什么这是关键问题？

sfntVersion是字体文件的**第一个字段**（前4字节），操作系统首先读取它来判断字体格式：

```
字体文件结构：
┌────────────────────────────┐
│ sfntVersion (4 bytes)      │ ← 第一个字段！
├────────────────────────────┤
│ numTables (2 bytes)        │
│ searchRange (2 bytes)      │
│ entrySelector (2 bytes)    │
│ rangeShift (2 bytes)       │
├────────────────────────────┤
│ Table Directory            │
│ ...                        │
└────────────────────────────┘
```

**如果第一步就错了，整个字体就无法识别！**

## 🎯 相关修复

这个问题连带影响：

1. **maxp表** - TrueType格式需要32字节（已修复 ✅）
2. **head.indexToLocFormat** - TrueType需要设置为1（已修复 ✅）
3. **glyf/loca表** - TrueType必需（已实现 ✅）
4. **sfntVersion** - 动态设置（刚修复 ✅）

## 🎊 总结

**这是最后一个关键问题！**

修复后：
- ✅ macOS能识别字体格式
- ✅ 字体可以安装
- ✅ Font Book可以打开
- ✅ 应该能看到滑块！

## 🚀 立即测试

1. **硬刷新浏览器** (Cmd+Shift+R)
2. **重新生成字体**
3. **查看日志**：
   ```
   === Font Format Detection ===
   Has glyf table: true
   sfntVersion: 0x00010000 (TrueType)
   ```
4. **安装字体** - 应该能成功！
5. **Font Book** - 应该有滑块！🎉

---

**这应该就是最后一个障碍了！** 💪

请测试并告诉我结果！🚀✨

