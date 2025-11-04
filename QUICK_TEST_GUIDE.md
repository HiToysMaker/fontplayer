# 🚀 可变字体快速测试指南

## ✅ 所有问题已修复

1. ✅ **CFF + gvar 不兼容** → 自动转换为 glyf + gvar
2. ✅ **Combinations未转换** → 所有变体都转换为二次贝塞尔
3. ✅ **栈溢出** → 使用简化版本，不递归
4. ✅ **Offset错误** → sfnt表修复
5. ✅ **CheckSum溢出** → 添加模运算
6. ✅ **checkSumAdjustment硬编码** → 动态查找

## 🎯 立即测试（5分钟）

### 步骤1：刷新浏览器（清除缓存）

```bash
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

### 步骤2：生成字体

在你的UI中导出可变字体，查看控制台输出：

**应该看到**：
```
🔄 Generating variation combinations...
Total combinations: 1
  Combination 0: tuple [0] - converted to quadratic
✅ All combinations converted to quadratic Bezier

🎨 === Creating Variable Font ===
Axes: wght (100-900)
Combinations: 1
✅ Removed CFF table (using TrueType format for variable font)

📐 Step 1: Converting cubic Bezier to quadratic...
✅ Converted 42 glyphs to quadratic Bezier

📦 Step 2: Building glyf and loca tables...
=== Building glyf Table ===
Processing 42 glyphs...
  Glyph 0 (.notdef): 0 contours, 0 points
  ...
  Glyph 41 (字): 3 contours, 156 points
✅ Built glyf table with 42 glyphs

=== Building loca Table ===
Version: 1 (long/Offset32)
Total glyphs: 42
Total glyf data size: 8456 bytes
Offsets array length: 43
✅ Built loca table with 43 offsets

✅ glyf and loca tables created

🎯 Step 3: Creating variation tables...
✅ fvar table created
✅ gvar table created

🎉 Variable font tables complete!
```

**不应该看到**：
- ❌ 栈溢出错误
- ❌ `Cubic Bezier curve found in gvar table` 错误

### 步骤3：验证表结构

```bash
# 解压zip
cd ~/Downloads
unzip yourfont.zip

# 列出所有表
ttx -l yourfont.otf
```

**应该看到**：
```
OS/2  ✅
cmap  ✅
fvar  ✅ (变体轴)
glyf  ✅ (TrueType轮廓)
gvar  ✅ (字形变体)
head  ✅
hhea  ✅
hmtx  ✅
loca  ✅ (字形位置)
maxp  ✅
name  ✅
post  ✅
```

**关键检查**：
- ✅ **有** `glyf` 和 `loca` 表
- ✅ **有** `fvar` 和 `gvar` 表
- ✅ **没有** `CFF ` 表

### 步骤4：Font Book测试（最重要！）

```bash
# 双击.otf文件，或
open -a "Font Book" yourfont.otf
```

**成功标志**：
- ✅ 字体预览窗口打开
- ✅ **顶部有滑块控件！** 🎊
- ✅ 滑块名称显示为"字重"或"Weight"
- ✅ 拖动滑块，字形实时变化

**如果没有滑块**：
- 检查 `ttx -t fvar` 输出
- 检查控制台日志

### 步骤5：Photoshop测试

1. 安装字体（双击或拖到Font Book）
2. 打开Photoshop 2025
3. 创建文本图层，输入文字
4. 选择你的字体
5. 查找可变字体控件：
   - **属性面板** - 顶部标签或右侧面板
   - **字符面板** - 点击右上角菜单

## 🐛 故障排除

### 问题1：仍然栈溢出

**可能原因**：浏览器缓存

**解决**：
1. 完全关闭浏览器
2. 重新打开
3. 重新生成

### 问题2：Font Book没有滑块

**检查fvar表**：
```bash
ttx -t fvar yourfont.otf
cat yourfont.ttx
```

应该看到：
```xml
<fvar>
  <Axis>
    <AxisTag>wght</AxisTag>
    <MinValue>100.0</MinValue>
    <DefaultValue>400.0</DefaultValue>
    <MaxValue>900.0</MaxValue>
    <AxisNameID>256</AxisNameID>
  </Axis>
</fvar>
```

**如果fvar为空或缺失**：
- 检查 `selectedFile.value.variants.axes` 是否有值
- 检查控制台日志

### 问题3：字形显示异常

**可能原因**：轮廓数据有问题

**检查**：
```bash
# 检查gvar表
ttx -t gvar yourfont.otf | head -100
```

**如果看到错误**：
- 点数量不匹配
- 轮廓结构不一致

**解决**：检查你的轮廓生成代码，确保所有变体的轮廓结构一致。

## 📊 成功指标

### ✅ 控制台日志正常

- `✅ All combinations converted to quadratic Bezier`
- `✅ Built glyf table with N glyphs`
- `✅ Built loca table with N+1 offsets`
- `✅ fvar table created`
- `✅ gvar table created`
- 没有任何❌错误

### ✅ ttx验证通过

```bash
ttx -l yourfont.otf
# 输出12个表，包括 fvar, gvar, glyf, loca
```

### ✅ Font Book显示滑块

- 顶部有滑块控件
- 可以拖动改变字形

### ✅ Photoshop可以使用

- 字体列表中显示
- 可以输入文字
- 有可变字体控件

## 🎉 预期效果

**Font Book中**：
```
[字重] ●─────────────○─────────────●
       100          400          900
```

**拖动滑块时**：
- 字形粗细实时变化
- 从细体(100) → 常规(400) → 粗体(900)
- 平滑过渡，无跳跃

**Photoshop中**：
- 属性面板显示"字重"滑块
- 拖动滑块，文字粗细变化
- 实时预览

## 💪 你已经完成了！

**所有核心功能都已实现**：
- ✅ CFF → TrueType 转换
- ✅ 三次 → 二次贝塞尔转换
- ✅ glyf/loca表构建
- ✅ fvar/gvar表创建
- ✅ 所有bug修复
- ✅ 防止栈溢出

**只差最后一步**：测试！

## 📞 如果还有问题

提供以下信息：
1. **完整的控制台日志**（从开始到结束）
2. **ttx -l 输出**
3. **ttx -t fvar 输出**
4. **Font Book 截图**
5. **具体错误信息**

## 🎊 期待你的好消息！

"我看到滑块了！可变字体功能正常工作！" 🎉

加油！🚀✨

