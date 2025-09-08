import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 横折折撇的骨架转骨骼函数
export const skeletonToBones_heng_zhe_zhe_pie = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { heng_start, heng_end, zhe1_start, zhe1_end, zhe2_start, zhe2_end, pie_start, pie_bend, pie_end } = skeleton;
  
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
      // 第一个折1段连接到最后一个横段
      bone.parent = `heng_segment_${hengSegments - 1}`;
      bones[hengSegments - 1].children.push(bone.id);
    } else {
      bone.parent = `zhe1_segment_${i - 1}`;
      bones[hengSegments + i - 1].children.push(bone.id);
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
      // 第一个折2段连接到最后一个折1段
      bone.parent = `zhe1_segment_${zhe1Segments - 1}`;
      bones[hengSegments + zhe1Segments - 1].children.push(bone.id);
    } else {
      bone.parent = `zhe2_segment_${i - 1}`;
      bones[hengSegments + zhe1Segments + i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 撇的部分 - 分为两段：pie_start到pie_bend，pie_bend到pie_end
  const pie1Length = Math.sqrt((pie_bend.x - pie_start.x) ** 2 + (pie_bend.y - pie_start.y) ** 2);
  const pie1Segments = maxSegment//Math.max(minSegment, Math.ceil(pie1Length / 20));
  
  for (let i = 0; i < pie1Segments; i++) {
    const t1 = i / pie1Segments;
    const t2 = (i + 1) / pie1Segments;
    
    const p1 = {
      x: pie_start.x + (pie_bend.x - pie_start.x) * t1,
      y: pie_start.y + (pie_bend.y - pie_start.y) * t1
    };
    const p2 = {
      x: pie_start.x + (pie_bend.x - pie_start.x) * t2,
      y: pie_start.y + (pie_bend.y - pie_start.y) * t2
    };
    
    const bone: any = {
      id: `pie1_segment_${i}`,
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
      // 第一个撇段连接到最后一个折2段
      bone.parent = `zhe2_segment_${zhe2Segments - 1}`;
      bones[hengSegments + zhe1Segments + zhe2Segments - 1].children.push(bone.id);
    } else {
      bone.parent = `pie1_segment_${i - 1}`;
      bones[hengSegments + zhe1Segments + zhe2Segments + i - 1].children.push(bone.id);
    }
    
    bones.push(bone);
  }
  
  // 撇的第二段：pie_bend到pie_end
  const pie2Length = Math.sqrt((pie_end.x - pie_bend.x) ** 2 + (pie_end.y - pie_bend.y) ** 2);
  const pie2Segments = maxSegment//Math.max(minSegment, Math.ceil(pie2Length / 20));
  
  for (let i = 0; i < pie2Segments; i++) {
    const t1 = i / pie2Segments;
    const t2 = (i + 1) / pie2Segments;
    
    const p1 = {
      x: pie_bend.x + (pie_end.x - pie_bend.x) * t1,
      y: pie_bend.y + (pie_end.y - pie_bend.y) * t1
    };
    const p2 = {
      x: pie_bend.x + (pie_end.x - pie_bend.x) * t2,
      y: pie_bend.y + (pie_end.y - pie_bend.y) * t2
    };
    
    const bone: any = {
      id: `pie2_segment_${i}`,
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
      // 第一个撇2段连接到最后一个撇1段
      bone.parent = `pie1_segment_${pie1Segments - 1}`;
      bones[hengSegments + zhe1Segments + zhe2Segments + pie1Segments - 1].children.push(bone.id);
    } else {
      bone.parent = `pie2_segment_${i - 1}`;
      bones[hengSegments + zhe1Segments + zhe2Segments + pie1Segments + i - 1].children.push(bone.id);
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

const instanceBasicGlyph_heng_zhe_zhe_pie = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    heng_length: glyph.getParam('横-长度'),
    zhe1_horizonalSpan: glyph.getParam('折1-水平延伸'),
    zhe1_verticalSpan: glyph.getParam('折1-竖直延伸'),
    zhe2_length: glyph.getParam('折2-长度'),
    pie_horizonalSpan: glyph.getParam('撇-水平延伸'),
    pie_verticalSpan: glyph.getParam('撇-竖直延伸'),
    pie_bendCursor: glyph.getParam('撇-弯曲游标'),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_heng_zhe_zhe_pie = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_heng_zhe_zhe_pie(plainGlyph)
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
    heng_length,
    zhe1_horizonalSpan,
    zhe1_verticalSpan,
    zhe2_length,
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    skeletonRefPos,
    weight,
  } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 390 + _ox || 0
  const y0 = 185 + _oy || 0

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

  // 折1
  const zhe1_start = new FP.Joint(
    'zhe1_start',
    {
      x: heng_start.x + heng_length,
      y: heng_start.y,
    },
  )
  const zhe1_end = new FP.Joint(
    'zhe1_end',
    {
      x: zhe1_start.x - zhe1_horizonalSpan,
      y: zhe1_start.y + zhe1_verticalSpan,
    },
  )

  // 折2
  const zhe2_start = new FP.Joint(
    'zhe2_start',
    {
      x: zhe1_start.x - zhe1_horizonalSpan,
      y: zhe1_start.y + zhe1_verticalSpan,
    },
  )
  const zhe2_end = new FP.Joint(
    'zhe2_end',
    {
      x: zhe2_start.x + zhe2_length,
      y: zhe2_start.y,
    },
  )

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: zhe2_start.x + zhe2_length,
      y: zhe2_start.y,
    },
  )
  const pie_end = new FP.Joint(
    'pie_end',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  const pie_bend = new FP.Joint(
    'pie_bend',
    {
      x: pie_start.x,
      y: pie_start.y + pie_bendCursor * pie_verticalSpan,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(zhe1_start)
  glyph.addJoint(zhe1_end)
  glyph.addJoint(zhe2_start)
  glyph.addJoint(zhe2_end)
  glyph.addJoint(pie_start)
  glyph.addJoint(pie_end)
  glyph.addJoint(pie_bend)

  const skeleton = {
    heng_start,
    heng_end,
    zhe1_start,
    zhe1_end,
    zhe2_start,
    zhe2_end,
    pie_start,
    pie_end,
    pie_bend,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
  glyph.addRefLine(refline(zhe1_start, zhe1_end))
  glyph.addRefLine(refline(zhe2_start, zhe2_end))
  glyph.addRefLine(refline(pie_start, pie_bend))
  glyph.addRefLine(refline(pie_bend, pie_end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { heng_start, heng_end, zhe1_start, zhe1_end, zhe2_start, zhe2_end, pie_start, pie_bend, pie_end } = jointsMap
  const heng_length_range = glyph.getParamRange('横-长度')
  const zhe1_horizonal_span_range = glyph.getParamRange('折1-水平延伸')
  const zhe1_vertical_span_range = glyph.getParamRange('折1-竖直延伸')
  const zhe2_length_range = glyph.getParamRange('折2-长度')
  const pie_horizonal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const pie_bend_cursor_range = glyph.getParamRange('撇-弯曲游标')
  const heng_length = range(heng_end.x - heng_start.x, heng_length_range)
  const zhe1_horizonalSpan = range(zhe1_start.x - zhe1_end.x, zhe1_horizonal_span_range)
  const zhe1_verticalSpan = range(zhe1_end.y - zhe1_start.y, zhe1_vertical_span_range)
  const zhe2_length = range(zhe2_end.x - zhe2_start.x, zhe2_length_range)
  const pie_horizonalSpan = range(pie_start.x - pie_end.x, pie_horizonal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const pie_bendCursor = range((pie_bend.y - pie_start.y) / pie_verticalSpan, pie_bend_cursor_range)
  return {
    heng_length,
    zhe1_horizonalSpan,
    zhe1_verticalSpan,
    zhe2_length,
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_heng_zhe_zhe_pie = (glyph: CustomGlyph) => {
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
        jointsMap['zhe1_start'] = {
          x: glyph.tempData['zhe1_start'].x + deltaX,
          y: glyph.tempData['zhe1_start'].y,
        }
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        break
      }
      case 'zhe1_start': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['zhe1_start'] = {
          x: glyph.tempData['zhe1_start'].x + deltaX,
          y: glyph.tempData['zhe1_start'].y,
        }
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        break
      }
      case 'zhe1_end': {
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y + deltaY,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y + deltaY,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y + deltaY,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        break
      }
      case 'zhe2_start': {
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y + deltaY,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y + deltaY,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y + deltaY,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        break
      }
      case 'zhe2_end': {
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        break
      }
      case 'pie_start': {
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
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
    glyph.setParam('横-长度', _params.heng_length)
    glyph.setParam('折1-水平延伸', _params.zhe1_horizonalSpan)
    glyph.setParam('折1-竖直延伸', _params.zhe1_verticalSpan)
    glyph.setParam('折2-长度', _params.zhe2_length)
    glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
    glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
    glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_heng_zhe_zhe_pie = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'heng_end': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['zhe1_start'] = {
          x: glyph.tempData['zhe1_start'].x + deltaX,
          y: glyph.tempData['zhe1_start'].y,
        }
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        break
      }
      case 'zhe1_start': {
        jointsMap['heng_end'] = {
          x: glyph.tempData['heng_end'].x + deltaX,
          y: glyph.tempData['heng_end'].y,
        }
        jointsMap['zhe1_start'] = {
          x: glyph.tempData['zhe1_start'].x + deltaX,
          y: glyph.tempData['zhe1_start'].y,
        }
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        break
      }
      case 'zhe1_end': {
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y + deltaY,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y + deltaY,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y + deltaY,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        break
      }
      case 'zhe2_start': {
        jointsMap['zhe1_end'] = {
          x: glyph.tempData['zhe1_end'].x + deltaX,
          y: glyph.tempData['zhe1_end'].y + deltaY,
        }
        jointsMap['zhe2_start'] = {
          x: glyph.tempData['zhe2_start'].x + deltaX,
          y: glyph.tempData['zhe2_start'].y + deltaY,
        }
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y + deltaY,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y + deltaY,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y + deltaY,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y + deltaY,
        }
        break
      }
      case 'zhe2_end': {
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
        }
        break
      }
      case 'pie_start': {
        jointsMap['zhe2_end'] = {
          x: glyph.tempData['zhe2_end'].x + deltaX,
          y: glyph.tempData['zhe2_end'].y,
        }
        jointsMap['pie_start'] = {
          x: glyph.tempData['pie_start'].x + deltaX,
          y: glyph.tempData['pie_start'].y,
        }
        jointsMap['pie_bend'] = {
          x: glyph.tempData['pie_bend'].x + deltaX,
          y: glyph.tempData['pie_bend'].y,
        }
        jointsMap['pie_end'] = {
          x: glyph.tempData['pie_end'].x + deltaX,
          y: glyph.tempData['pie_end'].y,
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
    glyph.setParam('横-长度', _params.heng_length)
    glyph.setParam('折1-水平延伸', _params.zhe1_horizonalSpan)
    glyph.setParam('折1-竖直延伸', _params.zhe1_verticalSpan)
    glyph.setParam('折2-长度', _params.zhe2_length)
    glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
    glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
    glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_heng_zhe_zhe_pie,
  bindSkeletonGlyph_heng_zhe_zhe_pie,
  updateSkeletonListener_after_bind_heng_zhe_zhe_pie,
  updateSkeletonListener_before_bind_heng_zhe_zhe_pie,
}