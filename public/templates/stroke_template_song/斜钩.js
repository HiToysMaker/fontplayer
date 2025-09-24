const ox = 500
const oy = 500
const x0 = 350
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
  xie_horizonalSpan: glyph.getParam('斜-水平延伸'),
  xie_verticalSpan: glyph.getParam('斜-竖直延伸'),
  xie_bendCursor: glyph.getParam('斜-弯曲游标'),
  xie_bendDegree: glyph.getParam('斜-弯曲度') + 30 * global_params.bending_degree,
  gou_horizonalSpan: glyph.getParam('钩-水平延伸'),
  gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
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
    case 'xie_bend': {
      jointsMap['xie_bend'] = {
        x: glyph.tempData['xie_bend'].x + deltaX,
        y: glyph.tempData['xie_bend'].y + deltaY,
      }
      break
    }
    case 'xie_end': {
      jointsMap['xie_end'] = {
        x: glyph.tempData['xie_end'].x + deltaX,
        y: glyph.tempData['xie_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['xie_start'], jointsMap['xie_end'])
      jointsMap['xie_bend'] = {
        x: newBend.x,
        y: newBend.y,
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
    case 'gou_start': {
      jointsMap['xie_end'] = {
        x: glyph.tempData['xie_end'].x + deltaX,
        y: glyph.tempData['xie_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['xie_start'], jointsMap['xie_end'])
      jointsMap['xie_bend'] = {
        x: newBend.x,
        y: newBend.y,
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

const getBend = (start, end) => {
  // 改变end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  const { xie_bendCursor: bendCursor, xie_bendDegree: bendDegree } = params
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
  glyph.setParam('斜-水平延伸', _params.xie_horizonalSpan)
  glyph.setParam('斜-竖直延伸', _params.xie_verticalSpan)
  glyph.setParam('斜-弯曲游标', _params.xie_bendCursor)
  glyph.setParam('斜-弯曲度', _params.xie_bendDegree - 30 * global_params.bending_degree)
  glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
  glyph.setParam('钩-竖直延伸', _params.gou_verticalSpan)
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
  const { xie_start, xie_end, xie_bend, gou_start, gou_end } = jointsMap
  const xie_horizonal_span_range = glyph.getParamRange('斜-水平延伸')
  const xie_vertical_span_range = glyph.getParamRange('斜-竖直延伸')
  const xie_bend_cursor_range = glyph.getParamRange('斜-弯曲游标')
  const xie_bend_degree_range = glyph.getParamRange('斜-弯曲度')
  const gou_horizonal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const xie_horizonalSpan = range(xie_end.x - xie_start.x, xie_horizonal_span_range)
  const xie_verticalSpan = range(xie_end.y - xie_start.y, xie_vertical_span_range)
  const xie_data = FP.distanceAndFootPoint(xie_start, xie_end, xie_bend)
  const xie_bendCursor = range(xie_data.percentageFromA, xie_bend_cursor_range)
  const xie_bendDegree = range(xie_data.distance, xie_bend_degree_range)
  const gou_horizonalSpan = range(gou_end.x - gou_start.x, gou_horizonal_span_range)
  const gou_verticalSpan = range(gou_start.y - gou_end.y, gou_vertical_span_range)
  return {
    xie_horizonalSpan,
    xie_verticalSpan,
    xie_bendCursor,
    xie_bendDegree,
    gou_horizonalSpan,
    gou_verticalSpan,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    xie_horizonalSpan,
    xie_verticalSpan,
    xie_bendCursor,
    xie_bendDegree,
    gou_horizonalSpan,
    gou_verticalSpan,
  } = params

  // 斜
  const xie_start = new FP.Joint(
    'xie_start',
    {
      x: x0,
      y: y0,
    },
  )
  const xie_end = new FP.Joint(
    'xie_end',
    {
      x: xie_start.x + xie_horizonalSpan,
      y: xie_start.y + xie_verticalSpan,
    },
  )

  const xie_length = distance(xie_start, xie_end)
  const xie_cursor_x = xie_start.x + xie_bendCursor * xie_horizonalSpan
  const xie_cursor_y = xie_start.y + xie_bendCursor * xie_verticalSpan
  const xie_angle = Math.atan2(xie_verticalSpan, xie_horizonalSpan)

  const xie_bend = new FP.Joint(
    'xie_bend',
    {
      x: xie_cursor_x - xie_bendDegree * Math.sin(xie_angle),
      y: xie_cursor_y + xie_bendDegree * Math.cos(xie_angle),
    },
  )

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: xie_start.x + xie_horizonalSpan,
      y: xie_start.y + xie_verticalSpan,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x + gou_horizonalSpan,
      y: gou_start.y - gou_verticalSpan,
    },
  )

  glyph.addJoint(xie_start)
  glyph.addJoint(xie_end)
  glyph.addJoint(xie_bend)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    xie_start,
    xie_bend,
    xie_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(xie_start, xie_bend))
  glyph.addRefLine(refline(xie_bend, xie_end))
  glyph.addRefLine(refline(gou_start, gou_end))

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

  const getDistance = (p1, p2) => {
    if(!p1 || !p2) return 0
    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
  }
  
  const getRadiusPoint = (options) => {
    const { start, end, radius } = options
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    const point = {
      x: start.x + Math.cos(angle) * radius,
      y: start.y + Math.sin(angle) * radius,
    }
    return point
  }

  // 根据骨架计算轮廓关键点
  const {
    xie_start,
    xie_bend,
    xie_end,
    gou_start,
    gou_end,
  } = skeleton

  // 竖横比，竖的厚度比横的厚度
  const stress_ratio = 3
  const serif_size = 2.0
  const radius = 10
  const start_length = 30
  const end_length = 100

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_xie_curves, out_xie_points, in_xie_curves, in_xie_points } = FP.getCurveContours('xie', { xie_start, xie_bend, xie_end }, weight, {
    unticlockwise: true,   
  })
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight, {
    unticlockwise: true,
  })

  const start_right_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_xie_curves),
    start_length * start_style_value,
  )
  const start_left_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_xie_curves),
    start_length * start_style_value * 0.5,
  )
  const start_p0 = start_right_data.point
  const start_p3 = start_left_data.point
  const start_right_vector_end = FP.turnAngleFromEnd(start_right_data.tangent.end, start_p0, FP.degreeToRadius(-45), start_length)
  const start_left_vector_end = FP.turnAngleFromEnd(start_left_data.tangent.end, start_p3, FP.degreeToRadius(10), start_length)
  const start_top_vector_end = FP.turnAngleFromStart(xie_start, in_xie_curves[0].start, FP.degreeToRadius(-15), start_length)
  const { corner: start_p1 } = FP.getIntersection(
    { type: 'line', start: start_p0, end: start_right_vector_end },
    { type: 'line', start: xie_start, end: start_top_vector_end },
  )
  const { corner: start_p2 } = FP.getIntersection(
    { type: 'line', start: start_p3, end: start_left_vector_end },
    { type: 'line', start: xie_start, end: start_top_vector_end },
  )
  const start_p1_radius_before = FP.getPointOnLine(start_p1, start_p0, radius)
  const start_p1_radius_after = FP.getPointOnLine(start_p1, start_p2, radius)
  const start_p2_radius_before = FP.getPointOnLine(start_p2, start_p1, radius)
  const start_p2_radius_after = FP.getPointOnLine(start_p2, start_p3, radius)

  let out_xie_curves_final_1 = start_left_data.final_curves
  let in_xie_curves_final_1 = start_right_data.final_curves

  const p0 = out_xie_curves_final_1[out_xie_curves_final_1.length - 1].end
  const p3 = gou_end
  const p1 = FP.goStraight(
    out_xie_curves_final_1[out_xie_curves_final_1.length - 1].control2,
    out_xie_curves_final_1[out_xie_curves_final_1.length - 1].end, end_length,
  )
  const p1_p2_vector = FP.turnAngleFromStart(p1, p0, FP.degreeToRadius(-30), end_length)
  const p3_p2_vector = FP.turnAngleFromStart(gou_end, gou_start, FP.degreeToRadius(10), end_length)
  const p3_p4_vector = FP.turnAngleFromStart(gou_end, gou_start, FP.degreeToRadius(-10), 500)
  const { corner: p2 } = FP.getIntersection(
    { type: 'line', start: p1, end: p1_p2_vector },
    { type: 'line', start: p3, end: p3_p2_vector },
  )
  let { corner: p4, corner_index: p4_index } = FP.getIntersection(
    { type: 'line', start: p3, end: p3_p4_vector },
    { type: 'curve', points: FP.getCurvesPoints(in_xie_curves_final_1) },
  )
  let p4_radius_before = p4
  let p4_radius_after = p4
  let in_xie_curves_final_3 = in_xie_curves_final_1
  let in_xie_curves_final_2 = in_xie_curves_final_1
  if (!p4) {
    // 曲线和直线没有交点
    const data = FP.getIntersection(
      { type: 'line', start: p3, end: p3_p4_vector },
      { type: 'line', start: in_xie_curves_final_1[in_xie_curves_final_1.length - 1].control2, end: in_xie_curves_final_1[in_xie_curves_final_1.length - 1].end },
    )
    p4 = data.corner
    p4_radius_before = FP.getPointOnLine(p4, p3, radius)
    if (FP.distance(p4, in_xie_curves_final_1[in_xie_curves_final_1.length - 1].end) < radius) {
      p4_radius_after = in_xie_curves_final_1[in_xie_curves_final_1.length - 1].end
    } else {
      p4_radius_after = FP.getPointOnLine(p4, in_xie_curves_final_1[in_xie_curves_final_1.length - 1].end, radius)
    } 
  } else {
    const { curves } = FP.fitCurvesByPoints(FP.getCurvesPoints(in_xie_curves_final_1).slice(0, p4_index + 1))
    in_xie_curves_final_2 = curves
    p4_radius_before = FP.getPointOnLine(p4, p3, radius)
    const data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(in_xie_curves_final_2), radius, true)
    p4_radius_after = data.point
    in_xie_curves_final_3 = data.final_curves
  }

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制起笔衬线
  pen.moveTo(start_p0.x, start_p0.y)
  pen.lineTo(start_p1_radius_before.x, start_p1_radius_before.y)
  pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p1_radius_after.x, start_p1_radius_after.y)
  pen.lineTo(start_p2_radius_before.x, start_p2_radius_before.y)
  pen.quadraticBezierTo(start_p2.x, start_p2.y, start_p2_radius_after.x, start_p2_radius_after.y)
  pen.lineTo(start_p3.x, start_p3.y)

  for (let i = 0; i < out_xie_curves.length; i++) {
    const curve = out_xie_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen.bezierTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
  pen.lineTo(p4_radius_before.x, p4_radius_before.y)
  pen.quadraticBezierTo(p4.x, p4.y, p4_radius_after.x, p4_radius_after.y)

  pen.lineTo(in_xie_curves_final_3[in_xie_curves_final_3.length - 1].end.x, in_xie_curves_final_3[in_xie_curves_final_3.length - 1].end.y)
  for (let i = in_xie_curves_final_2.length - 1; i >= 0; i--) {
    const curve = in_xie_curves_final_3[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)