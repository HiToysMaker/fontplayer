# 验证可变字体功能

## 🧪 测试方法

### 方法1：使用macOS Font Book（推荐）

1. 打开 **Font Book**（字体册）应用
2. 找到你的字体并双击打开
3. 如果是可变字体，应该能看到：
   - 顶部有**滑块控件**显示各个轴（如Weight）
   - 可以拖动滑块预览不同变体

**如果看不到滑块** → 可变字体功能可能有问题

### 方法2：使用fonttools验证

```bash
# 安装fonttools
pip3 install fonttools

# 列出字体中的表
ttx -l yourfont.otf

# 应该看到：
# - fvar (Font Variations Table)  ✅
# - gvar (Glyph Variations Table) ✅

# 导出fvar和gvar表查看详细内容
ttx -t fvar -t gvar yourfont.otf

# 这会生成 yourfont.ttx 文件
# 打开查看fvar和gvar的具体内容
```

### 方法3：使用在线工具

1. 访问 https://wakamaifondue.com/
2. 上传你的.otf文件
3. 网站会显示字体的所有功能，包括可变轴

### 方法4：使用Axis-Praxis

1. 访问 https://www.axis-praxis.org/
2. 上传字体
3. 应该能看到所有的变体轴和滑块

## 🔍 检查fvar表内容

使用ttx导出后，fvar表应该类似这样：

```xml
<fvar>
  <Axis>
    <AxisTag>wght</AxisTag>
    <Flags>0x0</Flags>
    <MinValue>100.0</MinValue>
    <DefaultValue>400.0</DefaultValue>
    <MaxValue>900.0</MaxValue>
    <AxisNameID>256</AxisNameID>  <!-- 对应name表中的条目 -->
  </Axis>
  
  <!-- 可选：命名实例 -->
  <NamedInstance subfamilyNameID="257">
    <coord axis="wght" value="100.0"/>
  </NamedInstance>
  <NamedInstance subfamilyNameID="258">
    <coord axis="wght" value="400.0"/>
  </NamedInstance>
  <NamedInstance subfamilyNameID="259">
    <coord axis="wght" value="900.0"/>
  </NamedInstance>
</fvar>
```

## 🔍 检查gvar表内容

gvar表应该包含每个字形的变体数据：

```xml
<gvar>
  <version value="1"/>
  <reserved value="0"/>
  
  <glyphVariations glyph="A">
    <tuple>
      <coord axis="wght" value="1.0"/>
      <delta pt="0" x="10" y="0"/>
      <delta pt="1" x="15" y="5"/>
      <!-- ... 更多点的增量 -->
    </tuple>
  </glyphVariations>
  
  <!-- 更多字形... -->
</gvar>
```

## 🐛 常见问题

### 问题1：Photoshop不显示滑块

**可能原因**：
1. Photoshop版本 < CC 2018
2. 字体安装后没有重启Photoshop
3. fvar表存在但数据不正确
4. OS/2表的版本号不对（应该≥5）

**解决方法**：
```bash
# 检查OS/2表版本
ttx -t OS/2 yourfont.otf
# 查看 <version value="5"/> 或更高
```

### 问题2：Font Book中看不到滑块

**可能原因**：
1. macOS版本太旧（需要10.13+）
2. fvar表缺失或格式错误
3. axisCount为0

### 问题3：字体可以安装但不生效

**可能原因**：
1. gvar表数据错误（导致渲染失败）
2. 点数量不匹配（default和variation）
3. TupleVariationHeader格式错误

## 📊 调试信息收集

请提供以下信息：

1. **ttx输出**：
```bash
ttx -l yourfont.otf
```

2. **fvar表内容**：
```bash
ttx -t fvar yourfont.otf
cat yourfont.ttx
```

3. **gvar表摘要**：
```bash
ttx -t gvar yourfont.otf | head -100
```

4. **Photoshop版本**：
   - 帮助 > 关于Photoshop

5. **macOS版本**：
   - 系统设置 > 关于本机

## 🎯 快速测试

最简单的测试方法：

1. 在macOS Font Book中打开字体
2. 如果看到滑块 → fvar正确 ✅
3. 如果拖动滑块字形有变化 → gvar正确 ✅
4. 如果两者都OK但Photoshop没显示 → Photoshop配置问题

请先用Font Book测试，然后告诉我结果！

