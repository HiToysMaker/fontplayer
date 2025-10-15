const ox = 500
const oy = 500
const x0 = 250
const y0 = 250
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
  horizontalSpan: glyph.getParam('水平延伸'),
  verticalSpan: glyph.getParam('竖直延伸'),
  bendCursor: glyph.getParam('弯曲游标'),
  bendDegree: glyph.getParam('弯曲度') + 30 * global_params.bending_degree,
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
      const newBend = getBend(jointsMap['start'], jointsMap['end'])
      jointsMap['bend'] = {
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
  const { bendCursor, bendDegree } = params
  const horizontalSpan = Math.abs(end.x - start.x)
  const verticalSpan = Math.abs(end.y - start.y)
  const cursor_x = start.x + bendCursor * horizontalSpan
  const cursor_y = start.y + bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizontalSpan)
  
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
  glyph.setParam('水平延伸', _params.horizontalSpan)
  glyph.setParam('竖直延伸', _params.verticalSpan)
  glyph.setParam('弯曲游标', _params.bendCursor)
  glyph.setParam('弯曲度', _params.bendDegree - 30 * global_params.bending_degree)
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
  const { start, end, bend } = jointsMap
  const horizontal_span_range = glyph.getParamRange('水平延伸')
  const vertical_span_range = glyph.getParamRange('竖直延伸')
  const bend_cursor_range = glyph.getParamRange('弯曲游标')
  const bend_degree_range = glyph.getParamRange('弯曲度')
  const horizontalSpan = range(end.x - start.x, horizontal_span_range)
  const verticalSpan = range(end.y - start.y, vertical_span_range)
  const data = FP.distanceAndFootPoint(start, end, bend)
  const bendCursor = range(data.percentageFromA, bend_cursor_range)
  const bendDegree = range(data.distance, bend_degree_range)
  return {
    horizontalSpan,
    verticalSpan,
    bendCursor,
    bendDegree,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    horizontalSpan,
    verticalSpan,
    bendCursor,
    bendDegree,
  } = params

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
      x: start.x + horizontalSpan,
      y: start.y + verticalSpan,
    },
  )

  const length = distance(start, end)
  const cursor_x = start.x + bendCursor * horizontalSpan
  const cursor_y = start.y + bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizontalSpan)

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
  const { start, bend, end } = skeleton

  // 竖横比，竖的厚度比横的厚度
  const stress_ratio = 3
  const serif_size = 2.0
  const _weight = weight * 1.5

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_na_curves, out_na_points, in_na_curves, in_na_points } = FP.getCurveContours('na', { na_start: start, na_bend: bend, na_end: end }, _weight, {
    unticlockwise: true,
    weightsVariation: 'linear',
    weightsVariationPower: weights_variation_power,
    in_startWeight: _weight * 0.3,
    in_endWeight: _weight * 0.3,
    out_startWeight: _weight * 0.3,
    out_endWeight: _weight * 1.2,
  })

  const startTopAngle = FP.degreeToRadius(-10)
  const startRightAngle = FP.degreeToRadius(-(40 + 5 * start_style_value))
  const startLeftAngle = FP.degreeToRadius(10 + 5 * start_style_value)
  const start_length = Math.min(35, FP.distance(start, end) * 0.3)
  const radius = 15

  const start_right_data_1 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_na_curves),
    start_length,
  )
  const start_right_data_2 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(start_right_data_1.final_curves),
    start_length,
  )
  const start_left_data_1 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_na_curves),
    start_length,
  )
  const start_left_data_2 = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(start_left_data_1.final_curves),
    start_length,
  )
  const start_p0 = start_right_data_2.point
  const start_p1 = start_right_data_1.point
  const start_p1_p2_vector = FP.turnAngleFromEnd(start_p0, start_p1, startRightAngle, 100)
  const start_p6 = start_left_data_2.point
  const start_p5 = start_left_data_1.point
  const start_p5_p4_vector = FP.turnAngleFromEnd(start_p6, start_p5, startLeftAngle, 100)
  const start_p2_p4_vector = FP.turnAngleFromStart(start, out_na_curves[0].start, startTopAngle, 100)
  const { corner: start_p2 } = FP.getIntersection(
    { type: 'line', start: start_p1, end: start_p1_p2_vector },
    { type: 'line', start: start, end: start_p2_p4_vector }
  )
  const { corner: start_p4 } = FP.getIntersection(
    { type: 'line', start: start_p5, end: start_p5_p4_vector },
    { type: 'line', start: start, end: start_p2_p4_vector }
  )
  const start_p3 = FP.getPointOnLine(start_p2, start_p4, FP.distance(start_p2, start_p4) * 0.5)
  const start_p2_radius_before = FP.getPointOnLine(start_p2, start_p1, radius)
  const start_p2_radius_after = FP.getPointOnLine(start_p2, start_p3, radius)
  const start_p3_radius_before = FP.getPointOnLine(start_p3, start_p2, radius)
  const start_p3_radius_after = FP.getPointOnLine(start_p3, start_p4, radius)

  const end_length = Math.min(420, FP.distance(start, end) * 0.5)
  const end_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(start_left_data_2.final_curves),
    end_length,
    true,
  )
  const out_na_curves_final = end_data.final_curves
  const end_p0 = end_data.point
  const end_p1 = FP.goStraight(out_na_curves_final[out_na_curves_final.length - 1].control2, end_p0, end_length * 0.3)
  const end_p2 = FP.turnAngleFromEnd(end_p0, end_p1, FP.degreeToRadius(-10), end_length * 0.3)
  const end_bottom_vector_end = FP.turnAngleFromStart(end, in_na_curves[in_na_curves.length - 1].end, FP.degreeToRadius(-30), end_length)
  let { corner: end_p4 } = FP.getIntersection(
    { type: 'line', start: end, end: end_bottom_vector_end, },
    { type: 'line', start: in_na_curves[in_na_curves.length - 1].control2, end: in_na_curves[in_na_curves.length - 1].end }
  )
  end_p4 = FP.goStraight(in_na_curves[in_na_curves.length - 1].end, end_p4, 0.1 * end_length)
  const end_p3 = end
  const end_p2_radius_before = FP.getPointOnLine(end_p2, end_p1, radius * 4)
  const end_p2_radius_after = FP.getPointOnLine(end_p2, end_p3, radius * 4)
  const end_p4_radius_before = FP.getPointOnLine(end_p4, end_p3, radius * 2)
  const end_p4_radius_after = FP.getPointOnLine(end_p4, in_na_curves[in_na_curves.length - 1].end, radius * 2)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  pen.moveTo(start_p0.x, start_p0.y)
  pen.bezierTo(start_p1.x, start_p1.y, start_p2.x, start_p2.y, start_p3.x, start_p3.y)
  pen.bezierTo(start_p4.x, start_p4.y, start_p5.x, start_p5.y, start_p6.x, start_p6.y)

  // 绘制左侧（内侧）轮廓
  // pen.moveTo(out_na_curves_final[0].start.x, out_na_curves_final[0].start.y)
  for (let i = 0; i < out_na_curves_final.length; i++) {
    const curve = out_na_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制收笔样式
  pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2_radius_before.x, end_p2_radius_before.y)
  pen.quadraticBezierTo(end_p2.x, end_p2.y, end_p2_radius_after.x, end_p2_radius_after.y)
  pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p4_radius_before.x, end_p4_radius_before.y)
  pen.quadraticBezierTo(end_p4.x, end_p4.y, end_p4_radius_after.x, end_p4_radius_after.y)

  // 绘制轮廓连接线
  pen.lineTo(
    start_right_data_2.final_curves[start_right_data_2.final_curves.length - 1].end.x,
    start_right_data_2.final_curves[start_right_data_2.final_curves.length - 1].end.y
  )

  // 绘制右侧（外侧）轮廓
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