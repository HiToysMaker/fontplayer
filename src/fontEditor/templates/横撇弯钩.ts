import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 横撇弯钩的骨架转骨骼函数
export const skeletonToBones_heng_pie_wan_gou = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { heng_start, heng_end, pie_start, pie_end, pie_bend, wangou_start, wangou_end, wangou_bend } = skeleton;
  
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
    
    if (i === 0) {
      // 第一个撇段连接到最后一个横段
      bone.parent = `heng_segment_${hengSegments - 1}`;
      bones[hengSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `pie_segment_${i - 1}`;
      bones[hengSegments + i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 弯钩的部分 - 贝塞尔曲线段
  const wangouSegments = maxSegment;
  for (let i = 0; i < wangouSegments; i++) {
    const t1 = i / wangouSegments;
    const t2 = (i + 1) / wangouSegments;
    
    const p1 = quadraticBezierPoint(wangou_start, wangou_bend, wangou_end, t1);
    const p2 = quadraticBezierPoint(wangou_start, wangou_bend, wangou_end, t2);
    
    const bone: any = {
      id: `wangou_segment_${i}`,
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
      // 第一个弯钩段连接到最后一个撇段
      bone.parent = `pie_segment_${pieSegments - 1}`;
      bones[hengSegments + pieSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `wangou_segment_${i - 1}`;
      bones[hengSegments + pieSegments + i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 钩的部分 - 贝塞尔曲线段
  const gouLength = Math.sqrt((wangou_end.x - wangou_start.x) ** 2 + (wangou_end.y - wangou_start.y) ** 2);
  const gouSegments = maxSegment//Math.max(minSegment, Math.ceil(gouLength / 20));
  for (let i = 0; i < gouSegments; i++) {
    const t1 = i / gouSegments;
    const t2 = (i + 1) / gouSegments;
    
    const p1 = quadraticBezierPoint(wangou_start, wangou_bend, wangou_end, t1);
    const p2 = quadraticBezierPoint(wangou_start, wangou_bend, wangou_end, t2);
    
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
      // 第一个钩段连接到最后一个弯钩段
      bone.parent = `wangou_segment_${wangouSegments - 1}`;
      bones[hengSegments + pieSegments + wangouSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `gou_segment_${i - 1}`;
      bones[hengSegments + pieSegments + wangouSegments + i - 1].children.push(bone.id);
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

const instanceBasicGlyph_heng_pie_wan_gou = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    heng_length: glyph.getParam('横-长度'),
    pie_horizonalSpan: glyph.getParam('撇-水平延伸'),
    pie_verticalSpan: glyph.getParam('撇-竖直延伸'),
    wangou_verticalSpan: glyph.getParam('弯钩-竖直延伸'),
    wangou_bendCursor: glyph.getParam('弯钩-弯曲游标'),
    wangou_bendDegree: Number(glyph.getParam('弯钩-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_heng_pie_wan_gou = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_heng_pie_wan_gou(plainGlyph)
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
    pie_horizonalSpan,
    pie_verticalSpan,
    wangou_verticalSpan,
    wangou_bendCursor,
    wangou_bendDegree,
    skeletonRefPos,
    weight,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 370 + _ox || 0
  const y0 = 245 + _oy || 0

  // 横
  let heng_start, heng_end
  const heng_start_ref = new FP.Joint(
    'heng_start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const heng_end_ref = new FP.Joint(
    'heng_end_ref',
    {
      x: heng_start_ref.x + heng_length,
      y: heng_start_ref.y,
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

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: heng_start.x + heng_length,
      y: heng_start.y,
    },
  )
  const pie_end = new FP.Joint(
    'pie_end',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  // 弯钩
  const wangou_start = new FP.Joint(
    'wangou_start',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )
  const wangou_end = new FP.Joint(
    'wangou_end',
    {
      x: wangou_start.x,
      y: wangou_start.y + wangou_verticalSpan,
    },
  )

  const wangou_length = distance(wangou_start, wangou_end)
  const wangou_cursor_x = wangou_start.x
  const wangou_cursor_y = wangou_start.y + wangou_bendCursor * wangou_verticalSpan

  const wangou_bend = new FP.Joint(
    'wangou_bend',
    {
      x: wangou_cursor_x + wangou_bendDegree,
      y: wangou_cursor_y,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(pie_start)
  glyph.addJoint(pie_end)
  glyph.addJoint(wangou_start)
  glyph.addJoint(wangou_bend)
  glyph.addJoint(wangou_end)

  const skeleton = {
    heng_start,
    heng_end,
    pie_start,
    pie_end,
    wangou_start,
    wangou_bend,
    wangou_end,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
  glyph.addRefLine(refline(pie_start, pie_end))
  glyph.addRefLine(refline(wangou_start, wangou_bend))
  glyph.addRefLine(refline(wangou_bend, wangou_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { heng_start, heng_end, pie_start, pie_end, wangou_start, wangou_bend, wangou_end } = jointsMap
  const heng_length_range = glyph.getParamRange('横-长度')
  const pie_horizonal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const wangou_vertical_span_range = glyph.getParamRange('弯钩-竖直延伸')
  const wangou_bend_cursor_range = glyph.getParamRange('弯钩-弯曲游标')
  const wangou_bend_degree_range = glyph.getParamRange('弯钩-弯曲度')
  const heng_length = range(heng_end.x - heng_start.x, heng_length_range)
  const pie_horizonalSpan = range(pie_start.x - pie_end.x, pie_horizonal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const wangou_verticalSpan = range(wangou_end.y - wangou_start.y, wangou_vertical_span_range)
  const wangou_bendCursor = range((wangou_bend.y - wangou_start.y) / wangou_verticalSpan, wangou_bend_cursor_range)
  const wangou_bendDegree = range(wangou_bend.x - wangou_start.x, wangou_bend_degree_range)
  return {
    heng_length,
    pie_horizonalSpan,
    pie_verticalSpan,
    wangou_verticalSpan,
    wangou_bendCursor,
    wangou_bendDegree,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_heng_pie_wan_gou = (glyph: CustomGlyph) => {
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
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        jointsMap['wangou_start'] = {
          x: glyph.tempData['wangou_start'].x + deltaX,
          y: glyph.tempData['wangou_start'].y,
        }
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y,
        }
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x + deltaX,
          y: glyph.tempData['wangou_end'].y,
        }
        break
      }
      case 'pie_start': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        jointsMap['wangou_start'] = {
          x: glyph.tempData['wangou_start'].x + deltaX,
          y: glyph.tempData['wangou_start'].y,
        }
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y,
        }
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x + deltaX,
          y: glyph.tempData['wangou_end'].y,
        }
        break
      }
      case 'pie_end': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        jointsMap['wangou_start'] = {
          x: glyph.tempData['wangou_start'].x + deltaX,
          y: glyph.tempData['wangou_start'].y + deltaY,
        }
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y + deltaY,
        }
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x + deltaX,
          y: glyph.tempData['wangou_end'].y + deltaY,
        }
        break
      }
      case 'wangou_start': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        jointsMap['wangou_start'] = {
          x: glyph.tempData['wangou_start'].x + deltaX,
          y: glyph.tempData['wangou_start'].y + deltaY,
        }
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y + deltaY,
        }
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x + deltaX,
          y: glyph.tempData['wangou_end'].y + deltaY,
        }
        break
      }
      case 'wangou_bend': {
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y + deltaY,
        }
        break
      }
      case 'wangou_end': {
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x,
          y: glyph.tempData['wangou_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['wangou_start'], jointsMap['wangou_end'], glyph.tempData.wangou_bendCursor, glyph.tempData.wangou_bendDegree)
        jointsMap['wangou_bend'] = {
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
    glyph.tempData.bendCursor = glyph.getParam('弯钩-弯曲游标')
    glyph.tempData.bendDegree = Number(glyph.getParam('弯钩-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
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
    glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
    glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
    glyph.setParam('弯钩-竖直延伸', _params.wangou_verticalSpan)
    glyph.setParam('弯钩-弯曲游标', _params.wangou_bendCursor)
    glyph.setParam('弯钩-弯曲度', _params.wangou_bendDegree - 30 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_heng_pie_wan_gou = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'heng_end': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        jointsMap['wangou_start'] = {
          x: glyph.tempData['wangou_start'].x + deltaX,
          y: glyph.tempData['wangou_start'].y,
        }
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y,
        }
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x + deltaX,
          y: glyph.tempData['wangou_end'].y,
        }
        break
      }
      case 'pie_start': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        jointsMap['wangou_start'] = {
          x: glyph.tempData['wangou_start'].x + deltaX,
          y: glyph.tempData['wangou_start'].y,
        }
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y,
        }
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x + deltaX,
          y: glyph.tempData['wangou_end'].y,
        }
        break
      }
      case 'pie_end': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        jointsMap['wangou_start'] = {
          x: glyph.tempData['wangou_start'].x + deltaX,
          y: glyph.tempData['wangou_start'].y + deltaY,
        }
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y + deltaY,
        }
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x + deltaX,
          y: glyph.tempData['wangou_end'].y + deltaY,
        }
        break
      }
      case 'wangou_start': {
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        jointsMap['wangou_start'] = {
          x: glyph.tempData['wangou_start'].x + deltaX,
          y: glyph.tempData['wangou_start'].y + deltaY,
        }
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y + deltaY,
        }
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x + deltaX,
          y: glyph.tempData['wangou_end'].y + deltaY,
        }
        break
      }
      case 'wangou_bend': {
        jointsMap['wangou_bend'] = {
          x: glyph.tempData['wangou_bend'].x + deltaX,
          y: glyph.tempData['wangou_bend'].y + deltaY,
        }
        break
      }
      case 'wangou_end': {
        jointsMap['wangou_end'] = {
          x: glyph.tempData['wangou_end'].x,
          y: glyph.tempData['wangou_end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['wangou_start'], jointsMap['wangou_end'], glyph.tempData.wangou_bendCursor, glyph.tempData.wangou_bendDegree)
        jointsMap['wangou_bend'] = {
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
    glyph.tempData.wangou_bendCursor = glyph.getParam('弯钩-弯曲游标')
    glyph.tempData.wangou_bendDegree = Number(glyph.getParam('弯钩-弯曲度')) + 30 * Number(glyph.getParam('弯曲程度') || 1)
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
    glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
    glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
    glyph.setParam('弯钩-竖直延伸', _params.wangou_verticalSpan)
    glyph.setParam('弯钩-弯曲游标', _params.wangou_bendCursor)
    glyph.setParam('弯钩-弯曲度', _params.wangou_bendDegree - 30 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_heng_pie_wan_gou,
  bindSkeletonGlyph_heng_pie_wan_gou,
  updateSkeletonListener_after_bind_heng_pie_wan_gou,
  updateSkeletonListener_before_bind_heng_pie_wan_gou,
}