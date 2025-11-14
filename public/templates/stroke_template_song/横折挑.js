const ox = 500
const oy = 500
const x0 = 425
const y0 = 245
const params = {
  heng_horizontalSpan: glyph.getParam('横-水平延伸'),
  heng_verticalSpan: glyph.getParam('横-竖直延伸'),
  zhe_horizontalSpan: glyph.getParam('折-水平延伸'),
  zhe_verticalSpan: glyph.getParam('折-竖直延伸'),
  tiao_horizontalSpan: glyph.getParam('挑-水平延伸'),
  tiao_verticalSpan: glyph.getParam('挑-竖直延伸'),
  skeletonRefPos: glyph.getParam('参考位置'),
}
const global_params = {
  stress_ratio: glyph.getParam('竖横比'),
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
  let { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'heng_end': {
      const heng_vertical_span_range = glyph.getParamRange('横-竖直延伸')
      deltaY = range(deltaY, heng_vertical_span_range)
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
      jointsMap['tiao_start'] = {
        x: glyph.tempData['tiao_start'].x + deltaX,
        y: glyph.tempData['tiao_start'].y + deltaY,
      }
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      break
    }
    case 'zhe_start': {
      const heng_vertical_span_range = glyph.getParamRange('横-竖直延伸')
      deltaY = range(deltaY, heng_vertical_span_range)
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
      jointsMap['tiao_start'] = {
        x: glyph.tempData['tiao_start'].x + deltaX,
        y: glyph.tempData['tiao_start'].y + deltaY,
      }
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      break
    }
    case 'zhe_end': {
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y + deltaY,
      }
      jointsMap['tiao_start'] = {
        x: glyph.tempData['tiao_start'].x + deltaX,
        y: glyph.tempData['tiao_start'].y + deltaY,
      }
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      break
    }
    case 'tiao_start': {
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y + deltaY,
      }
      jointsMap['tiao_start'] = {
        x: glyph.tempData['tiao_start'].x + deltaX,
        y: glyph.tempData['tiao_start'].y + deltaY,
      }
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      break
    }
    case 'tiao_end': {
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x + deltaX,
        y: glyph.tempData['tiao_end'].y + deltaY,
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
  glyph.setParam('挑-水平延伸', _params.tiao_horizontalSpan)
  glyph.setParam('挑-竖直延伸', _params.tiao_verticalSpan)
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
  const { heng_start, heng_end, zhe_start, zhe_end, tiao_start, tiao_end } = jointsMap
  const heng_horizontalSpan_range = glyph.getParamRange('横-水平延伸')
  const heng_verticalSpan_range = glyph.getParamRange('横-竖直延伸')
  const zhe_horizontalSpan_range = glyph.getParamRange('折-水平延伸')
  const zhe_verticalSpan_range = glyph.getParamRange('折-竖直延伸')
  const tiao_horizontal_span_range = glyph.getParamRange('挑-水平延伸')
  const tiao_vertical_span_range = glyph.getParamRange('挑-竖直延伸')
  const heng_horizontalSpan = range(heng_end.x - heng_start.x, heng_horizontalSpan_range)
  const heng_verticalSpan = range(heng_start.y - heng_end.y, heng_verticalSpan_range)
  const zhe_horizontalSpan = range(zhe_end.x - zhe_start.x, zhe_horizontalSpan_range)
  const zhe_verticalSpan = range(zhe_end.y - zhe_start.y, zhe_verticalSpan_range)
  const tiao_horizontalSpan = range(tiao_end.x - tiao_start.x, tiao_horizontal_span_range)
  const tiao_verticalSpan = range(tiao_start.y - tiao_end.y, tiao_vertical_span_range)
  return {
    heng_horizontalSpan,
    heng_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    tiao_horizontalSpan,
    tiao_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_horizontalSpan,
    heng_verticalSpan,
    zhe_horizontalSpan,
    zhe_verticalSpan,
    tiao_horizontalSpan,
    tiao_verticalSpan,
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

  // 折
  let zhe_start, zhe_end
  const zhe_start_ref = new FP.Joint(
    'zhe_start_ref',
    {
      x: heng_end_ref.x,
      y: heng_end_ref.y,
    },
  )
  const zhe_end_ref = new FP.Joint(
    'zhe_end_ref',
    {
      x: zhe_start_ref.x + zhe_horizontalSpan,
      y: zhe_start_ref.y + zhe_verticalSpan,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x - weight / 2,
        y: zhe_start_ref.y,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x - weight / 2,
        y: zhe_end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    zhe_start = new FP.Joint(
      'zhe_start',
      {
        x: zhe_start_ref.x + weight / 2,
        y: zhe_start_ref.y,
      },
    )
    zhe_end = new FP.Joint(
      'zhe_end',
      {
        x: zhe_end_ref.x + weight / 2,
        y: zhe_end_ref.y,
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

  // 挑
  const tiao_start = new FP.Joint(
    'tiao_start',
    {
      x: zhe_end.x,
      y: zhe_end.y,
    },
  )
  const tiao_end = new FP.Joint(
    'tiao_end',
    {
      x: tiao_start.x + tiao_horizontalSpan,
      y: tiao_start.y - tiao_verticalSpan,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(zhe_start)
  glyph.addJoint(zhe_end)
  glyph.addJoint(tiao_start)
  glyph.addJoint(tiao_end)

  const skeleton = {
    heng_start,
    heng_end,
    zhe_start,
    zhe_end,
    tiao_start,
    tiao_end,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
  glyph.addRefLine(refline(zhe_start, zhe_end))
  glyph.addRefLine(refline(tiao_start, tiao_end))

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
    stress_ratio,
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
    tiao_start,
    tiao_end,
  } = skeleton

  // 竖横比，竖的厚度比横的厚度
  const serif_size = 2.0
  const radius = 10
  const _weight = weight / stress_ratio
  const turn_angle_1 = FP.degreeToRadius(10)
  const turn_angle_2 = FP.degreeToRadius(15)
  const end_length = 100
  const _tiao_weight = weight * 1.2

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, _weight, {
    unticlockwise: true,
  })
  const { out_zhe_start, out_zhe_end, in_zhe_start, in_zhe_end } = FP.getLineContours('zhe', { zhe_start, zhe_end }, weight, {
    unticlockwise: true,
  })
  const { out_tiao_start, out_tiao_end, in_tiao_start, in_tiao_end } = FP.getLineContours('tiao', { tiao_start, tiao_end }, _tiao_weight, {
    unticlockwise: true,
  })
  const { corner: out_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: out_heng_start, end: out_heng_end },
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
  )
  const { corner: in_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: in_heng_start, end: in_heng_end },
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
  )
  const { corner: out_corner_zhe_tiao } = FP.getIntersection(
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
    { type: 'line', start: out_tiao_start, end: out_tiao_end },
  )
  const { corner: in_corner_zhe_tiao, corner_index: in_corner_index_zhe_tiao } = FP.getIntersection(
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
    { type: 'line', start: in_tiao_start, end: in_tiao_end },
  )
  const tiao_angle = Math.atan2(tiao_start.y - tiao_end.y, tiao_end.x - tiao_start.x)
  const out_corner_zhe_tiao_1 = {
    x: out_corner_zhe_tiao.x - _tiao_weight * Math.sin(tiao_angle),
    y: out_corner_zhe_tiao.y - _tiao_weight * Math.cos(tiao_angle)
  }
  const { corner: out_corner_zhe_tiao_2 } = FP.getIntersection(
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
    { type: 'line', start: in_tiao_start, end: in_tiao_end },
  )

  let turn_data = {}
  {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    const turn_length = 20 * turn_style_value
    const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(in_heng_start, in_corner_heng_zhe, in_zhe_end)
    const inner_corner_length = weight
    const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
    const turn_control_1 = {
      x: in_corner_heng_zhe.x - corner_radius,
      y: in_corner_heng_zhe.y,
    }
    const turn_start_1 = {
      x: turn_control_1.x - corner_radius,
      y: turn_control_1.y,
    }
    const turn_end_1 = {
      x: turn_control_1.x + turn_length * Math.cos(mid_angle),
      y: turn_control_1.y - turn_length * Math.sin(mid_angle),
    }
    const turn_control_2 = getRadiusPoint({
      start: in_corner_heng_zhe,
      end: in_zhe_end,
      radius: corner_radius,
    })
    const turn_start_2 = getRadiusPoint({
      start: turn_control_2,
      end: in_zhe_end,
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

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制左侧（外侧）轮廓
  pen.moveTo(out_heng_start.x, out_heng_start.y)
  pen.lineTo(out_corner_heng_zhe.x, out_corner_heng_zhe.y)
  pen.lineTo(out_corner_zhe_tiao_2.x, out_corner_zhe_tiao_2.y)
  pen.lineTo(out_corner_zhe_tiao_1.x, out_corner_zhe_tiao_1.y)
  pen.lineTo(out_corner_zhe_tiao.x, out_corner_zhe_tiao.y)
  
  // 绘制挑
  pen.lineTo(in_tiao_end.x, in_tiao_end.y)

  // 绘制右侧（内侧）轮廓
  pen.lineTo(in_corner_zhe_tiao.x, in_corner_zhe_tiao.y)

  // 绘制转角样式
  pen.lineTo(turn_p0.x, turn_p0.y)
  pen.lineTo(turn_p1_radius_before.x, turn_p1_radius_before.y)
  pen.quadraticBezierTo(turn_p1.x, turn_p1.y, turn_p1_radius_after.x, turn_p1_radius_after.y)
  pen.lineTo(turn_p2_radius_before.x, turn_p2_radius_before.y)
  pen.quadraticBezierTo(turn_p2.x, turn_p2.y, turn_p2_radius_after.x, turn_p2_radius_after.y)
  pen.lineTo(turn_p3.x, turn_p3.y)

  // 绘制上侧横
  pen.lineTo(in_heng_start.x, in_heng_start.y)

  // 绘制轮廓连接线
  pen.lineTo(out_heng_start.x, out_heng_start.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)