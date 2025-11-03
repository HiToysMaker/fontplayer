# 可变字体完整解决方案

## 🎯 问题总结

你的ttx错误 `KeyError: 'glyf'` 的根本原因：

**CFF格式 + gvar表 = 不兼容 ❌**

- 你的字体使用**CFF表**（PostScript轮廓，三次贝塞尔）
- **gvar表**需要**glyf表**（TrueType轮廓，二次贝塞尔）
- 这两者不兼容！

## ✅ 解决方案

### 阶段1：临时方案（立即可用）

**暂时生成普通字体**（不含可变功能），验证其他功能正常：

在 `handlers.ts` 的 `createVarFont` 函数中，暂时不传variants：

```typescript
const font = await create(fontCharacters, {
  familyName: selectedFile.value.name,
  styleName: 'Regular',
  unitsPerEm,
  ascender,
  descender,
  // 暂时注释掉
  // variants: {
  //   axes: selectedFile.value.variants?.axes,
  //   instances: selectedFile.value.variants?.instances,
  //   combinations: combinations,
  // },
  tables: selectedFile.value.fontSettings.tables || null,
})
```

这样生成的字体：
- ✅ 可以安装
- ✅ 可以在PS中使用
- ❌ 没有可变功能（滑块）

### 阶段2：完整方案（需要实现）

我已经为你创建了：
1. ✅ `cubicToQuadratic.ts` - 三次转二次贝塞尔的转换函数
2. ✅ 修改了`font.ts` - 自动检测可变字体并尝试转换

**但还缺少**：
- ❌ 从字符数组构建`IGlyfTable`的函数
- ❌ `ILocaTable`的构建逻辑

#### 需要添加的代码

在 `font.ts` 中，替换第648-653行：

```typescript
// 2. 创建glyf和loca表（使用转换后的轮廓）
// 需要先将convertedCharacters转换为IGlyfTable格式
const glyfTableData: IGlyfTable = {
  glyphTables: convertedCharacters.map(char => {
    // 计算边界框
    let xMin = Infinity, yMin = Infinity
    let xMax = -Infinity, yMax = -Infinity
    
    for (const contour of char.contours) {
      for (const segment of contour) {
        // 更新边界
        xMin = Math.min(xMin, segment.start.x, segment.end.x)
        xMax = Math.max(xMax, segment.start.x, segment.end.x)
        yMin = Math.min(yMin, segment.start.y, segment.end.y)
        yMax = Math.max(yMax, segment.start.y, segment.end.y)
        
        if (segment.type === PathType.QUADRATIC_BEZIER) {
          xMin = Math.min(xMin, segment.control.x)
          xMax = Math.max(xMax, segment.control.x)
          yMin = Math.min(yMin, segment.control.y)
          yMax = Math.max(yMax, segment.control.y)
        }
      }
    }
    
    return {
      numberOfContours: char.contourNum,
      xMin: Math.round(xMin) || 0,
      yMin: Math.round(yMin) || 0,
      xMax: Math.round(xMax) || 0,
      yMax: Math.round(yMax) || 0,
      contours: char.contours,
      advanceWidth: char.advanceWidth,
      leftSideBearing: char.leftSideBearing,
      // ... 其他必要字段
    }
  })
}

const glyfTable = createGlyfTable(glyfTableData)

// loca表需要从glyf表数据生成
const locaTableData: ILocaTable = {
  version: headTable.indexToLocFormat || 1,
  offsets: [] // 从glyfTable计算
}
const locaTable = createLocaTable(locaTableData, { version: headTable.indexToLocFormat || 1 })

tables['glyf'] = glyfTable
tables['loca'] = locaTable
```

## 🎯 推荐行动步骤

### 立即行动（今天）：

1. **暂时禁用variants参数**（阶段1）
2. **测试普通字体生成**
   ```bash
   # 生成字体
   # 安装字体
   # 在PS中测试
   ```
3. **确认其他功能正常**
   - 字体可以安装 ✅
   - 字符显示正确 ✅
   - 度量值正确 ✅

### 接下来（本周）：

#### 选项A：使用第三方工具转换（最简单）

使用fontkit等工具先生成TrueType字体：

```bash
npm install fonttools
# 或使用Python的fonttools
pip3 install fonttools

# 转换CFF到TrueType
fonttools varLib ...
```

#### 选项B：实现完整的转换逻辑

1. 完善`IGlyfTable`构建逻辑
2. 实现`ILocaTable`计算
3. 测试转换后的字体
4. 启用variants参数
5. 测试可变字体

### 长期（未来）：

实现CFF2支持，原生支持CFF格式的可变字体。

## 📊 当前状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 普通字体（CFF） | ✅ 完成 | 可以正常生成 |
| fvar表 | ✅ 完成 | 格式正确 |
| gvar表 | ✅ 完成 | 需要glyf表支持 |
| 三次→二次转换 | ✅ 完成 | `cubicToQuadratic.ts` |
| IGlyfTable构建 | ⚠️ 部分 | 需要完善 |
| ILocaTable构建 | ❌ 缺失 | 需要实现 |
| 可变字体测试 | ❌ 待定 | 依赖上述功能 |

## 🐛 调试技巧

### 1. 验证fvar表

```bash
ttx -t fvar yourfont.otf
cat yourfont.ttx
```

应该看到：
```xml
<fvar>
  <Axis>
    <AxisTag>wght</AxisTag>
    ...
  </Axis>
</fvar>
```

### 2. 检查表列表

```bash
ttx -l yourfont.otf
```

**普通字体**应该有：`CFF ` ✅
**可变字体**应该有：`glyf`, `loca`, `fvar`, `gvar` ✅

### 3. Font Book测试

macOS Font Book是最快的测试方法：
- 双击字体
- 如果是可变字体，顶部会显示滑块
- 可以实时预览变化

## 💡 关键要点

1. **CFF + gvar = 不兼容**
2. **可变字体需要TrueType格式（glyf + gvar）**
3. **CFF可变字体需要CFF2（复杂，尚未实现）**
4. **三次贝塞尔→二次贝塞尔转换已实现**
5. **还需要完善glyf/loca表的构建逻辑**

## 📞 需要帮助？

如果遇到问题，提供以下信息：
1. `ttx -l` 的完整输出
2. 控制台的调试日志
3. Font Book中的表现
4. 具体的错误信息

我们一起调试！🚀

