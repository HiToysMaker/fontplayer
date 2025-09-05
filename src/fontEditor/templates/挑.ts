import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";
import { minSegment, maxSegment } from "../stores/global";
// 挑的骨架转骨骼函数
export const skeletonToBones_tiao = (skeleton: any): any[] => {
  const bones: any[] = [];
  const { start, bend, end } = skeleton;
  
  // 贝塞尔曲线段
  const segments = maxSegment;
  for (let i = 0; i < segments; i++) {
    const t1 = i / segments;
    const t2 = (i + 1) / segments;
    
    const p1 = quadraticBezierPoint(start, bend, end, t1);
    const p2 = quadraticBezierPoint(start, bend, end, t2);
    
    const bone: any = {
      id: `segment_${i}`,
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
      bone.parent = `segment_${i - 1}`;
      bones[i - 1].children.push(bone.id);
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



const instanceBasicGlyph_tiao = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    horizonalSpan: glyph.getParam('水平延伸'),
    verticalSpan: glyph.getParam('竖直延伸'),
    bendCursor: glyph.getParam('弯曲游标'),
    bendDegree: Number(glyph.getParam('弯曲度')) + 10 * Number(glyph.getParam('弯曲程度') || 1),
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_tiao = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_tiao(plainGlyph)
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
  const cursor_y = start.y - bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizonalSpan)
  
  const bend = {
    x: cursor_x - bendDegree * Math.sin(angle),
    y: cursor_y - bendDegree * Math.cos(angle),
  }

  return bend
}

const updateGlyphByParams = (params, glyph) => {
  const { horizonalSpan, verticalSpan, bendCursor, bendDegree } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 400 + _ox || 0
  const y0 = 600 + _oy || 0

  const start = new FP.Joint(
    'start',
    {
      x: x0,
      y: y0,
    },
  )
  const end = new FP.Joint(
    'end',
    {
      x: start.x + horizonalSpan,
      y: start.y - verticalSpan,
    },
  )

  const length = distance(start, end)
  const cursor_x = start.x + bendCursor * horizonalSpan
  const cursor_y = start.y - bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizonalSpan)

  const bend = new FP.Joint(
    'bend',
    {
      x: cursor_x - bendDegree * Math.sin(angle),
      y: cursor_y - bendDegree * Math.cos(angle),
    },
  )

  glyph.addJoint(start)
  glyph.addJoint(end)
  glyph.addJoint(bend)

  const skeleton = {
    start,
    bend,
    end,
  }

  glyph.addRefLine(refline(start, bend))
  glyph.addRefLine(refline(bend, end))

  glyph.getSkeleton = () => {
    return skeleton
  }
}

const computeParamsByJoints = (jointsMap, glyph) => {
  const { start, end, bend } = jointsMap
  const horizonal_span_range = glyph.getParamRange('水平延伸')
  const vertical_span_range = glyph.getParamRange('竖直延伸')
  const bend_cursor_range = glyph.getParamRange('弯曲游标')
  const bend_degree_range = glyph.getParamRange('弯曲度')
  const horizonalSpan = range(end.x - start.x, horizonal_span_range)
  const verticalSpan = range(start.y - end.y, vertical_span_range)
  const data = FP.distanceAndFootPoint(start, end, bend)
  const bendCursor = range(data.percentageFromA, bend_cursor_range)
  const bendDegree = range(data.distance, bend_degree_range)
  return {
    horizonalSpan,
    verticalSpan,
    bendCursor,
    bendDegree,
    skeletonRefPos: glyph.getParam('参考位置'),
    weight: glyph.getParam('字重') || 40,
  }
}

const updateSkeletonListener_before_bind_tiao = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'start': {
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
      case 'bend': {
        jointsMap['bend'] = {
          x: glyph.tempData['bend'].x + deltaX,
          y: glyph.tempData['bend'].y + deltaY,
        }
        break
      }
      case 'end': {
        jointsMap['end'] = {
          x: glyph.tempData['end'].x + deltaX,
          y: glyph.tempData['end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['start'], jointsMap['end'], glyph.tempData.bendCursor, glyph.tempData.bendDegree)
        jointsMap['bend'] = {
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
    glyph.tempData.bendCursor = glyph.getParam('弯曲游标')
    glyph.tempData.bendDegree = Number(glyph.getParam('弯曲度')) + 10 * Number(glyph.getParam('弯曲程度') || 1)
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
    glyph.setParam('水平延伸', _params.horizonalSpan)
    glyph.setParam('竖直延伸', _params.verticalSpan)
    glyph.setParam('弯曲游标', _params.bendCursor)
    glyph.setParam('弯曲度', _params.bendDegree - 10 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_tiao = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'bend': {
        jointsMap['bend'] = {
          x: glyph.tempData['bend'].x + deltaX,
          y: glyph.tempData['bend'].y + deltaY,
        }
        break
      }
      case 'end': {
        jointsMap['end'] = {
          x: glyph.tempData['end'].x + deltaX,
          y: glyph.tempData['end'].y + deltaY,
        }
        const newBend = getBend(jointsMap['start'], jointsMap['end'], glyph.tempData.bendCursor, glyph.tempData.bendDegree)
        jointsMap['bend'] = {
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
    glyph.tempData.bendCursor = glyph.getParam('弯曲游标')
    glyph.tempData.bendDegree = Number(glyph.getParam('弯曲度')) + 10 * Number(glyph.getParam('弯曲程度') || 1)
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
    glyph.setParam('水平延伸', _params.horizonalSpan)
    glyph.setParam('竖直延伸', _params.verticalSpan)
    glyph.setParam('弯曲游标', _params.bendCursor)
    glyph.setParam('弯曲度', _params.bendDegree - 10 * Number(glyph.getParam('弯曲程度') || 1))
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_tiao,
  bindSkeletonGlyph_tiao,
  updateSkeletonListener_after_bind_tiao,
  updateSkeletonListener_before_bind_tiao,
}
