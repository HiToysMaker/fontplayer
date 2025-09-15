const ox = 500
const oy = 500
const x0 = 650
const y0 = 350
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
  pie_horizonalSpan: glyph.getParam('撇-水平延伸'),
  pie_verticalSpan: glyph.getParam('撇-竖直延伸'),
  pie_bendCursor: glyph.getParam('撇-弯曲游标'),
  pie_bendDegree: glyph.getParam('撇-弯曲度') + 10 * global_params.bending_degree,
  tiao_horizonalSpan: glyph.getParam('挑-水平延伸'),
  tiao_verticalSpan: glyph.getParam('挑-竖直延伸'),
  tiao_bendCursor: glyph.getParam('挑-弯曲游标'),
  tiao_bendDegree: glyph.getParam('挑-弯曲度') + 10 * global_params.bending_degree,
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
    case 'pie_bend': {
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x + deltaX,
        y: glyph.tempData['pie_bend'].y + deltaY,
      }
      break
    }
    case 'pie_end': {
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], 'pie')
      jointsMap['pie_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      jointsMap['tiao_start'] = {
        x: glyph.tempData['tiao_start'].x + deltaX,
        y: glyph.tempData['tiao_start'].y + deltaY,
      }
      jointsMap['tiao_bend'] = {
        x: glyph.tempData['tiao_bend'].x + deltaX,
        y: glyph.tempData['tiao_bend'].y + deltaY,
      }
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      break
    }
    case 'tiao_start': {
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], 'pie')
      jointsMap['pie_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      jointsMap['tiao_start'] = {
        x: glyph.tempData['tiao_start'].x + deltaX,
        y: glyph.tempData['tiao_start'].y + deltaY,
      }
      jointsMap['tiao_bend'] = {
        x: glyph.tempData['tiao_bend'].x + deltaX,
        y: glyph.tempData['tiao_bend'].y + deltaY,
      }
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      break
    }
    case 'tiao_bend': {
      jointsMap['tiao_bend'] = {
        x: glyph.tempData['tiao_bend'].x + deltaX,
        y: glyph.tempData['tiao_bend'].y + deltaY,
      }
      break
    }
    case 'tiao_end': {
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['tiao_start'], jointsMap['tiao_end'], 'tiao')
      jointsMap['tiao_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      break
    }
  }
  return jointsMap
}

const getBend = (start, end, name) => {
  // 改变撇end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  if (name === 'pie') {
    let { pie_bendCursor: bendCursor, pie_bendDegree: bendDegree } = params
    const horizonalSpan = Math.abs(end.x - start.x)
    const verticalSpan = Math.abs(end.y - start.y)
    const cursor_x = start.x - bendCursor * horizonalSpan
    const cursor_y = start.y + bendCursor * verticalSpan
    const angle = Math.atan2(verticalSpan, horizonalSpan)
    
    const bend = {
      x: cursor_x + bendDegree * Math.sin(angle),
      y: cursor_y + bendDegree * Math.cos(angle),
    }
    return bend
  } else if (name === 'tiao') {
    let { tiao_bendCursor: bendCursor, tiao_bendDegree: bendDegree } = params
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

  return null
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
  glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
  glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
  glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
  glyph.setParam('撇-弯曲度', _params.pie_bendDegree - 10 * global_params.bending_degree)
  glyph.setParam('挑-水平延伸', _params.tiao_horizonalSpan)
  glyph.setParam('挑-竖直延伸', _params.tiao_verticalSpan)
  glyph.setParam('挑-弯曲游标', _params.tiao_bendCursor)
  glyph.setParam('挑-弯曲度', _params.tiao_bendDegree - 10 * global_params.bending_degree)
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
  const { pie_start, pie_bend, pie_end, tiao_start, tiao_bend, tiao_end } = jointsMap
  const pie_horizonal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const pie_bend_cursor_range = glyph.getParamRange('撇-弯曲游标')
  const pie_bend_degree_range = glyph.getParamRange('撇-弯曲度')
  const tiao_horizonal_span_range = glyph.getParamRange('挑-水平延伸')
  const tiao_vertical_span_range = glyph.getParamRange('挑-竖直延伸')
  const tiao_bend_cursor_range = glyph.getParamRange('挑-弯曲游标')
  const tiao_bend_degree_range = glyph.getParamRange('挑-弯曲度')
  const pie_horizonalSpan = range(pie_start.x - pie_end.x, pie_horizonal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const pie_data = FP.distanceAndFootPoint(pie_start, pie_end, pie_bend)
  const pie_bendCursor = range(pie_data.percentageFromA, pie_bend_cursor_range)
  const pie_bendDegree = range(pie_data.distance, pie_bend_degree_range)
  const tiao_horizonalSpan = range(tiao_end.x - tiao_start.x, tiao_horizonal_span_range)
  const tiao_verticalSpan = range(tiao_start.y - tiao_end.y, tiao_vertical_span_range)
  const tiao_data = FP.distanceAndFootPoint(tiao_start, tiao_end, tiao_bend)
  const tiao_bendCursor = range(tiao_data.percentageFromA, tiao_bend_cursor_range)
  const tiao_bendDegree = range(tiao_data.distance, tiao_bend_degree_range)
  return {
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    tiao_horizonalSpan,
    tiao_verticalSpan,
    tiao_bendCursor,
    tiao_bendDegree,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    tiao_horizonalSpan,
    tiao_verticalSpan,
    tiao_bendCursor,
    tiao_bendDegree,
  } = params

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: x0,
      y: y0,
    },
  )
  const pie_end = new FP.Joint(
    'pie_end',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  const pie_length = distance(pie_start, pie_end)
  const pie_cursor_x = pie_start.x - pie_bendCursor * pie_horizonalSpan
  const pie_cursor_y = pie_start.y + pie_bendCursor * pie_verticalSpan
  const pie_angle = Math.atan2(pie_verticalSpan, pie_horizonalSpan)

  const pie_bend = new FP.Joint(
    'pie_bend',
    {
      x: pie_cursor_x + pie_bendDegree * Math.sin(pie_angle),
      y: pie_cursor_y + pie_bendDegree * Math.cos(pie_angle),
    },
  )

  // 挑
  const tiao_start = new FP.Joint(
    'tiao_start',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )
  const tiao_end = new FP.Joint(
    'tiao_end',
    {
      x: tiao_start.x + tiao_horizonalSpan,
      y: tiao_start.y - tiao_verticalSpan,
    },
  )

  const tiao_length = distance(tiao_start, tiao_end)
  const tiao_cursor_x = tiao_start.x + tiao_bendCursor * tiao_horizonalSpan
  const tiao_cursor_y = tiao_start.y - tiao_bendCursor * tiao_verticalSpan
  const tiao_angle = Math.atan2(tiao_verticalSpan, tiao_horizonalSpan)

  const tiao_bend = new FP.Joint(
    'tiao_bend',
    {
      x: tiao_cursor_x - tiao_bendDegree * Math.sin(tiao_angle),
      y: tiao_cursor_y - tiao_bendDegree * Math.cos(tiao_angle),
    },
  )

  glyph.addJoint(pie_start)
  glyph.addJoint(pie_bend)
  glyph.addJoint(pie_end)
  glyph.addJoint(tiao_start)
  glyph.addJoint(tiao_bend)
  glyph.addJoint(tiao_end)

  const skeleton = {
    pie_start,
    pie_bend,
    pie_end,
    tiao_start,
    tiao_bend,
    tiao_end,
  }

  glyph.addRefLine(refline(pie_start, pie_bend))
  glyph.addRefLine(refline(pie_bend, pie_end))
  glyph.addRefLine(refline(tiao_start, tiao_bend))
  glyph.addRefLine(refline(tiao_bend, tiao_end))

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
    pie_start,
    pie_bend,
    pie_end,
    tiao_start,
    tiao_bend,
    tiao_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_pie_curves, out_pie_points, in_pie_curves, in_pie_points } = FP.getCurveContours('pie', { pie_start, pie_bend, pie_end }, weight, {
    unticlockwise: true,
  })
  const { out_tiao_curves, out_tiao_points, in_tiao_curves, in_tiao_points } = FP.getCurveContours('tiao', { tiao_start, tiao_bend, tiao_end }, weight, {
    unticlockwise: true,
  })
  let { corner: out_corner_pie_tiao, corner_index: out_corner_index_pie_tiao } = FP.getIntersection(
    { type: 'curve', points: out_pie_points },
    { type: 'curve', points: in_tiao_points },
  )
  if (!out_corner_pie_tiao) {
    out_corner_pie_tiao = out_pie_curves[out_pie_curves.length - 1].end
    out_corner_index_pie_tiao = [out_pie_points.length, 0]
  }
  const { corner: in_corner_pie_tiao, corner_index: in_corner_index_pie_tiao } = FP.getIntersection(
    { type: 'curve', points: in_pie_points },
    { type: 'curve', points: in_tiao_points },
  )
  const { curves: out_pie_curves_final } = FP.fitCurvesByPoints(out_pie_points.slice(0, out_corner_index_pie_tiao[0]))
  const { curves: in_pie_curves_final } = FP.fitCurvesByPoints(in_pie_points.slice(0, in_corner_index_pie_tiao[0]))
  let in_tiao_curves_final_1 = []
  if (out_corner_index_pie_tiao[1]) {
    let { curves } = FP.fitCurvesByPoints(in_tiao_points.slice(0, out_corner_index_pie_tiao[1]))
    in_tiao_curves_final_1 = curves
  }
  const { curves: in_tiao_curves_final_2 } = FP.fitCurvesByPoints(in_tiao_points.slice(in_corner_index_pie_tiao[1]))

  const start_length = 60
  const end_length = 60
  const d = 20

  const start_right_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_pie_curves_final),
    start_length,
  )
  const start_left_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_pie_curves),
    start_length * 0.45,
  )
  const end_right_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_tiao_curves_final_2),
    end_length,
    true,
  )
  const end_left_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_tiao_curves),
    end_length * 0.45,
    true,
  )

  const start_p10 = start_right_data.point
  const start_p9 = FP.turnLeft(start_right_data.tangent.end, start_p10, 2 * d)
  const start_p8 = FP.turnRight(start_p10, start_p9, 0.3 * end_length)
  const start_p7 = FP.turnRight(start_p10, start_p9, 0.15 * end_length)
  const start_p6 = FP.turnRight(start_p9, start_p7, 0.9 * d)
  const start_p5 = FP.goStraight(start_p7, start_p6, 1.3 * d)
  const start_p4 = FP.turnLeft(start_p6, start_p5, 0.425 * end_length)
  const start_p1 = FP.goStraight(start_left_data.tangent.end, start_left_data.tangent.start, 0.45 * end_length)
  const start_p0 = start_left_data.point//FP.turnLeft(end_p2, end_p1, 0.45 * end_length)
  const start_p2 = FP.turnRight(start_p0, start_p1, weight - 2 * d + 0.9 * d)
  const start_p3 = FP.turnRight(start_p0, start_p1, weight - 2 * d + 2.2 * d)

  const end_p10 = end_right_data.point
  const end_p9 = FP.turnRight(end_right_data.tangent.end, end_p10, 2 * d)
  const end_p8 = FP.turnLeft(end_p10, end_p9, 0.3 * end_length)
  const end_p7 = FP.turnLeft(end_p10, end_p9, 0.15 * end_length)
  const end_p6 = FP.turnLeft(end_p9, end_p7, 0.9 * d)
  const end_p5 = FP.goStraight(end_p7, end_p6, 1.3 * d)
  const end_p4 = FP.turnRight(end_p6, end_p5, 0.425 * end_length)
  const end_p1 = FP.goStraight(end_left_data.tangent.end, end_left_data.tangent.start, 0.45 * end_length)
  const end_p0 = end_left_data.point//FP.turnLeft(end_p2, end_p1, 0.45 * end_length)
  const end_p2 = FP.turnLeft(end_p0, end_p1, weight - 2 * d + 0.9 * d)
  const end_p3 = FP.turnLeft(end_p0, end_p1, weight - 2 * d + 2.2 * d)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制起笔样式
  pen.moveTo(start_p10.x, start_p10.y)
  pen.quadraticBezierTo(start_p9.x, start_p9.y, start_p8.x, start_p8.y)
  pen.quadraticBezierTo(start_p7.x, start_p7.y, start_p6.x, start_p6.y)
  pen.quadraticBezierTo(start_p5.x, start_p5.y, start_p4.x, start_p4.y)
  pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p2.x, start_p2.y)
  pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p0.x, start_p0.y)

  // 绘制左侧轮廓
  for (let i = 0; i < start_left_data.final_curves.length; i++) {
    const curve = start_left_data.final_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen.lineTo(
    end_left_data.final_curves[end_left_data.final_curves.length - 1].start.x,
    end_left_data.final_curves[end_left_data.final_curves.length - 1].start.y,
  )
  for (let i = end_left_data.final_curves.length - 1; i >= 0; i--) {
    const curve = end_left_data.final_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制收笔样式
  pen.lineTo(end_p0.x, end_p0.y)
  pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2.x, end_p2.y)
  pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p4.x, end_p4.y)
  pen.quadraticBezierTo(end_p5.x, end_p5.y, end_p6.x, end_p6.y)
  pen.quadraticBezierTo(end_p7.x, end_p7.y, end_p8.x, end_p8.y)
  pen.quadraticBezierTo(end_p9.x, end_p9.y, end_p10.x, end_p10.y)

  // 绘制右侧轮廓
  for (let i = 0; i < end_right_data.final_curves.length; i++) {
    const curve = end_right_data.final_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  for (let i = start_right_data.final_curves.length - 1; i >= 0; i--) {
    const curve = start_right_data.final_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  pen.lineTo(start_p10.x, start_p10.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)