import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 竖钩的骨架转骨骼函数
export const skeletonToBones_shu_gou = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { shu_start, shu_end, gou_start, gou_end } = skeleton;
  
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
    
    const bone: any = {
      id: `shu_segment_${i}`,
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
      bone.parent = `shu_segment_${i - 1}`;
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
      // 第一个钩段连接到最后一个竖段
      bone.parent = `shu_segment_${shuSegments - 1}`;
      bones[shuSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `gou_segment_${i - 1}`;
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



const instanceBasicGlyph_shu_gou = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    shu_length: glyph.getParam('竖-长度'),
    gou_horizonalSpan: glyph.getParam('钩-水平延伸'),
    gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_shu_gou = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_shu_gou(plainGlyph)
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
    shu_length,
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

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: shu_start.x,
      y: shu_start.y + shu_length,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x - gou_horizonalSpan,
      y: gou_start.y + gou_verticalSpan,
    },
  )

  glyph.addJoint(shu_start)
  glyph.addJoint(shu_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    shu_start,
    shu_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
  glyph.addRefLine(refline(gou_start, gou_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { shu_start, shu_end, gou_start, gou_end } = jointsMap
  const shu_length_range = glyph.getParamRange('竖-长度')
  const gou_horizonal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const shu_length = range(shu_end.y - shu_start.y, shu_length_range)
  const gou_horizonalSpan = range(gou_start.x - gou_end.x, gou_horizonal_span_range)
  const gou_verticalSpan = range(gou_end.y - gou_start.y, gou_vertical_span_range)
  return {
    shu_length,
    gou_horizonalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_shu_gou = (glyph: CustomGlyph) => {
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
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        break
      }
      case 'gou_start': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x,
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
    glyph.tempData.bendCursor = glyph.getParam('弯曲游标')
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
    glyph.setParam('竖-长度', _params.shu_length)
    glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
    glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_shu_gou = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'shu_end': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x,
          y: glyph.tempData['gou_end'].y + deltaY,
        }
        break
      }
      case 'gou_start': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x,
          y: glyph.tempData['gou_start'].y + deltaY,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x,
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
    glyph.tempData.bendCursor = glyph.getParam('弯曲游标')
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
    glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
    glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_shu_gou,
  bindSkeletonGlyph_shu_gou,
  updateSkeletonListener_after_bind_shu_gou,
  updateSkeletonListener_before_bind_shu_gou,
}