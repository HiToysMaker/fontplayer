import { CustomGlyph } from "../programming/CustomGlyph";
import { ICustomGlyph } from "../stores/glyph";
import { refline, range } from "../../utils/glyph";
import { FP } from "../programming/FPUtils";
import { applySkeletonTransformation, glyphSkeletonBind } from "../../features/glyphSkeletonBind";
import { updateSkeletonTransformation } from "./strokeFnMap";

const instanceBasicGlyph_na = (plainGlyph: ICustomGlyph) => {
  const glyph = new CustomGlyph(plainGlyph)
  const params = {
    horizonalSpan: glyph.getParam('水平延伸'),
    verticalSpan: glyph.getParam('竖直延伸'),
    bendCursor: glyph.getParam('弯曲游标'),
    bendDegree: Number(glyph.getParam('弯曲度')) + 30 * Number(glyph.getParam('弯曲程度')),
  }

  updateGlyphByParams(params, glyph)

  return
}

const bindSkeletonGlyph_na = (plainGlyph: ICustomGlyph) => {
  if (!plainGlyph._o) {
    instanceBasicGlyph_na(plainGlyph)
  }
  glyphSkeletonBind(plainGlyph._o)
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const getBend = (start, end, bendCursor, bendDegree) => {
  // 改变捺end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  const horizonalSpan = Math.abs(end.x - start.x)
  const verticalSpan = Math.abs(end.y - start.y)
  const cursor_x = start.x + bendCursor * horizonalSpan
  const cursor_y = start.y + bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizonalSpan)
  
  const bend = {
    x: cursor_x - bendDegree * Math.sin(angle),
    y: cursor_y + bendDegree * Math.cos(angle),
  }

  return bend
}

const updateGlyphByParams = (params, glyph) => {
  const { horizonalSpan, verticalSpan, bendCursor, bendDegree } = params

  const { ox : _ox, oy : _oy } = glyph._glyph.skeleton

  const ox = 500
  const oy = 500
  const x0 = 250 + _ox || 0
  const y0 = 250 + _oy || 0

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
      y: start.y + verticalSpan,
    },
  )

  const length = distance(start, end)
  const cursor_x = start.x + bendCursor * horizonalSpan
  const cursor_y = start.y + bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizonalSpan)

  const bend = new FP.Joint(
    'bend',
    {
      x: cursor_x - bendDegree * Math.sin(angle),
      y: cursor_y + bendDegree * Math.cos(angle),
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
  const verticalSpan = range(end.y - start.y, vertical_span_range)
  const data = FP.distanceAndFootPoint(start, end, bend)
  const bendCursor = range(data.percentageFromA, bend_cursor_range)
  const bendDegree = range(data.distance, bend_degree_range)
  return {
    horizonalSpan,
    verticalSpan,
    bendCursor,
    bendDegree,
  }
}

const updateSkeletonListener_before_bind_na = (glyph: CustomGlyph) => {
  const getJointsMap = (data) => {
    const { draggingJoint, deltaX, deltaY } = data
    const jointsMap = Object.assign({}, glyph.tempData)
    switch (draggingJoint.name) {
      case 'start': {
        // 拖拽第一个joint，整体移动骨架
        const deltaX = data.deltaX
        const deltaY = data.deltaY
        
        // 更新骨架的ox, oy
        if (glyph._glyph.skeleton) {
          glyph._glyph.skeleton.ox = (glyph.tempData.ox || 0) + deltaX
          glyph._glyph.skeleton.oy = (glyph.tempData.oy || 0) + deltaY
        }
        
        // 更新所有joint的位置
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
    // joint数据格式：{x, y, name}
    const { draggingJoint } = data
    glyph.tempData = {}
    glyph.tempData.ox = glyph._glyph.skeleton.ox
    glyph.tempData.oy = glyph._glyph.skeleton.oy
    glyph.tempData.bendCursor = glyph.getParam('弯曲游标')
    glyph.tempData.bendDegree = Number(glyph.getParam('弯曲度')) + 30 * Number(glyph.getParam('弯曲程度'))
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
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    //updateSkeletonTransformation(glyph)
  }
  
  glyph.onSkeletonDragEnd = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    //updateSkeletonTransformation(glyph)
    glyph.setParam('水平延伸', _params.horizonalSpan)
    glyph.setParam('竖直延伸', _params.verticalSpan)
    glyph.setParam('弯曲游标', _params.bendCursor)
    glyph.setParam('弯曲度', _params.bendDegree - 30 * Number(glyph.getParam('弯曲程度')))
    glyph.tempData = null
  }
}

const updateSkeletonListener_after_bind_na = (glyph: CustomGlyph) => {
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
    // joint数据格式：{x, y, name}
    const { draggingJoint } = data
    glyph.tempData = {}
    glyph.tempData.bendCursor = glyph.getParam('弯曲游标')
    glyph.tempData.bendDegree = Number(glyph.getParam('弯曲度')) + 30 * Number(glyph.getParam('弯曲程度'))
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
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    updateSkeletonTransformation(glyph)
  }
  
  glyph.onSkeletonDragEnd = (data) => {
    if (!glyph.tempData) return
    glyph.clear()
    // joint数据格式：{x, y, name}
    const jointsMap = getJointsMap(data)
    const _params = computeParamsByJoints(jointsMap, glyph)
    updateGlyphByParams(_params, glyph)
    updateSkeletonTransformation(glyph)
    glyph.setParam('水平延伸', _params.horizonalSpan)
    glyph.setParam('竖直延伸', _params.verticalSpan)
    glyph.setParam('弯曲游标', _params.bendCursor)
    glyph.setParam('弯曲度', _params.bendDegree - 30 * Number(glyph.getParam('弯曲程度')))
    glyph.tempData = null
  }
}

export {
  instanceBasicGlyph_na,
  bindSkeletonGlyph_na,
  updateSkeletonListener_after_bind_na,
  updateSkeletonListener_before_bind_na,
}
