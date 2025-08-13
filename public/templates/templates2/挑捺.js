const ox = 500
const oy = 500
const x0 = 200
const y0 = 575
const global_params = {
  weights_variation_power: glyph.getParam('字重变化'),
  start_style_type: glyph.getParam('起笔风格'),
  start_style_value: glyph.getParam('起笔数值'),
  turn_style_type: glyph.getParam('转角风格'),
  turn_style_value: glyph.getParam('转角数值'),
  bending_degree: glyph.getParam('弯曲程度'),
  weight: glyph.getParam('字重') || 40,
}
const params = {
  tiao_horizonalSpan: glyph.getParam('挑-水平延伸'),
  tiao_verticalSpan: glyph.getParam('挑-竖直延伸'),
  na_horizonalSpan: glyph.getParam('捺-水平延伸'),
  na_verticalSpan: glyph.getParam('捺-竖直延伸'),
  na_bendCursor: glyph.getParam('捺-弯曲游标'),
  na_bendDegree: glyph.getParam('捺-弯曲度') + 30 * global_params.bending_degree,
}

const refline = (p1, p2) => {
  return {
    name: `${p1.name}-${p2.name}`,
    start: p1.name,
    end: p2.name,
  }
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'tiao_end': {
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      jointsMap['na_start'] = {
        x: glyph.tempData['na_start'].x + deltaX,
        y: glyph.tempData['na_start'].y + deltaY,
      }
      jointsMap['na_bend'] = {
        x: glyph.tempData['na_bend'].x + deltaX,
        y: glyph.tempData['na_bend'].y + deltaY,
      }
      jointsMap['na_end'] = {
        x: glyph.tempData['na_end'].x + deltaX,
        y: glyph.tempData['na_end'].y + deltaY,
      }
      break
    }
    case 'na_start': {
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      jointsMap['na_start'] = {
        x: glyph.tempData['na_start'].x + deltaX,
        y: glyph.tempData['na_start'].y + deltaY,
      }
      jointsMap['na_bend'] = {
        x: glyph.tempData['na_bend'].x + deltaX,
        y: glyph.tempData['na_bend'].y + deltaY,
      }
      jointsMap['na_end'] = {
        x: glyph.tempData['na_end'].x + deltaX,
        y: glyph.tempData['na_end'].y + deltaY,
      }
      break
    }
    case 'na_bend': {
      jointsMap['na_bend'] = {
        x: glyph.tempData['na_bend'].x + deltaX,
        y: glyph.tempData['na_bend'].y + deltaY,
      }
      break
    }
    case 'na_end': {
      jointsMap['na_end'] = {
        x: glyph.tempData['na_end'].x + deltaX,
        y: glyph.tempData['na_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['na_start'], jointsMap['na_end'])
      jointsMap['na_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      break
    }
  }
  return jointsMap
}

const getBend = (start, end) => {
  // 改变end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  const { na_bendCursor: bendCursor, na_bendDegree: bendDegree } = params
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

glyph.onSkeletonDragStart = (data) => {
  // joint数据格式：{x, y, name}
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
  // joint数据格式：{x, y, name}
  const jointsMap = getJointsMap(data)
  const _params = computeParamsByJoints(jointsMap)
  updateGlyphByParams(_params, global_params)
}

glyph.onSkeletonDragEnd = (data) => {
  if (!glyph.tempData) return
  glyph.clear()
  // joint数据格式：{x, y, name}
  const jointsMap = getJointsMap(data)
  const _params = computeParamsByJoints(jointsMap)
  updateGlyphByParams(_params, global_params)
  glyph.setParam('挑-水平延伸', _params.tiao_horizonalSpan)
  glyph.setParam('挑-竖直延伸', _params.tiao_verticalSpan)
  glyph.setParam('捺-水平延伸', _params.na_horizonalSpan)
  glyph.setParam('捺-竖直延伸', _params.na_verticalSpan)
  glyph.setParam('捺-弯曲游标', _params.na_bendCursor)
  glyph.setParam('捺-弯曲度', _params.na_bendDegree - 30 * global_params.bending_degree)
  glyph.tempData = null
}

const range = (value, range) => {
  if (value < range.min) {
    return range.min
  } else if (value > range.max) {
    return range.max
  }
  return value
}

const computeParamsByJoints = (jointsMap) => {
  const { tiao_start, tiao_end, na_start, na_end, na_bend } = jointsMap
  const tiao_horizonal_span_range = glyph.getParamRange('挑-水平延伸')
  const tiao_vertical_span_range = glyph.getParamRange('挑-竖直延伸')
  const na_horizonal_span_range = glyph.getParamRange('捺-水平延伸')
  const na_vertical_span_range = glyph.getParamRange('捺-竖直延伸')
  const na_bend_cursor_range = glyph.getParamRange('捺-弯曲游标')
  const na_bend_degree_range = glyph.getParamRange('捺-弯曲度')
  const tiao_horizonalSpan = range(tiao_end.x - tiao_start.x, tiao_horizonal_span_range)
  const tiao_verticalSpan = range(tiao_start.y - tiao_end.y, tiao_vertical_span_range)
  const na_horizonalSpan = range(na_end.x - na_start.x, na_horizonal_span_range)
  const na_verticalSpan = range(na_end.y - na_start.y, na_vertical_span_range)
  const data = FP.distanceAndFootPoint(na_start, na_end, na_bend)
  const na_bendCursor = range(data.percentageFromA, na_bend_cursor_range)
  const na_bendDegree = range(data.distance, na_bend_degree_range)
  return {
    tiao_horizonalSpan,
    tiao_verticalSpan,
    na_horizonalSpan,
    na_verticalSpan,
    na_bendCursor,
    na_bendDegree,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    tiao_horizonalSpan,
    tiao_verticalSpan,
    na_horizonalSpan,
    na_verticalSpan,
    na_bendCursor,
    na_bendDegree,
  } = params

  // 挑
  const tiao_start = new FP.Joint(
    'tiao_start',
    {
      x: x0,
      y: y0,
    },
  )
  const tiao_end = new FP.Joint(
    'tiao_end',
    {
      x: tiao_start.x + tiao_horizonalSpan,
      y: tiao_start.y - tiao_verticalSpan,
    },
  )

  // 捺
  const na_start = new FP.Joint(
    'na_start',
    {
      x: tiao_start.x + tiao_horizonalSpan,
      y: tiao_start.y - tiao_verticalSpan,
    },
  )
  const na_end = new FP.Joint(
    'na_end',
    {
      x: na_start.x + na_horizonalSpan,
      y: na_start.y + na_verticalSpan,
    },
  )

  const na_bend = new FP.Joint(
    'na_bend',
    {
      x: na_start.x + na_horizonalSpan * na_bendCursor,
      y: na_start.y + na_bendDegree,
    },
  )

  glyph.addJoint(tiao_start)
  glyph.addJoint(tiao_end)
  glyph.addJoint(na_start)
  glyph.addJoint(na_end)
  glyph.addJoint(na_bend)

  const skeleton = {
    tiao_start,
    tiao_end,
    na_start,
    na_bend,
    na_end,
  }

  glyph.addRefLine(refline(tiao_start, tiao_end))
  glyph.addRefLine(refline(na_start, na_bend))
  glyph.addRefLine(refline(na_bend, na_end))

  const components = getComponents(skeleton, global_params)
  for (let i = 0; i < components.length; i++) {
    glyph.addComponent(components[i])
  }

  glyph.getSkeleton = () => {
    return skeleton
  }
  glyph.getComponentsBySkeleton = (skeleton) => {
    return getComponents(skeleton, global_params)
  }
}

const getComponents = (skeleton) => {
  const {
    weights_variation_power,
    start_style_type,
    start_style_value,
    turn_style_type,
    turn_style_value,
    bending_degree,
    weight,
  } = global_params

  // 根据骨架计算轮廓关键点
  const {
    tiao_start,
    tiao_end,
    na_start,
    na_bend,
    na_end,
  } = skeleton

  // in指左侧（外侧）轮廓线
  // out指右侧（内侧）轮廓线
  const { out_tiao_start, out_tiao_end, in_tiao_start, in_tiao_end } = FP.getLineContours('tiao', { tiao_start, tiao_end }, weight, {
    unticlockwise: true,
  })
  const { out_na_curves, out_na_points, in_na_curves, in_na_points } = FP.getCurveContours('na', { na_start, na_bend, na_end }, weight, {
    unticlockwise: true,
  })
  const { corner: in_corner_tiao_na } = FP.getIntersection(
    { type: 'line', start: in_tiao_start, end: in_tiao_end },
    { type: 'line', start: in_na_curves[0].start, end: in_na_curves[0].control1 },
  )
  const { corner: out_corner_tiao_na, corner_index: out_corner_index_tiao_na } = FP.getIntersection(
    { type: 'curve', points: out_na_points },
    { type: 'line', start: out_tiao_start, end: out_tiao_end },
  )
  const { curves: out_na_curves_final } = FP.fitCurvesByPoints(out_na_points.slice(out_corner_index_tiao_na))

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制左侧（外侧）轮廓
  pen.moveTo(in_tiao_start.x, in_tiao_start.y)
  pen.lineTo(in_corner_tiao_na.x, in_corner_tiao_na.y)
  for (let i = 0; i < in_na_curves.length; i++) {
    const curve = in_na_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(out_na_curves_final[out_na_curves_final.length - 1].end.x, out_na_curves_final[out_na_curves_final.length - 1].end.y)

  // 绘制横的右侧（内侧）轮廓
  for (let i = out_na_curves_final.length - 1; i >= 0; i--) {
    const curve = out_na_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen.lineTo(out_corner_tiao_na.x, out_corner_tiao_na.y)
  pen.lineTo(out_tiao_start.x, out_tiao_start.y)

  // 绘制轮廓连接线
  pen.lineTo(in_tiao_start.x, in_tiao_start.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)