import { CustomGlyph } from "../fontEditor/programming/CustomGlyph";
import { IPenComponent, IComponent } from "../fontEditor/stores/files";

// 骨骼定义
interface Bone {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  uAxis: { x: number; y: number }; // 骨骼方向向量
  vAxis: { x: number; y: number }; // 垂直方向向量
  parent?: string;
  children: string[];
  bindMatrix: number[]; // 绑定时的变换矩阵
  currentMatrix: number[]; // 当前的变换矩阵
}

// 控制点绑定信息
interface PointBinding {
  pointIndex: number;
  bones: Array<{
    boneIndex: number;
    weight: number;
    localCoords: { u: number; v: number };
  }>;
}

// 骨架类型
type SkeletonType = 'horizontal' | 'vertical' | 'pie' | 'na';

const glyphSkeletonBind = (glyph: CustomGlyph) => {
  const skeleton = glyph.getSkeleton();
  const components = glyph.components;

  // 只处理Pen类型的组件
  const penComponents = components.filter(comp => comp.type === 'pen') as IComponent[];
  if (penComponents.length === 0) return;

  const penComponent = penComponents[0]; // 假设只有一个Pen组件
  
  // 阶段一：骨架分析
  const bones = skeletonToBones(skeleton);
  
  // 阶段二：控制点绑定与权重分配
  const points = componentsToPoints(penComponent);
  const pointsBonesMap = points.map((point, index) => {
    return calculatePointBones(point, bones, index);
  });

  // 存储绑定信息到glyph对象中，供后续变形使用
  (glyph as any).skeletonBindData = {
    bones,
    pointsBonesMap,
    originalPoints: points.map(p => ({ x: p.x, y: p.y })),
    skeletonType: detectSkeletonType(skeleton)
  };

  // 存储绑定信息到glyph对象中，供后续变形使用
  if((glyph as any)._glyph.skeleton) {
    (glyph as any)._glyph.skeleton.skeletonBindData = {
      bones,
      pointsBonesMap,
      originalPoints: points.map(p => ({ x: p.x, y: p.y })),
      skeletonType: detectSkeletonType(skeleton)
    };
  }

  return {
    bones,
    pointsBonesMap
  };
};

// 检测骨架类型
function detectSkeletonType(skeleton: any): SkeletonType {
  const jointNames = Object.keys(skeleton);
  
  if (jointNames.includes('start') && jointNames.includes('end') && !jointNames.includes('bend')) {
    // 只有start和end，判断是横还是竖
    const start = skeleton.start;
    const end = skeleton.end;
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    
    return dx > dy ? 'horizontal' : 'vertical';
  } else if (jointNames.includes('start') && jointNames.includes('bend') && jointNames.includes('end')) {
    // 有bend点，判断是撇还是捺
    const start = skeleton.start;
    const bend = skeleton.bend;
    const end = skeleton.end;
    
    // 计算弯曲方向
    const startToBend = { x: bend.x - start.x, y: bend.y - start.y };
    const bendToEnd = { x: end.x - bend.x, y: end.y - bend.y };
    
    // 撇：从右上到左下，捺：从左上到右下
    // 通过比较水平方向的变化来判断
    const startToEndX = end.x - start.x;
    return startToEndX < 0 ? 'pie' : 'na';
  }
  
  return 'horizontal'; // 默认
}

// 阶段一：骨架分析 - 将骨架转换为骨骼集合
function skeletonToBones(skeleton: any): Bone[] {
  const bones: Bone[] = [];
  const jointNames = Object.keys(skeleton);
  
  if (jointNames.includes('start') && jointNames.includes('end') && !jointNames.includes('bend')) {
    // 直线骨架（横、竖）
    const start = skeleton.start;
    const end = skeleton.end;
    
    const bone: Bone = {
      id: 'main',
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
      length: Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2),
      uAxis: normalize({ x: end.x - start.x, y: end.y - start.y }),
      vAxis: normalize({ x: -(end.y - start.y), y: end.x - start.x }),
      children: [],
      bindMatrix: createIdentityMatrix(),
      currentMatrix: createIdentityMatrix()
    };
    
    bones.push(bone);
    
  } else if (jointNames.includes('start') && jointNames.includes('bend') && jointNames.includes('end')) {
    // 曲线骨架（撇、捺）- 使用二次贝塞尔曲线
    const start = skeleton.start;
    const bend = skeleton.bend;
    const end = skeleton.end;
    
    // 将贝塞尔曲线离散化为多个骨骼段
    const segments = 8; // 分段数量
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      const p1 = quadraticBezierPoint(start, bend, end, t1);
      const p2 = quadraticBezierPoint(start, bend, end, t2);
      
      const bone: Bone = {
        id: `segment_${i}`,
        start: p1,
        end: p2,
        length: Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2),
        uAxis: normalize({ x: p2.x - p1.x, y: p2.y - p1.y }),
        vAxis: normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x }),
        children: [],
        bindMatrix: createIdentityMatrix(),
        currentMatrix: createIdentityMatrix()
      };
      
      if (i > 0) {
        bone.parent = `segment_${i - 1}`;
        bones[i - 1].children.push(bone.id);
      }
      
      bones.push(bone);
    }
  }
  
  // 计算绑定时的变换矩阵
  bones.forEach(bone => {
    bone.bindMatrix = calculateBoneMatrix(bone);
    bone.currentMatrix = [...bone.bindMatrix];
  });
  
  return bones;
}

// 二次贝塞尔曲线上的点
function quadraticBezierPoint(p0: any, p1: any, p2: any, t: number) {
  const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
  const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;
  return { x, y };
}

// 阶段二：从组件中提取控制点
function componentsToPoints(penComponent: IComponent): Array<{ x: number; y: number }> {
  return (penComponent.value as unknown as IPenComponent).points.map(point => ({
    x: point.x,
    y: point.y
  }));
}

// 阶段二：计算控制点的骨骼绑定
function calculatePointBones(point: { x: number; y: number }, bones: Bone[], pointIndex: number): PointBinding {
  const binding: PointBinding = {
    pointIndex,
    bones: []
  };
  
  // 计算点到每根骨骼的距离和权重
  const boneWeights: Array<{ boneIndex: number; weight: number; localCoords: { u: number; v: number } }> = [];
  
  bones.forEach((bone, boneIndex) => {
    const { distance, localCoords } = pointToBoneDistance(point, bone);
    
    // 设定影响阈值（骨骼长度的1.5倍）
    const threshold = bone.length * 1.5;
    
    if (distance <= threshold) {
      // 基于距离的权重计算
      const weight = 1.0 / (distance + 0.001); // 防止除零
      
      // 添加衰减函数（在骨骼中部权重最大）
      const u = localCoords.u;
      const falloff = calculateFalloff(u);
      
      boneWeights.push({
        boneIndex,
        weight: weight * falloff,
        localCoords
      });
    }
  });
  
  // 选择最近的2-4根骨骼
  boneWeights.sort((a, b) => a.weight - b.weight);
  const selectedBones = boneWeights.slice(-Math.min(4, boneWeights.length));
  
  // 归一化权重
  const totalWeight = selectedBones.reduce((sum, bone) => sum + bone.weight, 0);
  selectedBones.forEach(bone => {
    bone.weight /= totalWeight;
  });
  
  binding.bones = selectedBones;
  return binding;
}

// 计算点到骨骼的距离和局部坐标
function pointToBoneDistance(point: { x: number; y: number }, bone: Bone) {
  const { x, y } = point;
  const { start, end, uAxis, vAxis } = bone;
  
  // 计算点到骨骼起点的向量
  const toPoint = { x: x - start.x, y: y - start.y };
  
  // 计算在骨骼局部坐标系中的坐标
  const u = toPoint.x * uAxis.x + toPoint.y * uAxis.y;
  const v = toPoint.x * vAxis.x + toPoint.y * vAxis.y;
  
  // 计算到骨骼的最短距离
  let distance: number;
  if (u < 0) {
    // 点在骨骼起点之前
    distance = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2);
  } else if (u > bone.length) {
    // 点在骨骼终点之后
    distance = Math.sqrt((x - end.x) ** 2 + (y - end.y) ** 2);
  } else {
    // 点在骨骼投影范围内
    distance = Math.abs(v);
  }
  
  return {
    distance,
    localCoords: { u, v }
  };
}

// 计算衰减函数
function calculateFalloff(u: number): number {
  // 使用平滑的Hermite曲线，在骨骼中部为1，在两端衰减为0
  const normalizedU = Math.max(0, Math.min(1, u));
  return 1 - 4 * (normalizedU - 0.5) ** 2;
}

// 工具函数
function normalize(vector: { x: number; y: number }): { x: number; y: number } {
  const length = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  if (length === 0) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

function createIdentityMatrix(): number[] {
  return [1, 0, 0, 1, 0, 0]; // 2x3变换矩阵
}

function calculateBoneMatrix(bone: Bone): number[] {
  const { start, end, uAxis, vAxis } = bone;
  
  // 计算骨骼的变换矩阵
  // 矩阵形式：[uAxis.x, vAxis.x, uAxis.y, vAxis.y, start.x, start.y]
  return [uAxis.x, vAxis.x, uAxis.y, vAxis.y, start.x, start.y];
}

// 阶段三：变形计算 - 根据骨架变化计算新的控制点位置
export function calculateTransformedPoints(glyph: CustomGlyph, newSkeleton: any): Array<{ x: number; y: number }> {
  const bindData = (glyph as any)._glyph.skeleton?.skeletonBindData;
  // console.log('calculateTransformedPoints', (glyph as any)._glyph.skeleton)
  // debugger
  if (!bindData) return [];
  
  const { bones, pointsBonesMap, originalPoints } = bindData;
  
  // 更新骨骼的当前变换矩阵
  updateBoneMatrices(bones, newSkeleton);
  
  // 计算每个控制点的新位置
  return pointsBonesMap.map(binding => {
    return calculatePointTransformation(binding, bones, originalPoints[binding.pointIndex]);
  });
}

// 更新骨骼的变换矩阵
function updateBoneMatrices(bones: Bone[], newSkeleton: any) {
  const skeletonType = detectSkeletonType(newSkeleton);
  
  if (skeletonType === 'horizontal' || skeletonType === 'vertical') {
    // 直线骨架
    const start = newSkeleton.start;
    const end = newSkeleton.end;
    
    if (bones.length > 0) {
      const bone = bones[0];
      bone.start = { x: start.x, y: start.y };
      bone.end = { x: end.x, y: end.y };
      bone.length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
      bone.uAxis = normalize({ x: end.x - start.x, y: end.y - start.y });
      bone.vAxis = normalize({ x: -(end.y - start.y), y: end.x - start.x });
      bone.currentMatrix = calculateBoneMatrix(bone);
    }
    
  } else if (skeletonType === 'pie' || skeletonType === 'na') {
    // 曲线骨架
    const start = newSkeleton.start;
    const bend = newSkeleton.bend;
    const end = newSkeleton.end;
    
    const segments = 8;
    for (let i = 0; i < segments && i < bones.length; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      const p1 = quadraticBezierPoint(start, bend, end, t1);
      const p2 = quadraticBezierPoint(start, bend, end, t2);
      
      const bone = bones[i];
      bone.start = p1;
      bone.end = p2;
      bone.length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      bone.uAxis = normalize({ x: p2.x - p1.x, y: p2.y - p1.y });
      bone.vAxis = normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x });
      bone.currentMatrix = calculateBoneMatrix(bone);
    }
  }
}

// 计算单个控制点的变换
function calculatePointTransformation(binding: PointBinding, bones: Bone[], originalPoint: { x: number; y: number }): { x: number; y: number } {
  let newX = 0;
  let newY = 0;
  
  binding.bones.forEach(({ boneIndex, weight, localCoords }) => {
    const bone = bones[boneIndex];
    if (!bone) return;
    
    // 线性混合蒙皮（LBS）
    // 将点从世界坐标变换到骨骼的局部坐标
    const localPoint = transformPointToLocal(originalPoint, bone.bindMatrix);
    
    // 将局部坐标用当前骨骼变换矩阵变回世界坐标
    const worldPoint = transformPointToWorld(localPoint, bone.currentMatrix);
    
    // 加权累加
    newX += weight * worldPoint.x;
    newY += weight * worldPoint.y;
  });
  
  return { x: newX, y: newY };
}

// 点变换到局部坐标
function transformPointToLocal(point: { x: number; y: number }, matrix: number[]): { x: number; y: number } {
  const [a, b, c, d, tx, ty] = matrix;
  const det = a * d - b * c;
  
  if (Math.abs(det) < 0.001) return point;
  
  const invDet = 1 / det;
  const invA = d * invDet;
  const invB = -b * invDet;
  const invC = -c * invDet;
  const invD = a * invDet;
  
  const x = point.x - tx;
  const y = point.y - ty;
  
  return {
    x: invA * x + invB * y,
    y: invC * x + invD * y
  };
}

// 点变换到世界坐标
function transformPointToWorld(point: { x: number; y: number }, matrix: number[]): { x: number; y: number } {
  const [a, b, c, d, tx, ty] = matrix;
  
  return {
    x: a * point.x + b * point.y + tx,
    y: c * point.x + d * point.y + ty
  };
}

// 应用变形到组件
export function applySkeletonTransformation(glyph: CustomGlyph, newSkeleton: any) {
  console.log('applySkeletonTransformation', newSkeleton)
  // debugger
  const penComponents = glyph.components.filter(comp => comp.type === 'pen') as IComponent[];
  if (penComponents.length === 0) return;
  
  const penComponent = penComponents[0];
  const transformedPoints = calculateTransformedPoints(glyph, newSkeleton);
  
  if (transformedPoints.length === (penComponent.value as unknown as IPenComponent).points.length) {
    console.log('applySkeletonTransformation 2', transformedPoints);
    // 更新控制点位置
    (penComponent.value as unknown as IPenComponent).points.forEach((point, index) => {
      const newPoint = transformedPoints[index];
      point.x = newPoint.x;
      point.y = newPoint.y;
    });
  }
  console.log('applySkeletonTransformation 3', (penComponent.value as unknown as IPenComponent).points)
}

export { glyphSkeletonBind };

// 使用示例和集成指南
/*
在模板脚本中使用骨架绑定功能的步骤：

1. 在模板脚本的开头导入绑定功能：
```javascript
// 在模板脚本中
const { glyphSkeletonBind, applySkeletonTransformation } = require('../features/glyphSkeletonBind');
```

2. 在updateGlyphByParams函数中，在创建组件之前进行绑定：
```javascript
const updateGlyphByParams = (params, global_params) => {
  // ... 现有的骨架创建代码 ...
  
  const skeleton = {
    start,
    end,
    // 或者对于撇捺：start, bend, end
  }
  
  // 创建组件
  const components = getComponents(skeleton, global_params)
  for (let i = 0; i < components.length; i++) {
    glyph.addComponent(components[i])
  }
  
  // 设置骨架获取函数
  glyph.getSkeleton = () => {
    return skeleton
  }
  
  // 设置组件获取函数
  glyph.getComponentsBySkeleton = (skeleton) => {
    return getComponents(skeleton, global_params)
  }
  
  // 执行骨架绑定
  glyphSkeletonBind(glyph)
}
```

3. 在拖拽事件处理函数中应用变形：
```javascript
glyph.onSkeletonDrag = (data) => {
  if (!glyph.tempData) return
  glyph.clear()
  
  const jointsMap = getJointsMap(data)
  const _params = computeParamsByJoints(jointsMap)
  
  // 创建新的骨架
  const newSkeleton = {
    start: jointsMap.start,
    end: jointsMap.end,
    // 或者对于撇捺：start, bend, end
  }
  
  // 应用骨架变形
  applySkeletonTransformation(glyph, newSkeleton)
  
  // 更新组件
  updateGlyphByParams(_params, global_params)
}
```

4. 对于手绘形状的绑定：
```javascript
// 假设用户已经绘制了一个Pen组件
const bindHandDrawnShape = (glyph) => {
  // 确保glyph有getSkeleton函数
  if (glyph.getSkeleton) {
    // 执行绑定
    const bindResult = glyphSkeletonBind(glyph)
    
    if (bindResult) {
      console.log('绑定成功，骨骼数量:', bindResult.bones.length)
      console.log('控制点绑定数量:', bindResult.pointsBonesMap.length)
    }
  }
}
```

注意事项：
1. 确保PenComponent的points数组不为空
2. 骨架的joints必须有正确的name属性（start, end, bend等）
3. 绑定数据会存储在glyph.skeletonBindData中
4. 变形计算使用线性混合蒙皮算法，适合字体变形场景
*/

