import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 弯钩的骨架转骨骼函数
export const skeletonToBones_wan_gou = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { wan_start, wan_bend, wan_end, gou_start, gou_end } = skeleton;
  
  // 弯的部分 - 贝塞尔曲线段
  const wanSegments = maxSegment;
  for (let i = 0; i < wanSegments; i++) {
    const t1 = i / wanSegments;
    const t2 = (i + 1) / wanSegments;
    
    const p1 = quadraticBezierPoint(wan_start, wan_bend, wan_end, t1);
    const p2 = quadraticBezierPoint(wan_start, wan_bend, wan_end, t2);
    
    const bone: any = {
      id: `wan_segment_${i}`,
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
      bone.parent = `wan_segment_${i - 1}`;
      bones[i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 钩的部分 - 直线段
  const gouLength = Math.sqrt((gou_end.x - gou_start.x) ** 2 + (gou_end.y - gou_start.y) ** 2);
  const gouSegments = maxSegment//Math.max(minSegment, Math.ceil(gouLength / 20));
  
  for (let i = 0; i < gouSegments; i++) {
    const t1 = i / gouSegments;
    const t2 = (i + 1) / gouSegments;
    
    const p1 = {
      x: gou_start.x + (gou_end.x - gou_start.x) * t1,
      y: gou_start.y + (gou_end.y - gou_start.y) * t1
    };
    const p2 = {
      x: gou_start.x + (gou_end.x - gou_start.x) * t2,
      y: gou_start.y + (gou_end.y - gou_start.y) * t2
    };
    
    const bone: any = {
      id: `gou_segment_${i}`,
      start: p1,
      end: p2,
      length: Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2),
      uAxis: normalize({ x: p2.x - p1.x, y: p2.y - p1.y }),
      vAxis: normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x }),
      children: [],
      bindMatrix: createIdentityMatrix(),
      currentMatrix: createIdentityMatrix()
    };
    
    if (i === 0) {
      // 第一个钩段连接到最后一个弯段
      bone.parent = `wan_segment_${wanSegments - 1}`;
      bones[wanSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `gou_segment_${i - 1}`;
      bones[wanSegments + i - 1].children.push(bone.id);
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

const instanceBasicGlyph_wan_gou = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    wan_length: glyph.getParam('弯-长度'),
    wan_bendDegree: Number(glyph.getParam('弯-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1),
    gou_horizonalSpan: glyph.getParam('钩-水平延伸'),
    gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_wan_gou = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_wan_gou(plainGlyph)
  }
  glyphSkeletonBind(plainGlyph._o)
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const getBend = (start, end, wan_bendDegree) => {
  // 改变end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  const verticalSpan = Math.abs(end.y - start.y)
  const bend = {
    x: start.x + wan_bendDegree,
    y: start.y + verticalSpan / 2,
  }

  return bend
}

const updateGlyphByParams = (params, glyph) => {
  const {
    wan_length,
    wan_bendDegree,
    gou_horizonalSpan,
    gou_verticalSpan,
    skeletonRefPos,
    weight,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 500 + _ox || 0
  const y0 = 250 + _oy || 0

  // 弯
  const wan_start = new FP.Joint(
    'wan_start',
    {
      x: x0,
      y: y0,
    },
  )
  const wan_end = new FP.Joint(
    'wan_end',
    {
      x: wan_start.x,
      y: wan_start.y + wan_length,
    },
  )
  const wan_bend = new FP.Joint(
    'wan_bend',
    {
      x: wan_start.x + wan_bendDegree,
      y: wan_start.y + wan_length / 2,
    },
  )

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: wan_start.x,
      y: wan_start.y + wan_length,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x - gou_horizonalSpan,
      y: gou_start.y + gou_verticalSpan,
    },
  )

  glyph.addJoint(wan_start)
  glyph.addJoint(wan_bend)
  glyph.addJoint(wan_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    wan_start,
    wan_bend,
    wan_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(wan_start, wan_bend))
  glyph.addRefLine(refline(wan_bend, wan_end))
  glyph.addRefLine(refline(gou_start, gou_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { wan_start, wan_end, wan_bend, gou_start, gou_end } = jointsMap
  const wan_length_range = glyph.getParamRange('弯-长度')
  const wan_bend_degree_range = glyph.getParamRange('弯-弯曲度')
  const gou_horizonal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const wan_length = range(wan_end.y - wan_start.y, wan_length_range)
  const wan_bendDegree = range(wan_bend.x - wan_start.x, wan_bend_degree_range)
  const gou_horizonalSpan = range(gou_start.x - gou_end.x, gou_horizonal_span_range)
  const gou_verticalSpan = range(gou_end.y - gou_start.y, gou_vertical_span_range)
  return {
    wan_length,
    wan_bendDegree,
    gou_horizonalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_wan_gou = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'wan_start': {
        const deltaX = data.deltaX
        const deltaY = data.deltaY
        
        if (glyph._glyph.skeleton) {
          glyph._glyph.skeleton.ox = (glyph.tempData.ox || 0) + deltaX
          glyph._glyph.skeleton.oy = (glyph.tempData.oy || 0) + deltaY
        }
        
        Object.keys(jointsMap).forEach(key => {
          jointsMap[key] = {
            x: glyph.tempData[key].x + deltaX,
            y: glyph.tempData[key].y + deltaY,
          }
        })
        break
      }
      case 'wan_bend': {
        jointsMap['wan_bend'] = {
          x: glyph.tempData['wan_bend'].x + deltaX,
          y: glyph.tempData['wan_bend'].y,
        }
        break
      }
      case 'wan_end': {
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x,
          y: glyph.tempData['wan_end'].y + deltaY,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['wan_start'], jointsMap['wan_end'], glyph.tempData.wan_bendDegree)
        jointsMap['wan_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        break
      }
      case 'gou_start': {
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x,
          y: glyph.tempData['wan_end'].y + deltaY,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['wan_start'], jointsMap['wan_end'], glyph.tempData.wan_bendDegree)
        jointsMap['wan_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        break
      }
      case 'gou_end': {
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        break
      }
    }
    return jointsMap
  }

  glyph.onSkeletonDragStart = (data) => {
    const { draggingJoint } = data
    glyph.tempData = {}
    glyph.tempData.ox = glyph._glyph.skeleton.ox
    glyph.tempData.oy = glyph._glyph.skeleton.oy
    glyph.tempData.wan_bendDegree = Number(glyph.getParam('弯-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
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
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
  }
  
  glyph.onSkeletonDragEnd = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    glyph.setParam('弯-长度', _params.wan_length)
    glyph.setParam('弯-弯曲度', _params.wan_bendDegree - 30 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
    glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_wan_gou = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'wan_bend': {
        jointsMap['wan_bend'] = {
          x: glyph.tempData['wan_bend'].x + deltaX,
          y: glyph.tempData['wan_bend'].y,
        }
        break
      }
      case 'wan_end': {
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x,
          y: glyph.tempData['wan_end'].y + deltaY,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['wan_start'], jointsMap['wan_end'], glyph.tempData.wan_bendDegree)
        jointsMap['wan_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        break
      }
      case 'gou_start': {
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x,
          y: glyph.tempData['wan_end'].y + deltaY,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['wan_start'], jointsMap['wan_end'], glyph.tempData.wan_bendDegree)
        jointsMap['wan_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        break
      }
      case 'gou_end': {
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        break
      }
    }
    return jointsMap
  }

  glyph.onSkeletonDragStart = (data) => {
    const { draggingJoint } = data
    glyph.tempData = {}
    glyph.tempData.wan_bendDegree = Number(glyph.getParam('弯-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
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
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    updateSkeletonTransformation(glyph)
  }
  
  glyph.onSkeletonDragEnd = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    updateSkeletonTransformation(glyph)
    glyph.setParam('弯-长度', _params.wan_length)
    glyph.setParam('弯-弯曲度', _params.wan_bendDegree - 30 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
    glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_wan_gou,
  bindSkeletonGlyph_wan_gou,
  updateSkeletonListener_after_bind_wan_gou,
  updateSkeletonListener_before_bind_wan_gou,
}