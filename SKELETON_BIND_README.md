# 骨架绑定功能使用指南

## 概述

骨架绑定功能允许用户将手绘的笔画形状与参数化骨架进行绑定，实现拖拽骨架就能改变形状的效果。该功能基于线性混合蒙皮（Linear Blend Skinning, LBS）算法，专门针对字体设计中的四种基本笔画（横、竖、撇、捺）进行了优化。

## 核心功能

### 1. 骨架分析
- 自动识别骨架类型（横、竖、撇、捺）
- 将骨架转换为骨骼集合
- 为曲线骨架（撇、捺）创建离散化的骨骼段

### 2. 控制点绑定
- 自动计算控制点到骨骼的距离
- 基于距离和位置的权重分配
- 支持多骨骼影响（最多4根骨骼）

### 3. 实时变形
- 线性混合蒙皮算法
- 支持骨架拖拽时的实时变形
- 保持形状的连续性和平滑性

## 技术实现

### 骨骼定义
```typescript
interface Bone {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  uAxis: { x: number; y: number }; // 骨骼方向向量
  vAxis: { x: number; y: number }; // 垂直方向向量
  bindMatrix: number[]; // 绑定时的变换矩阵
  currentMatrix: number[]; // 当前的变换矩阵
}
```

### 控制点绑定
```typescript
interface PointBinding {
  pointIndex: number;
  bones: Array<{
    boneIndex: number;
    weight: number;
    localCoords: { u: number; v: number };
  }>;
}
```

## 使用方法

### 1. 基本绑定流程

```javascript
// 导入绑定功能
const { glyphSkeletonBind, applySkeletonTransformation } = require('./features/glyphSkeletonBind');

// 在模板脚本中执行绑定
const updateGlyphByParams = (params, global_params) => {
  // 创建骨架
  const skeleton = {
    start: { x: 100, y: 100 },
    end: { x: 300, y: 100 }
  };
  
  // 创建组件
  const components = getComponents(skeleton, global_params);
  components.forEach(comp => glyph.addComponent(comp));
  
  // 设置骨架获取函数
  glyph.getSkeleton = () => skeleton;
  
  // 执行绑定
  glyphSkeletonBind(glyph);
};
```

### 2. 拖拽变形处理

```javascript
glyph.onSkeletonDrag = (data) => {
  if (!glyph.tempData) return;
  
  const jointsMap = getJointsMap(data);
  
  // 创建新的骨架
  const newSkeleton = {
    start: jointsMap.start,
    end: jointsMap.end
  };
  
  // 应用变形
  applySkeletonTransformation(glyph, newSkeleton);
  
  // 更新组件
  updateGlyphByParams(computeParamsByJoints(jointsMap), global_params);
};
```

### 3. 手绘形状绑定

```javascript
// 假设用户已经绘制了一个Pen组件
const bindHandDrawnShape = (glyph) => {
  if (glyph.getSkeleton) {
    const result = glyphSkeletonBind(glyph);
    
    if (result) {
      console.log('绑定成功');
      console.log('骨骼数量:', result.bones.length);
      console.log('控制点绑定数量:', result.pointsBonesMap.length);
    }
  }
};
```

## 支持的骨架类型

### 1. 横笔画（Horizontal）
- 骨架：`{ start: {x, y}, end: {x, y} }`
- 特点：水平方向的直线骨架

### 2. 竖笔画（Vertical）
- 骨架：`{ start: {x, y}, end: {x, y} }`
- 特点：垂直方向的直线骨架

### 3. 撇笔画（Pie）
- 骨架：`{ start: {x, y}, bend: {x, y}, end: {x, y} }`
- 特点：从右上到左下的曲线骨架

### 4. 捺笔画（Na）
- 骨架：`{ start: {x, y}, bend: {x, y}, end: {x, y} }`
- 特点：从左上到右下的曲线骨架

## 权重计算算法

### 1. 距离权重
```javascript
weight = 1.0 / (distance + epsilon)
```

### 2. 位置衰减
```javascript
falloff = 1 - 4 * (normalizedU - 0.5)²
```

### 3. 最终权重
```javascript
finalWeight = distanceWeight * falloff
```

## 性能优化

### 1. 影响范围限制
- 只考虑距离小于骨骼长度1.5倍的骨骼
- 每个控制点最多受4根骨骼影响

### 2. 权重归一化
- 确保所有影响骨骼的权重总和为1
- 避免变形时的缩放问题

### 3. 矩阵缓存
- 缓存绑定时的变换矩阵
- 避免重复计算逆矩阵

## 注意事项

1. **组件类型**：目前只支持Pen类型的组件
2. **骨架格式**：确保骨架的joints有正确的name属性
3. **绑定数据**：绑定信息存储在`glyph.skeletonBindData`中
4. **变形范围**：适合字体变形场景，避免极端旋转

## 测试

运行测试文件验证功能：

```javascript
import { runAllTests } from './features/testSkeletonBind';
runAllTests();
```

## 扩展功能

### 1. 权重可视化
- 提供权重热力图显示
- 允许用户手动调整权重

### 2. 多组件支持
- 扩展到其他组件类型
- 支持复合组件的绑定

### 3. 高级变形
- 实现双四元数蒙皮（DQS）
- 支持更复杂的变形效果

## 技术细节

### 线性混合蒙皮算法
```javascript
V' = Σ(w_i * M_i_current * M_i_bind^(-1) * V)
```

其中：
- `V`：原始控制点
- `V'`：变形后的控制点
- `w_i`：权重
- `M_i_bind`：绑定时的变换矩阵
- `M_i_current`：当前的变换矩阵

### 贝塞尔曲线离散化
对于撇、捺笔画，将二次贝塞尔曲线离散化为8个骨骼段，确保变形的平滑性。

## 故障排除

### 常见问题

1. **绑定失败**
   - 检查PenComponent的points数组是否为空
   - 确认骨架格式正确

2. **变形效果不理想**
   - 调整影响范围阈值
   - 检查权重计算参数

3. **性能问题**
   - 减少骨骼段数量
   - 优化影响范围计算

## 更新日志

- v1.0.0：初始版本，支持四种基本笔画
- 支持线性混合蒙皮算法
- 自动骨架类型检测
- 实时变形功能 