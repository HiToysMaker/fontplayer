const ox = 500
const oy = 500
const x0 = 250
const y0 = 250
const params = {
  shu_horizontalSpan: glyph.getParam('竖-水平延伸'),
  shu_verticalSpan: glyph.getParam('竖-竖直延伸'),
  zhe_horizontalSpan: glyph.getParam('折-水平延伸'),
  zhe_verticalSpan: glyph.getParam('折-竖直延伸'),
  skeletonRefPos: glyph.getParam('参考位置'),
}
const global_params = {
  weights_variation_power: glyph.getParam('字重变化'),
  start_style_type: glyph.getParam('起笔风格'),
  start_style_value: glyph.getParam('起笔数值'),
  end_style_type: glyph.getParam('收笔风格'),
  end_style_value: glyph.getParam('收笔数值'),
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
      jointsMap['zhe_start'] = {
        x: glyph.tempData['zhe_start'].x + deltaX,
        y: glyph.tempData['zhe_start'].y + deltaY,
      }
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y + deltaY,
      }
      break
    }
    case 'zhe_start': {
      jointsMap['shu_end'] = {
        x: glyph.tempData['shu_end'].x + deltaX,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['zhe_start'] = {
        x: glyph.tempData['zhe_start'].x + deltaX,
        y: glyph.tempData['zhe_start'].y + deltaY,
      }
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y + deltaY,
      }
      break
    }
    case 'zhe_end': {
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y,
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
  glyph.setParam('折-水平延伸', _params.zhe_horizontalSpan)
  glyph.setParam('折-竖直延伸', _params.zhe_verticalSpan)
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
  const { shu_start, shu_end, zhe_start, zhe_end } = jointsMap
  const shu_horizontal_span_range = glyph.getParamRange('竖-水平延伸')
  const shu_vertical_span_range = glyph.getParamRange('竖-竖直延伸')
  const zhe_horizontal_span_range = glyph.getParamRange('折-水平延伸')
  const zhe_vertical_span_range = glyph.getParamRange('折-竖直延伸')
  const shu_horizontalSpan = range(shu_end.x - shu_start.x, shu_horizontal_span_range)
  const shu_verticalSpan = range(shu_end.y - shu_start.y, shu_vertical_span_range)
  const zhe_horizontalSpan = range(zhe_end.x - zhe_start.x, zhe_horizontal_span_range)
  const zhe_verticalSpan = range(zhe_end.y - zhe_start.y, zhe_vertical_span_range)
  return {
    shu_horizontalSpan,
    shu_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    shu_horizontalSpan,
    shu_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params

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

  // 折
  let zhe_start, zhe_end
  const zhe_start_ref = new FP.Joint(
    'zhe_start_ref',
    {
      x: shu_start.x + shu_horizontalSpan,
      y: shu_start.y + shu_verticalSpan,
    },
  )
  const zhe_end_ref = new FP.Joint(
    'zhe_end_ref',
    {
      x: zhe_start_ref.x + zhe_horizontalSpan,
      y: zhe_start_ref.y - zhe_verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x,
        y: zhe_start_ref.y + weight / 2,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x,
        y: zhe_end_ref.y + weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x,
        y: zhe_start_ref.y - weight / 2,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x,
        y: zhe_end_ref.y - weight / 2,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x,
        y: zhe_start_ref.y,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x,
        y: zhe_end_ref.y,
      },
    )
  }
  glyph.addJoint(zhe_start_ref)
  glyph.addJoint(zhe_end_ref)
  glyph.addRefLine(refline(zhe_start_ref, zhe_end_ref, 'ref'))

  glyph.addJoint(shu_start)
  glyph.addJoint(shu_end)
  glyph.addJoint(zhe_start)
  glyph.addJoint(zhe_end)

  const skeleton = {
    shu_start,
    shu_end,
    zhe_start,
    zhe_end,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
  glyph.addRefLine(refline(zhe_start, zhe_end))

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
  let {
    weights_variation_power,
    start_style_type,
    start_style_value,
    turn_style_type,
    turn_style_value,
    bending_degree,
    weight,
    end_style_type,
    end_style_value,
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
    zhe_start,
    zhe_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, weight, {
    unticlockwise: true,
  })
  const { out_zhe_start, out_zhe_end, in_zhe_start, in_zhe_end } = FP.getLineContours('zhe', { zhe_start, zhe_end }, weight, {
    unticlockwise: true,
  })
  const { corner: in_corner_shu_zhe } = FP.getIntersection(
    { type: 'line', start: in_shu_start, end: in_shu_end },
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
  )
  const { corner: out_corner_shu_zhe } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
  )

  // 计算竖折拐角处内外圆角相关的点与数据
  let in_radius_shu_zhe = bending_degree > 1 ? 60 * (bending_degree - 1) : 0
  let out_radius_shu_zhe = bending_degree > 1 ? 80 * (bending_degree - 1) : 0
  // 如果in_radius超出竖或折长度，取竖或折的最小长度
  const in_radius_min_length_shu_zhe = Math.min(
    getDistance(in_corner_shu_zhe, in_shu_start),
    getDistance(in_corner_shu_zhe, in_zhe_end),
  )
  const out_radius_min_length_shu_zhe = Math.min(
    getDistance(out_zhe_end, out_shu_start),
    getDistance(out_zhe_start, out_zhe_end),
  )
  if (in_radius_shu_zhe >= in_radius_min_length_shu_zhe) {
    in_radius_shu_zhe = in_radius_min_length_shu_zhe
  }
  if (out_radius_shu_zhe >= out_radius_min_length_shu_zhe) {
    out_radius_shu_zhe = out_radius_min_length_shu_zhe
  }
  const in_radius_start_shu_zhe = FP.getPointOnLine(in_corner_shu_zhe, in_shu_start, in_radius_shu_zhe)
  const in_radius_end_shu_zhe = getRadiusPoint({
    start: in_corner_shu_zhe,
    end: in_zhe_end,
    radius: in_radius_shu_zhe,
  })
  const out_radius_start_shu_zhe = FP.getPointOnLine(out_corner_shu_zhe, out_shu_start, out_radius_shu_zhe)
  const out_radius_end_shu_zhe = getRadiusPoint({
    start: out_corner_shu_zhe,
    end: out_zhe_end,
    radius: out_radius_shu_zhe,
  })

  let turn_data = {}
  {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    const turn_length = 20 * turn_style_value
    const inner_angle = Math.PI / 2
    const mid_angle = Math.PI / 4
    const inner_corner_length = weight
    const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
    const turn_control_1 = getRadiusPoint({
      start: out_corner_shu_zhe,
      end: out_shu_start,
      radius: corner_radius,
    })
    const turn_start_1 = getRadiusPoint({
      start: turn_control_1,
      end: out_shu_start,
      radius: corner_radius,
    })
    const turn_end_1 = {
      x: turn_control_1.x - turn_length * Math.cos(mid_angle),
      y: turn_control_1.y + turn_length * Math.sin(mid_angle),
    }
    const turn_control_2 = FP.getPointOnLine(out_corner_shu_zhe, out_zhe_end, corner_radius)
    const turn_start_2 = FP.getPointOnLine(turn_control_2, out_zhe_end, corner_radius)
    const turn_end_2 = {
      x: turn_control_2.x - turn_length * Math.cos(mid_angle),
      y: turn_control_2.y + turn_length * Math.sin(mid_angle),
    }
    turn_data = {
      turn_start_1,
      turn_control_1,
      turn_end_1,
      turn_start_2,
      turn_control_2,
      turn_end_2,
    }
  }

  let start_data = {}
  {
    // 计算起笔样式1或2需要的数据
    const angle = Math.atan2(shu_end.x - shu_start.x, shu_end.y - shu_start.x)
    const left_up = {
      x: out_shu_start.x - start_style.start_style_decorator_width * Math.cos(angle),
      y: out_shu_start.y + start_style.start_style_decorator_width * Math.sin(angle),
    }
    const right_up = {
      x: in_shu_start.x + start_style.start_style_decorator_width * Math.cos(angle),
      y: in_shu_start.y - start_style.start_style_decorator_width * Math.sin(angle),
    }
    const left_down = {
      x: left_up.x + start_style.start_style_decorator_height * Math.sin(angle),
      y: left_up.y + start_style.start_style_decorator_height * Math.cos(angle),
    }
    const right_down = {
      x: right_up.x + start_style.start_style_decorator_height * Math.sin(angle),
      y: right_up.y + start_style.start_style_decorator_height * Math.cos(angle),
    }
    const left_control = getRadiusPoint({
      start: out_shu_start,
      end: out_shu_end,
      radius: start_style.start_style_decorator_height,
    })
    const right_control = getRadiusPoint({
      start: in_shu_start,
      end: in_shu_end,
      radius: start_style.start_style_decorator_height,
    })
    const left_end = getRadiusPoint({
      start: out_shu_start,
      end: out_shu_end,
      radius: start_style.start_style_decorator_height + start_style.start_style_decorator_radius,
    })
    const right_end = getRadiusPoint({
      start: in_shu_start,
      end: in_shu_end,
      radius: start_style.start_style_decorator_height + start_style.start_style_decorator_radius,
    })
    start_data = {
      left_up,
      left_down,
      right_up,
      right_down,
      left_control,
      right_control,
      left_end,
      right_end,
    }
  }

  const turn_angle_1 = FP.degreeToRadius(10)
  const turn_angle_2 = FP.degreeToRadius(15)
  const radius = 5
  const startTopAngle = FP.degreeToRadius(-45)
  const startRightAngle = FP.degreeToRadius(-(40 + 5 * start_style_value))
  const startLeftAngle = FP.degreeToRadius(25 + 5 * start_style_value)
  const start_length = Math.min(35, FP.distance(shu_start, shu_end) * 0.5)

  const start_p0 = FP.getPointOnLine(in_shu_start, in_shu_end, start_length * 2)
  const start_p1 = FP.getPointOnLine(in_shu_start, in_shu_end, start_length)
  const start_p1_p2_vector = FP.turnAngleFromEnd(start_p0, start_p1, startRightAngle, 100)
  const start_p5 = FP.getPointOnLine(out_shu_start, out_shu_end, start_length)
  const start_p4 = out_shu_start
  const start_p4_p3_vector = FP.turnAngleFromEnd(start_p5, start_p4, startLeftAngle, 100)
  const start_p2_p3_vector = FP.turnAngleFromStart(shu_start, out_shu_start, startTopAngle, 100)
  const { corner: start_p2 } = FP.getIntersection(
    { type: 'line', start: start_p1, end: start_p1_p2_vector },
    { type: 'line', start: shu_start, end: start_p2_p3_vector }
  )
  const { corner: start_p3 } = FP.getIntersection(
    { type: 'line', start: start_p4, end: start_p4_p3_vector },
    { type: 'line', start: shu_start, end: start_p2_p3_vector }
  )
  const start_p2_radius_before = FP.getPointOnLine(start_p2, start_p1, radius)
  const start_p2_radius_after = FP.getPointOnLine(start_p2, start_p3, radius)
  const start_p4_radius_before = FP.getPointOnLine(start_p4, start_p3, radius)
  const start_p4_radius_after = FP.getPointOnLine(start_p4, start_p5, radius)

  const turn_p0 = turn_data.turn_control_2
  const turn_p3 = turn_data.turn_control_1
  const turn_p1_vector = FP.turnAngleFromStart(turn_p0, turn_data.turn_end_2, turn_angle_2, 100)
  const turn_p2_vector = FP.turnAngleFromStart(turn_p3, turn_data.turn_end_1, -turn_angle_1, 100)
  const { corner: turn_p1 } = FP.getIntersection(
    { type: 'line', start: turn_p0, end: turn_p1_vector },
    { type: 'line', start: turn_data.turn_end_2, end: turn_data.turn_end_1 }
  )
  const { corner: turn_p2 } = FP.getIntersection(
    { type: 'line', start: turn_p3, end: turn_p2_vector },
    { type: 'line', start: turn_data.turn_end_2, end: turn_data.turn_end_1 }
  )
  const turn_p1_radius_before = FP.getPointOnLine(turn_p1, turn_p0, radius)
  const turn_p1_radius_after = FP.getPointOnLine(turn_p1, turn_p2, radius)
  const turn_p2_radius_after = FP.getPointOnLine(turn_p2, turn_p3, radius)
  const turn_p2_radius_before = FP.getPointOnLine(turn_p2, turn_p1, radius)

  const endTopAngle = FP.degreeToRadius(25 + 5 * end_style_value)
  const endBottomAngle = FP.degreeToRadius(-(0 + 5 * end_style_value))
  const endRightAngle = FP.degreeToRadius(20)
  const end_length = Math.min(55, FP.distance(zhe_start, zhe_end) * 0.5)

  const end_p5 = FP.getPointOnLine(in_zhe_end, in_zhe_start, end_length * 2)
  const end_p4 = FP.getPointOnLine(in_zhe_end, in_zhe_start, end_length)
  const end_p4_p3_vector = FP.turnAngleFromEnd(end_p5, end_p4, endTopAngle, 100)
  const end_p0 = FP.getPointOnLine(out_zhe_end, out_zhe_start, end_length * 1.3)
  const end_p1 = FP.getPointOnLine(out_zhe_end, out_zhe_start, end_length * 0.65)
  const end_p1_p2_vector = FP.turnAngleFromEnd(end_p0, end_p1, endBottomAngle, 100)
  const end_p3_p2_vector = FP.turnAngleFromStart(out_zhe_end, zhe_end, endRightAngle, 100)
  const { corner: end_p2 } = FP.getIntersection(
    { type: 'line', start: end_p1, end: end_p1_p2_vector },
    { type: 'line', start: zhe_end, end: end_p3_p2_vector }
  )
  const { corner: end_p3 } = FP.getIntersection(
    { type: 'line', start: end_p4, end: end_p4_p3_vector },
    { type: 'line', start: zhe_end, end: end_p3_p2_vector }
  )
  const end_p2_radius_before = FP.getPointOnLine(end_p2, end_p1, radius)
  const end_p2_radius_after = FP.getPointOnLine(end_p2, end_p3, radius)
  const end_p3_radius_before = FP.getPointOnLine(end_p3, end_p2, radius)
  const end_p3_radius_after = FP.getPointOnLine(end_p3, end_p4, radius)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  if (start_style_type === 1) {
    // 绘制起笔衬线
    pen.moveTo(start_p0.x, start_p0.y)
    pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p2_radius_before.x, start_p2_radius_before.y)
    pen.quadraticBezierTo(start_p2.x, start_p2.y, start_p2_radius_after.x, start_p2_radius_after.y)
    pen.lineTo(start_p3.x, start_p3.y)
    pen.lineTo(start_p4_radius_before.x, start_p4_radius_before.y)
    pen.quadraticBezierTo(start_p4.x, start_p4.y, start_p4_radius_after.x, start_p4_radius_after.y)
    pen.lineTo(start_p5.x, start_p5.y)
  } else if (start_style_type === 0) {
    pen.moveTo(in_shu_start.x, in_shu_start.y)
    pen.lineTo(out_shu_start.x, out_shu_start.y)
  }

  // 绘制转角样式
  pen.lineTo(turn_p3.x, turn_p3.y)
  pen.lineTo(turn_p2_radius_after.x, turn_p2_radius_after.y)
  pen.quadraticBezierTo(turn_p2.x, turn_p2.y, turn_p2_radius_before.x, turn_p2_radius_before.y)
  pen.lineTo(turn_p1_radius_after.x, turn_p1_radius_after.y)
  pen.quadraticBezierTo(turn_p1.x, turn_p1.y, turn_p1_radius_before.x, turn_p1_radius_before.y)
  pen.lineTo(turn_p0.x, turn_p0.y)

  if (end_style_type === 1) {
    // 绘制衬线
    pen.lineTo(end_p0.x, end_p0.y)
    pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2_radius_before.x, end_p2_radius_before.y)
    pen.quadraticBezierTo(end_p2.x, end_p2.y, end_p2_radius_after.x, end_p2_radius_after.y)
    pen.lineTo(end_p3_radius_before.x, end_p3_radius_before.y)
    pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p3_radius_after.x, end_p3_radius_after.y)
    pen.quadraticBezierTo(end_p4.x, end_p4.y, end_p5.x, end_p5.y)
  } else {
    pen.lineTo(out_zhe_end.x, out_zhe_end.y)
    pen.lineTo(in_zhe_end.x, in_zhe_end.y)
  }

  // 绘制右侧（内侧）轮廓
  pen.lineTo(in_radius_end_shu_zhe.x, in_radius_end_shu_zhe.y)
  pen.quadraticBezierTo(in_corner_shu_zhe.x, in_corner_shu_zhe.y, in_radius_start_shu_zhe.x, in_radius_start_shu_zhe.y)

  if (start_style_type === 1) {
    // 绘制右侧（内侧）轮廓
    pen.lineTo(start_p0.x, start_p0.y)
  } else if (start_style_type === 0) {
    pen.lineTo(in_shu_start.x, in_shu_start.y)
  }

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)