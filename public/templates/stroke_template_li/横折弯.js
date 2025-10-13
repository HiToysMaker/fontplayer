const ox = 500
const oy = 500
const x0 = 300
const y0 = 345
const params = {
  heng_horizontalSpan: glyph.getParam('横-水平延伸'),
  heng_verticalSpan: glyph.getParam('横-竖直延伸'),
  zhe_horizontalSpan: glyph.getParam('折-水平延伸'),
  zhe_verticalSpan: glyph.getParam('折-竖直延伸'),
  wan_length: glyph.getParam('弯-长度'),
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
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
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
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
      }
      break
    }
    case 'zhe_end': {
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y + deltaY,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
      }
      break
    }
    case 'wan_start': {
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y + deltaY,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x + deltaX,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y + deltaY,
      }
      break
    }
    case 'wan_end': {
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x + deltaX,
        y: glyph.tempData['wan_end'].y,
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
  glyph.setParam('弯-长度', _params.wan_length)
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
  const { heng_start, heng_end, zhe_start, zhe_end, wan_start, wan_end } = jointsMap
  const heng_horizontalSpan_range = glyph.getParamRange('横-水平延伸')
  const heng_verticalSpan_range = glyph.getParamRange('横-竖直延伸')
  const zhe_horizontal_span_range = glyph.getParamRange('折-水平延伸')
  const zhe_vertical_span_range = glyph.getParamRange('折-竖直延伸')
  const wan_length_range = glyph.getParamRange('弯-长度')
  const heng_horizontalSpan = range(heng_end.x - heng_start.x, heng_horizontalSpan_range)
  const heng_verticalSpan = range(heng_start.y - heng_end.y, heng_verticalSpan_range)
  const zhe_horizontalSpan = range(zhe_start.x - zhe_end.x, zhe_horizontal_span_range)
  const zhe_verticalSpan = range(zhe_end.y - zhe_start.y, zhe_vertical_span_range)
  const wan_length = range(wan_end.x - wan_start.x, wan_length_range)
  return {
    heng_horizontalSpan,
    heng_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    wan_length,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_horizontalSpan,
    heng_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    wan_length,
    skeletonRefPos,
  } = params
  const { weight } = global_params

  const _weight = weight * 1.5

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

  // 弯
  const wan_start = new FP.Joint(
    'wan_start',
    {
      x: zhe_start.x - zhe_horizontalSpan,
      y: zhe_start.y + zhe_verticalSpan,
    },
  )
  const wan_end = new FP.Joint(
    'wan_end',
    {
      x: wan_start.x + wan_length,
      y: wan_start.y,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(zhe_start)
  glyph.addJoint(zhe_end)
  glyph.addJoint(wan_start)
  glyph.addJoint(wan_end)

  const skeleton = {
    heng_start,
    heng_end,
    zhe_start,
    zhe_end,
    wan_start,
    wan_end,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
  glyph.addRefLine(refline(zhe_start, zhe_end))
  glyph.addRefLine(refline(wan_start, wan_end))

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
    wan_start,
    wan_end,
  } = skeleton

  const _weight = weight * 1.5
  const _weight_2 = weight * 1.35
  const turn_angle_1 = FP.degreeToRadius(10)
  const turn_angle_2 = FP.degreeToRadius(15)
  const end_length = 30

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, _weight)
  const { out_zhe_start, out_zhe_end, in_zhe_start, in_zhe_end } = FP.getLineContours('zhe', { zhe_start, zhe_end }, _weight_2)
  const { out_wan_start, out_wan_end, in_wan_start, in_wan_end } = FP.getLineContours('wan', { wan_start, wan_end }, _weight_2)
  const { corner: in_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: in_heng_start, end: in_heng_end },
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
  )
  const { corner: out_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: out_heng_start, end: out_heng_end },
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
  )
  const { corner: in_corner_zhe_wan } = FP.getIntersection(
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
    { type: 'line', start: in_wan_start, end: in_wan_end },
  )
  const { corner: out_corner_zhe_wan } = FP.getIntersection(
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
    { type: 'line', start: out_wan_start, end: out_wan_end },
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
  const in_radius_start_heng_zhe = FP.getPointOnLine(in_corner_heng_zhe, in_heng_start, in_radius_heng_zhe)
  const in_radius_end_heng_zhe = getRadiusPoint({
    start: in_corner_heng_zhe,
    end: in_zhe_end,
    radius: in_radius_heng_zhe,
  })
  const out_radius_start_heng_zhe = FP.getPointOnLine(out_corner_heng_zhe, out_heng_start, out_radius_heng_zhe)
  const out_radius_end_heng_zhe = getRadiusPoint({
    start: out_corner_heng_zhe,
    end: out_zhe_end,
    radius: out_radius_heng_zhe,
  })

  // 计算折弯拐角处内外圆角相关的点与数据
  let in_radius_zhe_wan = 80 * bending_degree
  let out_radius_zhe_wan = 60 * bending_degree
  // 如果in_radius超出竖或弯长度，取竖或弯的最小长度
  const in_radius_min_length_zhe_wan = Math.min(
    getDistance(in_corner_zhe_wan, in_radius_end_heng_zhe),
    getDistance(in_corner_zhe_wan, in_wan_end),
  )
  const out_radius_min_length_zhe_wan = Math.min(
    getDistance(out_corner_zhe_wan, out_radius_end_heng_zhe),
    getDistance(out_corner_zhe_wan, out_wan_end),
  )
  if (in_radius_zhe_wan >= in_radius_min_length_zhe_wan) {
    in_radius_zhe_wan = in_radius_min_length_zhe_wan
  }
  if (out_radius_zhe_wan >= out_radius_min_length_zhe_wan) {
    out_radius_zhe_wan = out_radius_min_length_zhe_wan
  }
  const in_radius_start_zhe_wan = getRadiusPoint({
    start: in_corner_zhe_wan,
    end: in_corner_heng_zhe,
    radius: in_radius_zhe_wan,
  })
  const in_radius_end_zhe_wan = getRadiusPoint({
    start: in_corner_zhe_wan,
    end: in_wan_end,
    radius: in_radius_zhe_wan,
  })
  const out_radius_start_zhe_wan = getRadiusPoint({
    start: out_corner_zhe_wan,
    end: out_corner_heng_zhe_down,
    radius: out_radius_zhe_wan,
  })
  const out_radius_end_zhe_wan = getRadiusPoint({
    start: out_corner_zhe_wan,
    end: out_wan_end,
    radius: out_radius_zhe_wan,
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
  const start_length = Math.min(50, FP.distance(heng_start, heng_end) * 0.2)
  const d = 3 + 3 * weights_variation_power
  const l = FP.distance(heng_start, heng_end)
  const l_2 = FP.distance(zhe_start, zhe_end)
  const control_length = Math.min((l * 0.5 - start_length) * 0.2, 45)
  const control_length_2 = Math.min(l_2 * 0.5 - end_length, 45)

  const out_turn_p2 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 - control_length), d)
  const out_turn_p1 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5), d)
  const out_turn_p0 = FP.turnLeft(out_heng_end, FP.getPointOnLine(out_heng_end, out_heng_start, l * 0.5 + control_length), d)
  const in_turn_p2 = FP.turnRight(in_heng_end, FP.getPointOnLine(in_heng_end, in_heng_start, l * 0.5 - control_length), d)
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
  const in_turn_p4 = FP.turnRight(in_zhe_end, FP.getPointOnLine(in_zhe_end, in_zhe_start, l_2 * 0.5 + control_length_2), d)
  const in_turn_p3 = in_corner_heng_zhe

  const out_turn_p4_radius_before = FP.getPointOnLine(out_turn_p4, out_turn_p3, FP.distance(out_turn_p4, out_turn_p3) * 0.7)
  const out_turn_p4_radius_after = FP.getPointOnLine(out_turn_p4, out_turn_p5, FP.distance(out_turn_p4, out_turn_p5) * 0.4)
  const out_turn_p5_radius_before = FP.getPointOnLine(out_turn_p5, out_turn_p4, FP.distance(out_turn_p5, out_turn_p4) * 0.4)
  const out_turn_p5_radius_after = FP.getPointOnLine(out_turn_p5, out_turn_p6, FP.distance(out_turn_p5, out_turn_p6) * 0.7)
  const in_turn_p3_radius_before = FP.getPointOnLine(in_turn_p3, in_turn_p2, radius)
  const in_turn_p3_radius_after = FP.getPointOnLine(in_turn_p3, in_turn_p4, radius)

  const start_p4 = heng_start
  const start_p5 = FP.turnAngleFromEnd(heng_end, heng_start, FP.degreeToRadius(90) - leftAngle, _weight * 0.6)
  const start_p3 = FP.turnAngleFromEnd(heng_end, heng_start, -(FP.degreeToRadius(90) + leftAngle), _weight * 0.75)
  const start_p6 = FP.turnLeft(start_p4, start_p5, _weight * 0.5)
  const start_p7 = FP.turnLeft(start_p4, start_p5, _weight)
  const start_p7_p9_vector = FP.turnLeft(start_p5, start_p7, 100)
  const { corner: start_p9 } = FP.getIntersection(
    { type: 'line', start: start_p7, end: start_p7_p9_vector },
    { type: 'line', start: in_heng_start, end: in_heng_end }
  )
  const start_p8 = FP.getPointOnLine(start_p7, start_p9, FP.distance(start_p7, start_p9) * 0.5)
  const start_p10 = FP.getPointOnLine(start_p9, in_turn_p0, FP.distance(start_p9, in_turn_p0) * 0.5)
  const start_p1 = FP.turnRight(start_p4, start_p3, _weight * 0.5)
  const start_p2 = FP.getPointOnLine(start_p3, start_p1, FP.distance(start_p3, start_p1) * 0.5)
  const start_p0 = FP.getPointOnLine(start_p1, out_turn_p0, FP.distance(start_p1, out_turn_p0) * 0.5)

  const turn_p0 = turn_data.turn_control_2
  const turn_p3 = turn_data.turn_control_1
  const turn_p1_vector = FP.turnAngleFromStart(turn_p0, turn_data.turn_end_2, -turn_angle_2, 100)
  const turn_p2_vector = FP.turnAngleFromStart(turn_p3, turn_data.turn_end_1, turn_angle_1, 100)
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

  const d_2 = Math.min(getDistance(wan_start, wan_end) * 0.5, end_length * end_style_value)
  const angle = 45
  const a = d_2 * 0.5 / Math.cos(FP.degreeToRadius(angle))
  const end_p0 = FP.getPointOnLine(in_wan_end, in_wan_start, d_2 * 0.5)
  const end_p1 = in_wan_end
  const end_p2 = FP.turnLeft(end_p0, end_p1, weight * 0.5)
  const end_p3 = out_wan_end
  const end_p4 = FP.turnAngleFromEnd(end_p1, end_p3, FP.degreeToRadius(90 - angle), a)
  const end_p5 = FP.getPointOnLine(end_p3, out_wan_start, d_2)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  pen.moveTo(start_p0.x, start_p0.y)
  pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p2.x, start_p2.y)
  pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p4.x, start_p4.y)
  pen.quadraticBezierTo(start_p5.x, start_p5.y, start_p6.x, start_p6.y)
  pen.quadraticBezierTo(start_p7.x, start_p7.y, start_p8.x, start_p8.y)
  pen.quadraticBezierTo(start_p9.x, start_p9.y, start_p10.x, start_p10.y)

  pen.quadraticBezierTo(in_turn_p0.x, in_turn_p0.y, in_turn_p1.x, in_turn_p1.y)
  pen.quadraticBezierTo(in_turn_p2.x, in_turn_p2.y, in_turn_p3_radius_before.x, in_turn_p3_radius_before.y)
  pen.quadraticBezierTo(in_turn_p3.x, in_turn_p3.y, in_turn_p3_radius_after.x, in_turn_p3_radius_after.y)

  // 绘制内侧折弯圆角
  pen.lineTo(in_radius_start_zhe_wan.x, in_radius_start_zhe_wan.y)
  pen.quadraticBezierTo(in_corner_zhe_wan.x, in_corner_zhe_wan.y, in_radius_end_zhe_wan.x, in_radius_end_zhe_wan.y)

  // 绘制收笔衬线
  pen.lineTo(end_p0.x, end_p0.y)
  pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2.x, end_p2.y)
  pen.bezierTo(end_p3.x, end_p3.y, end_p4.x, end_p4.y, end_p5.x, end_p5.y)

  // 绘制外侧折弯圆角
  pen.lineTo(out_radius_end_zhe_wan.x, out_radius_end_zhe_wan.y)
  pen.quadraticBezierTo(out_corner_zhe_wan.x, out_corner_zhe_wan.y, out_radius_start_zhe_wan.x, out_radius_start_zhe_wan.y)

  pen.lineTo(turn_data.turn_start_2.x, turn_data.turn_start_2.y)
  pen.quadraticBezierTo(turn_p0.x, turn_p0.y, turn_p1_radius_before.x, turn_p1_radius_before.y)
  pen.quadraticBezierTo(turn_p1.x, turn_p1.y, turn_p1_radius_after.x, turn_p1_radius_after.y)
  pen.lineTo(out_turn_p4_radius_after.x, out_turn_p4_radius_after.y)
  pen.quadraticBezierTo(out_turn_p4.x, out_turn_p4.y, out_turn_p4_radius_before.x, out_turn_p4_radius_before.y)
  pen.bezierTo(out_turn_p3.x, out_turn_p3.y, out_turn_p2.x, out_turn_p2.y, out_turn_p1.x, out_turn_p1.y)
  pen.quadraticBezierTo(out_turn_p0.x, out_turn_p0.y, start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)