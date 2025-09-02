import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 横折弯钩的骨架转骨骼函数
export const skeletonToBones_heng_zhe_wan_gou = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { heng_start, heng_end, zhe_start, zhe_bend, zhe_end, wan_start, wan_end, gou_start, gou_end } = skeleton;
  
  // 横的部分 - 直线段
  const hengLength = Math.sqrt((heng_end.x - heng_start.x) ** 2 + (heng_end.y - heng_start.y) ** 2);
  const hengSegments = Math.max(minSegment, Math.ceil(hengLength / 20));
  
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
  
      // 折的部分 - 贝塞尔曲线段
    const zheSegments = maxSegment;
  for (let i = 0; i < zheSegments; i++) {
    const t1 = i / zheSegments;
    const t2 = (i + 1) / zheSegments;
    
    const p1 = quadraticBezierPoint(zhe_start, zhe_bend, zhe_end, t1);
    const p2 = quadraticBezierPoint(zhe_start, zhe_bend, zhe_end, t2);
    
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
    
    // 连接到横的最后一个骨骼
    if (i === 0) {
      bone.parent = `heng_segment_${hengSegments - 1}`;
      bones[hengSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `zhe_segment_${i - 1}`;
      bones[bones.length - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 弯的部分 - 直线段
  const wanLength = Math.sqrt((wan_end.x - wan_start.x) ** 2 + (wan_end.y - wan_start.y) ** 2);
  const wanSegments = Math.max(minSegment, Math.ceil(wanLength / 20));
  
  for (let i = 0; i < wanSegments; i++) {
    const t1 = i / wanSegments;
    const t2 = (i + 1) / wanSegments;
    
    const p1 = {
      x: wan_start.x + (wan_end.x - wan_start.x) * t1,
      y: wan_start.y + (wan_end.y - wan_start.y) * t1
    };
    const p2 = {
      x: wan_start.x + (wan_end.x - wan_start.x) * t2,
      y: wan_start.y + (wan_end.y - wan_start.y) * t2
    };
    
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
    
    // 连接到折的最后一个骨骼
    if (i === 0) {
      bone.parent = `zhe_segment_${zheSegments - 1}`;
      bones[bones.length - 1].children.push(bone.id);
    } else {
      bone.parent = `wan_segment_${i - 1}`;
      bones[bones.length - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 钩的部分 - 直线段
  const gouLength = Math.sqrt((gou_end.x - gou_start.x) ** 2 + (gou_end.y - gou_start.y) ** 2);
  const gouSegments = Math.max(minSegment, Math.ceil(gouLength / 20));
  
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
    
    // 连接到弯的最后一个骨骼
    if (i === 0) {
      bone.parent = `wan_segment_${wanSegments - 1}`;
      bones[bones.length - 1].children.push(bone.id);
    } else {
      bone.parent = `gou_segment_${i - 1}`;
      bones[bones.length - 1].children.push(bone.id);
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

const instanceBasicGlyph_heng_zhe_wan_gou = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    heng_length: glyph.getParam('横-长度'),
    zhe_horizonalSpan: glyph.getParam('折-水平延伸'),
    zhe_verticalSpan: glyph.getParam('折-竖直延伸'),
    zhe_bendCursor: glyph.getParam('折-弯曲游标'),
    zhe_bendDegree: Number(glyph.getParam('折-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1),
    wan_length: glyph.getParam('弯-长度'),
    gou_horizonalSpan: glyph.getParam('钩-水平延伸'),
    gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_heng_zhe_wan_gou = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_heng_zhe_wan_gou(plainGlyph)
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
    heng_length,
    zhe_horizonalSpan,
    zhe_verticalSpan,
    zhe_bendCursor,
    zhe_bendDegree,
    wan_length,
    gou_horizonalSpan,
    gou_verticalSpan,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 350 + _ox || 0
  const y0 = 300 + _oy || 0

  // 横
  const heng_start = new FP.Joint(
    'heng_start',
    {
      x: x0,
      y: y0,
    },
  )
  const heng_end = new FP.Joint(
    'heng_end',
    {
      x: heng_start.x + heng_length,
      y: heng_start.y,
    },
  )

  // 折
  const zhe_start = new FP.Joint(
    'zhe_start',
    {
      x: heng_start.x + heng_length,
      y: heng_start.y,
    },
  )
  const zhe_end = new FP.Joint(
    'zhe_end',
    {
      x: zhe_start.x - zhe_horizonalSpan,
      y: zhe_start.y + zhe_verticalSpan,
    },
  )

  const zhe_length = distance(zhe_start, zhe_end)
  const zhe_cursor_x = zhe_start.x - zhe_bendCursor * zhe_horizonalSpan
  const zhe_cursor_y = zhe_start.y + zhe_bendCursor * zhe_verticalSpan
  const zhe_angle = Math.atan2(zhe_verticalSpan, zhe_horizonalSpan)

  const zhe_bend = new FP.Joint(
    'zhe_bend',
    {
      x: zhe_cursor_x - zhe_bendDegree * Math.sin(zhe_angle),
      y: zhe_cursor_y - zhe_bendDegree * Math.cos(zhe_angle),
    },
  )

  // 弯
  const wan_start = new FP.Joint(
    'wan_start',
    {
      x: zhe_start.x - zhe_horizonalSpan,
      y: zhe_start.y + zhe_verticalSpan,
    },
  )
  const wan_end = new FP.Joint(
    'wan_end',
    {
      x: wan_start.x + wan_length,
      y: wan_start.y,
    },
  )

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: wan_start.x + wan_length,
      y: wan_start.y,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x + gou_horizonalSpan,
      y: gou_start.y - gou_verticalSpan,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(zhe_start)
  glyph.addJoint(zhe_bend)
  glyph.addJoint(zhe_end)
  glyph.addJoint(wan_start)
  glyph.addJoint(wan_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    heng_start,
    heng_end,
    zhe_start,
    zhe_bend,
    zhe_end,
    wan_start,
    wan_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
  glyph.addRefLine(refline(zhe_start, zhe_bend))
  glyph.addRefLine(refline(zhe_bend, zhe_end))
  glyph.addRefLine(refline(wan_start, wan_end))
  glyph.addRefLine(refline(gou_start, gou_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { heng_start, heng_end, zhe_start, zhe_end, zhe_bend, wan_start, wan_end, gou_start, gou_end } = jointsMap
  const heng_length_range = glyph.getParamRange('横-长度')
  const zhe_horizonal_span_range = glyph.getParamRange('折-水平延伸')
  const zhe_vertical_span_range = glyph.getParamRange('折-竖直延伸')
  const zhe_bend_cursor_range = glyph.getParamRange('折-弯曲游标')
  const zhe_bend_degree_range = glyph.getParamRange('折-弯曲度')
  const wan_length_range = glyph.getParamRange('弯-长度')
  const gou_horizonal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const heng_length = range(heng_end.x - heng_start.x, heng_length_range)
  const zhe_horizonalSpan = range(zhe_start.x - zhe_end.x, zhe_horizonal_span_range)
  const zhe_verticalSpan = range(zhe_end.y - zhe_start.y, zhe_vertical_span_range)
  const zhe_data = FP.distanceAndFootPoint(zhe_start, zhe_end, zhe_bend)
  const zhe_bendCursor = range(zhe_data.percentageFromA, zhe_bend_cursor_range)
  const zhe_bendDegree = range(zhe_data.distance, zhe_bend_degree_range)
  const wan_length = range(wan_end.x - wan_start.x, wan_length_range)
  const gou_horizonalSpan = range(gou_end.x - gou_start.x, gou_horizonal_span_range)
  const gou_verticalSpan = range(gou_start.y - gou_end.y, gou_vertical_span_range)
  return {
    heng_length,
    zhe_horizonalSpan,
    zhe_verticalSpan,
    zhe_bendCursor,
    zhe_bendDegree,
    wan_length,
    gou_verticalSpan,
    gou_horizonalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_heng_zhe_wan_gou = (glyph: CustomGlyph) => {
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
          jointsMap[key] = {
            x: glyph.tempData[key].x + deltaX,
            y: glyph.tempData[key].y + deltaY,
          }
        })
        break
      }
      case 'heng_end': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y,
        }
        jointsMap['zhe_bend'] = {
          x: glyph.tempData['zhe_bend'].x + deltaX,
          y: glyph.tempData['zhe_bend'].y,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y,
        }
        jointsMap['wan_start'] = {
          x: glyph.tempData['wan_start'].x + deltaX,
          y: glyph.tempData['wan_start'].y,
        }
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y,
        }
        break
      }
      case 'zhe_start': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y,
        }
        jointsMap['zhe_bend'] = {
          x: glyph.tempData['zhe_bend'].x + deltaX,
          y: glyph.tempData['zhe_bend'].y,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y,
        }
        jointsMap['wan_start'] = {
          x: glyph.tempData['wan_start'].x + deltaX,
          y: glyph.tempData['wan_start'].y,
        }
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y,
        }
        break
      }
      case 'zhe_bend': {
        jointsMap['zhe_bend'] = {
          x: glyph.tempData['zhe_bend'].x + deltaX,
          y: glyph.tempData['zhe_bend'].y + deltaY,
        }
        break
      }
      case 'zhe_end': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['zhe_start'], jointsMap['zhe_end'], glyph.tempData.zhe_bendCursor, glyph.tempData.zhe_bendDegree)
        jointsMap['zhe_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['wan_start'] = {
          x: glyph.tempData['wan_start'].x + deltaX,
          y: glyph.tempData['wan_start'].y  + deltaY,
        }
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y + deltaY,
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
      case 'wan_start': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['zhe_start'], jointsMap['zhe_end'], glyph.tempData.zhe_bendCursor, glyph.tempData.zhe_bendDegree)
        jointsMap['zhe_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['wan_start'] = {
          x: glyph.tempData['wan_start'].x + deltaX,
          y: glyph.tempData['wan_start'].y  + deltaY,
        }
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y + deltaY,
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
      case 'wan_end': {
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y,
        }
        break
      }
      case 'gou_start': {
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y,
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
    glyph.tempData.zhe_bendCursor = glyph.getParam('折-弯曲游标')
    glyph.tempData.zhe_bendDegree = Number(glyph.getParam('折-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
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
    glyph.setParam('横-长度', _params.heng_length)
    glyph.setParam('折-水平延伸', _params.zhe_horizonalSpan)
    glyph.setParam('折-竖直延伸', _params.zhe_verticalSpan)
    glyph.setParam('折-弯曲游标', _params.zhe_bendCursor)
    glyph.setParam('折-弯曲度', _params.zhe_bendDegree - 30 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.setParam('弯-长度', _params.wan_length)
    glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
    glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_heng_zhe_wan_gou = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'heng_end': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y,
        }
        jointsMap['zhe_bend'] = {
          x: glyph.tempData['zhe_bend'].x + deltaX,
          y: glyph.tempData['zhe_bend'].y,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y,
        }
        jointsMap['wan_start'] = {
          x: glyph.tempData['wan_start'].x + deltaX,
          y: glyph.tempData['wan_start'].y,
        }
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y,
        }
        break
      }
      case 'zhe_start': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['zhe_start'] = {
          x: glyph.tempData['zhe_start'].x + deltaX,
          y: glyph.tempData['zhe_start'].y,
        }
        jointsMap['zhe_bend'] = {
          x: glyph.tempData['zhe_bend'].x + deltaX,
          y: glyph.tempData['zhe_bend'].y,
        }
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y,
        }
        jointsMap['wan_start'] = {
          x: glyph.tempData['wan_start'].x + deltaX,
          y: glyph.tempData['wan_start'].y,
        }
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y,
        }
        break
      }
      case 'zhe_bend': {
        jointsMap['zhe_bend'] = {
          x: glyph.tempData['zhe_bend'].x + deltaX,
          y: glyph.tempData['zhe_bend'].y + deltaY,
        }
        break
      }
      case 'zhe_end': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['zhe_start'], jointsMap['zhe_end'], glyph.tempData.zhe_bendCursor, glyph.tempData.zhe_bendDegree)
        jointsMap['zhe_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['wan_start'] = {
          x: glyph.tempData['wan_start'].x + deltaX,
          y: glyph.tempData['wan_start'].y  + deltaY,
        }
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y + deltaY,
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
      case 'wan_start': {
        jointsMap['zhe_end'] = {
          x: glyph.tempData['zhe_end'].x + deltaX,
          y: glyph.tempData['zhe_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['zhe_start'], jointsMap['zhe_end'], glyph.tempData.zhe_bendCursor, glyph.tempData.zhe_bendDegree)
        jointsMap['zhe_bend'] = {
          x: newBend.x,
          y: newBend.y,
        }
        jointsMap['wan_start'] = {
          x: glyph.tempData['wan_start'].x + deltaX,
          y: glyph.tempData['wan_start'].y  + deltaY,
        }
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y + deltaY,
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
      case 'wan_end': {
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y,
        }
        break
      }
      case 'gou_start': {
        jointsMap['wan_end'] = {
          x: glyph.tempData['wan_end'].x + deltaX,
          y: glyph.tempData['wan_end'].y,
        }
        jointsMap['gou_start'] = {
          x: glyph.tempData['gou_start'].x + deltaX,
          y: glyph.tempData['gou_start'].y,
        }
        jointsMap['gou_end'] = {
          x: glyph.tempData['gou_end'].x + deltaX,
          y: glyph.tempData['gou_end'].y,
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
    glyph.tempData.zhe_bendCursor = glyph.getParam('折-弯曲游标')
    glyph.tempData.zhe_bendDegree = Number(glyph.getParam('折-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
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
    glyph.setParam('横-长度', _params.heng_length)
    glyph.setParam('折-水平延伸', _params.zhe_horizonalSpan)
    glyph.setParam('折-竖直延伸', _params.zhe_verticalSpan)
    glyph.setParam('折-弯曲游标', _params.zhe_bendCursor)
    glyph.setParam('折-弯曲度', _params.zhe_bendDegree - 30 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.setParam('弯-长度', _params.wan_length)
    glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
    glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_heng_zhe_wan_gou,
  bindSkeletonGlyph_heng_zhe_wan_gou,
  updateSkeletonListener_after_bind_heng_zhe_wan_gou,
  updateSkeletonListener_before_bind_heng_zhe_wan_gou,
}