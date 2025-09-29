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
  horizontalSpan: glyph.getParam('水平延伸'),
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
  const horizontalSpan = Math.abs(end.x - start.x)
  const verticalSpan = Math.abs(end.y - start.y)
  const cursor_x = start.x + bendCursor * horizontalSpan
  const cursor_y = start.y - bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizontalSpan)
  
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
  glyph.setParam('水平延伸', _params.horizontalSpan)
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
  const horizontal_span_range = glyph.getParamRange('水平延伸')
  const vertical_span_range = glyph.getParamRange('竖直延伸')
  const bend_cursor_range = glyph.getParamRange('弯曲游标')
  const bend_degree_range = glyph.getParamRange('弯曲度')
  const horizontalSpan = range(end.x - start.x, horizontal_span_range)
  const verticalSpan = range(start.y - end.y, vertical_span_range)
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
      y: start.y - verticalSpan,
    },
  )

  const length = distance(start, end)
  const cursor_x = start.x + bendCursor * horizontalSpan
  const cursor_y = start.y - bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizontalSpan)

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

  const radius = 5
  const _weight = weight * 1.2

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_tiao_curves, out_tiao_points, in_tiao_curves, in_tiao_points } = FP.getCurveContours('tiao', { tiao_start: start, tiao_bend: bend, tiao_end: end }, _weight, {
    weightsVariation: 'bezier',
    weightsVariationDir: 'reverse',
    weightsVariationPower: weights_variation_power,
  })

  const p1 = FP.turnRight(end, start, _weight * 0.5)
  const p0 = FP.turnLeft(end, start, _weight * 0.5)
  const p2 = FP.turnRight(end, start, _weight * 0.5 + 15 * start_style_value)
  const p3_vector = FP.turnAngleFromStart(p2, p0, FP.degreeToRadius(45), 100)
  const { corner: p3 } = FP.getIntersection(
    { type: 'line', start: p2, end: p3_vector },
    { type: 'line', start: p1, end: end },
  )
  const p4 = end
  let p2_radius_before = p2
  let p2_radius_after = p2
  if (radius < FP.distance(p2, p3)) {
    p2_radius_before = FP.getPointOnLine(p2, p1, radius)
    p2_radius_after = FP.getPointOnLine(p2, p3, radius)
  }

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  if (start_style_type === 1) {
    pen.moveTo(p4.x, p4.y)
    pen.lineTo(p3.x, p3.y)
    pen.lineTo(p2_radius_after.x, p2_radius_after.y)
    pen.quadraticBezierTo(p2.x, p2.y, p2_radius_before.x, p2_radius_before.y)
    pen.lineTo(p1.x, p1.y)
    pen.lineTo(p0.x, p0.y)
    pen.lineTo(p4.x, p4.y)
  } else if (start_style_type === 0) {
    pen.moveTo(p4.x, p4.y)
    pen.lineTo(p1.x, p1.y)
    pen.lineTo(p0.x, p0.y)
    pen.lineTo(p4.x, p4.y)
  }

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)