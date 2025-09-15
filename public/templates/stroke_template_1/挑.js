const ox = 500
const oy = 500
const x0 = 400
const y0 = 600
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
  horizonalSpan: glyph.getParam('水平延伸'),
  verticalSpan: glyph.getParam('竖直延伸'),
  bendCursor: glyph.getParam('弯曲游标'),
  bendDegree: glyph.getParam('弯曲度') + 10 * global_params.bending_degree,
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
  // 改变撇end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  const { bendCursor, bendDegree } = params
  const horizonalSpan = Math.abs(end.x - start.x)
  const verticalSpan = Math.abs(end.y - start.y)
  const cursor_x = start.x + bendCursor * horizonalSpan
  const cursor_y = start.y - bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizonalSpan)
  
  const bend = {
    x: cursor_x + bendDegree * Math.sin(angle),
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
  glyph.setParam('水平延伸', _params.horizonalSpan)
  glyph.setParam('竖直延伸', _params.verticalSpan)
  glyph.setParam('弯曲游标', _params.bendCursor)
  glyph.setParam('弯曲度', _params.bendDegree - 10 * global_params.bending_degree)
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
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    horizonalSpan,
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
      x: cursor_x + bendDegree * Math.sin(angle),
      y: cursor_y + bendDegree * Math.cos(angle),
    },
  )

  glyph.addJoint(start)
  glyph.addJoint(end)
  glyph.addJoint(bend)

  const skeleton = {
    start,
    end,
    bend,
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

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_tiao_curves, out_tiao_points, in_tiao_curves, in_tiao_points } = FP.getCurveContours('tiao', { tiao_start: start, tiao_bend: bend, tiao_end: end }, weight)

  const start_length = 100
  const end_length = 80
  const d = 10

  // 这里需要按照挑的起笔方向去看，正着看的话其实是左侧
  const start_right_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_tiao_curves),
    start_length * 0.7,
  )
  const start_left_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_tiao_curves),
    start_length * 0.15,
  )
  const end_right_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(start_right_data.final_curves),
    end_length * 0.5,
    true,
  )
  const end_left_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(start_left_data.final_curves),
    end_length * 0.5,
    true,
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

  const end_p0 = end_left_data.point
  const end_p1 = FP.goStraight(end_left_data.tangent.end, end_left_data.tangent.start, 0.5 * end_length)
  const end_p3 = end_right_data.point
  const end_p2 = FP.goStraight(end_right_data.tangent.end, end_right_data.tangent.start, 0.5 * end_length)

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

  // 绘制左侧轮廓
  for (let i = end_left_data.final_curves.length - 1; i >= 0; i--) {
    const curve = end_left_data.final_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制收笔样式
  pen.bezierTo(end_p1.x, end_p1.y, end_p2.x, end_p2.y, end_p3.x, end_p3.y)

  // 绘制右侧轮廓
  for (let i = 0; i < end_right_data.final_curves.length; i++) {
    const curve = end_right_data.final_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)