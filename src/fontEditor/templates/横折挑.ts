import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 横折挑的骨架转骨骼函数
export const skeletonToBones_heng_zhe_tiao = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { heng_start, heng_end, zhe_start, zhe_end, tiao_start, tiao_end } = skeleton;
  
  // 横的部分 - 直线段
  const hengLength = Math.sqrt((heng_end.x - heng_start.x) ** 2 + (heng_end.y - heng_start.y) ** 2);
  const hengSegments = maxSegment//Math.max(minSegment, Math.ceil(hengLength / 20));
  
  for (let i = 0; i < hengSegments; i++) {
    const t1 = i / hengSegments;
    const t2 = (i + 1) / hengSegments;
    
    const p1 = {
      x: heng_start.x + (heng_end.x - heng_start.x) * t1,
      y: heng_start.y + (heng_end.y - heng_start.y) * t1
    };
    const p2 = {
      x: heng_start.x + (heng_end.x - heng_start.x) * t2,
      y: heng_start.y + (heng_end.y - heng_start.y) * t2
    };
    
    const bone: any = {
      id: `heng_segment_${i}`,
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
      bone.parent = `heng_segment_${i - 1}`;
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
      // 第一个折段连接到最后一个横段
      bone.parent = `heng_segment_${hengSegments - 1}`;
      bones[hengSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `zhe_segment_${i - 1}`;
      bones[hengSegments + i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 挑的部分 - 直线段
  const tiaoLength = Math.sqrt((tiao_end.x - tiao_start.x) ** 2 + (tiao_end.y - tiao_start.y) ** 2);
  const tiaoSegments = maxSegment//Math.max(minSegment, Math.ceil(tiaoLength / 20));
  
  for (let i = 0; i < tiaoSegments; i++) {
    const t1 = i / tiaoSegments;
    const t2 = (i + 1) / tiaoSegments;
    
    const p1 = {
      x: tiao_start.x + (tiao_end.x - tiao_start.x) * t1,
      y: tiao_start.y + (tiao_end.y - tiao_start.y) * t1
    };
    const p2 = {
      x: tiao_start.x + (tiao_end.x - tiao_start.x) * t2,
      y: tiao_start.y + (tiao_end.y - tiao_start.y) * t2
    };
    
    const bone: any = {
      id: `tiao_segment_${i}`,
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
      // 第一个挑段连接到最后一个折段
      bone.parent = `zhe_segment_${zheSegments - 1}`;
      bones[hengSegments + zheSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `tiao_segment_${i - 1}`;
      bones[hengSegments + zheSegments + i - 1].children.push(bone.id);
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

const instanceBasicGlyph_heng_zhe_tiao = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    heng_horizontalSpan: glyph.getParam('横-水平延伸'),
    heng_verticalSpan: glyph.getParam('横-竖直延伸'),
    zhe_horizontalSpan: glyph.getParam('折-水平延伸'),
    zhe_verticalSpan: glyph.getParam('折-竖直延伸'),
    tiao_horizontalSpan: glyph.getParam('挑-水平延伸'),
    tiao_verticalSpan: glyph.getParam('挑-竖直延伸'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_heng_zhe_tiao = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_heng_zhe_tiao(plainGlyph)
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
    heng_horizontalSpan,
    heng_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    tiao_horizontalSpan,
    tiao_verticalSpan,
    skeletonRefPos,
    weight,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 425 + _ox || 0
  const y0 = 245 + _oy || 0

  // 横
  let heng_start, heng_end
  const heng_start_ref = new FP.Joint(
    'heng_start_ref',
    {
      x: x0,
      y: y0 + heng_verticalSpan / 2,
    },
  )
  const heng_end_ref = new FP.Joint(
    'heng_end_ref',
    {
      x: heng_start_ref.x + heng_horizontalSpan,
      y: heng_start_ref.y - heng_verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y + weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y + weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y - weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y - weight / 2,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y,
      },
    )
  }
  glyph.addJoint(heng_start_ref)
  glyph.addJoint(heng_end_ref)
  glyph.addRefLine(refline(heng_start_ref, heng_end_ref, 'ref'))

  // 折
  let zhe_start, zhe_end
  const zhe_start_ref = new FP.Joint(
    'zhe_start_ref',
    {
      x: heng_end_ref.x,
      y: heng_end_ref.y,
    },
  )
  const zhe_end_ref = new FP.Joint(
    'zhe_end_ref',
    {
      x: zhe_start_ref.x + zhe_horizontalSpan,
      y: zhe_start_ref.y + zhe_verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x - weight / 2,
        y: zhe_start_ref.y,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x - weight / 2,
        y: zhe_end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x + weight / 2,
        y: zhe_start_ref.y,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x + weight / 2,
        y: zhe_end_ref.y,
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

  // 挑
  const tiao_start = new FP.Joint(
    'tiao_start',
    {
      x: zhe_end.x,
      y: zhe_end.y,
    },
  )
  const tiao_end = new FP.Joint(
    'tiao_end',
    {
      x: tiao_start.x + tiao_horizontalSpan,
      y: tiao_start.y - tiao_verticalSpan,
    },
  )
  
  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(zhe_start)
  glyph.addJoint(zhe_end)
  glyph.addJoint(tiao_start)
  glyph.addJoint(tiao_end)

  const skeleton = {
    heng_start,
    heng_end,
    zhe_start,
    zhe_end,
    tiao_start,
    tiao_end,
  }
  
  glyph.addRefLine(refline(heng_start, heng_end))
  glyph.addRefLine(refline(zhe_start, zhe_end))
  glyph.addRefLine(refline(tiao_start, tiao_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { heng_start, heng_end, zhe_start, zhe_end, tiao_start, tiao_end } = jointsMap
  const heng_horizontalSpan_range = glyph.getParamRange('横-水平延伸')
  const heng_verticalSpan_range = glyph.getParamRange('横-竖直延伸')
  const zhe_horizontalSpan_range = glyph.getParamRange('折-水平延伸')
  const zhe_verticalSpan_range = glyph.getParamRange('折-竖直延伸')
  const tiao_horizontal_span_range = glyph.getParamRange('挑-水平延伸')
  const tiao_vertical_span_range = glyph.getParamRange('挑-竖直延伸')
  const heng_horizontalSpan = range(heng_end.x - heng_start.x, heng_horizontalSpan_range)
  const heng_verticalSpan = range(heng_start.y - heng_end.y, heng_verticalSpan_range)
  const zhe_horizontalSpan = range(zhe_end.x - zhe_start.x, zhe_horizontalSpan_range)
  const zhe_verticalSpan = range(zhe_end.y - zhe_start.y, zhe_verticalSpan_range)
  const tiao_horizontalSpan = range(tiao_end.x - tiao_start.x, tiao_horizontal_span_range)
  const tiao_verticalSpan = range(tiao_start.y - tiao_end.y, tiao_vertical_span_range)
  return {
    heng_horizontalSpan,
    heng_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    tiao_horizontalSpan,
    tiao_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_heng_zhe_tiao = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'heng_start': {
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
      case 'heng_end': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y + deltaY,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y + deltaY,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        jointsMap['tiao_start'] = {
          x: glyph.tempData['tiao_start'].x + deltaX,
          y: glyph.tempData['tiao_start'].y + deltaY,
        }
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
        }
        break
      }
      case 'zhe_start': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y + deltaY,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y + deltaY,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        jointsMap['tiao_start'] = {
          x: glyph.tempData['tiao_start'].x + deltaX,
          y: glyph.tempData['tiao_start'].y + deltaY,
        }
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
        }
        break
      }
      case 'zhe_end': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        jointsMap['tiao_start'] = {
          x: glyph.tempData['tiao_start'].x + deltaX,
          y: glyph.tempData['tiao_start'].y + deltaY,
        }
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
        }
        break
      }
      case 'tiao_start': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        jointsMap['tiao_start'] = {
          x: glyph.tempData['tiao_start'].x + deltaX,
          y: glyph.tempData['tiao_start'].y + deltaY,
        }
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
        }
        break
      }
      case 'tiao_end': {
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
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
    glyph.setParam('横-水平延伸', _params.heng_horizontalSpan)
    glyph.setParam('横-竖直延伸', _params.heng_verticalSpan)
    glyph.setParam('折-水平延伸', _params.zhe_horizontalSpan)
    glyph.setParam('折-竖直延伸', _params.zhe_verticalSpan)
    glyph.setParam('挑-水平延伸', _params.tiao_horizontalSpan)
    glyph.setParam('挑-竖直延伸', _params.tiao_verticalSpan)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_heng_zhe_tiao = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'heng_end': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y + deltaY,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y + deltaY,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        jointsMap['tiao_start'] = {
          x: glyph.tempData['tiao_start'].x + deltaX,
          y: glyph.tempData['tiao_start'].y + deltaY,
        }
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
        }
        break
      }
      case 'zhe_start': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y + deltaY,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y + deltaY,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        jointsMap['tiao_start'] = {
          x: glyph.tempData['tiao_start'].x + deltaX,
          y: glyph.tempData['tiao_start'].y + deltaY,
        }
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
        }
        break
      }
      case 'zhe_end': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        jointsMap['tiao_start'] = {
          x: glyph.tempData['tiao_start'].x + deltaX,
          y: glyph.tempData['tiao_start'].y + deltaY,
        }
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
        }
        break
      }
      case 'tiao_start': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        jointsMap['tiao_start'] = {
          x: glyph.tempData['tiao_start'].x + deltaX,
          y: glyph.tempData['tiao_start'].y + deltaY,
        }
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
        }
        break
      }
      case 'tiao_end': {
        jointsMap['tiao_end'] = {
          x: glyph.tempData['tiao_end'].x + deltaX,
          y: glyph.tempData['tiao_end'].y + deltaY,
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
    glyph.setParam('横-水平延伸', _params.heng_horizontalSpan)
    glyph.setParam('横-竖直延伸', _params.heng_verticalSpan)
    glyph.setParam('折-水平延伸', _params.zhe_horizontalSpan)
    glyph.setParam('折-竖直延伸', _params.zhe_verticalSpan)
    glyph.setParam('挑-水平延伸', _params.tiao_horizontalSpan)
    glyph.setParam('挑-竖直延伸', _params.tiao_verticalSpan)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_heng_zhe_tiao,
  bindSkeletonGlyph_heng_zhe_tiao,
  updateSkeletonListener_after_bind_heng_zhe_tiao,
  updateSkeletonListener_before_bind_heng_zhe_tiao,
}