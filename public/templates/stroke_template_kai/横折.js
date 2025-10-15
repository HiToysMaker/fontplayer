const ox = 500
const oy = 500
const x0 = 250
const y0 = 345
const params = {
  heng_horizontalSpan: glyph.getParam('横-水平延伸'),
  heng_verticalSpan: glyph.getParam('横-竖直延伸'),
  zhe_horizontalSpan: glyph.getParam('折-水平延伸'),
  zhe_verticalSpan: glyph.getParam('折-竖直延伸'),
  skeletonRefPos: glyph.getParam('参考位置'),
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
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y + deltaY,
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
        y: glyph.tempData['zhe_end'].y + deltaY,
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
  const { heng_start, heng_end, zhe_start, zhe_end } = jointsMap
  const heng_horizontalSpan_range = glyph.getParamRange('横-水平延伸')
  const heng_verticalSpan_range = glyph.getParamRange('横-竖直延伸')
  const zhe_horizontal_span_range = glyph.getParamRange('折-水平延伸')
  const zhe_verticalSpan_range = glyph.getParamRange('折-竖直延伸')
  const heng_horizontalSpan = range(heng_end.x - heng_start.x, heng_horizontalSpan_range)
  const heng_verticalSpan = range(heng_start.y - heng_end.y, heng_verticalSpan_range)
  const zhe_horizontalSpan = range(zhe_start.x - zhe_end.x, zhe_horizontal_span_range)
  const zhe_verticalSpan = range(zhe_end.y - zhe_start.y, zhe_verticalSpan_range)
  return {
    heng_horizontalSpan,
    heng_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_horizontalSpan,
    heng_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params

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
        y: heng_start_ref.y + weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y + weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    heng_start = new FP.Joint(
      'heng_start',
      {
        x: heng_start_ref.x,
        y: heng_start_ref.y - weight / 2,
      },
    )
    heng_end = new FP.Joint(
      'heng_end',
      {
        x: heng_end_ref.x,
        y: heng_end_ref.y - weight / 2,
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

  // 折
  const zhe_start = new FP.Joint(
    'zhe_start',
    {
      x: heng_end.x,
      y: heng_end.y,
    },
  )
  const zhe_end = new FP.Joint(
    'zhe_end',
    {
      x: zhe_start.x - zhe_horizontalSpan,
      y: zhe_start.y + zhe_verticalSpan,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(zhe_start)
  glyph.addJoint(zhe_end)

  const skeleton = {
    heng_start,
    heng_end,
    zhe_start,
    zhe_end,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
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
    end_style_type,
    end_style_value,
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
    heng_start,
    heng_end,
    zhe_start,
    zhe_end,
  } = skeleton

  const turn_angle_1 = FP.degreeToRadius(10)
  const turn_angle_2 = FP.degreeToRadius(15)
  const _weight = weight * 1.5

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, _weight)
  const { out_zhe_start, out_zhe_end, in_zhe_start, in_zhe_end } = FP.getLineContours('zhe', { zhe_start, zhe_end }, _weight)
  const { corner: in_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: in_heng_start, end: in_heng_end },
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
  )
  const { corner: out_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: out_heng_start, end: out_heng_end },
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
  )
  const { corner: out_corner_heng_zhe_down } = FP.getIntersection(
    { type: 'line', start: out_zhe_start, end: in_zhe_end },
    { type: 'line', start: in_heng_start, end: in_heng_end }
  )
  const out_corner_heng_zhe_up = {
    x: out_corner_heng_zhe_down.x,
    y: out_corner_heng_zhe_down.y - weight,
  }

  // 计算横折拐角处内外圆角相关的点与数据
  let in_radius_heng_zhe = bending_degree > 1 ? 60 * (bending_degree - 1) : 0
  let out_radius_heng_zhe = bending_degree > 1 ? 80 * (bending_degree - 1) : 0
  // 如果in_radius超出横或折长度，取横或折的最小长度
  const in_radius_min_length_heng_zhe = Math.min(
    getDistance(in_corner_heng_zhe, in_heng_start),
    getDistance(in_corner_heng_zhe, in_zhe_end),
  )
  const out_radius_min_length_heng_zhe = Math.min(
    getDistance(out_zhe_end, out_heng_start),
    getDistance(out_zhe_start, out_zhe_end),
  )
  if (in_radius_heng_zhe >= in_radius_min_length_heng_zhe) {
    in_radius_heng_zhe = in_radius_min_length_heng_zhe
  }
  if (out_radius_heng_zhe >= out_radius_min_length_heng_zhe) {
    out_radius_heng_zhe = out_radius_min_length_heng_zhe
  }
  const in_radius_start_heng_zhe = {
    x: in_corner_heng_zhe.x - in_radius_heng_zhe,
    y: in_corner_heng_zhe.y,
  }
  const in_radius_end_heng_zhe = getRadiusPoint({
    start: in_corner_heng_zhe,
    end: in_zhe_end,
    radius: in_radius_heng_zhe,
  })
  const out_radius_start_heng_zhe = {
    x: out_corner_heng_zhe.x - out_radius_heng_zhe,
    y: out_corner_heng_zhe.y,
  }
  const out_radius_end_heng_zhe = getRadiusPoint({
    start: out_corner_heng_zhe,
    end: out_zhe_end,
    radius: out_radius_heng_zhe,
  })

  let turn_data = {}
  {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    const turn_length = 20 * turn_style_value
    const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_heng_start, out_corner_heng_zhe, out_zhe_end)
    const inner_corner_length = _weight
    const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
    const turn_control_1 = FP.getPointOnLine(out_corner_heng_zhe, out_heng_start, corner_radius)
    const turn_start_1 = FP.getPointOnLine(turn_control_1, out_heng_start, corner_radius)
    const turn_end_1 = {
      x: turn_control_1.x + turn_length * Math.cos(mid_angle),
      y: turn_control_1.y - turn_length * Math.sin(mid_angle),
    }
    const turn_control_2 = getRadiusPoint({
      start: out_corner_heng_zhe,
      end: out_zhe_end,
      radius: corner_radius,
    })
    const turn_start_2 = getRadiusPoint({
      start: turn_control_2,
      end: out_zhe_end,
      radius: corner_radius,
    })
    const turn_end_2 = {
      x: turn_control_2.x + turn_length * Math.cos(mid_angle),
      y: turn_control_2.y - turn_length * Math.sin(mid_angle),
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

  const radius = 15
  const topAngle = FP.degreeToRadius(-(5 + 5 * start_style_value))
  const bottomAngle = FP.degreeToRadius(25 + 5 * start_style_value)
  const leftAngle = FP.degreeToRadius(20)
  const start_length = Math.min(50, FP.distance(heng_start, heng_end) * 0.3)
  const endRightAngle = FP.degreeToRadius(25 + 5 * end_style_value)
  const endLeftAngle = FP.degreeToRadius(-(0 + 5 * end_style_value))
  const endBottomAngle = FP.degreeToRadius(20)
  const end_length = Math.min(60, FP.distance(zhe_start, zhe_end) * 0.3)
  const d = 6 + 3 * weights_variation_power
  const l = FP.distance(heng_start, heng_end)
  const l_2 = FP.distance(zhe_start, zhe_end)
  const control_length = Math.min(l * 0.5 - start_length, 45)
  const control_length_2 = Math.min(l_2 * 0.5 - end_length, 45)

  const out_turn_p2 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 - control_length), d)
  const out_turn_p1 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5), d)
  const out_turn_p0 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 + control_length), d)
  let in_turn_p2 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5 - control_length), d)
  const in_turn_p1 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5), d)
  const in_turn_p0 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5 + control_length), d)
  const out_turn_p3 = turn_data.turn_start_1
  const out_turn_p6 = turn_data.turn_control_2
  const turn_p4_vector = FP.turnAngleFromStart(turn_data.turn_control_1, turn_data.turn_end_1, turn_angle_1, 100)
  const turn_p5_vector = FP.turnAngleFromStart(out_turn_p6, turn_data.turn_end_2, -turn_angle_2, 100)
  const { corner: out_turn_p4 } = FP.getIntersection(
    { type: 'line', start: turn_data.turn_control_1, end: turn_p4_vector },
    { type: 'line', start: turn_data.turn_end_2, end: turn_data.turn_end_1 }
  )
  const { corner: out_turn_p5 } = FP.getIntersection(
    { type: 'line', start: out_turn_p6, end: turn_p5_vector },
    { type: 'line', start: turn_data.turn_end_2, end: turn_data.turn_end_1 }
  )
  const out_turn_p9 = FP.turnLeft(out_zhe_end, FP.getPointOnLine(out_zhe_end, out_zhe_start, l_2 * 0.5 - control_length_2), d)
  const out_turn_p8 = FP.turnLeft(out_zhe_end, FP.getPointOnLine(out_zhe_end, out_zhe_start, l_2 * 0.5), d)
  const out_turn_p7 = FP.turnLeft(out_zhe_end, FP.getPointOnLine(out_zhe_end, out_zhe_start, l_2 * 0.5 + control_length_2), d)
  const in_turn_p6 = FP.turnRight(in_zhe_end, FP.getPointOnLine(in_zhe_end, in_zhe_start, l_2 * 0.5 - control_length_2), d)
  const in_turn_p5 = FP.turnRight(in_zhe_end, FP.getPointOnLine(in_zhe_end, in_zhe_start, l_2 * 0.5), d)
  let in_turn_p4 = FP.turnRight(in_zhe_end, FP.getPointOnLine(in_zhe_end, in_zhe_start, l_2 * 0.5 + control_length_2), d)
  const in_turn_p3 = in_corner_heng_zhe

  const out_turn_p4_radius_before = FP.getPointOnLine(out_turn_p4, out_turn_p3, radius)
  const out_turn_p4_radius_after = FP.getPointOnLine(out_turn_p4, out_turn_p5, radius)
  const out_turn_p5_radius_before = FP.getPointOnLine(out_turn_p5, out_turn_p4, radius)
  const out_turn_p5_radius_after = FP.getPointOnLine(out_turn_p5, out_turn_p6, radius)
  let in_turn_p3_radius_before = FP.getPointOnLine(in_turn_p3, in_turn_p2, radius)
  let in_turn_p3_radius_after = FP.getPointOnLine(in_turn_p3, in_turn_p4, radius)

  if (FP.distance(zhe_start, zhe_end) <= 150 || FP.getAngle(heng_start, heng_end, zhe_end) <= FP.degreeToRadius(60)) {
    in_turn_p4 = FP.getPointOnLine(in_turn_p3, in_turn_p5, FP.distance(in_turn_p3, in_turn_p5) * 0.5)
    in_turn_p3_radius_after = in_turn_p4
  }
  if (FP.distance(heng_start, heng_end) <= 210) {
    in_turn_p2 = FP.getPointOnLine(in_turn_p3, in_turn_p1, FP.distance(in_turn_p3, in_turn_p1) * 0.5)
    in_turn_p3_radius_before = in_turn_p2
  }

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

  const end_p1 = FP.getPointOnLine(in_zhe_end, in_zhe_start, end_length)
  const end_p4 = FP.getPointOnLine(out_zhe_end, out_zhe_start, end_length)
  const end_p1_p2_vector = FP.turnAngleFromEnd(in_zhe_start, end_p1, endLeftAngle, 100)
  const end_p4_p3_vector = FP.turnAngleFromEnd(out_zhe_start, end_p4, endRightAngle, 100)
  const end_p2_p3_vector = FP.turnAngleFromStart(zhe_end, out_zhe_end, endBottomAngle, 100)
  const { corner: end_p2 } = FP.getIntersection(
    { type: 'line', start: end_p1, end: end_p1_p2_vector },
    { type: 'line', start: zhe_end, end: end_p2_p3_vector }
  )
  const { corner: end_p3 } = FP.getIntersection(
    { type: 'line', start: end_p4, end: end_p4_p3_vector },
    { type: 'line', start: zhe_end, end: end_p2_p3_vector }
  )
  const end_p0 = FP.getPointOnLine(end_p1, in_turn_p6, FP.distance(end_p1, in_turn_p6) * 0.5)
  const end_p5 = FP.getPointOnLine(end_p4, out_turn_p9, FP.distance(end_p4, out_turn_p9) * 0.5)

  const end_p2_radius_before = FP.getPointOnLine(end_p2, end_p1, radius)
  const end_p2_radius_after = FP.getPointOnLine(end_p2, end_p3, radius)
  const end_p3_radius_before = FP.getPointOnLine(end_p3, end_p2, radius)
  const end_p3_radius_after = FP.getPointOnLine(end_p3, end_p4, radius)

  const start_p0_joint = new FP.Joint('start_p0', start_p0)
  const start_p1_joint = new FP.Joint('start_p1', start_p1)
  const start_p2_joint = new FP.Joint('start_p2', start_p2)
  const start_p3_joint = new FP.Joint('start_p3', start_p3)
  const start_p4_joint = new FP.Joint('start_p4', start_p4)
  const start_p5_joint = new FP.Joint('start_p5', start_p5)
  const in_turn_p0_joint = new FP.Joint('in_turn_p0', in_turn_p0)
  const in_turn_p1_joint = new FP.Joint('in_turn_p1', in_turn_p1)
  const in_turn_p2_joint = new FP.Joint('in_turn_p2', in_turn_p2)
  const in_turn_p3_joint = new FP.Joint('in_turn_p3', in_turn_p3)
  const in_turn_p4_joint = new FP.Joint('in_turn_p4', in_turn_p4)
  const in_turn_p5_joint = new FP.Joint('in_turn_p5', in_turn_p5)
  const in_turn_p6_joint = new FP.Joint('in_turn_p6', in_turn_p6)
  const end_p0_joint = new FP.Joint('end_p0', end_p0)
  const end_p1_joint = new FP.Joint('end_p1', end_p1)
  const end_p2_joint = new FP.Joint('end_p2', end_p2)
  const end_p3_joint = new FP.Joint('end_p3', end_p3)
  const end_p4_joint = new FP.Joint('end_p4', end_p4)
  const end_p5_joint = new FP.Joint('end_p5', end_p5)
  const out_turn_p0_joint = new FP.Joint('out_turn_p0', out_turn_p0)
  const out_turn_p1_joint = new FP.Joint('out_turn_p1', out_turn_p1)
  const out_turn_p2_joint = new FP.Joint('out_turn_p2', out_turn_p2)
  const out_turn_p3_joint = new FP.Joint('out_turn_p3', out_turn_p3)
  const out_turn_p4_joint = new FP.Joint('out_turn_p4', out_turn_p4)
  const out_turn_p5_joint = new FP.Joint('out_turn_p5', out_turn_p5)
  const out_turn_p6_joint = new FP.Joint('out_turn_p6', out_turn_p6)
  const out_turn_p7_joint = new FP.Joint('out_turn_p7', out_turn_p7)
  const out_turn_p8_joint = new FP.Joint('out_turn_p8', out_turn_p8)
  const out_turn_p9_joint = new FP.Joint('out_turn_p9', out_turn_p9)

  glyph.addJoint(start_p0_joint)
  glyph.addJoint(start_p1_joint)
  glyph.addJoint(start_p2_joint)
  glyph.addJoint(start_p3_joint)
  glyph.addJoint(start_p4_joint)
  glyph.addJoint(start_p5_joint)

  glyph.addJoint(in_turn_p0_joint)
  glyph.addJoint(in_turn_p1_joint)
  glyph.addJoint(in_turn_p2_joint)
  glyph.addJoint(in_turn_p3_joint)
  glyph.addJoint(in_turn_p4_joint)
  glyph.addJoint(in_turn_p5_joint)
  glyph.addJoint(in_turn_p6_joint)

  glyph.addJoint(end_p0_joint)
  glyph.addJoint(end_p1_joint)
  glyph.addJoint(end_p2_joint)
  glyph.addJoint(end_p3_joint)
  glyph.addJoint(end_p4_joint)
  glyph.addJoint(end_p5_joint)

  glyph.addJoint(out_turn_p0_joint)
  glyph.addJoint(out_turn_p1_joint)
  glyph.addJoint(out_turn_p2_joint)
  glyph.addJoint(out_turn_p3_joint)
  glyph.addJoint(out_turn_p4_joint)
  glyph.addJoint(out_turn_p5_joint)
  glyph.addJoint(out_turn_p6_joint)
  glyph.addJoint(out_turn_p7_joint)
  glyph.addJoint(out_turn_p8_joint)
  glyph.addJoint(out_turn_p9_joint)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  if (FP.distance(heng_start, heng_end) > 250) {
    pen.moveTo(out_turn_p1.x, out_turn_p1.y)
    pen.quadraticBezierTo(out_turn_p0.x, out_turn_p0.y, start_p0.x, start_p0.y)
    pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p2_radius_before.x, start_p2_radius_before.y)
    pen.quadraticBezierTo(start_p2.x, start_p2.y, start_p2_radius_after.x, start_p2_radius_after.y)
    pen.lineTo(start_p3_radius_before.x, start_p3_radius_before.y)
    pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p3_radius_after.x, start_p3_radius_after.y)
    pen.quadraticBezierTo(start_p4.x, start_p4.y, start_p5.x, start_p5.y)
    pen.quadraticBezierTo(in_turn_p0.x, in_turn_p0.y, in_turn_p1.x, in_turn_p1.y)
  } else if (FP.distance(heng_start, heng_end) <= 250 && FP.distance(heng_start, heng_end) > 150) {
    pen.moveTo(out_turn_p1.x, out_turn_p1.y)
    pen.quadraticBezierTo(start_p0.x, start_p0.y, start_p2_radius_before.x, start_p2_radius_before.y)
    pen.quadraticBezierTo(start_p2.x, start_p2.y, start_p2_radius_after.x, start_p2_radius_after.y)
    pen.lineTo(start_p3_radius_before.x, start_p3_radius_before.y)
    pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p3_radius_after.x, start_p3_radius_after.y)
    pen.quadraticBezierTo(start_p5.x, start_p5.y, in_turn_p1.x, in_turn_p1.y)
  } else if (FP.distance(heng_start, heng_end) <= 150) {
    pen.moveTo(out_turn_p4_radius_before.x, out_turn_p4_radius_before.y)
    pen.quadraticBezierTo(out_turn_p1.x, out_turn_p1.y, start_p2_radius_before.x, start_p2_radius_before.y)
    pen.quadraticBezierTo(start_p2.x, start_p2.y, start_p2_radius_after.x, start_p2_radius_after.y)
    pen.lineTo(start_p3_radius_before.x, start_p3_radius_before.y)
    pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p3_radius_after.x, start_p3_radius_after.y)
    pen.quadraticBezierTo(in_turn_p1.x, in_turn_p1.y, in_turn_p3_radius_before.x, in_turn_p3_radius_before.y)
  }

  if (FP.distance(heng_start, heng_end) > 150) {
    pen.quadraticBezierTo(in_turn_p2.x, in_turn_p2.y, in_turn_p3_radius_before.x, in_turn_p3_radius_before.y)
    pen.quadraticBezierTo(in_turn_p3.x, in_turn_p3.y, in_turn_p3_radius_after.x, in_turn_p3_radius_after.y)
    pen.quadraticBezierTo(in_turn_p4.x, in_turn_p4.y, in_turn_p5.x, in_turn_p5.y)
  } else if (FP.distance(heng_start, heng_end) <= 150) {
    pen.quadraticBezierTo(in_turn_p4.x, in_turn_p4.y, in_turn_p5.x, in_turn_p5.y)
  }

  if (FP.distance(zhe_start, zhe_end) > 300) {
    pen.quadraticBezierTo(in_turn_p6.x, in_turn_p6.y, end_p0.x, end_p0.y)
    pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2_radius_before.x, end_p2_radius_before.y)
    pen.quadraticBezierTo(end_p2.x, end_p2.y, end_p2_radius_after.x, end_p2_radius_after.y)
    pen.lineTo(end_p3_radius_before.x, end_p3_radius_before.y)
    pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p3_radius_after.x, end_p3_radius_after.y)
    pen.quadraticBezierTo(end_p4.x, end_p4.y, end_p5.x, end_p5.y)
    pen.quadraticBezierTo(out_turn_p9.x, out_turn_p9.y, out_turn_p8.x, out_turn_p8.y)
  } else if (FP.distance(zhe_start, zhe_end) <= 300) {
    pen.quadraticBezierTo(end_p0.x, end_p0.y, end_p2_radius_before.x, end_p2_radius_before.y)
    pen.quadraticBezierTo(end_p2.x, end_p2.y, end_p2_radius_after.x, end_p2_radius_after.y)
    pen.lineTo(end_p3_radius_before.x, end_p3_radius_before.y)
    pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p3_radius_after.x, end_p3_radius_after.y)
    pen.quadraticBezierTo(end_p5.x, end_p5.y, out_turn_p8.x, out_turn_p8.y)
  }
  
  pen.bezierTo(out_turn_p7.x, out_turn_p7.y, out_turn_p6.x, out_turn_p6.y, out_turn_p5_radius_after.x, out_turn_p5_radius_after.y)
  pen.quadraticBezierTo(out_turn_p5.x, out_turn_p5.y, out_turn_p5_radius_before.x, out_turn_p5_radius_before.y)
  pen.lineTo(out_turn_p4_radius_after.x, out_turn_p4_radius_after.y)
  pen.quadraticBezierTo(out_turn_p4.x, out_turn_p4.y, out_turn_p4_radius_before.x, out_turn_p4_radius_before.y)

  if (FP.distance(heng_start, heng_end) > 150) {
    pen.bezierTo(out_turn_p3.x, out_turn_p3.y, out_turn_p2.x, out_turn_p2.y, out_turn_p1.x, out_turn_p1.y)
  }

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)