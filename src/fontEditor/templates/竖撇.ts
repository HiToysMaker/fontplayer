import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";

// 竖撇的骨架转骨骼函数
export const skeletonToBones_shu_pie = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { shu_start, shu_end, pie_start, pie_bend, pie_end } = skeleton;
  
  // 竖的部分 - 直线段
  const shuLength = Math.sqrt((shu_end.x - shu_start.x) ** 2 + (shu_end.y - shu_start.y) ** 2);
  const shuSegments = maxSegment//Math.max(minSegment, Math.ceil(shuLength / 20));
  
  for (let i = 0; i < shuSegments; i++) {
    const t1 = i / shuSegments;
    const t2 = (i + 1) / shuSegments;
    
    const p1 = {
      x: shu_start.x + (shu_end.x - shu_start.x) * t1,
      y: shu_start.y + (shu_end.y - shu_start.y) * t1
    };
    const p2 = {
      x: shu_start.x + (shu_end.x - shu_start.x) * t2,
      y: shu_start.y + (shu_end.y - shu_start.y) * t2
    };
    
    bones.push({
      id: `shu_segment_${i}`,
      start: p1,
      end: p2,
      length: Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2),
      uAxis: normalize({ x: p2.x - p1.x, y: p2.y - p1.y }),
      vAxis: normalize({ x: -(p2.y - p1.y), y: p2.x - p1.x }),
      children: [],
      bindMatrix: createIdentityMatrix(),
      currentMatrix: createIdentityMatrix()
    });
  }
  
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
    
    // 设置骨骼层级关系
    if (i === 0) {
      bone.parent = `shu_segment_${shuSegments - 1}`;
      bones[shuSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `pie_segment_${i - 1}`;
      bones[shuSegments + i - 1].children.push(bone.id);
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

const instanceBasicGlyph_shu_pie = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    shu_length: glyph.getParam('竖-长度'),
    pie_horizonalSpan: glyph.getParam('撇-水平延伸'),
    pie_verticalSpan: glyph.getParam('撇-竖直延伸'),
    pie_bendCursor: glyph.getParam('撇-弯曲游标'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_shu_pie = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_shu_pie(plainGlyph)
  }
  glyphSkeletonBind(plainGlyph._o)
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const getBend = (start, end, pie_bendCursor) => {
  const verticalSpan = Math.abs(end.y - start.y)

  const bend = {
    x: start.x,
    y: start.y + pie_bendCursor * verticalSpan,
  }

  return bend
}

const updateGlyphByParams = (params, glyph) => {
  const {
    shu_length,
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    skeletonRefPos,
    weight,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 600 + _ox || 0
  const y0 = 250 + _oy || 0

  // 竖
  let shu_start, shu_end
  const shu_start_ref = new FP.Joint(
    'shu_start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const shu_end_ref = new FP.Joint(
    'shu_end_ref',
    {
      x: shu_start_ref.x,
      y: shu_start_ref.y + shu_length,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    shu_start = new FP.Joint(
      'shu_start',
      {
        x: shu_start_ref.x - weight / 2,
        y: shu_start_ref.y,
      },
    )
    shu_end = new FP.Joint(
      'shu_end',
      {
        x: shu_end_ref.x - weight / 2,
        y: shu_end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    shu_start = new FP.Joint(
      'shu_start',
      {
        x: shu_start_ref.x + weight / 2,
        y: shu_start_ref.y,
      },
    )
    shu_end = new FP.Joint(
      'shu_end',
      {
        x: shu_end_ref.x + weight / 2,
        y: shu_end_ref.y,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    shu_start = new FP.Joint(
      'shu_start',
      {
        x: shu_start_ref.x,
        y: shu_start_ref.y,
      },
    )
    shu_end = new FP.Joint(
      'shu_end',
      {
        x: shu_end_ref.x,
        y: shu_end_ref.y,
      },
    )
  }
  glyph.addJoint(shu_start_ref)
  glyph.addJoint(shu_end_ref)
  glyph.addRefLine(refline(shu_start_ref, shu_end_ref, 'ref'))

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: shu_start.x,
      y: shu_start.y + shu_length,
    },
  )
  const pie_bend = new FP.Joint(
    'pie_bend',
    {
      x: pie_start.x,
      y: pie_start.y + pie_bendCursor * pie_verticalSpan,
    },
  )
  const pie_end = new FP.Joint(
    'pie_end',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  glyph.addJoint(shu_start)
  glyph.addJoint(shu_end)
  glyph.addJoint(pie_start)
  glyph.addJoint(pie_end)
  glyph.addJoint(pie_bend)

  const skeleton = {
    shu_start,
    shu_end,
    pie_start,
    pie_end,
    pie_bend,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
  glyph.addRefLine(refline(pie_start, pie_bend))
  glyph.addRefLine(refline(pie_bend, pie_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { shu_start, shu_end, pie_start, pie_bend, pie_end } = jointsMap
  const shu_length_range = glyph.getParamRange('竖-长度')
  const pie_horizonal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const pie_bend_cursor_range = glyph.getParamRange('撇-弯曲游标')
  const shu_length = range(shu_end.y - shu_start.y, shu_length_range)
  const pie_horizonalSpan = range(pie_start.x - pie_end.x, pie_horizonal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const pie_bendCursor = range((pie_bend.y - pie_start.y) / pie_verticalSpan, pie_bend_cursor_range)
  return {
    shu_length,
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_shu_pie = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'shu_start': {
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
      case 'shu_end': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x,
          y: glyph.tempData['pie_start'].y + deltaY,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        break
      }
      case 'pie_start': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x,
          y: glyph.tempData['pie_start'].y + deltaY,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        break
      }
      case 'pie_bend': {
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        break
      }
      case 'pie_end': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], glyph.tempData.pie_bendCursor)
        jointsMap['pie_bend'] = {
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
    glyph.setParam('竖-长度', _params.shu_length)
    glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
    glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
    glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_shu_pie = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'shu_end': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x,
          y: glyph.tempData['pie_start'].y + deltaY,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        break
      }
      case 'pie_start': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x,
          y: glyph.tempData['pie_start'].y + deltaY,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        break
      }
      case 'pie_bend': {
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        break
      }
      case 'pie_end': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], glyph.tempData.pie_bendCursor)
        jointsMap['pie_bend'] = {
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
    glyph.setParam('竖-长度', _params.shu_length)
    glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
    glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
    glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_shu_pie,
  bindSkeletonGlyph_shu_pie,
  updateSkeletonListener_after_bind_shu_pie,
  updateSkeletonListener_before_bind_shu_pie,
}