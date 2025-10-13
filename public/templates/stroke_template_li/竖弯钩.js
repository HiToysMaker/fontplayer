const ox = 500
const oy = 500
const x0 = 370
const y0 = 250
const params = {
  shu_horizontalSpan: glyph.getParam('竖-水平延伸'),
  shu_verticalSpan: glyph.getParam('竖-竖直延伸'),
  wan_length: glyph.getParam('弯-长度'),
  gou_horizontalSpan: glyph.getParam('钩-水平延伸'),
  gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
}
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
    case 'shu_end': {
      jointsMap['shu_end'] = {
        x: glyph.tempData['shu_end'].x + deltaX,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
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
    case 'wan_start': {
      jointsMap['shu_end'] = {
        x: glyph.tempData['shu_end'].x + deltaX,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
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
    case 'wan_end': {
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x + deltaX,
        y: glyph.tempData['gou_start'].y,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x + deltaX,
        y: glyph.tempData['gou_end'].y,
      }
      break
    }
    case 'gou_start': {
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x + deltaX,
        y: glyph.tempData['gou_start'].y,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x + deltaX,
        y: glyph.tempData['gou_end'].y,
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
  glyph.setParam('竖-水平延伸', _params.shu_horizontalSpan)
  glyph.setParam('竖-竖直延伸', _params.shu_verticalSpan)
  glyph.setParam('弯-长度', _params.wan_length)
  glyph.setParam('钩-水平延伸', _params.gou_horizontalSpan)
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
  const { shu_start, shu_end, wan_start, wan_end, gou_start, gou_end } = jointsMap
  const shu_horizontal_span_range = glyph.getParamRange('竖-水平延伸')
  const shu_vertical_span_range = glyph.getParamRange('竖-竖直延伸')
  const wan_length_range = glyph.getParamRange('弯-长度')
  const gou_horizontal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const shu_horizontalSpan = range(shu_end.x - shu_start.x, shu_horizontal_span_range)
  const shu_verticalSpan = range(shu_end.y - shu_start.y, shu_vertical_span_range)
  const wan_length = range(wan_end.x - wan_start.x, wan_length_range)
  const gou_horizontalSpan = range(gou_end.x - gou_start.x, gou_horizontal_span_range)
  const gou_verticalSpan = range(gou_start.y - gou_end.y, gou_vertical_span_range)
  return {
    shu_horizontalSpan,
    shu_verticalSpan,
    wan_length,
    gou_horizontalSpan,
    gou_verticalSpan,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    shu_horizontalSpan,
    shu_verticalSpan,
    wan_length,
    gou_horizontalSpan,
    gou_verticalSpan,
  } = params

  // 竖
  const shu_start = new FP.Joint(
    'shu_start',
    {
      x: x0,
      y: y0,
    },
  )
  const shu_end = new FP.Joint(
    'shu_end',
    {
      x: shu_start.x + shu_horizontalSpan,
      y: shu_start.y + shu_verticalSpan,
    },
  )

  // 弯
  const wan_start = new FP.Joint(
    'wan_start',
    {
      x: shu_end.x,
      y: shu_end.y,
    },
  )
  const wan_end = new FP.Joint(
    'wan_end',
    {
      x: wan_start.x + wan_length,
      y: wan_start.y,
    },
  )

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: wan_start.x + wan_length,
      y: wan_start.y,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x + gou_horizontalSpan,
      y: gou_start.y - gou_verticalSpan,
    },
  )

  glyph.addJoint(shu_start)
  glyph.addJoint(shu_end)
  glyph.addJoint(wan_start)
  glyph.addJoint(wan_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    shu_start,
    shu_end,
    wan_start,
    wan_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
  glyph.addRefLine(refline(wan_start, wan_end))
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
    end_style_type,
    end_style_value,
    bending_degree,
    weight,
  } = global_params

  const getStartStyle = (start_style_type, start_style_value) => {
    if (start_style_type === 1) {
      // 起笔上下凸起长方形
      return {
        start_style_decorator_height: start_style_value * 20,
        start_style_decorator_width: weight * 0.25,
      }
    } else if (start_style_type === 2) {
      // 起笔上下凸起长方形，长方形内侧转角为圆角
      return {
        start_style_decorator_height: start_style_value * 20,
        start_style_decorator_width: weight * 0.25,
        start_style_decorator_radius: 20,
      }
    }
    return {}
  }
  
  const start_style = getStartStyle(start_style_type, start_style_value)
  
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
    shu_start,
    shu_end,
    wan_start,
    wan_end,
    gou_start,
    gou_end,
  } = skeleton

  const _weight = weight * 1.5

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, _weight, {
    unticlockwise: true,
  })
  const { out_wan_start, out_wan_end, in_wan_start, in_wan_end } = FP.getLineContours('wan', { wan_start, wan_end }, _weight, {
    unticlockwise: true,
  })
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, _weight, {
    unticlockwise: true,
    startWeight: _weight,
    endWeight: _weight * 0.25,
  })
  let { corner: in_corner_shu_wan } = FP.getIntersection(
    { type: 'line', start: in_shu_start, end: in_shu_end },
    { type: 'line', start: in_wan_start, end: in_wan_end },
  )
  let { corner: out_corner_shu_wan } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: out_wan_start, end: out_wan_end },
  )
  let { corner: in_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: in_wan_start, end: in_wan_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  let { corner: out_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: out_wan_start, end: out_wan_end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )

  const radius = 30
  const startRightAngle = FP.degreeToRadius(-(3 + 3 * start_style_value))
  const startLeftAngle = FP.degreeToRadius(3 + 3 * start_style_value)
  const startTopAngle = FP.degreeToRadius(-10)
  const start_length = Math.min(100, FP.distance(shu_start, shu_end) * 0.3)
  const endRightAngle = FP.degreeToRadius(25 + 5 * end_style_value)
  const endLeftAngle = FP.degreeToRadius(-(0 + 5 * end_style_value))
  const endBottomAngle = FP.degreeToRadius(20)
  const d = 6 + 3 * weights_variation_power
  const l = FP.distance(shu_start, shu_end)
  const control_length = Math.min((l * 0.5 - start_length) * 0.8, 45)

  const start_p7 = FP.getPointOnLine(in_shu_start, out_shu_end, start_length)
  const start_p4 = FP.getPointOnLine(out_shu_start, out_shu_end, start_length)
  const start_p7_p6_vector = FP.turnAngleFromEnd(in_shu_end, start_p7, startRightAngle, 100)
  const start_p4_p5_vector = FP.turnAngleFromEnd(out_shu_end, start_p4, startLeftAngle, 100)
  const start_p5_p6_vector = FP.turnAngleFromStart(shu_start, in_shu_start, startTopAngle, 100)
  const { corner: start_p6 } = FP.getIntersection(
    { type: 'line', start: start_p7, end: start_p7_p6_vector },
    { type: 'line', start: shu_start, end: start_p5_p6_vector }
  )
  const { corner: start_p5 } = FP.getIntersection(
    { type: 'line', start: start_p4, end: start_p4_p5_vector },
    { type: 'line', start: shu_start, end: start_p5_p6_vector }
  )

  const start_p11 = FP.turnLeft(in_shu_end, FP.getPointOnLine(in_shu_end, in_shu_start, l * 0.5 - control_length), d)
  const start_p10 = FP.turnLeft(in_shu_end, FP.getPointOnLine(in_shu_end, in_shu_start, l * 0.5), d)
  const start_p9 = FP.turnLeft(in_shu_end, FP.getPointOnLine(in_shu_end, in_shu_start, l * 0.5 + control_length), d)
  const start_p0 = FP.turnRight(out_shu_end, FP.getPointOnLine(out_shu_end, out_shu_start, l * 0.5 - control_length), d)
  const start_p1 = FP.turnRight(out_shu_end, FP.getPointOnLine(out_shu_end, out_shu_start, l * 0.5), d)
  const start_p2 = FP.turnRight(out_shu_end, FP.getPointOnLine(out_shu_end, out_shu_start, l * 0.5 + control_length), d)

  const start_p3 = FP.getPointOnLine(start_p2, start_p4, FP.distance(start_p2, start_p4) * 0.5)
  const start_p8 = FP.getPointOnLine(start_p7, start_p9, FP.distance(start_p7, start_p9) * 0.5)

  const start_p6_radius_before = FP.getPointOnLine(start_p6, start_p5, radius)
  const start_p6_radius_after = FP.getPointOnLine(start_p6, start_p7, radius)
  const start_p5_radius_before = FP.getPointOnLine(start_p5, start_p4, radius)
  const start_p5_radius_after = FP.getPointOnLine(start_p5, start_p6, radius)

  in_corner_shu_wan = FP.getIntersection(
    { type: 'line', start: start_p10, end: start_p11 },
    { type: 'line', start: in_wan_start, end: in_wan_end },
  ).corner
  out_corner_shu_wan = FP.getIntersection(
    { type: 'line', start: start_p0, end: start_p1 },
    { type: 'line', start: out_wan_start, end: out_wan_end },
  ).corner

  // 计算竖弯拐角处内外圆角相关的点与数据
  let in_radius_shu_wan = 80 * bending_degree
  let out_radius_shu_wan = 80 * bending_degree
  // 如果in_radius超出竖或弯长度，取竖或弯的最小长度
  const in_radius_min_length_shu_wan = Math.min(
    getDistance(in_corner_shu_wan, in_shu_start),
    getDistance(in_corner_shu_wan, in_corner_wan_gou),
  )
  const out_radius_min_length_shu_wan = Math.min(
    getDistance(shu_start, shu_end),
    getDistance(wan_start, wan_end),
  )
  if (in_radius_shu_wan >= in_radius_min_length_shu_wan) {
    in_radius_shu_wan = in_radius_min_length_shu_wan
  }
  if (out_radius_shu_wan >= out_radius_min_length_shu_wan) {
    out_radius_shu_wan = out_radius_min_length_shu_wan
  }
  const in_radius_start_shu_wan = FP.getPointOnLine(in_corner_shu_wan, start_p11, in_radius_shu_wan)
  const in_radius_end_shu_wan = FP.getPointOnLine(in_corner_shu_wan, in_wan_end, in_radius_shu_wan)
  const out_radius_start_shu_wan = FP.getPointOnLine(out_shu_end, start_p0, out_radius_shu_wan)
  const out_radius_end_shu_wan = FP.getPointOnLine(out_wan_start, out_wan_end, out_radius_shu_wan)

  // 计算弯钩拐角处内外圆角相关的点与数据
  let in_radius_wan_gou = 30 * bending_degree
  let out_radius_wan_gou = 10 * bending_degree
  // 如果in_radius超出弯或钩的长度，取弯或钩的最小长度
  const in_radius_min_length_wan_gou = Math.min(
    getDistance(in_corner_wan_gou, in_gou_end),
    getDistance(in_corner_wan_gou, in_radius_end_shu_wan),
  )
  const out_radius_min_length_wan_gou = Math.min(
    getDistance(gou_start, gou_end),
    getDistance(out_wan_end, out_radius_end_shu_wan),
  )
  if (in_radius_wan_gou >= in_radius_min_length_wan_gou) {
    in_radius_wan_gou = in_radius_min_length_wan_gou
  }
  if (out_radius_wan_gou >= out_radius_min_length_wan_gou) {
    out_radius_wan_gou = out_radius_min_length_wan_gou
  }
  const in_radius_start_wan_gou = FP.getPointOnLine(in_corner_wan_gou, in_wan_start, in_radius_wan_gou)
  const in_radius_end_wan_gou = getRadiusPoint({
    start: in_corner_wan_gou,
    end: in_gou_end,
    radius: in_radius_wan_gou,
  })
  const out_radius_start_wan_gou = FP.getPointOnLine(out_wan_end, out_wan_start, out_radius_wan_gou)
  const out_radius_end_wan_gou = getRadiusPoint({
    start: out_gou_start,
    end: out_gou_end,
    radius: out_radius_wan_gou,
  })

  const end_p0 = out_radius_start_wan_gou
  const end_p3 = out_radius_end_wan_gou
  const end_p1 = FP.getPointOnLine(out_radius_start_wan_gou, out_corner_wan_gou, FP.distance(out_radius_start_wan_gou, out_corner_wan_gou) * 0.5)
  const end_p2 = FP.getPointOnLine(out_radius_end_wan_gou, out_corner_wan_gou, FP.distance(out_radius_end_wan_gou, out_corner_wan_gou) * 0.5)
  const end_p4 = out_gou_end
  const end_p5 = in_gou_end
  const end_p4_radius_before = FP.getPointOnLine(end_p4, end_p3, radius)
  const end_p5_radius_after = FP.getPointOnLine(end_p5, in_corner_wan_gou, radius)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  pen.moveTo(start_p10.x, start_p10.y)
  pen.quadraticBezierTo(start_p9.x, start_p9.y, start_p8.x, start_p8.y)
  pen.quadraticBezierTo(start_p7.x, start_p7.y, start_p6_radius_after.x, start_p6_radius_after.y)
  pen.quadraticBezierTo(start_p6.x, start_p6.y, start_p6_radius_before.x, start_p6_radius_before.y)
  pen.lineTo(start_p5_radius_after.x, start_p5_radius_after.y)
  pen.quadraticBezierTo(start_p5.x, start_p5.y, start_p5_radius_before.x, start_p5_radius_before.y)
  pen.quadraticBezierTo(start_p4.x, start_p4.y, start_p3.x, start_p3.y)
  pen.quadraticBezierTo(start_p2.x, start_p2.y, start_p1.x, start_p1.y)

  // 绘制外侧竖弯圆角
  pen.lineTo(out_radius_start_shu_wan.x, out_radius_start_shu_wan.y)
  pen.quadraticBezierTo(out_corner_shu_wan.x, out_corner_shu_wan.y, out_radius_end_shu_wan.x, out_radius_end_shu_wan.y)

  pen.lineTo(end_p0.x, end_p0.y)
  pen.bezierTo(end_p1.x, end_p1.y, end_p2.x, end_p2.y, end_p3.x, end_p3.y)
  pen.lineTo(end_p4_radius_before.x, end_p4_radius_before.y)
  pen.bezierTo(end_p4.x, end_p4.y, end_p5.x, end_p5.y, end_p5_radius_after.x, end_p5_radius_after.y)
  pen.lineTo(in_radius_end_wan_gou.x, in_radius_end_wan_gou.y)
  pen.quadraticBezierTo(in_corner_wan_gou.x, in_corner_wan_gou.y, in_radius_start_wan_gou.x, in_radius_start_wan_gou.y)

  // 绘制内侧竖弯圆角
  pen.lineTo(in_radius_end_shu_wan.x, in_radius_end_shu_wan.y)
  pen.quadraticBezierTo(in_corner_shu_wan.x, in_corner_shu_wan.y, in_radius_start_shu_wan.x, in_radius_start_shu_wan.y)

  pen.lineTo(start_p10.x, start_p10.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)