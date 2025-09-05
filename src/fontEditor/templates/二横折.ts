import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 二横折的骨架转骨骼函数
export const skeletonToBones_er_heng_zhe = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { heng1_start, heng1_end, zhe1_start, zhe1_end, heng2_start, heng2_end, zhe2_start, zhe2_end } = skeleton;
  
  // 横1的部分 - 直线段
  const heng1Length = Math.sqrt((heng1_end.x - heng1_start.x) ** 2 + (heng1_end.y - heng1_start.y) ** 2);
  const heng1Segments = maxSegment//Math.max(minSegment, Math.ceil(heng1Length / 20));
  
  for (let i = 0; i < heng1Segments; i++) {
    const t1 = i / heng1Segments;
    const t2 = (i + 1) / heng1Segments;
    
    const p1 = {
      x: heng1_start.x + (heng1_end.x - heng1_start.x) * t1,
      y: heng1_start.y + (heng1_end.y - heng1_start.y) * t1
    };
    const p2 = {
      x: heng1_start.x + (heng1_end.x - heng1_start.x) * t2,
      y: heng1_start.y + (heng1_end.y - heng1_start.y) * t2
    };
    
    const bone: any = {
      id: `heng1_segment_${i}`,
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
      bone.parent = `heng1_segment_${i - 1}`;
      bones[i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 折1的部分 - 直线段
  const zhe1Length = Math.sqrt((zhe1_end.x - zhe1_start.x) ** 2 + (zhe1_end.y - zhe1_start.y) ** 2);
  const zhe1Segments = maxSegment//Math.max(minSegment, Math.ceil(zhe1Length / 20));
  
  for (let i = 0; i < zhe1Segments; i++) {
    const t1 = i / zhe1Segments;
    const t2 = (i + 1) / zhe1Segments;
    
    const p1 = {
      x: zhe1_start.x + (zhe1_end.x - zhe1_start.x) * t1,
      y: zhe1_start.y + (zhe1_end.y - zhe1_start.y) * t1
    };
    const p2 = {
      x: zhe1_start.x + (zhe1_end.x - zhe1_start.x) * t2,
      y: zhe1_start.y + (zhe1_end.y - zhe1_start.y) * t2
    };
    
    const bone: any = {
      id: `zhe1_segment_${i}`,
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
      // 第一个折1段连接到最后一个横1段
      bone.parent = `heng1_segment_${heng1Segments - 1}`;
      bones[heng1Segments - 1].children.push(bone.id);
    } else {
      bone.parent = `zhe1_segment_${i - 1}`;
      bones[heng1Segments + i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 横2的部分 - 直线段
  const heng2Length = Math.sqrt((heng2_end.x - heng2_start.x) ** 2 + (heng2_end.y - heng2_start.y) ** 2);
  const heng2Segments = maxSegment//Math.max(minSegment, Math.ceil(heng2Length / 20));
  
  for (let i = 0; i < heng2Segments; i++) {
    const t1 = i / heng2Segments;
    const t2 = (i + 1) / heng2Segments;
    
    const p1 = {
      x: heng2_start.x + (heng2_end.x - heng2_start.x) * t1,
      y: heng2_start.y + (heng2_end.y - heng2_start.y) * t1
    };
    const p2 = {
      x: heng2_start.x + (heng2_end.x - heng2_start.x) * t2,
      y: heng2_start.y + (heng2_end.y - heng2_start.y) * t2
    };
    
    const bone: any = {
      id: `heng2_segment_${i}`,
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
      // 第一个横2段连接到最后一个折1段
      bone.parent = `zhe1_segment_${zhe1Segments - 1}`;
      bones[heng1Segments + zhe1Segments - 1].children.push(bone.id);
    } else {
      bone.parent = `heng2_segment_${i - 1}`;
      bones[heng1Segments + zhe1Segments + i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 折2的部分 - 直线段
  const zhe2Length = Math.sqrt((zhe2_end.x - zhe2_start.x) ** 2 + (zhe2_end.y - zhe2_start.y) ** 2);
  const zhe2Segments = maxSegment//Math.max(minSegment, Math.ceil(zhe2Length / 20));
  
  for (let i = 0; i < zhe2Segments; i++) {
    const t1 = i / zhe2Segments;
    const t2 = (i + 1) / zhe2Segments;
    
    const p1 = {
      x: zhe2_start.x + (zhe2_end.x - zhe2_start.x) * t1,
      y: zhe2_start.y + (zhe2_end.y - zhe2_start.y) * t1
    };
    const p2 = {
      x: zhe2_start.x + (zhe2_end.x - zhe2_start.x) * t2,
      y: zhe2_start.y + (zhe2_end.y - zhe2_start.y) * t2
    };
    
    const bone: any = {
      id: `zhe2_segment_${i}`,
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
      // 第一个折2段连接到最后一个横2段
      bone.parent = `heng2_segment_${heng2Segments - 1}`;
      bones[heng1Segments + zhe1Segments + heng2Segments - 1].children.push(bone.id);
    } else {
      bone.parent = `zhe2_segment_${i - 1}`;
      bones[heng1Segments + zhe1Segments + heng2Segments + i - 1].children.push(bone.id);
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

const instanceBasicGlyph_er_heng_zhe = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    heng1_length: glyph.getParam('横1-长度'),
    zhe1_horizonalSpan: glyph.getParam('折1-水平延伸'),
    zhe1_verticalSpan: glyph.getParam('折1-竖直延伸'),
    heng2_length: glyph.getParam('横2-长度'),
    zhe2_horizonalSpan: glyph.getParam('折2-水平延伸'),
    zhe2_verticalSpan: glyph.getParam('折2-竖直延伸'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_er_heng_zhe = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_er_heng_zhe(plainGlyph)
  }
  glyphSkeletonBind(plainGlyph._o)
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const updateGlyphByParams = (params, glyph) => {
  const {
    heng1_length,
    zhe1_horizonalSpan,
    zhe1_verticalSpan,
    heng2_length,
    zhe2_horizonalSpan,
    zhe2_verticalSpan,
    skeletonRefPos,
    weight,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 250 + _ox || 0
  const y0 = 295 + _oy || 0

  // 横1
  let heng1_start, heng1_end
  const heng1_start_ref = new FP.Joint(
    'heng1_start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const heng1_end_ref = new FP.Joint(
    'heng1_end_ref',
    {
      x: heng1_start_ref.x + heng1_length,
      y: heng1_start_ref.y,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    heng1_start = new FP.Joint(
      'heng1_start',
      {
        x: heng1_start_ref.x,
        y: heng1_start_ref.y + weight / 2,
      },
    )
    heng1_end = new FP.Joint(
      'heng1_end',
      {
        x: heng1_end_ref.x,
        y: heng1_end_ref.y + weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    heng1_start = new FP.Joint(
      'heng1_start',
      {
        x: heng1_start_ref.x,
        y: heng1_start_ref.y - weight / 2,
      },
    )
    heng1_end = new FP.Joint(
      'heng1_end',
      {
        x: heng1_end_ref.x,
        y: heng1_end_ref.y - weight / 2,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    heng1_start = new FP.Joint(
      'heng1_start',
      {
        x: heng1_start_ref.x,
        y: heng1_start_ref.y,
      },
    )
    heng1_end = new FP.Joint(
      'heng1_end',
      {
        x: heng1_end_ref.x,
        y: heng1_end_ref.y,
      },
    )
  }
  glyph.addJoint(heng1_start_ref)
  glyph.addJoint(heng1_end_ref)
  glyph.addRefLine(refline(heng1_start_ref, heng1_end_ref, 'ref'))

  // 折1
  const zhe1_start = new FP.Joint(
    'zhe1_start',
    {
      x: heng1_start.x + heng1_length,
      y: heng1_start.y,
    },
  )
  const zhe1_end = new FP.Joint(
    'zhe1_end',
    {
      x: zhe1_start.x - zhe1_horizonalSpan,
      y: zhe1_start.y + zhe1_verticalSpan,
    },
  )

  // 横2
  const heng2_start = new FP.Joint(
    'heng2_start',
    {
      x: zhe1_start.x - zhe1_horizonalSpan,
      y: zhe1_start.y + zhe1_verticalSpan,
    },
  )
  const heng2_end = new FP.Joint(
    'heng2_end',
    {
      x: heng2_start.x + heng2_length,
      y: heng2_start.y,
    },
  )

  // 折2
  const zhe2_start = new FP.Joint(
    'zhe2_start',
    {
      x: heng2_start.x + heng2_length,
      y: heng2_start.y,
    },
  )
  const zhe2_end = new FP.Joint(
    'zhe2_end',
    {
      x: zhe2_start.x - zhe2_horizonalSpan,
      y: zhe2_start.y + zhe2_verticalSpan,
    },
  )

  glyph.addJoint(heng1_start)
  glyph.addJoint(heng1_end)
  glyph.addJoint(zhe1_start)
  glyph.addJoint(zhe1_end)
  glyph.addJoint(heng2_start)
  glyph.addJoint(heng2_end)
  glyph.addJoint(zhe2_start)
  glyph.addJoint(zhe2_end)

  const skeleton = {
    heng1_start,
    heng1_end,
    zhe1_start,
    zhe1_end,
    heng2_start,
    heng2_end,
    zhe2_start,
    zhe2_end,
  }

  glyph.addRefLine(refline(heng1_start, heng1_end))
  glyph.addRefLine(refline(zhe1_start, zhe1_end))
  glyph.addRefLine(refline(heng2_start, heng2_end))
  glyph.addRefLine(refline(zhe2_start, zhe2_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { heng1_start, heng1_end, zhe1_start, zhe1_end, heng2_start, heng2_end, zhe2_start, zhe2_end } = jointsMap
  const heng1_length_range = glyph.getParamRange('横1-长度')
  const zhe1_horizonal_span_range = glyph.getParamRange('折1-水平延伸')
  const zhe1_vertical_span_range = glyph.getParamRange('折1-竖直延伸')
  const heng2_length_range = glyph.getParamRange('横2-长度')
  const zhe2_horizonal_span_range = glyph.getParamRange('折2-水平延伸')
  const zhe2_vertical_span_range = glyph.getParamRange('折2-竖直延伸')
  const heng1_length = range(heng1_end.x - heng1_start.x, heng1_length_range)
  const zhe1_horizonalSpan = range(zhe1_start.x - zhe1_end.x, zhe1_horizonal_span_range)
  const zhe1_verticalSpan = range(zhe1_end.y - zhe1_start.y, zhe1_vertical_span_range)
  const heng2_length = range(heng2_end.x - heng2_start.x, heng2_length_range)
  const zhe2_horizonalSpan = range(zhe2_start.x - zhe2_end.x, zhe2_horizonal_span_range)
  const zhe2_verticalSpan = range(zhe2_end.y - zhe2_start.y, zhe2_vertical_span_range)
  return {
    heng1_length,
    zhe1_horizonalSpan,
    zhe1_verticalSpan,
    heng2_length,
    zhe2_horizonalSpan,
    zhe2_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_er_heng_zhe = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'heng1_start': {
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
      case 'heng1_end': {
        jointsMap['heng1_end'] = {
          x: glyph.tempData['heng1_end'].x + deltaX,
          y: glyph.tempData['heng1_end'].y,
        }
        jointsMap['zhe1_start'] = {
          x: glyph.tempData['zhe1_start'].x + deltaX,
          y: glyph.tempData['zhe1_start'].y,
        }
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y,
        }
        jointsMap['heng2_start'] = {
          x: glyph.tempData['heng2_start'].x + deltaX,
          y: glyph.tempData['heng2_start'].y,
        }
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        break
      }
      case 'zhe1_start': {
        jointsMap['heng1_end'] = {
          x: glyph.tempData['heng1_end'].x + deltaX,
          y: glyph.tempData['heng1_end'].y,
        }
        jointsMap['zhe1_start'] = {
          x: glyph.tempData['zhe1_start'].x + deltaX,
          y: glyph.tempData['zhe1_start'].y,
        }
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y,
        }
        jointsMap['heng2_start'] = {
          x: glyph.tempData['heng2_start'].x + deltaX,
          y: glyph.tempData['heng2_start'].y,
        }
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        break
      }
      case 'zhe1_end': {
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y + deltaY,
        }
        jointsMap['heng2_start'] = {
          x: glyph.tempData['heng2_start'].x + deltaX,
          y: glyph.tempData['heng2_start'].y + deltaY,
        }
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y + deltaY,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y + deltaY,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
        }
        break
      }
      case 'heng2_start': {
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y + deltaY,
        }
        jointsMap['heng2_start'] = {
          x: glyph.tempData['heng2_start'].x + deltaX,
          y: glyph.tempData['heng2_start'].y + deltaY,
        }
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y + deltaY,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y + deltaY,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
        }
        break
      }
      case 'heng2_end': {
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        break
      }
      case 'zhe2_start': {
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        break
      }
      case 'zhe2_end': {
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
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
    glyph.setParam('横1-长度', _params.heng1_length)
    glyph.setParam('折1-水平延伸', _params.zhe1_horizonalSpan)
    glyph.setParam('折1-竖直延伸', _params.zhe1_verticalSpan)
    glyph.setParam('横2-长度', _params.heng2_length)
    glyph.setParam('折2-水平延伸', _params.zhe2_horizonalSpan)
    glyph.setParam('折2-竖直延伸', _params.zhe2_verticalSpan)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_er_heng_zhe = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'heng1_end': {
        jointsMap['heng1_end'] = {
          x: glyph.tempData['heng1_end'].x + deltaX,
          y: glyph.tempData['heng1_end'].y,
        }
        jointsMap['zhe1_start'] = {
          x: glyph.tempData['zhe1_start'].x + deltaX,
          y: glyph.tempData['zhe1_start'].y,
        }
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y,
        }
        jointsMap['heng2_start'] = {
          x: glyph.tempData['heng2_start'].x + deltaX,
          y: glyph.tempData['heng2_start'].y,
        }
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        break
      }
      case 'zhe1_start': {
        jointsMap['heng1_end'] = {
          x: glyph.tempData['heng1_end'].x + deltaX,
          y: glyph.tempData['heng1_end'].y,
        }
        jointsMap['zhe1_start'] = {
          x: glyph.tempData['zhe1_start'].x + deltaX,
          y: glyph.tempData['zhe1_start'].y,
        }
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y,
        }
        jointsMap['heng2_start'] = {
          x: glyph.tempData['heng2_start'].x + deltaX,
          y: glyph.tempData['heng2_start'].y,
        }
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        break
      }
      case 'zhe1_end': {
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y + deltaY,
        }
        jointsMap['heng2_start'] = {
          x: glyph.tempData['heng2_start'].x + deltaX,
          y: glyph.tempData['heng2_start'].y + deltaY,
        }
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y + deltaY,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y + deltaY,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
        }
        break
      }
      case 'heng2_start': {
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y + deltaY,
        }
        jointsMap['heng2_start'] = {
          x: glyph.tempData['heng2_start'].x + deltaX,
          y: glyph.tempData['heng2_start'].y + deltaY,
        }
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y + deltaY,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y + deltaY,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
        }
        break
      }
      case 'heng2_end': {
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        break
      }
      case 'zhe2_start': {
        jointsMap['heng2_end'] = {
          x: glyph.tempData['heng2_end'].x + deltaX,
          y: glyph.tempData['heng2_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        break
      }
      case 'zhe2_end': {
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
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
    glyph.setParam('横1-长度', _params.heng1_length)
    glyph.setParam('折1-水平延伸', _params.zhe1_horizonalSpan)
    glyph.setParam('折1-竖直延伸', _params.zhe1_verticalSpan)
    glyph.setParam('横2-长度', _params.heng2_length)
    glyph.setParam('折2-水平延伸', _params.zhe2_horizonalSpan)
    glyph.setParam('折2-竖直延伸', _params.zhe2_verticalSpan)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_er_heng_zhe,
  bindSkeletonGlyph_er_heng_zhe,
  updateSkeletonListener_after_bind_er_heng_zhe,
  updateSkeletonListener_before_bind_er_heng_zhe,
}