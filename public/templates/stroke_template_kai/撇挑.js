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
  pie_horizontalSpan: glyph.getParam('撇-水平延伸'),
  pie_verticalSpan: glyph.getParam('撇-竖直延伸'),
  pie_bendCursor: glyph.getParam('撇-弯曲游标'),
  pie_bendDegree: glyph.getParam('撇-弯曲度') + 10 * global_params.bending_degree,
  tiao_horizontalSpan: glyph.getParam('挑-水平延伸'),
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
    const horizontalSpan = Math.abs(end.x - start.x)
    const verticalSpan = Math.abs(end.y - start.y)
    const cursor_x = start.x - bendCursor * horizontalSpan
    const cursor_y = start.y + bendCursor * verticalSpan
    const angle = Math.atan2(verticalSpan, horizontalSpan)
    
    const bend = {
      x: cursor_x + bendDegree * Math.sin(angle),
      y: cursor_y + bendDegree * Math.cos(angle),
    }
    return bend
  } else if (name === 'tiao') {
    let { tiao_bendCursor: bendCursor, tiao_bendDegree: bendDegree } = params
    const horizontalSpan = Math.abs(end.x - start.x)
    const verticalSpan = Math.abs(end.y - start.y)
    const cursor_x = start.x + bendCursor * horizontalSpan
    const cursor_y = start.y - bendCursor * verticalSpan
    const angle = Math.atan2(verticalSpan, horizontalSpan)
    
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
  glyph.setParam('撇-水平延伸', _params.pie_horizontalSpan)
  glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
  glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
  glyph.setParam('撇-弯曲度', _params.pie_bendDegree - 10 * global_params.bending_degree)
  glyph.setParam('挑-水平延伸', _params.tiao_horizontalSpan)
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
  const pie_horizontal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const pie_bend_cursor_range = glyph.getParamRange('撇-弯曲游标')
  const pie_bend_degree_range = glyph.getParamRange('撇-弯曲度')
  const tiao_horizontal_span_range = glyph.getParamRange('挑-水平延伸')
  const tiao_vertical_span_range = glyph.getParamRange('挑-竖直延伸')
  const tiao_bend_cursor_range = glyph.getParamRange('挑-弯曲游标')
  const tiao_bend_degree_range = glyph.getParamRange('挑-弯曲度')
  const pie_horizontalSpan = range(pie_start.x - pie_end.x, pie_horizontal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const pie_data = FP.distanceAndFootPoint(pie_start, pie_end, pie_bend)
  const pie_bendCursor = range(pie_data.percentageFromA, pie_bend_cursor_range)
  const pie_bendDegree = range(pie_data.distance, pie_bend_degree_range)
  const tiao_horizontalSpan = range(tiao_end.x - tiao_start.x, tiao_horizontal_span_range)
  const tiao_verticalSpan = range(tiao_start.y - tiao_end.y, tiao_vertical_span_range)
  const tiao_data = FP.distanceAndFootPoint(tiao_start, tiao_end, tiao_bend)
  const tiao_bendCursor = range(tiao_data.percentageFromA, tiao_bend_cursor_range)
  const tiao_bendDegree = range(tiao_data.distance, tiao_bend_degree_range)
  return {
    pie_horizontalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    tiao_horizontalSpan,
    tiao_verticalSpan,
    tiao_bendCursor,
    tiao_bendDegree,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    pie_horizontalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    tiao_horizontalSpan,
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
      x: pie_start.x - pie_horizontalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  const pie_length = distance(pie_start, pie_end)
  const pie_cursor_x = pie_start.x - pie_bendCursor * pie_horizontalSpan
  const pie_cursor_y = pie_start.y + pie_bendCursor * pie_verticalSpan
  const pie_angle = Math.atan2(pie_verticalSpan, pie_horizontalSpan)

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
      x: pie_start.x - pie_horizontalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )
  const tiao_end = new FP.Joint(
    'tiao_end',
    {
      x: tiao_start.x + tiao_horizontalSpan,
      y: tiao_start.y - tiao_verticalSpan,
    },
  )

  const tiao_length = distance(tiao_start, tiao_end)
  const tiao_cursor_x = tiao_start.x + tiao_bendCursor * tiao_horizontalSpan
  const tiao_cursor_y = tiao_start.y - tiao_bendCursor * tiao_verticalSpan
  const tiao_angle = Math.atan2(tiao_verticalSpan, tiao_horizontalSpan)

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

  const radius = 15
  const _weight = weight * 1.0

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_pie_curves, out_pie_points, in_pie_curves, in_pie_points } = FP.getCurveContours('pie', { pie_start, pie_bend, pie_end }, _weight, {
    unticlockwise: true,
    weightsVariation: 'bezier',
    weightsVariationPower: weights_variation_power,
    weightsVariationDir: 'reverse',
    endWeight: _weight * 0.1,
  })
  const { out_tiao_curves, out_tiao_points, in_tiao_curves, in_tiao_points } = FP.getCurveContours('tiao', { tiao_start, tiao_bend, tiao_end }, _weight, {
    unticlockwise: true,
    weightsVariation: 'bezier',
    weightsVariationPower: weights_variation_power,
    weightsVariationDir: 'reverse',
    endWeight: _weight * 0.1,
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
  const { curves: in_tiao_curves_final_2 } = FP.fitCurvesByPoints(in_tiao_points.slice(in_corner_index_pie_tiao[1]))
  const startTopAngle = FP.degreeToRadius(-20)
  const startRightAngle = FP.degreeToRadius(-(40 + 5 * start_style_value))
  const startLeftAngle = FP.degreeToRadius(10 + 5 * start_style_value)
  const start_length = Math.min(35, FP.distance(pie_start, pie_end) * 0.5)

  const start_right_data_1 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_pie_curves_final),
    start_length,
  )
  const start_right_data_2 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(start_right_data_1.final_curves),
    start_length,
  )
  const start_left_data_1 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_pie_curves_final),
    start_length,
  )
  const start_left_data_2 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(start_left_data_1.final_curves),
    start_length,
  )
  const start_p0 = start_right_data_2.point
  const start_p1 = start_right_data_1.point
  const start_p1_p2_vector = FP.turnAngleFromEnd(start_p0, start_p1, startRightAngle, 100)
  const start_p5 = start_left_data_2.point
  const start_p4 = start_left_data_1.point
  const start_p4_p3_vector = FP.turnAngleFromEnd(start_p5, start_p4, startLeftAngle, 100)
  const start_p2_p3_vector = FP.turnAngleFromStart(pie_start, out_pie_curves[0].start, startTopAngle, 100)
  const { corner: start_p2 } = FP.getIntersection(
    { type: 'line', start: start_p1, end: start_p1_p2_vector },
    { type: 'line', start: pie_start, end: start_p2_p3_vector }
  )
  const { corner: start_p3 } = FP.getIntersection(
    { type: 'line', start: start_p4, end: start_p4_p3_vector },
    { type: 'line', start: pie_start, end: start_p2_p3_vector }
  )
  const start_p2_radius_before = FP.getPointOnLine(start_p2, start_p1, radius)
  const start_p2_radius_after = FP.getPointOnLine(start_p2, start_p3, radius)
  const start_p3_radius_before = FP.getPointOnLine(start_p3, start_p2, radius)
  const start_p3_radius_after = FP.getPointOnLine(start_p3, start_p4, radius)

  const turn_p0 = start_left_data_2.final_curves[start_left_data_2.final_curves.length - 1].end
  const turn_p1 = in_tiao_curves[0].start
  const turn_p2 = out_tiao_curves[0].start
  const turn_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_tiao_curves),
    radius,
  )
  const turn_p3 = turn_data.point
  const turn_p1_radius_before = FP.getPointOnLine(turn_p1, turn_p0, radius)
  const turn_p1_radius_after = FP.getPointOnLine(turn_p1, turn_p3, radius)
  const turn_p2_radius_before = FP.getPointOnLine(turn_p2, turn_p1, radius)
  const turn_p2_radius_after = FP.getPointOnLine(turn_p2, turn_p3, radius)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  pen.moveTo(start_p0.x, start_p0.y)
  pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p2_radius_before.x, start_p2_radius_before.y)
  pen.quadraticBezierTo(start_p2.x, start_p2.y, start_p2_radius_after.x, start_p2_radius_after.y)
  pen.lineTo(start_p3_radius_before.x, start_p3_radius_before.y)
  pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p3_radius_after.x, start_p3_radius_after.y)
  pen.quadraticBezierTo(start_p4.x, start_p4.y, start_p5.x, start_p5.y)

  // 绘制左侧（外侧）轮廓
  pen.lineTo(start_left_data_2.final_curves[0].start.x, start_left_data_2.final_curves[0].start.y)
  for (let i = 0; i < start_left_data_2.final_curves.length; i++) {
    const curve = start_left_data_2.final_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen.quadraticBezierTo(turn_p0.x, turn_p0.y, turn_p1_radius_before.x, turn_p1_radius_before.y)
  pen.quadraticBezierTo(turn_p1.x, turn_p1.y, turn_p1_radius_after.x, turn_p1_radius_after.y)
  pen.lineTo(turn_p2_radius_before.x, turn_p2_radius_before.y)
  pen.quadraticBezierTo(turn_p2.x, turn_p2.y, turn_p3.x, turn_p3.y)
  for (let i = 0; i < out_tiao_curves.length; i++) {
    const curve = out_tiao_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(in_tiao_curves_final_2[in_tiao_curves_final_2.length - 1].end.x, in_tiao_curves_final_2[in_tiao_curves_final_2.length - 1].end.y)

  // 绘制右侧（内侧）轮廓
  for (let i = in_tiao_curves_final_2.length - 1; i >= 0; i--) {
    const curve = in_tiao_curves_final_2[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  for (let i = start_right_data_2.final_curves.length - 1; i >= 0; i--) {
    const curve = start_right_data_2.final_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)