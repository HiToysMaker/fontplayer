# Font Validator错误排查

## 🎯 当前状态

✅ **所有内部验证都通过了**：
- name表binary: 324字节 ✅
- 表目录记录: offset=15008, length=324 ✅  
- 文件总大小: 15364字节 ✅
- ArrayBuffer: 15364字节 ✅

但Font Validator仍报 `Directory Entry offset plus length past EOF - name`

## 🔍 可能的原因

### 原因1: Font Validator缓存（最可能）

**检查方法**：
1. 找到保存的.otf文件
2. 右键 → 属性 / Get Info
3. 查看**实际文件大小**

**如果文件大小不是15364字节**：
- 说明保存过程有问题
- 可能被截断或未完全写入

**如果文件大小正好是15364字节**：
- 说明Font Validator可能在读旧文件
- 尝试：删除旧文件 → 重新生成 → 再验证

### 原因2: 中文名称编码问题

你提到axis.name可能是中文。让我们验证：

**请检查你的variants配置**：
```typescript
const axes = [
  {
    tag: 'wght',
    name: '字重',  // ← 如果这里是中文，可能有问题
    //...
  }
]
```

**如果name是中文**，试试改成英文测试：
```typescript
const axes = [
  {
    tag: 'wght',
    name: 'Weight',  // ← 改成英文测试
    //...
  }
]
```

### 原因3: ZIP压缩问题

从handlers.ts看，文件是先保存到ZIP再下载的：

```typescript
var zip = new JSZip()
zip.file(`${selectedFile.value.name}.otf`, blob)
zip.generateAsync({type:"blob"}).then(...)
```

**可能的问题**：
- ZIP压缩或解压时文件被损坏
- Blob创建时有问题

**测试方法**：
跳过ZIP，直接保存.otf文件：

```typescript
// 临时修改exportVarFont函数
const exportVarFont = async (options: CreateFontOptions) => {
  const font = await createVarFont(options)
  const dataView = new DataView(toArrayBuffer(font) as ArrayBuffer)
  const blob = new Blob([dataView], {type: 'font/opentype'})
  
  // 直接保存，不用ZIP
  saveAs(blob, `${selectedFile.value.name}.otf`)
  
  // 验证blob大小
  console.log(`Blob size: ${blob.size} bytes`)
}
```

## 🧪 排查步骤

### 步骤1: 检查文件大小

在文件管理器中：
1. 找到保存的.zip文件
2. 解压.zip
3. 查看.otf文件的**实际大小**

**应该是15364字节**

**如果不是15364字节**：
- 文件保存过程有问题
- 需要检查保存代码

**如果正好是15364字节**：
- 文件保存正确
- Font Validator可能有缓存或误报

### 步骤2: 清除Font Validator缓存

1. 删除所有之前生成的字体文件
2. 重新生成新的字体  
3. 用Font Validator打开**新文件**

### 步骤3: 使用其他工具验证

#### fonttools (Python)

```bash
pip install fonttools

# 验证字体
ttx -l yourfont.otf

# 如果成功，会列出所有表，不会报错
```

#### macOS内置工具

```bash
# 查看字体信息
ftxdumperfuser yourfont.otf

# 或使用Font Book打开
open -a "Font Book" yourfont.otf
```

#### 在线工具

上传到 https://fontdrop.info/ 看是否能正常解析

### 步骤4: 对比非可变字体

生成一个**不包含variants**的字体：

```typescript
const fontNormal = await createFont(characters, {
  familyName: 'TestNormal',
  // 不传variants
})
```

用Font Validator验证这个，看是否正常。

## 🔬 深度检查：中文name字段

如果axis.name确实是中文，请添加调试：

```typescript
// 在name.ts的addAxisNamesToTable函数中
for (const axis of axes) {
  if (!axis.name) continue
  
  // 添加调试
  console.log(`Adding axis name: "${axis.name}"`)
  console.log(`  UTF-16 encoded:`, encoder.utf16(axis.name))
  console.log(`  Length:`, encoder.utf16(axis.name).length)
  
  // ...
}
```

查看中文字符是否被正确编码。

## 💡 我的建议

基于所有验证都通过，我强烈怀疑是以下之一：

1. **Font Validator缓存**（最可能）
   - 删除旧文件
   - 重新生成
   - 重新验证

2. **文件保存截断**
   - 检查实际.otf文件大小
   - 如果不是15364字节，问题在保存代码

3. **中文编码**
   - 临时改成英文测试
   - 如果英文正常，再调查中文编码

## 📋 请提供以下信息

1. **保存的.otf文件的实际大小**（从文件管理器查看）
2. **你的variants.axes配置**（特别是name字段的值）
3. **使用英文name测试的结果**（如果可以的话）

根据这些信息，我可以精确定位问题！

## ⚠️ 重要提示

由于所有内部验证都通过了，**代码本身是正确的**！问题应该在：
- 文件保存/读取环节
- Font Validator缓存
- 或者Font Validator对可变字体的特殊验证规则

让我们一步步排查！

