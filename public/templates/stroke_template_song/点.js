const ox = 500
const oy = 500
const x0 = 450
const y0 = 425
const global_params = {
  weights_variation_power: glyph.getParam('字重变化'),
  start_style_type: glyph.getParam('起笔风格'),
  start_style_value: glyph.getParam('起笔数值'),
  turn_style_type: glyph.getParam('转角风格'),
  turn_style_value: glyph.getParam('转角数值'),
  end_style_type: glyph.getParam('收笔风格'),
  end_style_value: glyph.getParam('收笔数值'),
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
  const cursor_y = start.y + bendCursor * verticalSpan
  const angle = Math.atan2(verticalSpan, horizontalSpan)
  
  const bend = {
    x: cursor_x + bendDegree * Math.sin(angle),
    y: cursor_y - bendDegree * Math.cos(angle),
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
      x: cursor_x + bendDegree * Math.sin(angle),
      y: cursor_y - bendDegree * Math.cos(angle),
    },
  )
  
  const skeleton = { start, bend, end }
  
  glyph.addJoint(start)
  glyph.addJoint(end)
  glyph.addJoint(bend)
  
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

const getComponents = (skeleton, global_params) => {
  const {
    weights_variation_power,
    start_style_type,
    start_style_value,
    turn_style_type,
    turn_style_value,
    bending_degree,
    end_style_type,
    end_style_value,
    weight,
  } = global_params

  // 根据骨架计算轮廓关键点
  const { start, bend, end } = skeleton

  // 竖横比，竖的厚度比横的厚度
  const stress_ratio = 3
  const serif_size = 2.0
  const radius = 10
  const _dian_weight = weight * 1.2
  const dian_diameter = Math.min(FP.distance(bend, end), _dian_weight)

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_dian_curves, out_dian_points, in_dian_curves, in_dian_points } = FP.getCurveContours('dian', { dian_start: start, dian_bend: bend, dian_end: end }, weight)

  const p0 = end
  const p0_vector = FP.getPointOnLine(end, bend, dian_diameter / 2)
  const p1 = FP.turnRight(p0_vector, p0, dian_diameter / 2)
  const p2 = FP.turnLeft(p0, p0_vector, dian_diameter / 2)
  const p6 = FP.turnRight(p0, p0_vector, dian_diameter / 2)
  const p7 = FP.turnLeft(p0_vector, p0, dian_diameter / 2)
  const p4 = start
  let p4_vector_left = FP.turnAngleFromStart(p4, bend, FP.degreeToRadius(-5), 100)
  let p4_vector_right = FP.turnAngleFromStart(p4, bend, FP.degreeToRadius(15), 100)
  let { corner: p3 } = FP.getIntersection(
    { type: 'line', start: p1, end: p2 },
    { type: 'line', start: p4, end: p4_vector_left },
  )
  if ((p3.x > p2.x && p3.y > p2.y) || (p3.x < p4.x && p3.y < p4.y)) {
    p4_vector_left = FP.turnAngleFromStart(p4, bend, FP.degreeToRadius(-30), 100)
    p3 = FP.getIntersection(
      { type: 'line', start: p1, end: p2 },
      { type: 'line', start: p4, end: p4_vector_left },
    ).corner
  }
  const { corner: p5 } = FP.getIntersection(
    { type: 'line', start: p7, end: p6 },
    { type: 'line', start: p4, end: p4_vector_right },
  )

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  pen.moveTo(p0.x, p0.y)
  pen.quadraticBezierTo(p7.x, p7.y, p6.x, p6.y)
  pen.quadraticBezierTo(p5.x, p5.y, p4.x, p4.y)
  pen.quadraticBezierTo(p3.x, p3.y, p2.x, p2.y)
  pen.quadraticBezierTo(p1.x, p1.y, p0.x, p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)