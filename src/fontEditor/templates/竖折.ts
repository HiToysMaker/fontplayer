import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 竖折的骨架转骨骼函数
export const skeletonToBones_shu_zhe = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { shu_start, shu_end, zhe_start, zhe_end } = skeleton;
  
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
  
  // 折的部分 - 直线段
  const zheLength = Math.sqrt((zhe_end.x - zhe_start.x) ** 2 + (zhe_end.y - zhe_start.y) ** 2);
  const zheSegments = maxSegment//Math.max(minSegment, Math.ceil(zheLength / 20));
  
  for (let i = 0; i < zheSegments; i++) {
    const t1 = i / zheSegments;
    const t2 = (i + 1) / zheSegments;
    
    const p1 = {
      x: zhe_start.x + (zhe_end.x - zhe_start.x) * t1,
      y: zhe_start.y + (zhe_end.y - zhe_start.y) * t1
    };
    const p2 = {
      x: zhe_start.x + (zhe_end.x - zhe_start.x) * t2,
      y: zhe_start.y + (zhe_end.y - zhe_start.y) * t2
    };
    
    const bone: any = {
      id: `zhe_segment_${i}`,
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
      // 第一个折段连接到最后一个竖段
      bone.parent = `shu_segment_${shuSegments - 1}`;
      bones[shuSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `zhe_segment_${i - 1}`;
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



const instanceBasicGlyph_shu_zhe = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    shu_horizontalSpan: glyph.getParam('竖-水平延伸'),
    shu_verticalSpan: glyph.getParam('竖-竖直延伸'),
    zhe_horizontalSpan: glyph.getParam('折-水平延伸'),
    zhe_verticalSpan: glyph.getParam('折-竖直延伸'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_shu_zhe = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_shu_zhe(plainGlyph)
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
    shu_horizontalSpan,
    shu_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    skeletonRefPos,
    weight,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 250 + _ox || 0
  const y0 = 250 + _oy || 0

  // 竖
  const shu_start = new FP.Joint(
    'shu_start',
    {
      x: x0,
      y: y0,
    },
  )
  const shu_end = new FP.Joint(
    'shu_end',
    {
      x: shu_start.x + shu_horizontalSpan,
      y: shu_start.y + shu_verticalSpan,
    },
  )

  // 折
  let zhe_start, zhe_end
  const zhe_start_ref = new FP.Joint(
    'zhe_start_ref',
    {
      x: shu_start.x + shu_horizontalSpan,
      y: shu_start.y + shu_verticalSpan,
    },
  )
  const zhe_end_ref = new FP.Joint(
    'zhe_end_ref',
    {
      x: zhe_start_ref.x + zhe_horizontalSpan,
      y: zhe_start_ref.y - zhe_verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x,
        y: zhe_start_ref.y + weight / 2,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x,
        y: zhe_end_ref.y + weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x,
        y: zhe_start_ref.y - weight / 2,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x,
        y: zhe_end_ref.y - weight / 2,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x,
        y: zhe_start_ref.y,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x,
        y: zhe_end_ref.y,
      },
    )
  }
  glyph.addJoint(zhe_start_ref)
  glyph.addJoint(zhe_end_ref)
  glyph.addRefLine(refline(zhe_start_ref, zhe_end_ref, 'ref'))

  glyph.addJoint(shu_start)
  glyph.addJoint(shu_end)
  glyph.addJoint(zhe_start)
  glyph.addJoint(zhe_end)

  const skeleton = {
    shu_start,
    shu_end,
    zhe_start,
    zhe_end,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
  glyph.addRefLine(refline(zhe_start, zhe_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { shu_start, shu_end, zhe_start, zhe_end } = jointsMap
  const shu_horizontal_span_range = glyph.getParamRange('竖-水平延伸')
  const shu_vertical_span_range = glyph.getParamRange('竖-竖直延伸')
  const zhe_horizontal_span_range = glyph.getParamRange('折-水平延伸')
  const zhe_vertical_span_range = glyph.getParamRange('折-竖直延伸')
  const shu_horizontalSpan = range(shu_end.x - shu_start.x, shu_horizontal_span_range)
  const shu_verticalSpan = range(shu_end.y - shu_start.y, shu_vertical_span_range)
  const zhe_horizontalSpan = range(zhe_end.x - zhe_start.x, zhe_horizontal_span_range)
  const zhe_verticalSpan = range(zhe_start.y - zhe_end.y, zhe_vertical_span_range)
  return {
    shu_horizontalSpan,
    shu_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_shu_zhe = (glyph: CustomGlyph) => {
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
          if (glyph.tempData[key] && glyph.tempData[key].x && glyph.tempData[key].y) {
            jointsMap[key] = {
              x: glyph.tempData[key].x + deltaX,
              y: glyph.tempData[key].y + deltaY,
            }
          }
        })
        break
      }
      case 'shu_end': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x + deltaX,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y + deltaY,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        break
      }
      case 'zhe_start': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x + deltaX,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y + deltaY,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        break
      }
      case 'zhe_end': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
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
    glyph.setParam('竖-水平延伸', _params.shu_horizontalSpan)
    glyph.setParam('竖-竖直延伸', _params.shu_verticalSpan)
    glyph.setParam('折-水平延伸', _params.zhe_horizontalSpan)
    glyph.setParam('折-竖直延伸', _params.zhe_verticalSpan)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_shu_zhe = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'shu_end': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x + deltaX,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y + deltaY,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        break
      }
      case 'zhe_start': {
        jointsMap['shu_end'] = {
          x: glyph.tempData['shu_end'].x + deltaX,
          y: glyph.tempData['shu_end'].y + deltaY,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y + deltaY,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        break
      }
      case 'zhe_end': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        break
      }
    }
    return jointsMap
  }

  glyph.onSkeletonDragStart = (data) => {
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
    glyph.setParam('竖-水平延伸', _params.shu_horizontalSpan)
    glyph.setParam('竖-竖直延伸', _params.shu_verticalSpan)
    glyph.setParam('折-水平延伸', _params.zhe_horizontalSpan)
    glyph.setParam('折-竖直延伸', _params.zhe_verticalSpan)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_shu_zhe,
  bindSkeletonGlyph_shu_zhe,
  updateSkeletonListener_after_bind_shu_zhe,
  updateSkeletonListener_before_bind_shu_zhe,
}