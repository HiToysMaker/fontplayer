const ox = 500
const oy = 500
const x0 = 550
const y0 = 200
const BENDING_DEGREE = 0
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
  pie_bendDegree: glyph.getParam('撇-弯曲度') + BENDING_DEGREE * global_params.bending_degree,
  dian_horizontalSpan: glyph.getParam('点-水平延伸'),
  dian_verticalSpan: glyph.getParam('点-竖直延伸'),
  dian_bendCursor: glyph.getParam('点-弯曲游标'),
  dian_bendDegree: glyph.getParam('点-弯曲度') + BENDING_DEGREE * global_params.bending_degree,
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
      jointsMap['dian_start'] = {
        x: glyph.tempData['dian_start'].x + deltaX,
        y: glyph.tempData['dian_start'].y + deltaY,
      }
      jointsMap['dian_bend'] = {
        x: glyph.tempData['dian_bend'].x + deltaX,
        y: glyph.tempData['dian_bend'].y + deltaY,
      }
      jointsMap['dian_end'] = {
        x: glyph.tempData['dian_end'].x + deltaX,
        y: glyph.tempData['dian_end'].y + deltaY,
      }
      break
    }
    case 'dian_start': {
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'], 'pie')
      jointsMap['pie_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      jointsMap['dian_start'] = {
        x: glyph.tempData['dian_start'].x + deltaX,
        y: glyph.tempData['dian_start'].y + deltaY,
      }
      jointsMap['dian_bend'] = {
        x: glyph.tempData['dian_bend'].x + deltaX,
        y: glyph.tempData['dian_bend'].y + deltaY,
      }
      jointsMap['dian_end'] = {
        x: glyph.tempData['dian_end'].x + deltaX,
        y: glyph.tempData['dian_end'].y + deltaY,
      }
      break
    }
    case 'dian_bend': {
      jointsMap['dian_bend'] = {
        x: glyph.tempData['dian_bend'].x + deltaX,
        y: glyph.tempData['dian_bend'].y + deltaY,
      }
      break
    }
    case 'dian_end': {
      jointsMap['dian_end'] = {
        x: glyph.tempData['dian_end'].x + deltaX,
        y: glyph.tempData['dian_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['dian_start'], jointsMap['dian_end'], 'dian')
      jointsMap['dian_bend'] = {
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
  } else if (name === 'dian') {
    let { dian_bendCursor: bendCursor, dian_bendDegree: bendDegree } = params
    const horizontalSpan = Math.abs(end.x - start.x)
    const verticalSpan = Math.abs(end.y - start.y)
    const cursor_x = start.x + bendCursor * horizontalSpan
    const cursor_y = start.y + bendCursor * verticalSpan
    const angle = Math.atan2(verticalSpan, horizontalSpan)
    
    const bend = {
      x: cursor_x + bendDegree * Math.sin(angle),
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
  glyph.setParam('撇-弯曲度', _params.pie_bendDegree - BENDING_DEGREE * global_params.bending_degree)
  glyph.setParam('点-水平延伸', _params.dian_horizontalSpan)
  glyph.setParam('点-竖直延伸', _params.dian_verticalSpan)
  glyph.setParam('点-弯曲游标', _params.dian_bendCursor)
  glyph.setParam('点-弯曲度', _params.dian_bendDegree - BENDING_DEGREE * global_params.bending_degree)
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
  const { pie_start, pie_bend, pie_end, dian_start, dian_bend, dian_end } = jointsMap
  const pie_horizontal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const pie_bend_cursor_range = glyph.getParamRange('撇-弯曲游标')
  const pie_bend_degree_range = glyph.getParamRange('撇-弯曲度')
  const dian_horizontal_span_range = glyph.getParamRange('点-水平延伸')
  const dian_vertical_span_range = glyph.getParamRange('点-竖直延伸')
  const dian_bend_cursor_range = glyph.getParamRange('点-弯曲游标')
  const dian_bend_degree_range = glyph.getParamRange('点-弯曲度')
  const pie_horizontalSpan = range(pie_start.x - pie_end.x, pie_horizontal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const pie_data = FP.distanceAndFootPoint(pie_start, pie_end, pie_bend)
  const pie_bendCursor = range(pie_data.percentageFromA, pie_bend_cursor_range)
  const pie_bendDegree = range(pie_data.distance, pie_bend_degree_range)
  const dian_horizontalSpan = range(dian_end.x - dian_start.x, dian_horizontal_span_range)
  const dian_verticalSpan = range(dian_end.y - dian_start.y, dian_vertical_span_range)
  const dian_data = FP.distanceAndFootPoint(dian_start, dian_end, dian_bend)
  const dian_bendCursor = range(dian_data.percentageFromA, dian_bend_cursor_range)
  const dian_bendDegree = range(dian_data.distance, dian_bend_degree_range)
  return {
    pie_horizontalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    dian_horizontalSpan,
    dian_verticalSpan,
    dian_bendCursor,
    dian_bendDegree,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    pie_horizontalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    pie_bendDegree,
    dian_horizontalSpan,
    dian_verticalSpan,
    dian_bendCursor,
    dian_bendDegree,
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

  // 点
  const dian_start = new FP.Joint(
    'dian_start',
    {
      x: pie_start.x - pie_horizontalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )
  const dian_end = new FP.Joint(
    'dian_end',
    {
      x: dian_start.x + dian_horizontalSpan,
      y: dian_start.y + dian_verticalSpan,
    },
  )

  const dian_length = distance(dian_start, dian_end)
  const dian_cursor_x = dian_start.x + dian_bendCursor * dian_horizontalSpan
  const dian_cursor_y = dian_start.y + dian_bendCursor * dian_verticalSpan
  const dian_angle = Math.atan2(dian_verticalSpan, dian_horizontalSpan)

  const dian_bend = new FP.Joint(
    'dian_bend',
    {
      x: dian_cursor_x + dian_bendDegree * Math.sin(dian_angle),
      y: dian_cursor_y - dian_bendDegree * Math.cos(dian_angle),
    },
  )

  glyph.addJoint(pie_start)
  glyph.addJoint(pie_bend)
  glyph.addJoint(pie_end)
  glyph.addJoint(dian_start)
  glyph.addJoint(dian_bend)
  glyph.addJoint(dian_end)

  const skeleton = {
    pie_start,
    pie_bend,
    pie_end,
    dian_start,
    dian_bend,
    dian_end,
  }

  glyph.addRefLine(refline(pie_start, pie_bend))
  glyph.addRefLine(refline(pie_bend, pie_end))
  glyph.addRefLine(refline(dian_start, dian_bend))
  glyph.addRefLine(refline(dian_bend, dian_end))

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
    dian_start,
    dian_bend,
    dian_end,
  } = skeleton

  const radius = 15
  const _weight = weight * 1.5
  const dian_diameter = Math.min(FP.distance(dian_bend, dian_end), _weight)

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_pie_curves, out_pie_points, in_pie_curves, in_pie_points } = FP.getCurveContours('pie', { pie_start, pie_bend, pie_end }, _weight, {
    unticlockwise: true,
    weightsVariation: 'bezier',
    weightsVariationPower: weights_variation_power,
    weightsVariationDir: 'reverse',
    endWeight: _weight * 0.5,
  })
  const { out_dian_curves, out_dian_points, in_dian_curves, in_dian_points } = FP.getCurveContours('dian', { dian_start, dian_bend, dian_end }, _weight * 0.5, {
    unticlockwise: true,
  })

  const startTopAngle = FP.degreeToRadius(-20)
  const startRightAngle = FP.degreeToRadius(-(40 + 5 * start_style_value))
  const startLeftAngle = FP.degreeToRadius(10 + 5 * start_style_value)
  const start_length = Math.min(35, FP.distance(pie_start, pie_end) * 0.5)

  const start_right_data_1 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_pie_curves),
    start_length,
  )
  const start_right_data_2 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(start_right_data_1.final_curves),
    start_length,
  )
  const start_left_data_1 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_pie_curves),
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

  const { corner: in_corner_pie_dian, corner_index: in_corner_index_pie_dian } = FP.getIntersection(
    { type: 'curve', points: FP.getCurvesPoints(start_right_data_2.final_curves) },
    { type: 'line', start: FP.goStraight(in_dian_curves[0].control1, in_dian_curves[0].start, 500), end: in_dian_curves[0].control1 }
  )
  const { corner: out_corner_pie_dian } = FP.getIntersection(
    { type: 'line', start: out_pie_curves[out_pie_curves.length - 1].control2, end: out_pie_curves[out_pie_curves.length - 1].end },
    { type: 'line', start: FP.goStraight(out_dian_curves[0].control1, out_dian_curves[0].start, 500), end: out_dian_curves[0].control1 }
  )

  const dian_p0 = dian_end
  const dian_p0_vector = FP.getPointOnLine(dian_end, dian_bend, dian_diameter / 2)
  const dian_p1 = FP.turnRight(dian_p0_vector, dian_p0, dian_diameter / 2)
  const dian_p2 = FP.turnLeft(dian_p0, dian_p0_vector, dian_diameter / 2)
  const dian_p6 = FP.turnRight(dian_p0, dian_p0_vector, dian_diameter / 2)
  const dian_p7 = FP.turnLeft(dian_p0_vector, dian_p0, dian_diameter / 2)
  const dian_p4 = out_corner_pie_dian
  const dian_p4_vector_left = FP.turnAngleFromStart(dian_p4, dian_bend, FP.degreeToRadius(-5), 100)
  const dian_p4_vector_right = FP.turnAngleFromStart(dian_p4, dian_bend, FP.degreeToRadius(15), 100)
  const { corner: dian_p3 } = FP.getIntersection(
    { type: 'line', start: dian_p1, end: dian_p2 },
    { type: 'line', start: dian_p4, end: dian_p4_vector_left },
  )
  const { corner: dian_p5 } = FP.getIntersection(
    { type: 'line', start: dian_p7, end: dian_p6 },
    { type: 'line', start: dian_p4, end: dian_p4_vector_right },
  )

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

  for (let i = 0; i < start_left_data_2.final_curves.length; i++) {
    const curve = start_left_data_2.final_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  pen.lineTo(out_corner_pie_dian.x, out_corner_pie_dian.y)

  pen.quadraticBezierTo(dian_p3.x, dian_p3.y, dian_p2.x, dian_p2.y)
  pen.quadraticBezierTo(dian_p1.x, dian_p1.y, dian_p0.x, dian_p0.y)
  pen.quadraticBezierTo(dian_p7.x, dian_p7.y, dian_p6.x, dian_p6.y)
  pen.quadraticBezierTo(dian_p5.x, dian_p5.y, in_corner_pie_dian.x, in_corner_pie_dian.y)

  for (let i = start_right_data_2.final_curves.length - 1; i >= 0; i--) {
    const curve = start_right_data_2.final_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)