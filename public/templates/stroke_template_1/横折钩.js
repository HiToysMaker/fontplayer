const ox = 500
const oy = 500
const x0 = 250
const y0 = 350
const params = {
  heng_length: glyph.getParam('横-长度'),
  zhe_horizonalSpan: glyph.getParam('折-水平延伸'),
  zhe_verticalSpan: glyph.getParam('折-竖直延伸'),
  gou_horizonalSpan: glyph.getParam('钩-水平延伸'),
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
        y: glyph.tempData['heng_end'].y,
      }
      jointsMap['zhe_start'] = {
        x: glyph.tempData['zhe_start'].x + deltaX,
        y: glyph.tempData['zhe_start'].y,
      }
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y,
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
    case 'zhe_start': {
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y,
      }
      jointsMap['zhe_start'] = {
        x: glyph.tempData['zhe_start'].x + deltaX,
        y: glyph.tempData['zhe_start'].y,
      }
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y,
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
    case 'zhe_end': {
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y + deltaY,
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
      jointsMap['zhe_end'] = {
        x: glyph.tempData['zhe_end'].x + deltaX,
        y: glyph.tempData['zhe_end'].y + deltaY,
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
  glyph.setParam('横-长度', _params.heng_length)
  glyph.setParam('折-水平延伸', _params.zhe_horizonalSpan)
  glyph.setParam('折-竖直延伸', _params.zhe_verticalSpan)
  glyph.setParam('钩-水平延伸', _params.gou_horizonalSpan)
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
  const { heng_start, heng_end, zhe_start, zhe_end, gou_start, gou_end } = jointsMap
  const heng_length_range = glyph.getParamRange('横-长度')
  const zhe_horizonal_span_range = glyph.getParamRange('折-水平延伸')
  const zhe_vertical_span_range = glyph.getParamRange('折-竖直延伸')
  const gou_horizonal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const heng_length = range(heng_end.x - heng_start.x, heng_length_range)
  const zhe_horizonalSpan = range(zhe_start.x - zhe_end.x, zhe_horizonal_span_range)
  const zhe_verticalSpan = range(zhe_end.y - zhe_start.y, zhe_vertical_span_range)
  const gou_horizonalSpan = range(gou_start.x - gou_end.x, gou_horizonal_span_range)
  const gou_verticalSpan = range(gou_end.y - gou_start.y, gou_vertical_span_range)
  return {
    heng_length,
    zhe_horizonalSpan,
    zhe_verticalSpan,
    gou_horizonalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_length,
    zhe_horizonalSpan,
    zhe_verticalSpan,
    gou_horizonalSpan,
    gou_verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params

  // 横
  let heng_start, heng_end
  const heng_start_ref = new FP.Joint(
    'heng_start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const heng_end_ref = new FP.Joint(
    'heng_end_ref',
    {
      x: heng_start_ref.x + heng_length,
      y: heng_start_ref.y,
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
      x: heng_start.x + heng_length,
      y: heng_start.y,
    },
  )
  const zhe_end = new FP.Joint(
    'zhe_end',
    {
      x: zhe_start.x - zhe_horizonalSpan,
      y: zhe_start.y + zhe_verticalSpan,
    },
  )

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: zhe_start.x - zhe_horizonalSpan,
      y: zhe_start.y + zhe_verticalSpan,
    },
  )
  const gou_end = new FP.Joint(
    'gou_end',
    {
      x: gou_start.x - gou_horizonalSpan,
      y: gou_start.y + gou_verticalSpan,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(zhe_start)
  glyph.addJoint(zhe_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    heng_start,
    heng_end,
    zhe_start,
    zhe_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
  glyph.addRefLine(refline(zhe_start, zhe_end))
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
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, weight)
  const { out_zhe_start, out_zhe_end, in_zhe_start, in_zhe_end } = FP.getLineContours('zhe', { zhe_start, zhe_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
  const { corner: in_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: in_heng_start, end: in_heng_end },
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
  )
  const { corner: out_corner_heng_zhe } = FP.getIntersection(
    { type: 'line', start: out_heng_start, end: out_heng_end },
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
  )
  const { corner: in_corner_zhe_gou } = FP.getIntersection(
    { type: 'line', start: in_zhe_start, end: in_zhe_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_zhe_gou } = FP.getIntersection(
    { type: 'line', start: out_zhe_start, end: out_zhe_end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )

  // 计算横折拐角处内外圆角相关的点与数据
  let in_radius_heng_zhe = 60 * bending_degree
  let out_radius_heng_zhe = 80 * bending_degree
  // 如果in_radius超出折1或折2长度，取折1或折2的最小长度
  const in_radius_min_length_heng_zhe = Math.min(
    getDistance(in_corner_heng_zhe, in_heng_start),
    getDistance(in_corner_heng_zhe, in_corner_zhe_gou),
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
    end: in_corner_zhe_gou,
    radius: in_radius_heng_zhe,
  })
  const out_radius_start_heng_zhe = {
    x: out_corner_heng_zhe.x - out_radius_heng_zhe,
    y: out_corner_heng_zhe.y,
  }
  const out_radius_end_heng_zhe = getRadiusPoint({
    start: out_corner_heng_zhe,
    end: out_corner_zhe_gou,
    radius: out_radius_heng_zhe,
  })

  // 计算折2钩拐角处内外圆角相关的点与数据
  let in_radius_zhe_gou = 30 * bending_degree
  let out_radius_zhe_gou = 30 * bending_degree
  // 如果in_radius超出折2或钩的长度，取折2或钩的最小长度
  const in_radius_min_length_zhe_gou = Math.min(
    getDistance(in_corner_zhe_gou, in_gou_end),
    getDistance(in_corner_zhe_gou, in_radius_end_heng_zhe),
  )
  const out_radius_min_length_zhe_gou = Math.min(
    getDistance(gou_start, gou_end),
    getDistance(out_zhe_end, out_radius_end_heng_zhe),
  )
  if (in_radius_zhe_gou >= in_radius_min_length_zhe_gou) {
    in_radius_zhe_gou = in_radius_min_length_zhe_gou
  }
  if (out_radius_zhe_gou >= out_radius_min_length_zhe_gou) {
    out_radius_zhe_gou = out_radius_min_length_zhe_gou
  }
  const in_radius_start_zhe_gou = getRadiusPoint({
    start: in_corner_zhe_gou,
    end: in_corner_heng_zhe,
    radius: in_radius_zhe_gou,
  })
  const in_radius_end_zhe_gou = getRadiusPoint({
    start: in_corner_zhe_gou,
    end: in_gou_end,
    radius: in_radius_zhe_gou,
  })
  const out_radius_start_zhe_gou = getRadiusPoint({
    start: out_zhe_end,
    end: out_radius_end_heng_zhe,
    radius: out_radius_zhe_gou,
  })
  const out_radius_end_zhe_gou = getRadiusPoint({
    start: out_gou_start,
    end: out_gou_end,
    radius: out_radius_zhe_gou,
  })

  let turn_data = {}
  if (turn_style_type === 1) {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    const turn_length = 20 * turn_style_value
    const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_heng_start, out_corner_heng_zhe, out_zhe_end)
    const inner_corner_length = weight
    const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
    const turn_control_1 = {
      x: out_corner_heng_zhe.x - corner_radius,
      y: out_corner_heng_zhe.y,
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

  const start_length = 100
  const end_length = 60
  const d = 20
  const turn_ratio = 0.85

  const start_p14 = {
    x: in_heng_start.x + 0.25 * start_length,
    y: in_heng_start.y,
  }
  const start_p13 = {
    x: in_heng_start.x,
    y: in_heng_start.y,
  }
  const start_p12 = {
    x: in_heng_start.x,
    y: in_heng_start.y - weight / 2,
  }
  const start_p11 = {
    x: out_heng_start.x,
    y: out_heng_start.y,
  }
  const start_p10 = {
    x: out_heng_start.x + 0.15 * start_length,
    y: out_heng_start.y,
  }
  const start_p9 = {
    x: out_heng_start.x + 0.3 * start_length,
    y: out_heng_start.y,
  }
  const start_p8 = {
    x: out_heng_start.x + 0.3 * start_length,
    y: out_heng_start.y - d,
  }
  const start_p7 = {
    x: out_heng_start.x + 0.45 * start_length,
    y: out_heng_start.y - d,
  }
  const start_p6 = {
    x: out_heng_start.x + 0.6 * start_length,
    y: out_heng_start.y - d,
  }
  const start_p5 = {
    x: out_heng_start.x + 0.6 * start_length,
    y: out_heng_start.y,
  }
  const start_p4 = {
    x: out_heng_start.x + 0.9 * start_length,
    y: out_heng_start.y,
  }
  const start_p3 = {
    x: out_heng_start.x + 0.9 * start_length,
    y: out_heng_start.y + d,
  }
  const start_p2 = {
    x: out_heng_start.x + 0.6 * start_length,
    y: out_heng_start.y + d,
  }
  const start_p1 = {
    x: out_heng_start.x + 1 * start_length,
    y: out_heng_start.y + d,
  }
  const start_p0 = {
    x: out_heng_start.x + 1 * start_length,
    y: out_heng_start.y,
  }
  
  const turn_p6 = turn_data.turn_control_1
  const turn_p3 = FP.getPointOnLineByPercentage(turn_data.turn_end_1, turn_data.turn_end_2, turn_ratio)
  const turn_p5 = FP.turnRight(turn_p3, turn_p6, d * 1.5)
  const turn_p4 = FP.turnLeft(turn_p6, turn_p3, d * 1.5)
  const turn_p0 = turn_data.turn_control_2
  const turn_p2 = FP.turnRight(turn_p0, turn_p3, d * 0.75)
  const turn_p1 = FP.turnLeft(turn_p3, turn_p0, d * 0.75)

  const gou_vecter_end = FP.turnAngle(in_gou_end, out_gou_end, -Math.PI / 4, 100)
  let { corner: gou_control } = FP.getIntersection(
    { type: 'line', start: out_radius_end_zhe_gou, end: out_gou_end },
    { type: 'line', start: in_gou_end, end: gou_vecter_end },
  )
  if (!FP.isPointOnLineSegment(gou_control, out_radius_end_zhe_gou, out_gou_end)) {
    gou_control = out_gou_end
  }

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制起笔样式
  pen.moveTo(start_p0.x, start_p0.y)
  pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p2.x, start_p2.y)
  pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p4.x, start_p4.y)
  pen.bezierTo(start_p5.x, start_p5.y, start_p6.x, start_p6.y, start_p7.x, start_p7.y)
  pen.bezierTo(start_p8.x, start_p8.y, start_p9.x, start_p9.y, start_p10.x, start_p10.y)
  pen.quadraticBezierTo(start_p11.x, start_p11.y, start_p12.x, start_p12.y)
  pen.quadraticBezierTo(start_p13.x, start_p13.y, start_p14.x, start_p14.y)

  // 绘制内侧横折圆角
  pen.lineTo(in_radius_start_heng_zhe.x, in_radius_start_heng_zhe.y)
  pen.quadraticBezierTo(in_corner_heng_zhe.x, in_corner_heng_zhe.y, in_radius_end_heng_zhe.x, in_radius_end_heng_zhe.y)
  // 绘制内侧折钩圆角
  pen.lineTo(in_radius_start_zhe_gou.x, in_radius_start_zhe_gou.y)
  pen.quadraticBezierTo(in_corner_zhe_gou.x, in_corner_zhe_gou.y, in_radius_end_zhe_gou.x, in_radius_end_zhe_gou.y)
  
  pen.lineTo(in_gou_end.x, in_gou_end.y)
  // 绘制钩转角
  pen.quadraticBezierTo(gou_control.x, gou_control.y, out_radius_end_zhe_gou.x, out_radius_end_zhe_gou.y)

  pen.quadraticBezierTo(out_corner_zhe_gou.x, out_corner_zhe_gou.y, out_radius_start_zhe_gou.x, out_radius_start_zhe_gou.y)

  // 绘制转角样式
  pen.lineTo(turn_p0.x, turn_p0.y)
  pen.bezierTo(turn_p1.x, turn_p1.y, turn_p2.x, turn_p2.y, turn_p3.x, turn_p3.y)
  pen.bezierTo(turn_p4.x, turn_p4.y, turn_p5.x, turn_p5.y, turn_p6.x, turn_p6.y)

  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)