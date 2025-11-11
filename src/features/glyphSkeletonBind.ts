import { getBound } from "@/utils/math";
import { emitter } from "../fontEditor/Event/bus";
import { CustomGlyph } from "../fontEditor/programming/CustomGlyph";
import { IPenComponent, IComponent } from "../fontEditor/stores/files";

// 导入所有笔画的skeletonToBones函数
import { skeletonToBones_heng } from "../fontEditor/templates/横"
import { skeletonToBones_shu } from "../fontEditor/templates/竖"
import { skeletonToBones_pie } from "../fontEditor/templates/撇"
import { skeletonToBones_na } from "../fontEditor/templates/捺"
import { skeletonToBones_dian } from "../fontEditor/templates/点"
import { skeletonToBones_tiao } from "../fontEditor/templates/挑"
import { skeletonToBones_heng_gou } from "../fontEditor/templates/横钩"
import { skeletonToBones_ping_na } from "../fontEditor/templates/平捺"
import { skeletonToBones_tiao_na } from "../fontEditor/templates/挑捺"
import { skeletonToBones_pie_dian } from "../fontEditor/templates/撇点"
import { skeletonToBones_pie_tiao } from "../fontEditor/templates/撇挑"
import { skeletonToBones_heng_pie_wan_gou } from "../fontEditor/templates/横撇弯钩"
import { skeletonToBones_xie_gou } from "../fontEditor/templates/斜钩"
import { skeletonToBones_shu_zhe } from "../fontEditor/templates/竖折"
import { skeletonToBones_shu_wan_gou } from "../fontEditor/templates/竖弯钩"
import { skeletonToBones_shu_wan } from "../fontEditor/templates/竖弯"
import { skeletonToBones_shu_tiao } from "../fontEditor/templates/竖挑"
import { skeletonToBones_shu_pie } from "../fontEditor/templates/竖撇"
import { skeletonToBones_heng_zhe_tiao } from "../fontEditor/templates/横折挑"
import { skeletonToBones_heng_zhe2 } from "../fontEditor/templates/横折2"
import { skeletonToBones_heng_zhe_wan } from "../fontEditor/templates/横折弯"
import { skeletonToBones_er_heng_zhe } from "../fontEditor/templates/二横折"
import { skeletonToBones_heng_zhe } from "../fontEditor/templates/横折"
import { skeletonToBones_heng_zhe_zhe_wan_gou } from "../fontEditor/templates/横折折弯钩"
import { skeletonToBones_heng_zhe_wan_gou } from "../fontEditor/templates/横折弯钩"
import { skeletonToBones_heng_wan_gou } from "../fontEditor/templates/横弯钩"
import { skeletonToBones_heng_zhe_gou } from "../fontEditor/templates/横折钩"
import { skeletonToBones_heng_pie } from "../fontEditor/templates/横撇"
import { skeletonToBones_heng_zhe_zhe_pie } from "../fontEditor/templates/横折折撇"
import { skeletonToBones_shu_zhe_zhe_gou } from "../fontEditor/templates/竖折折钩"
import { skeletonToBones_shu_gou } from "../fontEditor/templates/竖钩"
import { skeletonToBones_wan_gou } from "../fontEditor/templates/弯钩"
import { maxSegment, minSegment, skeletonThreshold } from "../fontEditor/stores/global"
import * as R from "ramda";

// 骨骼定义
interface Bone {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  bindLength: number;
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
type SkeletonType = 'line' | 'curve' | 'heng' | 'shu' | 'pie' | 'na' |
  'heng_gou' | 'shu_pie' | 'heng_pie' | 'heng_na' | 'shu_gou' |
  'heng_zhe' | 'shu_zhe' | 'heng_wan_gou' | 'shu_wan' | 'tiao_na' |
  'pie_tiao' | 'pie_dian' | 'heng_pie_wan_gou' | 'heng_zhe_wan_gou' |
  'heng_zhe_zhe_wan_gou' | 'heng_zhe_zhe_pie' | 'shu_zhe_zhe_gou' |
  'heng_zhe_tiao' | 'heng_zhe_wan' | 'heng_zhe_gou' | 'heng_zhe_pie' |
  'er_heng_zhe' | 'heng_zhe2' | 'shu_tiao' | 'shu_wan_gou' | 'xie_gou' |
  'wan_gou' | 'dian' | 'tiao' | 'ping_na';

const glyphSkeletonBind = (glyph: CustomGlyph) => {
  const skeleton = glyph.getSkeleton();
  const components = glyph.components;

  // 只处理Pen类型的组件
  const penComponents = components.filter(comp => comp.type === 'pen') as IComponent[];
  if (penComponents.length === 0) {
    console.warn('No pen components found');
    return;
  }

  const penComponent = penComponents[0]; // 假设只有一个Pen组件
  
  // 阶段一：骨架分析
  const bones = skeletonToBones(skeleton);
  
  // 阶段二：控制点绑定与权重分配
  const points = componentsToPoints(penComponent);
  
  const pointsBonesMap = points.map((point, index) => {
    const binding = calculatePointBones(point, bones, index);
    return binding;
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
    
    // return dx > dy ? 'horizontal' : 'vertical';
    return 'line'
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
    //return startToEndX < 0 ? 'pie' : 'na';
    return 'curve'
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('zhe1_start') && jointNames.includes('zhe1_end') && jointNames.includes('zhe2_start') && jointNames.includes('zhe2_end') && jointNames.includes('wan_start') && jointNames.includes('wan_end') && jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：横折折弯钩类
    return 'heng_zhe_zhe_wan_gou';
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('zhe1_start') && jointNames.includes('zhe1_end') && jointNames.includes('zhe2_start') && jointNames.includes('zhe2_end') && jointNames.includes('pie_start') && jointNames.includes('pie_end')) {
    // 复合笔画：横折折撇类
    return 'heng_zhe_zhe_pie';
  } else if (jointNames.includes('heng1_start') && jointNames.includes('heng1_end') && jointNames.includes('heng2_start') && jointNames.includes('heng2_end') && jointNames.includes('zhe1_start') && jointNames.includes('zhe1_end') && jointNames.includes('zhe2_start') && jointNames.includes('zhe2_end')) {
    // 复合笔画：二横折类
    return 'er_heng_zhe';
  } else if (
    jointNames.includes('heng_start') && jointNames.includes('heng_end') &&
    jointNames.includes('zhe_start') && jointNames.includes('zhe_end') &&
    jointNames.includes('wan_start') && jointNames.includes('wan_end') &&
    jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：横折弯钩类
    return 'heng_zhe_wan_gou';
  } else if (
    jointNames.includes('heng_start') && jointNames.includes('heng_end') &&
    jointNames.includes('zhe_start') && jointNames.includes('zhe_end') &&
    jointNames.includes('wan_start') && jointNames.includes('wan_end')) {
    // 复合笔画：横折弯类
    return 'heng_zhe_wan';
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('zhe_start') && jointNames.includes('zhe_end') && jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：横折钩类
    return 'heng_zhe_gou';
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('zhe_start') && jointNames.includes('zhe_end') && jointNames.includes('tiao_start') && jointNames.includes('tiao_end')) {
    // 复合笔画：横折挑类
    return 'heng_zhe_tiao';
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('zhe_start') && jointNames.includes('zhe_end') && jointNames.includes('pie_start') && jointNames.includes('pie_end')) {
    // 复合笔画：横折撇类
    return 'heng_zhe_pie';
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('pie_start') && jointNames.includes('pie_end') && jointNames.includes('wangou_start') && jointNames.includes('wangou_end')) {
    // 复合笔画：横撇弯钩类
    return 'heng_pie_wan_gou';
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('wan_start') && jointNames.includes('wan_end') && jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：横弯钩类
    return 'heng_wan_gou';
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('pie_start') &&jointNames.includes('pie_bend') && jointNames.includes('pie_end')) {
    // 复合笔画：横撇类
    return 'heng_pie';
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：横钩类
    return 'heng_gou';
  } else if (jointNames.includes('heng_start') && jointNames.includes('heng_end') && jointNames.includes('zhe_start') && jointNames.includes('zhe_end')) {
    // 复合笔画：横折类
    return 'heng_zhe';
  } else if (jointNames.includes('shu_start') && jointNames.includes('shu_end') && jointNames.includes('zhe1_start') && jointNames.includes('zhe1_end') && jointNames.includes('zhe2_start') && jointNames.includes('zhe2_end') && jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：竖折折钩类
    return 'shu_zhe_zhe_gou';
  } else if (jointNames.includes('shu_start') && jointNames.includes('shu_end') && jointNames.includes('wan_start') && jointNames.includes('wan_end') && jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：竖弯钩类
    return 'shu_wan_gou';
  } else if (jointNames.includes('shu_start') && jointNames.includes('shu_end') && jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：竖钩类
    return 'shu_gou';
  } else if (jointNames.includes('shu_start') && jointNames.includes('shu_end') && jointNames.includes('zhe_start') && jointNames.includes('zhe_end')) {
    // 复合笔画：竖折类
    return 'shu_zhe';
  } else if (jointNames.includes('shu_start') && jointNames.includes('shu_end') && jointNames.includes('wan_start') && jointNames.includes('wan_end')) {
    // 复合笔画：竖弯类
    return 'shu_wan';
  } else if (jointNames.includes('shu_start') && jointNames.includes('shu_end') && jointNames.includes('pie_start') && jointNames.includes('pie_end')) {
    // 复合笔画：竖撇类
    return 'shu_pie';
  } else if (jointNames.includes('shu_start') && jointNames.includes('shu_end') && jointNames.includes('tiao_start') && jointNames.includes('tiao_end')) {
    // 复合笔画：竖挑类
    return 'shu_tiao';
  } else if (jointNames.includes('pie_start') && jointNames.includes('pie_end') && jointNames.includes('tiao_start') && jointNames.includes('tiao_end')) {
    // 复合笔画：撇挑类
    return 'pie_tiao';
  } else if (jointNames.includes('pie_start') && jointNames.includes('pie_end') && jointNames.includes('dian_start') && jointNames.includes('dian_end')) {
    // 复合笔画：撇点类
    return 'pie_dian';
  } else if (jointNames.includes('tiao_start') && jointNames.includes('tiao_end') && jointNames.includes('na_start') && jointNames.includes('na_end')) {
    // 复合笔画：挑捺类
    return 'tiao_na';
  } else if (jointNames.includes('wan_start') && jointNames.includes('wan_end') && jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：弯钩类
    return 'wan_gou';
  } else if (jointNames.includes('xie_start') && jointNames.includes('xie_end') && jointNames.includes('gou_start') && jointNames.includes('gou_end')) {
    // 复合笔画：斜钩类
    return 'xie_gou';
  } else if (jointNames.includes('start') && jointNames.includes('end') && jointNames.includes('bend')) {
    // 点类
    return 'dian';
  } else if (jointNames.includes('start') && jointNames.includes('end')) {
    // 基础笔画：横、竖、撇、捺、挑、平捺
    if (jointNames.includes('heng_start') && jointNames.includes('heng_end')) {
      return 'heng';
    } else if (jointNames.includes('shu_start') && jointNames.includes('shu_end')) {
      return 'shu';
    } else if (jointNames.includes('pie_start') && jointNames.includes('pie_end')) {
      return 'pie';
    } else if (jointNames.includes('na_start') && jointNames.includes('na_end')) {
      return 'na';
    } else if (jointNames.includes('tiao_start') && jointNames.includes('tiao_end')) {
      return 'tiao';
    } else if (jointNames.includes('ping_na_start') && jointNames.includes('ping_na_end')) {
      return 'ping_na';
    }
  }
  
  return 'line'; // 默认
}

// 阶段一：骨架分析 - 将骨架转换为骨骼集合
function skeletonToBones(skeleton: any): Bone[] {
  const bones: Bone[] = [];
  const jointNames = Object.keys(skeleton);
  
  // 检测骨架类型并调用对应的处理函数
  const skeletonType = detectSkeletonType(skeleton);
  
  if (skeletonType === 'line') {
    // 直线骨架（横、竖）- 离散化为多个骨骼段
    const start = skeleton.start;
    const end = skeleton.end;
    
    // 计算直线总长度
    const totalLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    
    // 根据长度确定分段数量，确保每段长度在合理范围内
    const segmentLength = Math.max(20, totalLength / maxSegment); // 每段至少20像素，最多8段
    const segments = Math.max(minSegment, Math.ceil(totalLength / segmentLength)); // 至少3段
    
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
      const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      
      const bone: Bone = {
        id: `segment_${i}`,
        start: p1,
        end: p2,
        length,
        bindLength: length,
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
    
  } else if (skeletonType === 'curve') {
    // 曲线骨架（撇、捺）- 使用二次贝塞尔曲线
    const start = skeleton.start;
    const bend = skeleton.bend;
    const end = skeleton.end;
    
    // 将贝塞尔曲线离散化为多个骨骼段
    const segments = maxSegment; // 分段数量
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      const p1 = quadraticBezierPoint(start, bend, end, t1);
      const p2 = quadraticBezierPoint(start, bend, end, t2);
      const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      
      const bone: Bone = {
        id: `segment_${i}`,
        start: p1,
        end: p2,
        length,
        bindLength: length,
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
  } else {
    // 复合笔画 - 调用对应的处理函数
    try {
      const strokeBones = callStrokeSkeletonToBones(skeletonType, skeleton);
      bones.push(...strokeBones);
    } catch (error) {
      console.warn(`Failed to process skeleton type ${skeletonType}:`, error);
      // 回退到默认处理
      return skeletonToBones(skeleton);
    }
  }
  
  // 计算绑定时的变换矩阵
  bones.forEach(bone => {
    if (typeof bone.bindLength !== 'number') {
      bone.bindLength = bone.length;
    }
    bone.bindMatrix = calculateBoneMatrix(bone);
    bone.currentMatrix = [...bone.bindMatrix];
  });
  
  return bones;
}

// 调用对应笔画的骨架转骨骼函数
function callStrokeSkeletonToBones(skeletonType: SkeletonType, skeleton: any): Bone[] {
  try {
    switch (skeletonType) {
      case 'heng_gou':
        return skeletonToBones_heng_gou(skeleton);
      
      case 'shu_pie':
        return skeletonToBones_shu_pie(skeleton);
      
      case 'heng_pie':
        return skeletonToBones_heng_pie(skeleton);
      
      case 'heng_na':
        // 横捺暂时使用捺的处理函数
        return skeletonToBones_na(skeleton);
      
      case 'shu_gou':
        return skeletonToBones_shu_gou(skeleton);
      
      case 'heng_zhe':
        return skeletonToBones_heng_zhe(skeleton);
      
      case 'shu_zhe':
        return skeletonToBones_shu_zhe(skeleton);
      
      case 'heng_wan_gou':
        return skeletonToBones_heng_wan_gou(skeleton);
      
      case 'shu_wan':
        return skeletonToBones_shu_wan(skeleton);
      
      case 'tiao_na':
        return skeletonToBones_tiao_na(skeleton);
      
      case 'pie_tiao':
        return skeletonToBones_pie_tiao(skeleton);
      
      case 'pie_dian':
        return skeletonToBones_pie_dian(skeleton);
      
      case 'heng_pie_wan_gou':
        return skeletonToBones_heng_pie_wan_gou(skeleton);
      
      case 'heng_zhe_wan_gou':
        return skeletonToBones_heng_zhe_wan_gou(skeleton);
      
      case 'heng_zhe_zhe_wan_gou':
        return skeletonToBones_heng_zhe_zhe_wan_gou(skeleton);
      
      case 'heng_zhe_zhe_pie':
        return skeletonToBones_heng_zhe_zhe_pie(skeleton);
      
      case 'shu_zhe_zhe_gou':
        return skeletonToBones_shu_zhe_zhe_gou(skeleton);
      
      case 'heng_zhe_tiao':
        return skeletonToBones_heng_zhe_tiao(skeleton);
      
      case 'heng_zhe_wan':
        return skeletonToBones_heng_zhe_wan(skeleton);
      
      case 'heng_zhe_gou':
        return skeletonToBones_heng_zhe_gou(skeleton);
      
      case 'heng_zhe_pie':
        return skeletonToBones_heng_pie(skeleton);
      
      case 'er_heng_zhe':
        return skeletonToBones_er_heng_zhe(skeleton);
      
      case 'heng_zhe2':
        return skeletonToBones_heng_zhe2(skeleton);
      
      case 'shu_tiao':
        return skeletonToBones_shu_tiao(skeleton);
      
      case 'shu_wan_gou':
        return skeletonToBones_shu_wan_gou(skeleton);
      
      case 'xie_gou':
        return skeletonToBones_xie_gou(skeleton);
      
      case 'wan_gou':
        return skeletonToBones_wan_gou(skeleton);
      
      case 'dian':
        return skeletonToBones_dian(skeleton);
      
      case 'tiao':
        return skeletonToBones_tiao(skeleton);
      
      case 'ping_na':
        return skeletonToBones_ping_na(skeleton);
      
      default:
        console.warn(`No specific skeletonToBones function for type: ${skeletonType}`);
        return [];
    }
  } catch (error) {
    console.warn(`Failed to call skeletonToBones for type ${skeletonType}:`, error);
    return [];
  }
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
    const threshold = bone.length * skeletonThreshold//2.5;
    
    if (distance <= threshold) {
      // 基于距离的权重计算
      const weight = 1.0 / (distance + 0.001); // 防止除零
      
      // 验证权重
      if (typeof weight !== 'number' || isNaN(weight) || weight < 0) {
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
      if (typeof finalWeight !== 'number' || isNaN(finalWeight) || finalWeight < 0) {
        console.warn('Invalid final weight:', finalWeight, 'weight:', weight, 'falloff:', falloff);
        return;
      }
      
      boneWeights.push({
        boneIndex,
        weight: finalWeight,
        localCoords
      });
    } else {
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
  
  // 归一化权重
  const totalWeight = selectedBones.reduce((sum, bone) => {
    if (typeof bone.weight !== 'number' || isNaN(bone.weight)) {
      console.warn('Invalid bone weight in normalization:', bone.weight);
      return sum;
    }
    return sum + bone.weight;
  }, 0);
  
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
  
  binding.bones = selectedBones;
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
  
  if (length === 0 || isNaN(length)) {
    console.warn('Cannot normalize zero or NaN vector:', vector);
    return { x: 1, y: 0 }; // 返回默认方向
  }
  
  const result = { x: vector.x / length, y: vector.y / length };
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
  const bindLength = typeof originalBone.bindLength === 'number'
    ? originalBone.bindLength
    : originalBone.length;
  const targetLength = typeof newBone.length === 'number'
    ? newBone.length
    : bindLength;
  const scale =
    bindLength && Math.abs(bindLength) > 0.001
      ? targetLength / bindLength
      : 1;
  const scaleMatrix = [scale, 0, 0, 1, 0, 0];
  
  // 计算逆变换矩阵
  const invOriginalMatrix = invertMatrix(originalMatrix);
  
  // 组合变换：新矩阵（含尺度） * 逆原始矩阵
  const result = multiplyMatrices(
    multiplyMatrices(newMatrix, scaleMatrix),
    invOriginalMatrix
  );
  
  return result;
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
export function calculateTransformedPoints(glyph: CustomGlyph, newSkeleton: any, weightedOriginalPoints?: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  const bindData = (glyph as any)._glyph.skeleton?.skeletonBindData;
  
  if (!bindData) {
    console.warn('No bind data found');
    return [];
  }
  
  const { bones, pointsBonesMap, originalPoints: _originalPoints } = bindData;
  let originalPoints = weightedOriginalPoints || _originalPoints
  
  // 验证绑定数据
  if (!bones || !pointsBonesMap || !originalPoints) {
    console.warn('Invalid bind data:', bindData);
    return [];
  }
  
  if (bones.length === 0) {
    console.warn('No bones found');
    return originalPoints.map(p => ({ x: p.x, y: p.y })); // 返回原始点
  }
  
  // 更新骨骼的当前变换矩阵
  updateBoneMatrices(bones, newSkeleton);
  
  // 计算每个控制点的新位置
  const transformedPoints = pointsBonesMap.map((binding, index) => {
    if (!binding || !originalPoints[index]) {
      console.warn('Invalid binding or original point at index:', index);
      return { x: 0, y: 0 };
    }
    
    const transformedPoint = calculatePointTransformation(binding, bones, originalPoints[index]);
    return transformedPoint;
  });
  
  return transformedPoints;
}

// 更新骨骼的变换矩阵
function updateBoneMatrices(bones: Bone[], newSkeleton: any) {
  if (!newSkeleton) {
    console.warn('Invalid skeleton:', newSkeleton);
    return;
  }

  bones.forEach(bone => {
    if (typeof bone.bindLength !== 'number') {
      bone.bindLength = bone.length;
    }
  });
  
  const skeletonType = detectSkeletonType(newSkeleton);
  
  if (skeletonType === 'line') {
    // 直线骨架
    updateLinearBoneMatrices(bones, newSkeleton);
  } else if (skeletonType === 'curve') {
    // 曲线骨架
    updateCurveBoneMatrices(bones, newSkeleton);
  } else {
    // 复合笔画 - 调用对应的处理函数
    updateCompositeBoneMatrices(bones, newSkeleton, skeletonType);
  }
}

// 更新直线骨骼的变换矩阵
function updateLinearBoneMatrices(bones: Bone[], newSkeleton: any) {
  const start = newSkeleton.start;
  const end = newSkeleton.end;
  
  if (!start || !end) {
    console.warn('Invalid start or end point:', start, end);
    return;
  }
  
  // 更新所有骨骼段
  const totalLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const segments = bones.length;
  
  if (segments === 0) {
    console.warn('No bones to update in updateLinearBoneMatrices');
    return;
  }
  
  for (let i = 0; i < segments; i++) {
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
  }
}

// 更新曲线骨骼的变换矩阵
function updateCurveBoneMatrices(bones: Bone[], newSkeleton: any) {
  const start = newSkeleton.start;
  const bend = newSkeleton.bend;
  const end = newSkeleton.end;
  
  if (!start || !bend || !end) {
    console.warn('Invalid skeleton points:', start, bend, end);
    return;
  }
  
  const segments = bones.length;
  
  if (segments === 0) {
    console.warn('No bones to update in updateCurveBoneMatrices');
    return;
  }
  
  for (let i = 0; i < segments; i++) {
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

// 更新复合笔画骨骼的变换矩阵
function updateCompositeBoneMatrices(bones: Bone[], newSkeleton: any, skeletonType: SkeletonType) {
  try {
    // 调用对应笔画的skeletonToBones函数获取新的骨骼结构
    const newBones = callStrokeSkeletonToBones(skeletonType, newSkeleton);
    
    if (newBones.length === 0) {
      console.warn(`No bones generated for skeleton type: ${skeletonType}`);
      return;
    }
    
    // 确保骨骼数量匹配
    if (newBones.length !== bones.length) {
      console.warn(`Bone count mismatch: expected ${bones.length}, got ${newBones.length}`);
      // 调整骨骼数量
      while (bones.length < newBones.length) {
        bones.push(createDefaultBone(`extra_${bones.length}`));
      }
      while (bones.length > newBones.length) {
        bones.pop();
      }
    }
    
    // 更新每个骨骼
    for (let i = 0; i < bones.length && i < newBones.length; i++) {
      const originalBone = { ...bones[i] }; // 保存原始骨骼状态
      const newBone = newBones[i];
      const bone = bones[i];
      
      // 更新骨骼属性
      bone.start = newBone.start;
      bone.end = newBone.end;
      bone.length = newBone.length;
      bone.uAxis = newBone.uAxis;
      bone.vAxis = newBone.vAxis;
      bone.children = newBone.children;
      bone.parent = newBone.parent;
      
      // 验证长度
      if (isNaN(bone.length) || bone.length < 0.001) {
        console.warn('Invalid bone length:', bone.length);
        bone.length = 0.001; // 设置最小长度
      }
      
      // 计算从原始骨骼到新骨骼的变换矩阵
      bone.currentMatrix = calculateBoneTransformationMatrix(originalBone, bone);
    }
    
  } catch (error) {
    console.warn(`Failed to update composite bone matrices for type ${skeletonType}:`, error);
    // 回退到默认处理
    updateLinearBoneMatrices(bones, newSkeleton);
  }
}

// 创建默认骨骼
function createDefaultBone(id: string): Bone {
  return {
    id,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
    length: 1,
    bindLength: 1,
    uAxis: { x: 1, y: 0 },
    vAxis: { x: 0, y: 1 },
    children: [],
    bindMatrix: createIdentityMatrix(),
    currentMatrix: createIdentityMatrix()
  };
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
  
  binding.bones.forEach(({ boneIndex, weight, localCoords }, boneBindingIndex) => {
    const bone = bones[boneIndex];
    if (!bone) {
      console.warn('Bone not found at index:', boneIndex);
      return;
    }
    
    // 验证权重
    if (typeof weight !== 'number' || isNaN(weight) || weight < 0) {
      console.warn('Invalid weight:', weight);
      return;
    }
    
    // 验证矩阵
    if (!bone.currentMatrix) {
      console.warn('Invalid bone currentMatrix:', bone);
      return;
    }

    // 直接使用变换矩阵变换点
    const transformedPoint = transformPointToWorld(originalPoint, bone.currentMatrix);
    
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
  });
  
  // 如果所有计算都失败，返回原始点
  if (isNaN(newX) || isNaN(newY)) {
    console.warn('Final transformation result is NaN, returning original point');
    return originalPoint;
  }
  
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
  const penComponents = glyph.components.filter(comp => comp.type === 'pen') as IComponent[];
  if (penComponents.length === 0) {
    console.warn('No pen components found in applySkeletonTransformation');
    return;
  }
  
  const penComponent = penComponents[0];

  const { originalPoints } = glyph._glyph.skeleton.skeletonBindData
  const weightedOriginalPoints = R.clone(originalPoints)

  // 更新字重
  if (glyph._glyph?.skeleton?.dynamicWeight) {
    const weight = glyph.getParam('字重') as number
    const originWeight = glyph._glyph.skeleton.originWeight
    if (weight && weight !== originWeight) {
      const d = (weight - originWeight) / 2
      const points = originalPoints
      for (let i = 0; i < points.length - 1; i+=3) {
        const bezier = [points[i], points[i+1], points[i+2], points[i+3]]
        const angle1 = Math.atan2(bezier[1].y - bezier[0].y, bezier[1].x - bezier[0].x)
        const angle2 = Math.atan2(bezier[3].y - bezier[2].y, bezier[3].x - bezier[2].x)
        const p1 = { x: bezier[0].x - Math.sin(angle1) * d, y: bezier[0].y + Math.cos(angle1) * d }
        const p2 = { x: bezier[1].x - Math.sin(angle1) * d, y: bezier[1].y + Math.cos(angle1) * d }
        const p3 = { x: bezier[2].x - Math.sin(angle2) * d, y: bezier[2].y + Math.cos(angle2) * d }
        const p4 = { x: bezier[3].x - Math.sin(angle2) * d, y: bezier[3].y + Math.cos(angle2) * d }
        weightedOriginalPoints[i].x = p1.x
        weightedOriginalPoints[i].y = p1.y
        weightedOriginalPoints[i+1].x = p2.x
        weightedOriginalPoints[i+1].y = p2.y
        weightedOriginalPoints[i+2].x = p3.x
        weightedOriginalPoints[i+2].y = p3.y
        weightedOriginalPoints[i+3].x = p4.x
        weightedOriginalPoints[i+3].y = p4.y
      };
    }
  }
  
  let transformedPoints = calculateTransformedPoints(glyph, newSkeleton, weightedOriginalPoints);
  
  if (transformedPoints.length === (penComponent.value as unknown as IPenComponent).points.length) {
    // 更新控制点位置
    (penComponent.value as unknown as IPenComponent).points.forEach((point, index) => {
      const newPoint = transformedPoints[index];
      point.x = newPoint.x;
      point.y = newPoint.y;
    });

    const bound = getBound((penComponent.value as unknown as IPenComponent).points);
    (penComponent as IComponent).x = bound.x;
    (penComponent as IComponent).y = bound.y;
    (penComponent as IComponent).w = bound.w;
    (penComponent as IComponent).h = bound.h;
  } else {
    console.warn('Transformed points length mismatch:', 
      transformedPoints.length, 
      (penComponent.value as unknown as IPenComponent).points.length);
  }
  
  // 强制触发重新渲染
  // emitter.emit('renderCharacter')
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

export {
  pointToBoneDistance,
  calculatePointTransformation,
  transformPointToLocal,
  transformPointToWorld,
  updateBoneMatrices,
  updateLinearBoneMatrices,
  updateCurveBoneMatrices,
  updateCompositeBoneMatrices,
}