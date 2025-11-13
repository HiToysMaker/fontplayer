import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 竖的骨架转骨骼函数
export const skeletonToBones_shu = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { start, end } = skeleton;
  
  // 直线段
  const totalLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const segments = maxSegment//Math.max(minSegment, Math.ceil(totalLength / 20));
  
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
    
    const bone: any = {
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
  
  return bones;
};

// 辅助函数
const normalize = (vector: { x: number; y: number }) => {
  const length = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  return length > 0 ? { x: vector.x / length, y: vector.y / length } : { x: 0, y: 0 };
};

const createIdentityMatrix = () => [1, 0, 0, 1, 0, 0];

const quadraticBezierPoint = (p0: any, p1: any, p2: any, t: number) => {
  const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
  const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;
  return { x, y };
};



const instanceBasicGlyph_shu = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    horizontalSpan: glyph.getParam('水平延伸'),
    verticalSpan: glyph.getParam('竖直延伸'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_shu = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_shu(plainGlyph)
  }
  glyphSkeletonBind(plainGlyph._o)
}

const updateGlyphByParams = (params, glyph) => {
  const { horizontalSpan, verticalSpan, skeletonRefPos, weight } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 500 + _ox || 0
  const y0 = 250 + _oy || 0

  let start, end
  const start_ref = new FP.Joint(
    'start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const end_ref = new FP.Joint(
    'end_ref',
    {
      x: start_ref.x + horizontalSpan,
      y: start_ref.y + verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x - weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x - weight / 2,
        y: end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x + weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x + weight / 2,
        y: end_ref.y,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x,
        y: end_ref.y,
      },
    )
  }
  
  glyph.addJoint(start_ref)
  glyph.addJoint(end_ref)
  glyph.addRefLine(refline(start_ref, end_ref, 'ref'))
  
  glyph.addJoint(start)
  glyph.addJoint(end)
  
  const skeleton = {
    start,
    end,
  }
  
  glyph.addRefLine(refline(start, end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { start, end } = jointsMap
  const horizontal_span_range = glyph.getParamRange('水平延伸')
  const vertical_span_range = glyph.getParamRange('竖直延伸')
  const horizontalSpan = range(end.x - start.x, horizontal_span_range)
  const verticalSpan = range(end.y - start.y, vertical_span_range)
  return {
    horizontalSpan,
    verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_shu = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'start': {
        // 拖拽第一个joint，整体移动骨架
        const deltaX = data.deltaX
        const deltaY = data.deltaY
        
        // 更新骨架的ox, oy
        if (glyph._glyph.skeleton) {
          glyph._glyph.skeleton.ox = (glyph.tempData.ox || 0) + deltaX
          glyph._glyph.skeleton.oy = (glyph.tempData.oy || 0) + deltaY
        }
        
        // 更新所有joint的位置
        Object.keys(jointsMap).forEach(key => {
          if (glyph.tempData[key] && glyph.tempData[key].x && glyph.tempData[key].y) {
            jointsMap[key] = {
              x: glyph.tempData[key].x + deltaX,
              y: glyph.tempData[key].y + deltaY,
            }
          }
        })
        break
      }
      case 'end': {
        jointsMap['end'] = {
          x: glyph.tempData['end'].x + deltaX,
          y: glyph.tempData['end'].y + deltaY,
        }
        break
      }
    }
    return jointsMap
  }

  glyph.onSkeletonDragStart = (data) => {
    // joint数据格式：{x, y, name}
    const { draggingJoint } = data
    glyph.tempData = {}
    glyph.tempData.ox = glyph._glyph.skeleton.ox
    glyph.tempData.oy = glyph._glyph.skeleton.oy
    glyph.getJoints().map((joint) => {
      const _joint = {
        name: joint.name,
        x: joint.x,
        y: joint.y,
      }
      glyph.tempData[_joint.name] = _joint
    })
  }
  
  glyph.onSkeletonDrag = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    //updateSkeletonTransformation(glyph)
  }
  
  glyph.onSkeletonDragEnd = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    //updateSkeletonTransformation(glyph)
    glyph.setParam('水平延伸', _params.horizontalSpan)
    glyph.setParam('竖直延伸', _params.verticalSpan)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_shu = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'end': {
        jointsMap['end'] = {
          x: glyph.tempData['end'].x + deltaX,
          y: glyph.tempData['end'].y + deltaY,
        }
        break
      }
    }
    return jointsMap
  }

  glyph.onSkeletonDragStart = (data) => {
    // joint数据格式：{x, y, name}
    const { draggingJoint } = data
    glyph.tempData = {}
    glyph.getJoints().map((joint) => {
      const _joint = {
        name: joint.name,
        x: joint.x,
        y: joint.y,
      }
      glyph.tempData[_joint.name] = _joint
    })
  }
  
  glyph.onSkeletonDrag = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    updateSkeletonTransformation(glyph)
  }
  
  glyph.onSkeletonDragEnd = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    updateSkeletonTransformation(glyph)
    glyph.setParam('水平延伸', _params.horizontalSpan)
    glyph.setParam('竖直延伸', _params.verticalSpan)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_shu,
  bindSkeletonGlyph_shu,
  updateSkeletonListener_after_bind_shu,
  updateSkeletonListener_before_bind_shu,
}
