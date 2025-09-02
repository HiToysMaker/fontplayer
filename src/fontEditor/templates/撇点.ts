import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 撇点的骨架转骨骼函数
export const skeletonToBones_pie_dian = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { pie_start, pie_end, pie_bend, dian_start, dian_end, dian_bend } = skeleton;
  
      // 撇的部分 - 贝塞尔曲线段
    const pieSegments = maxSegment;
  for (let i = 0; i < pieSegments; i++) {
    const t1 = i / pieSegments;
    const t2 = (i + 1) / pieSegments;
    
    const p1 = quadraticBezierPoint(pie_start, pie_bend, pie_end, t1);
    const p2 = quadraticBezierPoint(pie_start, pie_bend, pie_end, t2);
    
    const bone: any = {
      id: `pie_segment_${i}`,
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
      bone.parent = `pie_segment_${i - 1}`;
      bones[i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
      // 点的部分 - 贝塞尔曲线段
    const dianSegments = maxSegment;
  for (let i = 0; i < dianSegments; i++) {
    const t1 = i / dianSegments;
    const t2 = (i + 1) / dianSegments;
    
    const p1 = quadraticBezierPoint(dian_start, dian_bend, dian_end, t1);
    const p2 = quadraticBezierPoint(dian_start, dian_bend, dian_end, t2);
    
    const bone: any = {
      id: `dian_segment_${i}`,
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
      // 第一个点段连接到最后一个撇段
      bone.parent = `pie_segment_${pieSegments - 1}`;
      bones[pieSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `dian_segment_${i - 1}`;
      bones[pieSegments + i - 1].children.push(bone.id);
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


const BENDING_DEGREE = 0
const instanceBasicGlyph_pie_dian = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    pie_horizonalSpan: glyph.getParam('撇-水平延伸'),
    pie_verticalSpan: glyph.getParam('撇-竖直延伸'),
    pie_bendCursor: glyph.getParam('撇-弯曲游标'),
    pie_bendDegree: Number(glyph.getParam('撇-弯曲度')) + BENDING_DEGREE * Number(glyph.getParam('弯曲程度') || 1),
    dian_horizonalSpan: glyph.getParam('点-水平延伸'),
    dian_verticalSpan: glyph.getParam('点-竖直延伸'),
    dian_bendCursor: glyph.getParam('点-弯曲游标'),
    dian_bendDegree: Number(glyph.getParam('点-弯曲度')) + BENDING_DEGREE * Number(glyph.getParam('弯曲程度') || 1),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_pie_dian = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_pie_dian(plainGlyph)
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
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    dian_horizonalSpan,
    dian_verticalSpan,
    dian_bendCursor,
    dian_bendDegree,
    skeletonRefPos,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 550 + _ox || 0
  const y0 = 200 + _oy || 0

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: x0,
      y: y0,
    },
  )
  const pie_end = new FP.Joint(
    'pie_end',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  const pie_length = distance(pie_start, pie_end)
  const pie_cursor_x = pie_start.x - pie_bendCursor * pie_horizonalSpan
  const pie_cursor_y = pie_start.y + pie_bendCursor * pie_verticalSpan
  const pie_angle = Math.atan2(pie_verticalSpan, pie_horizonalSpan)

  const pie_bend = new FP.Joint(
    'pie_bend',
    {
      x: pie_cursor_x + pie_bendDegree * Math.sin(pie_angle),
      y: pie_cursor_y + pie_bendDegree * Math.cos(pie_angle),
    },
  )

  // 点
  const dian_start = new FP.Joint(
    'dian_start',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )
  const dian_end = new FP.Joint(
    'dian_end',
    {
      x: dian_start.x + dian_horizonalSpan,
      y: dian_start.y + dian_verticalSpan,
    },
  )

  const dian_length = distance(dian_start, dian_end)
  const dian_cursor_x = dian_start.x + dian_bendCursor * dian_horizonalSpan
  const dian_cursor_y = dian_start.y + dian_bendCursor * dian_verticalSpan
  const dian_angle = Math.atan2(dian_verticalSpan, dian_horizonalSpan)

  const dian_bend = new FP.Joint(
    'dian_bend',
    {
      x: dian_cursor_x + dian_bendDegree * Math.sin(dian_angle),
      y: dian_cursor_y - dian_bendDegree * Math.cos(dian_angle),
    },
  )

  glyph.addJoint(pie_start)
  glyph.addJoint(pie_bend)
  glyph.addJoint(pie_end)
  glyph.addJoint(dian_start)
  glyph.addJoint(dian_bend)
  glyph.addJoint(dian_end)

  const skeleton = {
    pie_start,
    pie_bend,
    pie_end,
    dian_start,
    dian_bend,
    dian_end,
  }

  glyph.addRefLine(refline(pie_start, pie_bend))
  glyph.addRefLine(refline(pie_bend, pie_end))
  glyph.addRefLine(refline(dian_start, dian_bend))
  glyph.addRefLine(refline(dian_bend, dian_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { pie_start, pie_bend, pie_end, dian_start, dian_bend, dian_end } = jointsMap
  const pie_horizonal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const pie_bend_cursor_range = glyph.getParamRange('撇-弯曲游标')
  const pie_bend_degree_range = glyph.getParamRange('撇-弯曲度')
  const dian_horizonal_span_range = glyph.getParamRange('点-水平延伸')
  const dian_vertical_span_range = glyph.getParamRange('点-竖直延伸')
  const dian_bend_cursor_range = glyph.getParamRange('点-弯曲游标')
  const dian_bend_degree_range = glyph.getParamRange('点-弯曲度')
  const pie_horizonalSpan = range(pie_start.x - pie_end.x, pie_horizonal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const pie_data = FP.distanceAndFootPoint(pie_start, pie_end, pie_bend)
  const pie_bendCursor = range(pie_data.percentageFromA, pie_bend_cursor_range)
  const pie_bendDegree = range(pie_data.distance, pie_bend_degree_range)
  const dian_horizonalSpan = range(dian_end.x - dian_start.x, dian_horizonal_span_range)
  const dian_verticalSpan = range(dian_end.y - dian_start.y, dian_vertical_span_range)
  const dian_data = FP.distanceAndFootPoint(dian_start, dian_end, dian_bend)
  const dian_bendCursor = range(dian_data.percentageFromA, dian_bend_cursor_range)
  const dian_bendDegree = range(dian_data.distance, dian_bend_degree_range)
  return {
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    dian_horizonalSpan,
    dian_verticalSpan,
    dian_bendCursor,
    dian_bendDegree,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_pie_dian = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'pie_start': {
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
      case 'pie_bend': {
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        break
      }
      case 'pie_end': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], glyph.tempData.pie_bendCursor, glyph.tempData.pie_bendDegree)
        jointsMap['pie_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['dian_start'] = {
          x: glyph.tempData['dian_start'].x + deltaX,
          y: glyph.tempData['dian_start'].y + deltaY,
        }
        jointsMap['dian_bend'] = {
          x: glyph.tempData['dian_bend'].x + deltaX,
          y: glyph.tempData['dian_bend'].y + deltaY,
        }
        jointsMap['dian_end'] = {
          x: glyph.tempData['dian_end'].x + deltaX,
          y: glyph.tempData['dian_end'].y + deltaY,
        }
        break
      }
      case 'dian_start': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], glyph.tempData.pie_bendCursor, glyph.tempData.pie_bendDegree)
        jointsMap['pie_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['dian_start'] = {
          x: glyph.tempData['dian_start'].x + deltaX,
          y: glyph.tempData['dian_start'].y + deltaY,
        }
        jointsMap['dian_bend'] = {
          x: glyph.tempData['dian_bend'].x + deltaX,
          y: glyph.tempData['dian_bend'].y + deltaY,
        }
        jointsMap['dian_end'] = {
          x: glyph.tempData['dian_end'].x + deltaX,
          y: glyph.tempData['dian_end'].y + deltaY,
        }
        break
      }
      case 'dian_bend': {
        jointsMap['dian_bend'] = {
          x: glyph.tempData['dian_bend'].x + deltaX,
          y: glyph.tempData['dian_bend'].y + deltaY,
        }
        break
      }
      case 'dian_end': {
        jointsMap['dian_end'] = {
          x: glyph.tempData['dian_end'].x + deltaX,
          y: glyph.tempData['dian_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['dian_start'], jointsMap['dian_end'], glyph.tempData.dian_bendCursor, glyph.tempData.dian_bendDegree)
        jointsMap['dian_bend'] = {
          x: newBend.x,
          y: newBend.y,
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
    glyph.tempData.pie_bendCursor = glyph.getParam('撇-弯曲游标')
    glyph.tempData.pie_bendDegree = Number(glyph.getParam('撇-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
    glyph.tempData.dian_bendCursor = glyph.getParam('点-弯曲游标')
    glyph.tempData.dian_bendDegree = Number(glyph.getParam('点-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
    glyph.tempData.bendDegree = Number(glyph.getParam('弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
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
    glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
    glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
    glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
    glyph.setParam('撇-弯曲度', _params.pie_bendDegree - BENDING_DEGREE * Number(glyph.getParam('弯曲程度') || 1))
    glyph.setParam('点-水平延伸', _params.dian_horizonalSpan)
    glyph.setParam('点-竖直延伸', _params.dian_verticalSpan)
    glyph.setParam('点-弯曲游标', _params.dian_bendCursor)
    glyph.setParam('点-弯曲度', _params.dian_bendDegree - BENDING_DEGREE * Number(glyph.getParam('弯曲程度') || 1))
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_pie_dian = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'pie_bend': {
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        break
      }
      case 'pie_end': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], glyph.tempData.pie_bendCursor, glyph.tempData.pie_bendDegree)
        jointsMap['pie_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['dian_start'] = {
          x: glyph.tempData['dian_start'].x + deltaX,
          y: glyph.tempData['dian_start'].y + deltaY,
        }
        jointsMap['dian_bend'] = {
          x: glyph.tempData['dian_bend'].x + deltaX,
          y: glyph.tempData['dian_bend'].y + deltaY,
        }
        jointsMap['dian_end'] = {
          x: glyph.tempData['dian_end'].x + deltaX,
          y: glyph.tempData['dian_end'].y + deltaY,
        }
        break
      }
      case 'dian_start': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], glyph.tempData.pie_bendCursor, glyph.tempData.pie_bendDegree)
        jointsMap['pie_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['dian_start'] = {
          x: glyph.tempData['dian_start'].x + deltaX,
          y: glyph.tempData['dian_start'].y + deltaY,
        }
        jointsMap['dian_bend'] = {
          x: glyph.tempData['dian_bend'].x + deltaX,
          y: glyph.tempData['dian_bend'].y + deltaY,
        }
        jointsMap['dian_end'] = {
          x: glyph.tempData['dian_end'].x + deltaX,
          y: glyph.tempData['dian_end'].y + deltaY,
        }
        break
      }
      case 'dian_bend': {
        jointsMap['dian_bend'] = {
          x: glyph.tempData['dian_bend'].x + deltaX,
          y: glyph.tempData['dian_bend'].y + deltaY,
        }
        break
      }
      case 'dian_end': {
        jointsMap['dian_end'] = {
          x: glyph.tempData['dian_end'].x + deltaX,
          y: glyph.tempData['dian_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['dian_start'], jointsMap['dian_end'], glyph.tempData.dian_bendCursor, glyph.tempData.dian_bendDegree)
        jointsMap['dian_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        break
      }
    }
    return jointsMap
  }

  glyph.onSkeletonDragStart = (data) => {
    const { draggingJoint } = data
    glyph.tempData = {}
    glyph.tempData.pie_bendCursor = glyph.getParam('撇-弯曲游标')
    glyph.tempData.pie_bendDegree = Number(glyph.getParam('撇-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
    glyph.tempData.dian_bendCursor = glyph.getParam('点-弯曲游标')
    glyph.tempData.dian_bendDegree = Number(glyph.getParam('点-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
    glyph.tempData.bendCursor = glyph.getParam('弯曲游标')
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
    glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
    glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
    glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
    glyph.setParam('撇-弯曲度', _params.pie_bendDegree - BENDING_DEGREE * Number(glyph.getParam('弯曲程度') || 1))
    glyph.setParam('点-水平延伸', _params.dian_horizonalSpan)
    glyph.setParam('点-竖直延伸', _params.dian_verticalSpan)
    glyph.setParam('点-弯曲游标', _params.dian_bendCursor)
    glyph.setParam('点-弯曲度', _params.dian_bendDegree - BENDING_DEGREE * Number(glyph.getParam('弯曲程度') || 1))
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_pie_dian,
  bindSkeletonGlyph_pie_dian,
  updateSkeletonListener_after_bind_pie_dian,
  updateSkeletonListener_before_bind_pie_dian,
}