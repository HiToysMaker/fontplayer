import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 斜钩的骨架转骨骼函数
export const skeletonToBones_xie_gou = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { xie_start, xie_end, xie_bend, gou_start, gou_end } = skeleton;
  
  // 斜的部分 - 贝塞尔曲线段
  const xieSegments = maxSegment;
  for (let i = 0; i < xieSegments; i++) {
    const t1 = i / xieSegments;
    const t2 = (i + 1) / xieSegments;
    
    const p1 = quadraticBezierPoint(xie_start, xie_bend, xie_end, t1);
    const p2 = quadraticBezierPoint(xie_start, xie_bend, xie_end, t2);
    
    const bone: any = {
      id: `xie_segment_${i}`,
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
      bone.parent = `xie_segment_${i - 1}`;
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
      // 第一个钩段连接到最后一个斜段
      bone.parent = `xie_segment_${xieSegments - 1}`;
      bones[xieSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `gou_segment_${i - 1}`;
      bones[xieSegments + i - 1].children.push(bone.id);
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

const instanceBasicGlyph_xie_gou = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    xie_horizonalSpan: glyph.getParam('斜-水平延伸'),
    xie_verticalSpan: glyph.getParam('斜-竖直延伸'),
    xie_bendCursor: glyph.getParam('斜-弯曲游标'),
    xie_bendDegree: Number(glyph.getParam('斜-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1),
    gou_horizonalSpan: glyph.getParam('钩-水平延伸'),
    gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_xie_gou = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_xie_gou(plainGlyph)
  }
  glyphSkeletonBind(plainGlyph._o)
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const getBend = (start, end, bendCursor, bendDegree) => {
  const horizonalSpan = Math.abs(end.x - start.x)
  const verticalSpan = Math.abs(end.y - start.y)
  const cursor_x = start.x + bendCursor * horizonalSpan
  const cursor_y = start.y + bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizonalSpan)
  
  const bend = {
    x: cursor_x + bendDegree * Math.sin(angle),
    y: cursor_y + bendDegree * Math.cos(angle),
  }

  return bend
}

const updateGlyphByParams = (params, glyph) => {
  const {
    xie_horizonalSpan,
    xie_verticalSpan,
    xie_bendCursor,
    xie_bendDegree,
    gou_horizonalSpan,
    gou_verticalSpan,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 350 + _ox || 0
  const y0 = 250 + _oy || 0

  // 斜
  const xie_start = new FP.Joint(
    'xie_start',
    {
      x: x0,
      y: y0,
    },
  )
  const xie_end = new FP.Joint(
    'xie_end',
    {
      x: xie_start.x + xie_horizonalSpan,
      y: xie_start.y + xie_verticalSpan,
    },
  )

  const xie_length = distance(xie_start, xie_end)
  const xie_cursor_x = xie_start.x + xie_bendCursor * xie_horizonalSpan
  const xie_cursor_y = xie_start.y + xie_bendCursor * xie_verticalSpan
  const xie_angle = Math.atan2(xie_verticalSpan, xie_horizonalSpan)

  const xie_bend = new FP.Joint(
    'xie_bend',
    {
      x: xie_cursor_x - xie_bendDegree * Math.sin(xie_angle),
      y: xie_cursor_y + xie_bendDegree * Math.cos(xie_angle),
    },
  )

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: xie_start.x + xie_horizonalSpan,
      y: xie_start.y + xie_verticalSpan,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x + gou_horizonalSpan,
      y: gou_start.y - gou_verticalSpan,
    },
  )

  glyph.addJoint(xie_start)
  glyph.addJoint(xie_end)
  glyph.addJoint(xie_bend)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    xie_start,
    xie_bend,
    xie_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(xie_start, xie_bend))
  glyph.addRefLine(refline(xie_bend, xie_end))
  glyph.addRefLine(refline(gou_start, gou_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { xie_start, xie_end, xie_bend, gou_start, gou_end } = jointsMap
  const xie_horizonal_span_range = glyph.getParamRange('斜-水平延伸')
  const xie_vertical_span_range = glyph.getParamRange('斜-竖直延伸')
  const xie_bend_cursor_range = glyph.getParamRange('斜-弯曲游标')
  const xie_bend_degree_range = glyph.getParamRange('斜-弯曲度')
  const gou_horizonal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const xie_horizonalSpan = range(xie_end.x - xie_start.x, xie_horizonal_span_range)
  const xie_verticalSpan = range(xie_end.y - xie_start.y, xie_vertical_span_range)
  const xie_data = FP.distanceAndFootPoint(xie_start, xie_end, xie_bend)
  const xie_bendCursor = range(xie_data.percentageFromA, xie_bend_cursor_range)
  const xie_bendDegree = range(xie_data.distance, xie_bend_degree_range)
  const gou_horizonalSpan = range(gou_end.x - gou_start.x, gou_horizonal_span_range)
  const gou_verticalSpan = range(gou_start.y - gou_end.y, gou_vertical_span_range)
  return {
    xie_horizonalSpan,
    xie_verticalSpan,
    xie_bendCursor,
    xie_bendDegree,
    gou_horizonalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_xie_gou = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'xie_start': {
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
      case 'xie_bend': {
        jointsMap['xie_bend'] = {
          x: glyph.tempData['xie_bend'].x + deltaX,
          y: glyph.tempData['xie_bend'].y + deltaY,
        }
        break
      }
      case 'xie_end': {
        jointsMap['xie_end'] = {
          x: glyph.tempData['xie_end'].x + deltaX,
          y: glyph.tempData['xie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['xie_start'], jointsMap['xie_end'], glyph.tempData.xie_bendCursor, glyph.tempData.xie_bendDegree)
        jointsMap['xie_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        break
      }
      case 'gou_start': {
        jointsMap['xie_end'] = {
          x: glyph.tempData['xie_end'].x + deltaX,
          y: glyph.tempData['xie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['xie_start'], jointsMap['xie_end'], glyph.tempData.xie_bendCursor, glyph.tempData.xie_bendDegree)
        jointsMap['xie_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y + deltaY,
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
    glyph.tempData.xie_bendCursor = glyph.getParam('斜-弯曲游标')
    glyph.tempData.xie_bendDegree = Number(glyph.getParam('斜-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
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
    glyph.setParam('斜-水平延伸', _params.xie_horizonalSpan)
    glyph.setParam('斜-竖直延伸', _params.xie_verticalSpan)
    glyph.setParam('斜-弯曲游标', _params.xie_bendCursor)
    glyph.setParam('斜-弯曲度', _params.xie_bendDegree - 30 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
    glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_xie_gou = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'xie_bend': {
        jointsMap['xie_bend'] = {
          x: glyph.tempData['xie_bend'].x + deltaX,
          y: glyph.tempData['xie_bend'].y + deltaY,
        }
        break
      }
      case 'xie_end': {
        jointsMap['xie_end'] = {
          x: glyph.tempData['xie_end'].x + deltaX,
          y: glyph.tempData['xie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['xie_start'], jointsMap['xie_end'], glyph.tempData.xie_bendCursor, glyph.tempData.xie_bendDegree)
        jointsMap['xie_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        break
      }
      case 'gou_start': {
        jointsMap['xie_end'] = {
          x: glyph.tempData['xie_end'].x + deltaX,
          y: glyph.tempData['xie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['xie_start'], jointsMap['xie_end'], glyph.tempData.xie_bendCursor, glyph.tempData.xie_bendDegree)
        jointsMap['xie_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y + deltaY,
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
    glyph.tempData.xie_bendCursor = glyph.getParam('斜-弯曲游标')
    glyph.tempData.xie_bendDegree = Number(glyph.getParam('斜-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
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
    glyph.setParam('斜-水平延伸', _params.xie_horizonalSpan)
    glyph.setParam('斜-竖直延伸', _params.xie_verticalSpan)
    glyph.setParam('斜-弯曲游标', _params.xie_bendCursor)
    glyph.setParam('斜-弯曲度', _params.xie_bendDegree - 30 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
    glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_xie_gou,
  bindSkeletonGlyph_xie_gou,
  updateSkeletonListener_after_bind_xie_gou,
  updateSkeletonListener_before_bind_xie_gou,
}