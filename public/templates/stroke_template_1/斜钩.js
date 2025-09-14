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

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_xie_curves, out_xie_points, in_xie_curves, in_xie_points } = FP.getCurveContours('xie', { xie_start, xie_bend, xie_end }, weight, {
    unticlockwise: true,   
  })
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight, {
    unticlockwise: true,
  })
  const { corner: in_corner_xie_gou, corner_index: in_corner_index_xie_gou } = FP.getIntersection(
    { type: 'curve', points: in_xie_points },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_xie_gou } = FP.getIntersection(
    { type: 'line', start: out_xie_curves[out_xie_curves.length - 1].control2, end: out_xie_curves[out_xie_curves.length - 1].end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )
  let { curves: in_xie_curves_final } = FP.fitCurvesByPoints(in_xie_points.slice(0, in_corner_index_xie_gou))

  // 计算弯钩拐角处内外圆角相关的点与数据
  let in_radius = 30 * bending_degree
  let out_radius = 30 * bending_degree
  // 如果in_radius超出钩或弯的长度，取钩或弯的最小长度
  const in_radius_min_length = Math.min(
    getDistance(in_corner_index_xie_gou, in_gou_end),
    getDistance(in_corner_index_xie_gou, in_xie_curves_final[0].start),
  )
  const out_radius_min_length = Math.min(
    getDistance(gou_start, gou_end),
    getDistance(out_xie_curves[0].start, out_xie_curves[out_xie_curves.length - 1].end),
  )
  if (in_radius >= in_radius_min_length) {
    in_radius = in_radius_min_length
  }
  if (out_radius >= out_radius_min_length) {
    out_radius = out_radius_min_length
  }
  const in_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(in_xie_curves_final), in_radius, true)
  const in_radius_control = FP.getIntersection(
    { type: 'line', start: in_radius_data.tangent.start, end: in_radius_data.tangent.end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  ).corner
  const in_radius_start = in_radius_data.point
  const in_radius_end = getRadiusPoint({
    start: in_radius_control,
    end: in_gou_end,
    radius: in_radius,
  })
  const out_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(out_xie_curves), out_radius, true)
  const out_radius_control = FP.getIntersection(
    { type: 'line', start: out_radius_data.tangent.start, end: out_radius_data.tangent.end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  ).corner
  const out_radius_start = out_radius_data.point
  const out_radius_end = getRadiusPoint({
    start: out_radius_control,
    end: out_gou_end,
    radius: out_radius,
  })
  in_xie_curves_final = in_radius_data.final_curves
  const out_xie_curves_final = out_radius_data.final_curves

  const start_length = 100
  const d = 20

  const gou_vecter_end = FP.turnAngle(in_gou_end, out_gou_end, -Math.PI / 4, 100)
  let { corner: gou_control } = FP.getIntersection(
    { type: 'line', start: out_radius_end, end: out_gou_end },
    { type: 'line', start: in_gou_end, end: gou_vecter_end },
  )
  if (!FP.isPointOnLineSegment(gou_control, out_radius_end, out_gou_end)) {
    gou_control = out_gou_end
  }

  const start_right_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_xie_curves_final),
    start_length * 0.7,
  )
  const start_left_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_xie_curves_final),
    start_length * 0.15,
  )
  const start_p0 = start_right_data.point
  const start_p1 = FP.turnLeft(start_right_data.tangent.end, start_right_data.tangent.start, 2 * d)
  const start_p2 = FP.turnRight(start_p0, start_p1, 0.4 * start_length)
  const start_p3 = FP.turnRight(start_p0, start_p1, 0.1 * start_length)
  const start_p4 = FP.turnLeft(start_p2, start_p3, 3 * d)
  const start_p5 = FP.turnLeft(start_p2, start_p3, 2 * d)
  const start_p6 = FP.turnRight(start_p4, start_p5, 0.15 * start_length)
  const start_p7 = FP.turnRight(start_p4, start_p5, 0.3 * start_length)
  const start_p8 = FP.turnRight(start_p6, start_p7, d)
  const start_p9 = FP.turnLeft(start_p7, start_p8, 0.2 * start_length)
  const start_p10 = FP.turnLeft(start_p7, start_p8, 0.4 * start_length)
  const start_p11 = FP.turnLeft(start_p9, start_p10, 0.3 * weight)
  const start_p12 = FP.turnRight(start_p10, start_p11, 0.2 * start_length)
  const start_p13 = FP.turnLeft(start_p11, start_p12, 0.4 * weight + d)
  const start_p14 = FP.turnLeft(start_p12, start_p13, 0.2 * start_length)
  const start_p15 = FP.goStraight(start_left_data.tangent.end, start_left_data.tangent.start, 0.25 * start_length)
  const start_p16 = start_left_data.point

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制起笔样式
  pen.moveTo(start_p0.x, start_p0.y)
  pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p2.x, start_p2.y)
  pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p4.x, start_p4.y)
  pen.quadraticBezierTo(start_p5.x, start_p5.y, start_p6.x, start_p6.y)
  pen.bezierTo(start_p7.x, start_p7.y, start_p8.x, start_p8.y, start_p9.x, start_p9.y)
  pen.quadraticBezierTo(start_p10.x, start_p10.y, start_p11.x, start_p11.y)
  pen.bezierTo(start_p12.x, start_p12.y, start_p13.x, start_p13.y, start_p14.x, start_p14.y)
  pen.quadraticBezierTo(start_p15.x, start_p15.y, start_p16.x, start_p16.y)

  // 绘制左侧（外侧）轮廓
  for (let i = 0; i < start_left_data.final_curves.length; i++) {
    const curve = start_left_data.final_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制外侧圆角
  pen.quadraticBezierTo(out_radius_control.x, out_radius_control.y, out_radius_end.x, out_radius_end.y)

  // 绘制钩转角
  pen.quadraticBezierTo(gou_control.x, gou_control.y, in_gou_end.x, in_gou_end.y)

  // 绘制右侧（内侧）侧轮廓
  // 绘制内侧圆角
  pen.quadraticBezierTo(in_radius_control.x, in_radius_control.y, in_radius_start.x, in_radius_start.y)

  // 绘制右侧（内侧）轮廓
  for (let i = start_right_data.final_curves.length - 1; i >= 0; i--) {
    const curve = start_right_data.final_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)