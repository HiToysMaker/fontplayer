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

  console.log('glyphSkeletonBind - skeleton:', skeleton);
  console.log('glyphSkeletonBind - components:', components);

  // 只处理Pen类型的组件
  const penComponents = components.filter(comp => comp.type === 'pen') as IComponent[];
  if (penComponents.length === 0) {
    console.warn('No pen components found');
    return;
  }

  const penComponent = penComponents[0]; // 假设只有一个Pen组件
  
  // 阶段一：骨架分析
  const bones = skeletonToBones(skeleton);
  console.log('glyphSkeletonBind - bones:', bones);
  
  // 阶段二：控制点绑定与权重分配
  const points = componentsToPoints(penComponent);
  console.log('glyphSkeletonBind - points:', points);
  
  const pointsBonesMap = points.map((point, index) => {
    const binding = calculatePointBones(point, bones, index);
    console.log(`glyphSkeletonBind - point ${index} binding:`, binding);
    return binding;
  });

  console.log('glyphSkeletonBind - pointsBonesMap:', pointsBonesMap);

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
    // 直线骨架（横、竖）- 离散化为多个骨骼段
    const start = skeleton.start;
    const end = skeleton.end;
    
    // 计算直线总长度
    const totalLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    
    // 根据长度确定分段数量，确保每段长度在合理范围内
    const segmentLength = Math.max(20, totalLength / 8); // 每段至少20像素，最多8段
    const segments = Math.max(3, Math.ceil(totalLength / segmentLength)); // 至少3段
    
    console.log(`直线骨架分段: 总长度=${totalLength}, 分段数=${segments}, 每段长度=${segmentLength}`);
    
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      const p1 = {
        x: start.x + (end.x - start.x) * t1,
        y: start.y + (end.y - start.y) * t1
      };
      const p2 = {
        x: start.x + (end.x - start.x) * t2,
        y: start.y + (end.y - start.y) * t2
      };
      
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
      
      // 设置骨骼层级关系
      if (i > 0) {
        bone.parent = `segment_${i - 1}`;
        bones[i - 1].children.push(bone.id);
      }
      
      bones.push(bone);
    }
    
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
  
  // 验证输入点
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || isNaN(point.x) || isNaN(point.y)) {
    console.warn('Invalid point in calculatePointBones:', point);
    return binding;
  }
  
  // 验证骨骼数组
  if (!bones || bones.length === 0) {
    console.warn('No bones available for binding');
    return binding;
  }
  
  // 计算点到每根骨骼的距离和权重
  const boneWeights: Array<{ boneIndex: number; weight: number; localCoords: { u: number; v: number } }> = [];
  
  bones.forEach((bone, boneIndex) => {
    // 验证骨骼
    if (!bone || typeof bone.length !== 'number' || isNaN(bone.length) || bone.length <= 0) {
      console.warn('Invalid bone in calculatePointBones:', bone);
      return;
    }
    
    const { distance, localCoords } = pointToBoneDistance(point, bone);
    
    // 验证距离计算结果
    if (typeof distance !== 'number' || isNaN(distance) || distance < 0) {
      console.warn('Invalid distance calculated:', distance, 'for point:', point, 'bone:', bone);
      return;
    }
    
    // 验证局部坐标
    if (!localCoords || typeof localCoords.u !== 'number' || typeof localCoords.v !== 'number' || 
        isNaN(localCoords.u) || isNaN(localCoords.v)) {
      console.warn('Invalid local coordinates:', localCoords, 'for point:', point, 'bone:', bone);
      return;
    }
    
    // 根据技术方案，使用骨骼长度的2.5倍作为影响阈值，确保更多点能绑定到多根骨骼
    const threshold = bone.length * 2.5;
    
    console.log(`Point ${pointIndex} to bone ${boneIndex}: distance=${distance}, threshold=${threshold}, bone.length=${bone.length}`);
    
    if (distance <= threshold) {
      // 基于距离的权重计算
      const weight = 1.0 / (distance + 0.001); // 防止除零
      
      // 验证权重
      if (typeof weight !== 'number' || isNaN(weight) || weight <= 0) {
        console.warn('Invalid weight calculated:', weight, 'for distance:', distance);
        return;
      }
      
      // 添加衰减函数（在骨骼中部权重最大）
      const u = localCoords.u;
      const falloff = calculateFalloff(u);
      
      // 验证衰减值
      if (typeof falloff !== 'number' || isNaN(falloff) || falloff < 0) {
        console.warn('Invalid falloff calculated:', falloff, 'for u:', u);
        return;
      }
      
      const finalWeight = weight * falloff;
      
      // 验证最终权重
      if (typeof finalWeight !== 'number' || isNaN(finalWeight) || finalWeight <= 0) {
        console.warn('Invalid final weight:', finalWeight, 'weight:', weight, 'falloff:', falloff);
        return;
      }
      
      console.log(`Point ${pointIndex} bound to bone ${boneIndex}: weight=${finalWeight}, falloff=${falloff}`);
      
      boneWeights.push({
        boneIndex,
        weight: finalWeight,
        localCoords
      });
    } else {
      console.log(`Point ${pointIndex} too far from bone ${boneIndex}: distance=${distance} > threshold=${threshold}`);
    }
  });
  
  // 如果没有有效的骨骼权重，尝试更宽松的绑定策略
  if (boneWeights.length === 0) {
    console.warn(`No valid bone weights found for point ${pointIndex}, trying fallback strategy`);
    
    // 找到最近的骨骼，即使超出阈值
    let minDistance = Infinity;
    let closestBoneIndex = -1;
    let closestLocalCoords = { u: 0, v: 0 };
    
    bones.forEach((bone, boneIndex) => {
      if (!bone || typeof bone.length !== 'number' || isNaN(bone.length) || bone.length <= 0) {
        return;
      }
      
      const { distance, localCoords } = pointToBoneDistance(point, bone);
      
      if (typeof distance === 'number' && !isNaN(distance) && distance >= 0 && 
          typeof localCoords.u === 'number' && !isNaN(localCoords.u) &&
          typeof localCoords.v === 'number' && !isNaN(localCoords.v)) {
        
        if (distance < minDistance) {
          minDistance = distance;
          closestBoneIndex = boneIndex;
          closestLocalCoords = localCoords;
        }
      }
    });
    
    if (closestBoneIndex >= 0) {
      console.log(`Using fallback binding for point ${pointIndex} to bone ${closestBoneIndex} with distance ${minDistance}`);
      
      // 使用简单的权重计算
      const weight = 1.0 / (minDistance + 0.001);
      const falloff = calculateFalloff(closestLocalCoords.u);
      const finalWeight = weight * falloff;
      
      boneWeights.push({
        boneIndex: closestBoneIndex,
        weight: finalWeight,
        localCoords: closestLocalCoords
      });
    }
  }
  
  // 如果仍然没有有效的骨骼权重，返回空绑定
  if (boneWeights.length === 0) {
    console.warn(`Still no valid bone weights found for point ${pointIndex} after fallback`);
    return binding;
  }
  
  // 选择最近的2-4根骨骼
  boneWeights.sort((a, b) => a.weight - b.weight);
  const selectedBones = boneWeights.slice(-Math.min(4, boneWeights.length));
  
  console.log(`Point ${pointIndex} - boneWeights before selection:`, boneWeights.map(b => ({ boneIndex: b.boneIndex, weight: b.weight })));
  console.log(`Point ${pointIndex} - selectedBones before normalization:`, selectedBones.map(b => ({ boneIndex: b.boneIndex, weight: b.weight })));
  
  // 归一化权重
  const totalWeight = selectedBones.reduce((sum, bone) => {
    if (typeof bone.weight !== 'number' || isNaN(bone.weight)) {
      console.warn('Invalid bone weight in normalization:', bone.weight);
      return sum;
    }
    return sum + bone.weight;
  }, 0);
  
  console.log(`Point ${pointIndex} - totalWeight:`, totalWeight);
  
  // 验证总权重
  if (totalWeight <= 0 || isNaN(totalWeight)) {
    console.warn('Invalid total weight:', totalWeight, 'selectedBones:', selectedBones);
    // 如果总权重无效，给每个骨骼分配相等的权重
    selectedBones.forEach(bone => {
      bone.weight = 1.0 / selectedBones.length;
    });
  } else {
    selectedBones.forEach(bone => {
      bone.weight /= totalWeight;
    });
  }
  
  console.log(`Point ${pointIndex} - selectedBones after normalization:`, selectedBones.map(b => ({ boneIndex: b.boneIndex, weight: b.weight })));
  
  binding.bones = selectedBones;
  console.log(`Final binding for point ${pointIndex}:`, binding);
  return binding;
}

// 计算衰减函数 - 放宽条件
function calculateFalloff(u: number): number {
  // 验证输入
  if (typeof u !== 'number' || isNaN(u)) {
    console.warn('Invalid u value in calculateFalloff:', u);
    return 0.5; // 返回中等衰减值而不是0
  }
  
  // 使用更宽松的衰减函数
  // 对于超出[0,1]范围的u值，使用线性衰减而不是直接返回0
  let normalizedU;
  if (u < 0) {
    normalizedU = 0;
  } else if (u > 1) {
    normalizedU = 1;
  } else {
    normalizedU = u;
  }
  
  // 使用更平滑的衰减函数，确保在边界处也有一定的权重
  const result = 1 - 2 * (normalizedU - 0.5) ** 2;
  
  // 验证结果
  if (typeof result !== 'number' || isNaN(result) || result < 0) {
    console.warn('Invalid falloff result:', result, 'for u:', u, 'normalizedU:', normalizedU);
    return 0.5; // 返回中等衰减值
  }
  
  return result;
}

// 计算点到骨骼的距离和局部坐标
function pointToBoneDistance(point: { x: number; y: number }, bone: Bone) {
  const { x, y } = point;
  const { start, end, uAxis, vAxis } = bone;
  
  // 验证输入
  if (!start || !end || !uAxis || !vAxis) {
    console.warn('Invalid bone data in pointToBoneDistance:', bone);
    return { distance: Infinity, localCoords: { u: 0, v: 0 } };
  }
  
  // 验证坐标
  if (isNaN(x) || isNaN(y) || isNaN(start.x) || isNaN(start.y) || 
      isNaN(end.x) || isNaN(end.y) || isNaN(uAxis.x) || isNaN(uAxis.y) || 
      isNaN(vAxis.x) || isNaN(vAxis.y)) {
    console.warn('NaN values in pointToBoneDistance:', { x, y, start, end, uAxis, vAxis });
    return { distance: Infinity, localCoords: { u: 0, v: 0 } };
  }
  
  // 计算点到骨骼起点的向量
  const toPoint = { x: x - start.x, y: y - start.y };
  
  // 计算在骨骼局部坐标系中的坐标
  const u = toPoint.x * uAxis.x + toPoint.y * uAxis.y;
  const v = toPoint.x * vAxis.x + toPoint.y * vAxis.y;
  
  // 验证计算结果
  if (isNaN(u) || isNaN(v)) {
    console.warn('NaN in local coordinates calculation:', { u, v, toPoint, uAxis, vAxis });
    return { distance: Infinity, localCoords: { u: 0, v: 0 } };
  }
  
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
  
  // 验证距离
  if (isNaN(distance) || distance < 0) {
    console.warn('Invalid distance calculated:', distance, 'for point:', point, 'bone:', bone);
    return { distance: Infinity, localCoords: { u: 0, v: 0 } };
  }
  
  return {
    distance,
    localCoords: { u, v }
  };
}

// 工具函数
function normalize(vector: { x: number; y: number }): { x: number; y: number } {
  const length = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  console.log('normalize - input vector:', vector, 'length:', length);
  
  if (length === 0 || isNaN(length)) {
    console.warn('Cannot normalize zero or NaN vector:', vector);
    return { x: 1, y: 0 }; // 返回默认方向
  }
  
  const result = { x: vector.x / length, y: vector.y / length };
  console.log('normalize - result:', result);
  return result;
}

function createIdentityMatrix(): number[] {
  return [1, 0, 0, 1, 0, 0]; // 2x3变换矩阵
}

function calculateBoneMatrix(bone: Bone): number[] {
  const { start, end, uAxis, vAxis } = bone;
  
  // 计算骨骼的变换矩阵
  // 矩阵形式：[uAxis.x, vAxis.x, uAxis.y, vAxis.y, start.x, start.y]
  // 这是一个从骨骼局部坐标系到世界坐标系的变换矩阵
  return [uAxis.x, vAxis.x, uAxis.y, vAxis.y, start.x, start.y];
}

// 计算从原始骨骼到新骨骼的变换矩阵
function calculateBoneTransformationMatrix(originalBone: Bone, newBone: Bone): number[] {
  // 计算从原始骨骼局部坐标系到新骨骼局部坐标系的变换
  // 首先将点从原始骨骼局部坐标系变换到世界坐标系
  // 然后从世界坐标系变换到新骨骼局部坐标系
  
  const originalMatrix = originalBone.bindMatrix;
  const newMatrix = calculateBoneMatrix(newBone);
  
  // 计算逆变换矩阵
  const invOriginalMatrix = invertMatrix(originalMatrix);
  
  // 组合变换：新矩阵 * 逆原始矩阵
  return multiplyMatrices(newMatrix, invOriginalMatrix);
}

// 矩阵求逆
function invertMatrix(matrix: number[]): number[] {
  const [a, b, c, d, tx, ty] = matrix;
  
  const det = a * d - b * c;
  if (Math.abs(det) < 0.001) {
    console.warn('Matrix determinant too small for inversion:', det);
    return [1, 0, 0, 1, 0, 0]; // 返回单位矩阵
  }
  
  const invDet = 1 / det;
  const invA = d * invDet;
  const invB = -b * invDet;
  const invC = -c * invDet;
  const invD = a * invDet;
  
  // 计算逆变换的平移部分
  const invTx = -(invA * tx + invB * ty);
  const invTy = -(invC * tx + invD * ty);
  
  return [invA, invB, invC, invD, invTx, invTy];
}

// 矩阵乘法
function multiplyMatrices(matrix1: number[], matrix2: number[]): number[] {
  const [a1, b1, c1, d1, tx1, ty1] = matrix1;
  const [a2, b2, c2, d2, tx2, ty2] = matrix2;
  
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2,
    a1 * tx2 + b1 * ty2 + tx1,
    c1 * tx2 + d1 * ty2 + ty1
  ];
}

// 阶段三：变形计算 - 根据骨架变化计算新的控制点位置
export function calculateTransformedPoints(glyph: CustomGlyph, newSkeleton: any): Array<{ x: number; y: number }> {
  const bindData = (glyph as any)._glyph.skeleton?.skeletonBindData;
  
  if (!bindData) {
    console.warn('No bind data found');
    return [];
  }
  
  const { bones, pointsBonesMap, originalPoints } = bindData;
  
  // 验证绑定数据
  if (!bones || !pointsBonesMap || !originalPoints) {
    console.warn('Invalid bind data:', bindData);
    return [];
  }
  
  if (bones.length === 0) {
    console.warn('No bones found');
    return originalPoints.map(p => ({ x: p.x, y: p.y })); // 返回原始点
  }
  
  console.log('calculateTransformedPoints - originalPoints:', originalPoints);
  console.log('calculateTransformedPoints - newSkeleton:', newSkeleton);
  
  // 更新骨骼的当前变换矩阵
  updateBoneMatrices(bones, newSkeleton);
  console.log('calculateTransformedPoints - updated bones:', bones);
  
  // 计算每个控制点的新位置
  const transformedPoints = pointsBonesMap.map((binding, index) => {
    if (!binding || !originalPoints[index]) {
      console.warn('Invalid binding or original point at index:', index);
      return { x: 0, y: 0 };
    }
    
    const transformedPoint = calculatePointTransformation(binding, bones, originalPoints[index]);
    console.log(`Point ${index} transformation: original (${originalPoints[index].x}, ${originalPoints[index].y}) -> transformed (${transformedPoint.x}, ${transformedPoint.y})`);
    return transformedPoint;
  });
  
  console.log('calculateTransformedPoints - final transformed points:', transformedPoints);
  return transformedPoints;
}

// 更新骨骼的变换矩阵
function updateBoneMatrices(bones: Bone[], newSkeleton: any) {
  if (!newSkeleton) {
    console.warn('Invalid skeleton:', newSkeleton);
    return;
  }
  
  const skeletonType = detectSkeletonType(newSkeleton);
  console.log('updateBoneMatrices - skeletonType:', skeletonType);
  console.log('updateBoneMatrices - newSkeleton:', newSkeleton);
  console.log('updateBoneMatrices - bones before update:', bones);
  
  if (skeletonType === 'horizontal' || skeletonType === 'vertical') {
    // 直线骨架
    const start = newSkeleton.start;
    const end = newSkeleton.end;
    
    if (!start || !end) {
      console.warn('Invalid start or end point:', start, end);
      return;
    }
    
    console.log('updateBoneMatrices - start:', start, 'end:', end);
    
    // 更新所有骨骼段
    const totalLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    const segmentLength = Math.max(20, totalLength / 8);
    const segments = Math.max(3, Math.ceil(totalLength / segmentLength));
    
    console.log(`updateBoneMatrices - 更新${segments}个骨骼段`);
    
    for (let i = 0; i < segments && i < bones.length; i++) {
      const originalBone = { ...bones[i] }; // 保存原始骨骼状态
      const bone = bones[i];
      
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      const p1 = {
        x: start.x + (end.x - start.x) * t1,
        y: start.y + (end.y - start.y) * t1
      };
      const p2 = {
        x: start.x + (end.x - start.x) * t2,
        y: start.y + (end.y - start.y) * t2
      };
      
      // 更新骨骼位置和方向
      bone.start = p1;
      bone.end = p2;
      bone.length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      
      // 验证长度
      if (isNaN(bone.length) || bone.length < 0.001) {
        console.warn('Invalid bone length:', bone.length);
        bone.length = 0.001; // 设置最小长度
      }
      
      bone.uAxis = normalize({ x: p2.x - p1.x, y: p2.y - p1.y });
      bone.vAxis = normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x });
      
      // 计算从原始骨骼到新骨骼的变换矩阵
      bone.currentMatrix = calculateBoneTransformationMatrix(originalBone, bone);
      
      console.log(`updateBoneMatrices - 骨骼段${i} 更新完成:`, bone.currentMatrix);
    }
    
  } else if (skeletonType === 'pie' || skeletonType === 'na') {
    // 曲线骨架
    const start = newSkeleton.start;
    const bend = newSkeleton.bend;
    const end = newSkeleton.end;
    
    if (!start || !bend || !end) {
      console.warn('Invalid skeleton points:', start, bend, end);
      return;
    }
    
    const segments = 8;
    for (let i = 0; i < segments && i < bones.length; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      const p1 = quadraticBezierPoint(start, bend, end, t1);
      const p2 = quadraticBezierPoint(start, bend, end, t2);
      
      const originalBone = { ...bones[i] }; // 保存原始骨骼状态
      const bone = bones[i];
      
      // 更新骨骼位置和方向
      bone.start = p1;
      bone.end = p2;
      bone.length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      
      // 验证长度
      if (isNaN(bone.length) || bone.length < 0.001) {
        console.warn('Invalid bone length:', bone.length);
        bone.length = 0.001; // 设置最小长度
      }
      
      bone.uAxis = normalize({ x: p2.x - p1.x, y: p2.y - p1.y });
      bone.vAxis = normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x });
      
      // 计算从原始骨骼到新骨骼的变换矩阵
      bone.currentMatrix = calculateBoneTransformationMatrix(originalBone, bone);
    }
  }
  
  console.log('updateBoneMatrices - bones after update:', bones);
}

// 计算单个控制点的变换
function calculatePointTransformation(binding: PointBinding, bones: Bone[], originalPoint: { x: number; y: number }): { x: number; y: number } {
  let newX = 0;
  let newY = 0;
  
  // 添加数据验证
  if (!originalPoint || typeof originalPoint.x !== 'number' || typeof originalPoint.y !== 'number') {
    console.warn('Invalid original point:', originalPoint);
    return { x: 0, y: 0 };
  }
  
  if (!binding.bones || binding.bones.length === 0) {
    console.warn('No bones bound to point:', binding);
    return originalPoint;
  }
  
  console.log(`Calculating transformation for point (${originalPoint.x}, ${originalPoint.y}) with ${binding.bones.length} bones`);
  
  binding.bones.forEach(({ boneIndex, weight, localCoords }, boneBindingIndex) => {
    const bone = bones[boneIndex];
    if (!bone) {
      console.warn('Bone not found at index:', boneIndex);
      return;
    }
    
    // 验证权重
    if (typeof weight !== 'number' || isNaN(weight) || weight <= 0) {
      console.warn('Invalid weight:', weight);
      return;
    }
    
    // 验证矩阵
    if (!bone.currentMatrix) {
      console.warn('Invalid bone currentMatrix:', bone);
      return;
    }
    
    console.log(`Bone ${boneIndex} (binding ${boneBindingIndex}): weight=${weight}, currentMatrix=${bone.currentMatrix}`);
    
    // 直接使用变换矩阵变换点
    const transformedPoint = transformPointToWorld(originalPoint, bone.currentMatrix);
    console.log(`Transformed point for bone ${boneIndex}: (${transformedPoint.x}, ${transformedPoint.y})`);
    
    // 验证变换结果
    if (isNaN(transformedPoint.x) || isNaN(transformedPoint.y)) {
      console.warn('Invalid transformed point:', transformedPoint, 'for bone:', bone);
      return;
    }
    
    // 加权累加
    const weightedX = weight * transformedPoint.x;
    const weightedY = weight * transformedPoint.y;
    newX += weightedX;
    newY += weightedY;
    
    console.log(`Bone ${boneIndex} contribution: weight=${weight}, weighted=(${weightedX}, ${weightedY}), running total=(${newX}, ${newY})`);
  });
  
  // 如果所有计算都失败，返回原始点
  if (isNaN(newX) || isNaN(newY)) {
    console.warn('Final transformation result is NaN, returning original point');
    return originalPoint;
  }
  
  console.log(`Final transformation result: (${newX}, ${newY})`);
  return { x: newX, y: newY };
}

// 点变换到局部坐标
function transformPointToLocal(point: { x: number; y: number }, matrix: number[]): { x: number; y: number } {
  if (!matrix || matrix.length !== 6) {
    console.warn('Invalid matrix:', matrix);
    return point;
  }
  
  const [a, b, c, d, tx, ty] = matrix;
  
  // 验证矩阵元素
  if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d) || isNaN(tx) || isNaN(ty)) {
    console.warn('Matrix contains NaN values:', matrix);
    return point;
  }
  
  const det = a * d - b * c;
  
  if (Math.abs(det) < 0.001) {
    console.warn('Matrix determinant too small:', det);
    return point;
  }
  
  const invDet = 1 / det;
  const invA = d * invDet;
  const invB = -b * invDet;
  const invC = -c * invDet;
  const invD = a * invDet;
  
  const x = point.x - tx;
  const y = point.y - ty;
  
  const result = {
    x: invA * x + invB * y,
    y: invC * x + invD * y
  };
  
  // 验证结果
  if (isNaN(result.x) || isNaN(result.y)) {
    console.warn('Transform result is NaN:', result, 'for point:', point, 'matrix:', matrix);
    return point;
  }
  
  return result;
}

// 点变换到世界坐标
function transformPointToWorld(point: { x: number; y: number }, matrix: number[]): { x: number; y: number } {
  if (!matrix || matrix.length !== 6) {
    console.warn('Invalid matrix:', matrix);
    return point;
  }
  
  const [a, b, c, d, tx, ty] = matrix;
  
  // 验证矩阵元素
  if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d) || isNaN(tx) || isNaN(ty)) {
    console.warn('Matrix contains NaN values:', matrix);
    return point;
  }
  
  const result = {
    x: a * point.x + b * point.y + tx,
    y: c * point.x + d * point.y + ty
  };
  
  // 验证结果
  if (isNaN(result.x) || isNaN(result.y)) {
    console.warn('Transform result is NaN:', result, 'for point:', point, 'matrix:', matrix);
    return point;
  }
  
  return result;
}

// 应用变形到组件
export function applySkeletonTransformation(glyph: CustomGlyph, newSkeleton: any) {
  console.log('applySkeletonTransformation', newSkeleton)
  
  const penComponents = glyph.components.filter(comp => comp.type === 'pen') as IComponent[];
  if (penComponents.length === 0) {
    console.warn('No pen components found in applySkeletonTransformation');
    return;
  }
  
  const penComponent = penComponents[0];
  console.log('Original pen component points before transformation:', 
    (penComponent.value as unknown as IPenComponent).points.map(p => ({ x: p.x, y: p.y })));
  
  const transformedPoints = calculateTransformedPoints(glyph, newSkeleton);
  console.log('Transformed points:', transformedPoints);
  
  if (transformedPoints.length === (penComponent.value as unknown as IPenComponent).points.length) {
    console.log('applySkeletonTransformation 2', transformedPoints);
    
    // 更新控制点位置
    (penComponent.value as unknown as IPenComponent).points.forEach((point, index) => {
      const newPoint = transformedPoints[index];
      console.log(`Updating point ${index}: from (${point.x}, ${point.y}) to (${newPoint.x}, ${newPoint.y})`);
      point.x = newPoint.x;
      point.y = newPoint.y;
    });
    
    console.log('Pen component points after transformation:', 
      (penComponent.value as unknown as IPenComponent).points.map(p => ({ x: p.x, y: p.y })));
  } else {
    console.warn('Transformed points length mismatch:', 
      transformedPoints.length, 
      (penComponent.value as unknown as IPenComponent).points.length);
  }
  
  console.log('applySkeletonTransformation 3', (penComponent.value as unknown as IPenComponent).points);
  
  // 修复渲染调用 - 移除有问题的渲染调用
  // 注释掉有问题的渲染调用，让系统自然触发重新渲染
  /*
  if (glyph.render) {
    console.log('Triggering glyph render');
    glyph.render();
  }
  
  // 如果glyph有更新方法，也调用它
  if (typeof glyph.update === 'function') {
    console.log('Triggering glyph update');
    glyph.update();
  }
  */
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

