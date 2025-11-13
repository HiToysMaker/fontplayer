const ox = 500
const oy = 500
const x0 = 250
const y0 = 500
const params = {
  heng_horizontalSpan: glyph.getParam('横-水平延伸'),
  heng_verticalSpan: glyph.getParam('横-竖直延伸'),
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
    case 'heng_end': {
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y + deltaY,
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
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y + deltaY,
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
  glyph.setParam('横-水平延伸', _params.heng_horizontalSpan)
  glyph.setParam('横-竖直延伸', _params.heng_verticalSpan)
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
  const { heng_start, heng_end, gou_start, gou_end } = jointsMap
  const heng_horizontalSpan_range = glyph.getParamRange('横-水平延伸')
  const heng_verticalSpan_range = glyph.getParamRange('横-竖直延伸')
  const gou_horizontal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const heng_horizontalSpan = range(heng_end.x - heng_start.x, heng_horizontalSpan_range)
  const heng_verticalSpan = range(heng_start.y - heng_end.y, heng_verticalSpan_range)
  const gou_horizontalSpan = range(gou_start.x - gou_end.x, gou_horizontal_span_range)
  const gou_verticalSpan = range(gou_end.y - gou_start.y, gou_vertical_span_range)
  return {
    heng_horizontalSpan,
    heng_verticalSpan,
    gou_horizontalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_horizontalSpan,
    heng_verticalSpan,
    gou_horizontalSpan,
    gou_verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params

  const _weight = weight * 1.0

  // 横
  let heng_start, heng_end
  const heng_start_ref = new FP.Joint(
    'heng_start_ref',
    {
      x: x0,
      y: y0 + heng_verticalSpan / 2,
    },
  )
  const heng_end_ref = new FP.Joint(
    'heng_end_ref',
    {
      x: heng_start_ref.x + heng_horizontalSpan,
      y: heng_start_ref.y - heng_verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y + _weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y + _weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y - _weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y - _weight / 2,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y,
      },
    )
  }
  glyph.addJoint(heng_start_ref)
  glyph.addJoint(heng_end_ref)
  glyph.addRefLine(refline(heng_start_ref, heng_end_ref, 'ref'))

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: heng_start.x + heng_horizontalSpan,
      y: heng_start.y - heng_verticalSpan,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x - gou_horizontalSpan,
      y: gou_start.y + gou_verticalSpan,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    heng_start,
    heng_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
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

const getComponents = (skeleton, global_params) => {
  let {
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
        start_style_decorator_width: start_style_value * 20,
        start_style_decorator_height: weight * 0.25,
      }
    } else if (start_style_type === 2) {
      // 起笔上下凸起长方形，长方形内侧转角为圆角
      return {
        start_style_decorator_width: start_style_value * 20,
        start_style_decorator_height: weight * 0.25,
        start_style_decorator_radius: 20,
      }
    }
    return {}
  }
  
  const start_style = getStartStyle(start_style_type, start_style_value)

  // 根据骨架计算轮廓关键点
  const {
    heng_start,
    heng_end,
    gou_start,
    gou_end,
  } = skeleton

  const turn_angle_1 = FP.degreeToRadius(5)
  const turn_angle_2 = FP.degreeToRadius(5)
  const _gou_weight = weight * 1.2
  const _weight = weight * 1.0

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, _weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, _gou_weight)
  const { corner: in_corner_heng_gou } = FP.getIntersection(
    { type: 'line', start: in_heng_start, end: in_heng_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_heng_gou } = FP.getIntersection(
    { type: 'line', start: out_heng_start, end: out_heng_end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )
  const gou_angle = Math.atan2(gou_end.y - gou_start.y, gou_start.x - gou_end.x)
  const out_corner_heng_gou_1 = {
    x: out_corner_heng_gou.x - _gou_weight * Math.sin(gou_angle),
    y: out_corner_heng_gou.y - _gou_weight * Math.cos(gou_angle),
  }
  const { corner: out_corner_heng_gou_2 } = FP.getIntersection(
    { type: 'line', start: out_heng_start, end: out_heng_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )

  const radius = 15
  const topAngle = FP.degreeToRadius(-(5 + 5 * start_style_value))
  const bottomAngle = FP.degreeToRadius(25 + 5 * start_style_value)
  const leftAngle = FP.degreeToRadius(20)
  const start_length = Math.min(50, FP.distance(heng_start, heng_end) * 0.3)
  const d = 6 + 3 * weights_variation_power
  const l = FP.distance(heng_start, heng_end)
  const control_length = Math.min((l * 0.5 - start_length) * 0.8, 45)

  const out_turn_p2 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 - control_length), d)
  const out_turn_p1 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5), d)
  const out_turn_p0 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 + control_length), d)
  const in_turn_p2 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5 - control_length), d)
  const in_turn_p1 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5), d)
  const in_turn_p0 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5 + control_length), d)

  const out_turn_p4 = out_corner_heng_gou_2
  const out_turn_p5 = out_corner_heng_gou_1
  const out_turn_p6 = out_corner_heng_gou
  const out_turn_p7 = gou_end

  const out_turn_p5_radius_before = FP.getPointOnLine(out_turn_p5, out_turn_p4, radius)
  const out_turn_p5_radius_after = FP.getPointOnLine(out_turn_p5, out_turn_p6, radius)
  const out_turn_p6_radius_before = FP.getPointOnLine(out_turn_p6, out_turn_p5, radius)
  const out_turn_p6_radius_after = FP.getPointOnLine(out_turn_p6, out_turn_p7, radius)

  const in_turn_p4 = in_corner_heng_gou
  const in_turn_p3 = FP.getPointOnLine(in_turn_p2, in_turn_p4, FP.distance(in_turn_p2, in_turn_p4) * 0.5)
  const out_turn_p3 = FP.getPointOnLine(out_turn_p2, out_turn_p4, FP.distance(out_turn_p2, out_turn_p4) * 0.5)

  const start_p1 = FP.getPointOnLine(out_heng_start, out_heng_end, start_length)
  const start_p4 = FP.getPointOnLine(in_heng_start, in_heng_end, start_length)
  const start_p1_p2_vector = FP.turnAngleFromEnd(out_heng_end, start_p1, topAngle, 100)
  const start_p4_p3_vector = FP.turnAngleFromEnd(in_heng_end, start_p4, bottomAngle, 100)
  const start_p2_p3_vector = FP.turnAngleFromStart(heng_start, in_heng_start, leftAngle, 100)
  const { corner: start_p2 } = FP.getIntersection(
    { type: 'line', start: start_p1, end: start_p1_p2_vector },
    { type: 'line', start: heng_start, end: start_p2_p3_vector }
  )
  const { corner: start_p3 } = FP.getIntersection(
    { type: 'line', start: start_p4, end: start_p4_p3_vector },
    { type: 'line', start: heng_start, end: start_p2_p3_vector }
  )
  const start_p0 = FP.getPointOnLine(start_p1, out_turn_p0, FP.distance(start_p1, out_turn_p0) * 0.5)
  const start_p5 = FP.getPointOnLine(start_p4, in_turn_p0, FP.distance(start_p4, in_turn_p0) * 0.5)

  const start_p2_radius_before = FP.getPointOnLine(start_p2, start_p1, radius)
  const start_p2_radius_after = FP.getPointOnLine(start_p2, start_p3, radius)
  const start_p3_radius_before = FP.getPointOnLine(start_p3, start_p2, radius)
  const start_p3_radius_after = FP.getPointOnLine(start_p3, start_p4, radius)

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

  pen.quadraticBezierTo(in_turn_p0.x, in_turn_p0.y, in_turn_p1.x, in_turn_p1.y)
  pen.bezierTo(in_turn_p2.x, in_turn_p2.y, in_turn_p3.x, in_turn_p3.y, in_turn_p4.x, in_turn_p4.y)
  pen.lineTo(out_turn_p7.x, out_turn_p7.y)
  pen.lineTo(out_turn_p6_radius_after.x, out_turn_p6_radius_after.y)
  pen.quadraticBezierTo(out_turn_p6.x, out_turn_p6.y, out_turn_p6_radius_before.x, out_turn_p6_radius_before.y)
  pen.lineTo(out_turn_p5_radius_after.x, out_turn_p5_radius_after.y)
  pen.quadraticBezierTo(out_turn_p5.x, out_turn_p5.y, out_turn_p5_radius_before.x, out_turn_p5_radius_before.y)
  pen.quadraticBezierTo(out_turn_p4.x, out_turn_p4.y, out_turn_p3.x, out_turn_p3.y)
  pen.quadraticBezierTo(out_turn_p2.x, out_turn_p2.y, out_turn_p1.x, out_turn_p1.y)
  pen.quadraticBezierTo(out_turn_p0.x, out_turn_p0.y, start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)