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

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制左侧轮廓
  pen.moveTo(out_tiao_curves[0].start.x, out_tiao_curves[0].start.y)
  for (let i = 0; i < out_tiao_curves.length; i++) {
    const curve = out_tiao_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(in_tiao_curves[in_tiao_curves.length - 1].end.x, in_tiao_curves[in_tiao_curves.length - 1].end.y)

  // 绘制右侧轮廓
  for (let i = in_tiao_curves.length - 1; i >= 0; i--) {
    const curve = in_tiao_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(out_tiao_curves[0].start.x, out_tiao_curves[0].start.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)