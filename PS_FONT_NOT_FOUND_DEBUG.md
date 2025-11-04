# Photoshop 找不到字体 - 完整调试指南

## 问题描述

字体在macOS字体册中显示正常，但在Photoshop中找不到。

---

## 🔍 诊断步骤

### 步骤1：检查字体名称（最常见的原因）

PostScript Name（nameID=6）是Photoshop识别字体的关键。

**运行检查脚本**：
```bash
bash /tmp/check_font_names.sh ~/Downloads/你的字体.otf
```

**PS对PostScript Name的要求**：
- ✅ **只能包含**：A-Z, a-z, 0-9, 连字符(-), 下划线(_)
- ❌ **不能包含**：空格、中文、特殊字符
- ✅ **长度限制**：最多63个字符
- ✅ **格式推荐**：`FamilyName-SubfamilyName`（如：`MyFont-Regular`）

**示例**：
```
✅ 正确：untitled-Regular, MyFont-Bold, Font_Medium
❌ 错误：我的字体-Regular, My Font Regular, untitled 字体
```

**如何修复**：
如果你的字体名称包含中文或空格，需要在生成字体时使用纯英文名称。

---

### 步骤2：清除Photoshop字体缓存

PS有独立的字体缓存，有时需要手动清除。

**运行清理脚本**：
```bash
bash /tmp/clear_ps_cache.sh
```

**手动清理步骤**：
1. 完全退出Photoshop
2. 删除PS缓存：
   ```bash
   rm -rf ~/Library/Application\ Support/Adobe/Adobe\ Photoshop\ 2025/Caches/*
   rm -rf ~/Library/Caches/Adobe/Adobe\ Photoshop\ 2025/*
   ```
3. 重启字体服务：
   ```bash
   sudo atsutil databases -removeUser
   sudo atsutil server -shutdown
   sudo atsutil server -ping
   ```
4. 重新安装字体
5. 启动Photoshop

---

### 步骤3：验证字体结构

检查字体是否包含所有必需的表：

```bash
cd ~/Downloads
ttx -l 你的字体.otf
```

**可变字体必需的表**：
```
✅ head    - 字体头部
✅ hhea    - 水平度量头部
✅ maxp    - 最大配置
✅ OS/2    - OS/2和Windows度量
✅ name    - 名称表（包含postScriptName）
✅ cmap    - 字符到字形映射
✅ post    - PostScript信息
✅ glyf    - 字形数据（TrueType轮廓）
✅ loca    - 字形位置索引
✅ hmtx    - 水平度量
✅ fvar    - 字体变化（定义轴）
✅ gvar    - 字形变化
✅ STAT    - 样式属性（macOS/PS需要）
```

---

### 步骤4：检查name表详细内容

```bash
ttx -t name 你的字体.otf
cat 你的字体.ttx
```

**关键nameID检查**：

| nameID | 名称 | 要求 | 示例 |
|--------|------|------|------|
| 1 | Family Name | 可以有中文 | `我的字体` 或 `MyFont` |
| 2 | Subfamily Name | 建议英文 | `Regular`, `Bold` |
| 4 | Full Font Name | 可以有中文 | `我的字体 Regular` |
| 6 | **PostScript Name** | **必须纯英文** | `MyFont-Regular` |
| 16 | Typographic Family | 可以有中文 | `我的字体` |
| 17 | Typographic Subfamily | 建议英文 | `Regular` |

**nameID=6最重要**：如果这个字段包含中文或空格，PS肯定找不到！

---

## 🛠️ 解决方案

### 方案1：使用纯英文字体名称（推荐）

在创建字体时，使用英文名称：

**示例配置**：
```javascript
{
  familyName: "MyFont",      // 不要用中文
  subfamilyName: "Regular",
  fullName: "MyFont Regular",
  postScriptName: "MyFont-Regular"  // 自动生成
}
```

### 方案2：修复现有字体的postScriptName

如果字体已经生成，需要修改代码中的name表生成逻辑。

**检查当前的postScriptName生成**：
1. 打开 `src/fontManager/tables/name.ts`
2. 找到 `generatePostScriptName` 函数
3. 确保它移除了所有中文字符和空格

**改进建议**：
```typescript
const generatePostScriptName = (familyName: string, subfamilyName: string): string => {
	// 移除中文和特殊字符，只保留ASCII字母、数字、连字符
	const cleanFamily = familyName
		.replace(/[^\x00-\x7F]/g, '')  // 移除非ASCII字符（包括中文）
		.replace(/[^a-zA-Z0-9-_]/g, '')  // 只保留字母、数字、连字符、下划线
		.replace(/\s/g, '')  // 移除空格
	
	const cleanSubfamily = subfamilyName
		.replace(/[^\x00-\x7F]/g, '')
		.replace(/[^a-zA-Z0-9-_]/g, '')
		.replace(/\s/g, '')
	
	// 如果清理后为空，使用默认值
	const psFamily = cleanFamily || 'Untitled'
	const psSubfamily = cleanSubfamily || 'Regular'
	
	// 连接为 FamilyName-SubfamilyName 格式
	const psName = `${psFamily}-${psSubfamily}`.slice(0, 63)
	
	return psName
}
```

---

## 📊 测试流程

### 1. 检查字体名称
```bash
bash /tmp/check_font_names.sh ~/Downloads/你的字体.otf
```

查看输出的PostScript Name（nameID=6），确保：
- ✅ 没有中文
- ✅ 没有空格
- ✅ 只有字母、数字、连字符

### 2. 清除缓存并重装
```bash
# 清除PS缓存
bash /tmp/clear_ps_cache.sh

# 重新安装字体
open 你的字体.otf
```

### 3. 在PS中测试
1. 启动Photoshop
2. 创建新文档
3. 选择文字工具
4. 在字体列表中搜索：
   - 搜索 Family Name（中文或英文）
   - 搜索 PostScript Name（英文）

### 4. 如果还找不到

**检查PS控制台**（macOS）：
```bash
# 打开控制台应用
open -a Console

# 筛选：
# 进程：Photoshop
# 搜索：font
```

查看是否有字体加载错误。

---

## 🎯 常见问题和解决方案

### Q1: 字体册能看到，PS看不到
**原因**：PostScript Name包含中文或空格  
**解决**：使用纯英文重新生成字体

### Q2: 普通字体在PS中能看到，可变字体看不到
**原因**：缺少STAT表或STAT表配置错误  
**解决**：确保生成了STAT表（已在代码中添加）

### Q3: 清除缓存后还是看不到
**原因**：字体名称问题没有解决  
**解决**：先修复字体名称，再清除缓存

### Q4: PS字体列表中显示为"?"或乱码
**原因**：name表编码问题  
**解决**：确保name表使用UTF-16编码（platformID=3, encodingID=1）

---

## 📋 检查清单

在向Photoshop报告问题前，请确认：

- [ ] PostScript Name（nameID=6）是纯英文，无空格
- [ ] 已清除PS字体缓存
- [ ] 已重启字体服务（atsutil）
- [ ] 字体包含STAT表（可变字体）
- [ ] 字体在字体册中显示正常
- [ ] 使用ttx验证字体结构无误
- [ ] 尝试在其他Adobe应用（如Illustrator）中测试

---

## 🔬 高级诊断

### 使用Font Validator检查
```bash
# 下载Font Validator (macOS)
# 打开字体文件，查看错误和警告
```

### 使用fonttools检查
```bash
pip install fonttools

# 检查name表
ttx -t name 你的字体.otf
cat 你的字体.ttx

# 检查STAT表
ttx -t STAT 你的字体.otf
cat 你的字体.ttx
```

### 对比工作正常的字体
找一个在PS中能正常工作的可变字体：
```bash
ttx -t name -t STAT 工作正常的字体.otf
ttx -t name -t STAT 你的字体.otf

# 对比两个ttx文件，找出差异
```

---

## 📞 获取帮助

如果以上方法都无效，请提供：

1. **字体名称检查输出**：
   ```bash
   bash /tmp/check_font_names.sh 你的字体.otf > font_info.txt
   ```

2. **name表完整内容**：
   ```bash
   ttx -t name 你的字体.otf
   cat 你的字体.ttx > name_table.txt
   ```

3. **STAT表内容**：
   ```bash
   ttx -t STAT 你的字体.otf
   cat 你的字体.ttx > stat_table.txt
   ```

4. **字体表列表**：
   ```bash
   ttx -l 你的字体.otf > tables_list.txt
   ```

5. **PS版本信息**：
   - Photoshop版本号
   - macOS版本号

---

## ✅ 成功标志

字体在PS中正常工作应该能：

1. ✅ 在字体列表中搜索到
2. ✅ 正确显示字形
3. ✅ 看到变体轴滑块（可变字体）
4. ✅ 调整轴参数时字形正确变化
5. ✅ 保存和重新打开文档后字体依然可用

祝你调试顺利！🎉

