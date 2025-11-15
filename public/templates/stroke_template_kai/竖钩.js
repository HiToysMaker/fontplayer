const ox = 500
const oy = 500
const x0 = 500
const y0 = 250
const params = {
  shu_horizontalSpan: glyph.getParam('竖-水平延伸'),
  shu_verticalSpan: glyph.getParam('竖-竖直延伸'),
  gou_horizontalSpan: glyph.getParam('钩-水平延伸'),
  gou_verticalSpan: glyph.getParam('钩-竖直延伸'),
  skeletonRefPos: glyph.getParam('参考位置'),
}
const global_params = {
  weights_variation_power: glyph.getParam('字重变化'),
  start_style_type: glyph.getParam('起笔风格'),
  start_style_value: glyph.getParam('起笔数值'),
  turn_style_type: glyph.getParam('转角风格'),
  turn_style_value: glyph.getParam('转角数值'),
  bending_degree: glyph.getParam('弯曲程度'),
  weight: glyph.getParam('字重') || 40,
}

const refline = (p1, p2, type) => {
  const refline =  {
    name: `${p1.name}-${p2.name}`,
    start: p1.name,
    end: p2.name,
  }
  if (type) {
    refline.type = type
  }
  return refline
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
      jointsMap['shu_end'] = {
        x: glyph.tempData['shu_end'].x + deltaX,
        y: glyph.tempData['shu_end'].y + deltaY,
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
  const { shu_start, shu_end, gou_start, gou_end } = jointsMap
  const shu_horizontal_span_range = glyph.getParamRange('竖-水平延伸')
  const shu_vertical_span_range = glyph.getParamRange('竖-竖直延伸')
  const gou_horizontal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const shu_horizontalSpan = range(shu_end.x - shu_start.x, shu_horizontal_span_range)
  const shu_verticalSpan = range(shu_end.y - shu_start.y, shu_vertical_span_range)
  const gou_horizontalSpan = range(gou_start.x - gou_end.x, gou_horizontal_span_range)
  const gou_verticalSpan = range(gou_end.y - gou_start.y, gou_vertical_span_range)
  return {
    shu_horizontalSpan,
    shu_verticalSpan,
    gou_horizontalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    shu_horizontalSpan,
    shu_verticalSpan,
    gou_horizontalSpan,
    gou_verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params
  const _weight = weight * 1.0

  // 竖
  let shu_start, shu_end
  const shu_start_ref = new FP.Joint(
    'shu_start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const shu_end_ref = new FP.Joint(
    'shu_end_ref',
    {
      x: shu_start_ref.x + shu_horizontalSpan,
      y: shu_start_ref.y + shu_verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    shu_start = new FP.Joint(
      'shu_start',
      {
        x: shu_start_ref.x - _weight / 2,
        y: shu_start_ref.y,
      },
    )
    shu_end = new FP.Joint(
      'shu_end',
      {
        x: shu_end_ref.x - _weight / 2,
        y: shu_end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    shu_start = new FP.Joint(
      'shu_start',
      {
        x: shu_start_ref.x + _weight / 2,
        y: shu_start_ref.y,
      },
    )
    shu_end = new FP.Joint(
      'shu_end',
      {
        x: shu_end_ref.x + _weight / 2,
        y: shu_end_ref.y,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    shu_start = new FP.Joint(
      'shu_start',
      {
        x: shu_start_ref.x,
        y: shu_start_ref.y,
      },
    )
    shu_end = new FP.Joint(
      'shu_end',
      {
        x: shu_end_ref.x,
        y: shu_end_ref.y,
      },
    )
  }
  glyph.addJoint(shu_start_ref)
  glyph.addJoint(shu_end_ref)
  glyph.addRefLine(refline(shu_start_ref, shu_end_ref, 'ref'))

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: shu_end.x,
      y: shu_end.y,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x - gou_horizontalSpan,
      y: gou_start.y + gou_verticalSpan,
    },
  )

  glyph.addJoint(shu_start)
  glyph.addJoint(shu_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    shu_start,
    shu_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
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
    gou_start,
    gou_end,
  } = skeleton

  const _weight = weight * 1.0

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, _weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, _weight)
  const { corner: in_corner_shu_gou } = FP.getIntersection(
    { type: 'line', start: in_shu_start, end: in_shu_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_shu_gou } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )

  // 计算竖钩拐角处内外圆角相关的点与数据
  let in_radius = 30 * bending_degree
  let out_radius = 10 * bending_degree
  // 如果in_radius超出钩或竖的长度，取钩或竖的最小长度
  const in_radius_min_length = Math.min(
    getDistance(in_corner_shu_gou, in_gou_end),
    getDistance(in_corner_shu_gou, in_shu_start),
  )
  const out_radius_min_length = Math.min(
    getDistance(gou_start, gou_end),
    getDistance(shu_start, shu_end),
  )
  if (in_radius >= in_radius_min_length) {
    in_radius = in_radius_min_length
  }
  if (out_radius >= out_radius_min_length) {
    out_radius = out_radius_min_length
  }
  const in_radius_start = {
    x: in_shu_end.x,
    y: in_corner_shu_gou.y - in_radius,
  }
  const in_radius_end = getRadiusPoint({
    start: in_corner_shu_gou,
    end: in_gou_end,
    radius: in_radius,
  })
  const out_radius_start = {
    x: out_shu_end.x,
    y: out_shu_end.y - out_radius,
  }
  const out_radius_end = getRadiusPoint({
    start: out_gou_start,
    end: out_gou_end,
    radius: out_radius,
  })

  const radius = 15
  const startTopAngle = FP.degreeToRadius(-15)
  const startRightAngle = FP.degreeToRadius(-(30 + 5 * start_style_value))
  const startLeftAngle = FP.degreeToRadius(15 + 5 * start_style_value)
  const start_length = Math.min(35, FP.distance(shu_start, shu_end) * 0.3)
  const end_length = Math.min(100, FP.distance(shu_start, shu_end) * 0.3)

  const p19 = FP.getPointOnLine(out_shu_start, out_shu_end, start_length)
  const p2 = FP.getPointOnLine(in_shu_start, in_shu_end, start_length)
  const p19_p0_vector = FP.turnAngleFromEnd(out_shu_end, p19, startRightAngle, 100)
  const p2_p1_vector = FP.turnAngleFromEnd(in_shu_end, p2, startLeftAngle, 100)
  const p1_p0_vector = FP.turnAngleFromStart(shu_start, in_shu_start, startTopAngle, 100)
  const { corner: p0 } = FP.getIntersection(
    { type: 'line', start: p19, end: p19_p0_vector },
    { type: 'line', start: shu_start, end: p1_p0_vector }
  )
  const { corner: p1 } = FP.getIntersection(
    { type: 'line', start: p2, end: p2_p1_vector },
    { type: 'line', start: shu_start, end: p1_p0_vector }
  )

  const d = 6 + 3 * weights_variation_power
  const l = FP.distance(shu_end, shu_start)
  const control_length = Math.min(l * 0.5 - start_length, l * 0.5 - end_length, 45)
  const p15 = FP.turnLeft(out_shu_end, FP.getPointOnLine(out_shu_end, out_shu_start, l * 0.5 - control_length), d)
  const p16 = FP.turnLeft(out_shu_end, FP.getPointOnLine(out_shu_end, out_shu_start, l * 0.5), d)
  const p17 = FP.turnLeft(out_shu_end, FP.getPointOnLine(out_shu_end, out_shu_start, l * 0.5 + control_length), d)
  const p6 = FP.turnRight(in_shu_end, FP.getPointOnLine(in_shu_end, in_shu_start, l * 0.5 - control_length), d)
  const p5 = FP.turnRight(in_shu_end, FP.getPointOnLine(in_shu_end, in_shu_start, l * 0.5), d)
  const p4 = FP.turnRight(in_shu_end, FP.getPointOnLine(in_shu_end, in_shu_start, l * 0.5 + control_length), d)
  const p18 = FP.getPointOnLine(p19, p17, FP.distance(p19, p17) * 0.5)
  const p3 = FP.getPointOnLine(p2, p4, FP.distance(p2, p4) * 0.5)
  const p14 = FP.getPointOnLine(out_shu_end, out_shu_start, end_length)
  const p13 = FP.getPointOnLine(p14, out_shu_end, control_length)
  const p12 = FP.getPointOnLine(p13, out_shu_end, control_length)
  const p12_p11_vector = FP.turnAngleFromEnd(p13, p12, FP.degreeToRadius(-30), 100)
  const { corner: p11 } = FP.getIntersection(
    { type: 'line', start: p12, end: p12_p11_vector },
    { type: 'line', start: out_gou_end, end: out_gou_start },
  )
  const p10 = FP.getPointOnLine(p11, out_gou_end, Math.min(30, FP.distance(gou_start, gou_end) * 0.5))
  const p10_p9_vector = FP.turnAngleFromEnd(p11, p10, FP.degreeToRadius(-30), 100)
  const { corner: p9 } = FP.getIntersection(
    { type: 'line', start: p10, end: p10_p9_vector },
    { type: 'line', start: gou_end, end: gou_start },
  )
  const p8 = gou_end
  const p8_p7_vector = FP.turnAngleFromStart(p8, gou_start, FP.degreeToRadius(15), 100)
  const { corner: p7 } = FP.getIntersection(
    { type: 'line', start: p8, end: p8_p7_vector },
    { type: 'line', start: p6, end: in_shu_end },
  )
  const p0_radius_before = FP.getPointOnLine(p0, p19, radius)
  const p0_radius_after = FP.getPointOnLine(p0, p1, radius)
  const p1_radius_before = FP.getPointOnLine(p1, p0, radius)
  const p1_radius_after = FP.getPointOnLine(p1, p2, radius)
  const p7_radius_before = FP.getPointOnLine(p7, p6, 30)
  const p7_radius_after = FP.getPointOnLine(p7, p8, 30)
  const p11_radius_before = FP.getPointOnLine(p11, p10, radius)
  const p11_radius_after = FP.getPointOnLine(p11, p12, radius)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  pen.moveTo(p0_radius_before.x, p0_radius_before.y)
  pen.quadraticBezierTo(p0.x, p0.y, p0_radius_after.x, p0_radius_after.y)
  pen.lineTo(p1_radius_before.x, p1_radius_before.y)
  pen.quadraticBezierTo(p1.x, p1.y, p1_radius_after.x, p1_radius_after.y)
  pen.quadraticBezierTo(p2.x, p2.y, p3.x, p3.y)
  pen.quadraticBezierTo(p4.x, p4.y, p5.x, p5.y)
  pen.quadraticBezierTo(p6.x, p6.y, p7_radius_before.x, p7_radius_before.y)
  pen.quadraticBezierTo(p7.x, p7.y, p7_radius_after.x, p7_radius_after.y)
  pen.lineTo(p8.x, p8.y)
  pen.bezierTo(p9.x, p9.y, p10.x, p10.y, p11_radius_before.x, p11_radius_before.y)
  pen.quadraticBezierTo(p11.x, p11.y, p11_radius_after.x, p11_radius_after.y)
  pen.quadraticBezierTo(p12.x, p12.y, p13.x, p13.y)
  pen.bezierTo(p14.x, p14.y, p15.x, p15.y, p16.x, p16.y)
  pen.quadraticBezierTo(p17.x, p17.y, p18.x, p18.y)
  pen.quadraticBezierTo(p19.x, p19.y, p0_radius_before.x, p0_radius_before.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)