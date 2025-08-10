# WASM 去除重叠功能

本项目已将去除重叠功能从 paper.js 迁移到 WASM + Rust 实现，以提高性能和稳定性。

## 功能说明

### 主要改进
1. **性能提升**: WASM 实现比 JavaScript 实现更快
2. **内存效率**: Rust 的内存管理更高效
3. **稳定性**: 减少了 JavaScript 引擎的依赖
4. **回退机制**: 如果 WASM 加载失败，会自动回退到 paper.js 实现

### 涉及的文件
- `src/utils/wasm-loader.ts`: WASM 模块加载器
- `src/utils/overlap-remover.ts`: 轮廓数据转换和 WASM 调用工具
- `src/fontEditor/menus/handlers.ts`: 修改了两个主要函数
  - `computeOverlapRemovedContours()`: 生成字体文件时去除重叠
  - `removeOverlap()`: 菜单中的"去除重叠"按钮

## 最新修复 (2024年)

### 修复的问题
1. **乱码问题**: 修复了路径连接错误，确保每个线段都从前一个线段的终点开始
2. **非零环绕规则**: 添加了路径方向检测和修正，确保孔洞正确处理

### 技术细节
- **路径连接修复**: 在 `contour_to_simple_path` 函数中，使用 `current_start` 变量跟踪当前路径的起点
- **方向检测**: 添加了 `calculate_winding_number` 函数计算路径的环绕方向
- **方向修正**: 添加了 `normalize_contour_direction` 函数确保外轮廓逆时针，内轮廓（孔洞）顺时针
- **调试信息**: 添加了详细的调试输出，帮助诊断处理过程

### 修复的文件
- `crates/font-overlap-remover/src/lib.rs`: 主要算法修复
- `src/utils/overlap-remover.ts`: 添加调试信息处理

## 构建和部署

### 1. 安装依赖
```bash
# 安装 wasm-pack (如果还没有安装)
cargo install wasm-pack
```

### 2. 构建 WASM 模块
```bash
# 构建 WASM 模块
npm run build-wasm
```

### 3. 开发环境
```bash
# 启动开发服务器
npm run dev
```

### 4. 生产构建
```bash
# 构建生产版本
npm run build
```

## 技术实现

### WASM 模块结构
- `crates/font-overlap-remover/`: Rust WASM 模块
- `src/lib.rs`: 主要的去除重叠算法实现
- 使用 `flo_curves` 库进行路径布尔运算

### 数据格式转换
1. **输入**: 字体轮廓数据 (ILine, IQuadraticBezierCurve, ICubicBezierCurve)
2. **转换**: 转换为 WASM 模块需要的 JSON 格式
3. **处理**: 使用 Rust 的 `flo_curves` 库进行 Union 运算
4. **输出**: 转换回字体轮廓格式

### 错误处理
- WASM 模块加载失败时会回退到 paper.js
- 提供详细的错误日志
- 保持向后兼容性

## 使用方式

### 在代码中调用
```typescript
import { removeOverlapWithWasm } from '@/utils/overlap-remover'

// 去除重叠
const contours = [...] // 轮廓数据
const result = await removeOverlapWithWasm(contours)
```

### 用户界面
1. **导出字体时**: 勾选"去除重叠"选项
2. **编辑字符时**: 使用菜单中的"去除重叠"功能

## 测试

### 运行测试
```bash
# 运行WASM测试
node scripts/test-overlap-fix.js
```

### 测试内容
- 重叠矩形的合并
- 带孔洞形状的处理
- 路径方向检测
- 非零环绕规则验证

## 故障排除

### 常见问题
1. **WASM加载失败**: 检查浏览器控制台，确认WASM文件路径正确
2. **路径连接错误**: 查看调试信息中的winding number值
3. **孔洞处理异常**: 确认内轮廓方向为顺时针

### 调试信息
WASM模块现在会输出详细的调试信息，包括：
- 输入轮廓数量
- 路径转换结果
- 环绕方向修正
- 最终输出轮廓数量 