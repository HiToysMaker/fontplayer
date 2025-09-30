const ox = 500
const oy = 500
const x0 = 250
const y0 = 250
const params = {
  shu_length: glyph.getParam('竖-长度'),
  zhe1_length: glyph.getParam('折1-长度'),
  zhe2_horizontalSpan: glyph.getParam('折2-水平延伸'),
  zhe2_verticalSpan: glyph.getParam('折2-竖直延伸'),
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
        x: glyph.tempData['shu_end'].x,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['zhe1_start'] = {
        x: glyph.tempData['zhe1_start'].x,
        y: glyph.tempData['zhe1_start'].y + deltaY,
      }
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x,
        y: glyph.tempData['zhe1_end'].y + deltaY,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x,
        y: glyph.tempData['zhe2_start'].y + deltaY,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x,
        y: glyph.tempData['zhe2_end'].y + deltaY,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x,
        y: glyph.tempData['gou_start'].y + deltaY,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x,
        y: glyph.tempData['gou_end'].y + deltaY,
      }
      break
    }
    case 'zhe1_start': {
      jointsMap['shu_end'] = {
        x: glyph.tempData['shu_end'].x,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['zhe1_start'] = {
        x: glyph.tempData['zhe1_start'].x,
        y: glyph.tempData['zhe1_start'].y + deltaY,
      }
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x,
        y: glyph.tempData['zhe1_end'].y + deltaY,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x,
        y: glyph.tempData['zhe2_start'].y + deltaY,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x,
        y: glyph.tempData['zhe2_end'].y + deltaY,
      }
      jointsMap['gou_start'] = {
        x: glyph.tempData['gou_start'].x,
        y: glyph.tempData['gou_start'].y + deltaY,
      }
      jointsMap['gou_end'] = {
        x: glyph.tempData['gou_end'].x,
        y: glyph.tempData['gou_end'].y + deltaY,
      }
      break
    }
    case 'zhe1_end': {
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x + deltaX,
        y: glyph.tempData['zhe1_end'].y,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y,
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
    case 'zhe2_start': {
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x + deltaX,
        y: glyph.tempData['zhe1_end'].y,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y,
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
    case 'zhe2_end': {
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y + deltaY,
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
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y + deltaY,
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
  glyph.setParam('竖-长度', _params.shu_length)
  glyph.setParam('折1-长度', _params.zhe1_length)
  glyph.setParam('折2-水平延伸', _params.zhe2_horizontalSpan)
  glyph.setParam('折2-竖直延伸', _params.zhe2_verticalSpan)
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
  const { shu_start, shu_end, zhe1_start, zhe1_end, zhe2_start, zhe2_end, gou_start, gou_end } = jointsMap
  const shu_length_range = glyph.getParamRange('竖-长度')
  const zhe1_length_range = glyph.getParamRange('折1-长度')
  const zhe2_horizontal_span_range = glyph.getParamRange('折2-水平延伸')
  const zhe2_vertical_span_range = glyph.getParamRange('折2-竖直延伸')
  const gou_horizontal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const shu_length = range(shu_end.y - shu_start.y, shu_length_range)
  const zhe1_length = range(zhe1_end.x - zhe1_start.x, zhe1_length_range)
  const zhe2_horizontalSpan = range(zhe2_start.x - zhe2_end.x, zhe2_horizontal_span_range)
  const zhe2_verticalSpan = range(zhe2_end.y - zhe2_start.y, zhe2_vertical_span_range)
  const gou_horizontalSpan = range(gou_start.x - gou_end.x, gou_horizontal_span_range)
  const gou_verticalSpan = range(gou_end.y - gou_start.y, gou_vertical_span_range)
  return {
    shu_length,
    zhe1_length,
    zhe2_horizontalSpan,
    zhe2_verticalSpan,
    gou_horizontalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    shu_length,
    zhe1_length,
    zhe2_horizontalSpan,
    zhe2_verticalSpan,
    gou_horizontalSpan,
    gou_verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params

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
      x: shu_start_ref.x,
      y: shu_start_ref.y + shu_length,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    shu_start = new FP.Joint(
      'shu_start',
      {
        x: shu_start_ref.x - weight / 2,
        y: shu_start_ref.y,
      },
    )
    shu_end = new FP.Joint(
      'shu_end',
      {
        x: shu_end_ref.x - weight / 2,
        y: shu_end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    shu_start = new FP.Joint(
      'shu_start',
      {
        x: shu_start_ref.x + weight / 2,
        y: shu_start_ref.y,
      },
    )
    shu_end = new FP.Joint(
      'shu_end',
      {
        x: shu_end_ref.x + weight / 2,
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

  // 折1
  const zhe1_start = new FP.Joint(
    'zhe1_start',
    {
      x: shu_start.x,
      y: shu_start.y + shu_length,
    },
  )
  const zhe1_end = new FP.Joint(
    'zhe1_end',
    {
      x: zhe1_start.x + zhe1_length,
      y: zhe1_start.y,
    },
  )

  // 折2
  const zhe2_start = new FP.Joint(
    'zhe2_start',
    {
      x: zhe1_start.x + zhe1_length,
      y: zhe1_start.y,
    },
  )
  const zhe2_end = new FP.Joint(
    'zhe2_end',
    {
      x: zhe2_start.x - zhe2_horizontalSpan,
      y: zhe2_start.y + zhe2_verticalSpan,
    },
  )

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: zhe2_start.x - zhe2_horizontalSpan,
      y: zhe2_start.y + zhe2_verticalSpan,
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
  glyph.addJoint(zhe1_start)
  glyph.addJoint(zhe1_end)
  glyph.addJoint(zhe2_start)
  glyph.addJoint(zhe2_end)
  glyph.addJoint(gou_start)
  glyph.addJoint(gou_end)

  const skeleton = {
    shu_start,
    shu_end,
    zhe1_start,
    zhe1_end,
    zhe2_start,
    zhe2_end,
    gou_start,
    gou_end,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
  glyph.addRefLine(refline(zhe1_start, zhe1_end))
  glyph.addRefLine(refline(zhe2_start, zhe2_end))
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
    zhe1_start,
    zhe1_end,
    zhe2_start,
    zhe2_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, weight)
  const { out_zhe1_start, out_zhe1_end, in_zhe1_start, in_zhe1_end } = FP.getLineContours('zhe1', { zhe1_start, zhe1_end }, weight)
  const { out_zhe2_start, out_zhe2_end, in_zhe2_start, in_zhe2_end } = FP.getLineContours('zhe2', { zhe2_start, zhe2_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
  const { corner: in_corner_shu_zhe1 } = FP.getIntersection(
    { type: 'line', start: in_shu_start, end: in_shu_end },
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
  )
  const { corner: out_corner_shu_zhe1 } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: out_zhe1_start, end: out_zhe1_end },
  )
  const { corner: in_corner_zhe1_zhe2 } = FP.getIntersection(
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: in_zhe2_start, end: in_zhe2_end },
  )
  const { corner: out_corner_zhe1_zhe2 } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: out_zhe1_end },
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end },
  )
  const { corner: in_corner_zhe2_gou } = FP.getIntersection(
    { type: 'line', start: in_zhe2_start, end: in_zhe2_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_zhe2_gou } = FP.getIntersection(
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )

  // 计算折1折2拐角处内外圆角相关的点与数据
  let in_radius_zhe1_zhe2 = 60 * bending_degree
  let out_radius_zhe1_zhe2 = 80 * bending_degree
  // 如果in_radius超出折1或折2长度，取折1或折2的最小长度
  const in_radius_min_length_zhe1_zhe2 = Math.min(
    getDistance(in_corner_zhe1_zhe2, in_corner_shu_zhe1),
    getDistance(in_corner_zhe1_zhe2, in_corner_zhe2_gou),
  )
  const out_radius_min_length_zhe1_zhe2 = Math.min(
    getDistance(out_zhe1_end, out_corner_shu_zhe1),
    getDistance(out_zhe2_start, out_zhe2_end),
  )
  if (in_radius_zhe1_zhe2 >= in_radius_min_length_zhe1_zhe2) {
    in_radius_zhe1_zhe2 = in_radius_min_length_zhe1_zhe2
  }
  if (out_radius_zhe1_zhe2 >= out_radius_min_length_zhe1_zhe2) {
    out_radius_zhe1_zhe2 = out_radius_min_length_zhe1_zhe2
  }
  const in_radius_start_zhe1_zhe2= {
    x: in_corner_zhe1_zhe2.x - in_radius_zhe1_zhe2,
    y: in_corner_zhe1_zhe2.y,
  }
  const in_radius_end_zhe1_zhe2 = getRadiusPoint({
    start: in_corner_zhe1_zhe2,
    end: in_corner_zhe2_gou,
    radius: in_radius_zhe1_zhe2,
  })
  const out_radius_start_zhe1_zhe2 = {
    x: out_corner_zhe1_zhe2.x - out_radius_zhe1_zhe2,
    y: out_corner_zhe1_zhe2.y,
  }
  const out_radius_end_zhe1_zhe2 = getRadiusPoint({
    start: out_corner_zhe1_zhe2,
    end: out_corner_zhe2_gou,
    radius: out_radius_zhe1_zhe2,
  })

  // 计算折2钩拐角处内外圆角相关的点与数据
  let in_radius_zhe2_gou = 30 * bending_degree
  let out_radius_zhe2_gou = 30 * bending_degree
  // 如果in_radius超出折2或钩的长度，取折2或钩的最小长度
  const in_radius_min_length_zhe2_gou = Math.min(
    getDistance(in_corner_zhe2_gou, in_gou_end),
    getDistance(in_corner_zhe2_gou, in_radius_end_zhe1_zhe2),
  )
  const out_radius_min_length_zhe2_gou = Math.min(
    getDistance(gou_start, gou_end),
    getDistance(out_zhe2_end, out_radius_end_zhe1_zhe2),
  )
  if (in_radius_zhe2_gou >= in_radius_min_length_zhe2_gou) {
    in_radius_zhe2_gou = in_radius_min_length_zhe2_gou
  }
  if (out_radius_zhe2_gou >= out_radius_min_length_zhe2_gou) {
    out_radius_zhe2_gou = out_radius_min_length_zhe2_gou
  }
  const in_radius_start_zhe2_gou = getRadiusPoint({
    start: in_corner_zhe2_gou,
    end: in_corner_zhe1_zhe2,
    radius: in_radius_zhe2_gou,
  })
  const in_radius_end_zhe2_gou = getRadiusPoint({
    start: in_corner_zhe2_gou,
    end: in_gou_end,
    radius: in_radius_zhe2_gou,
  })
  const out_radius_start_zhe2_gou = getRadiusPoint({
    start: out_zhe2_end,
    end: out_radius_end_zhe1_zhe2,
    radius: out_radius_zhe2_gou,
  })
  const out_radius_end_zhe2_gou = getRadiusPoint({
    start: out_gou_start,
    end: out_gou_end,
    radius: out_radius_zhe2_gou,
  })

  let turn_data = {}
  {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    const turn_length = 20 * turn_style_value
    const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_zhe1_start, out_corner_zhe1_zhe2, out_zhe2_end)
    const inner_corner_length = weight
    const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
    const turn_control_1 = {
      x: out_corner_zhe1_zhe2.x - corner_radius,
      y: out_corner_zhe1_zhe2.y,
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
      start: out_corner_zhe1_zhe2,
      end: out_zhe2_end,
      radius: corner_radius,
    })
    const turn_start_2 = getRadiusPoint({
      start: turn_control_2,
      end: out_zhe2_end,
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
  const d = 10
  const start_gap = 20
  const turn_ratio = 0.85

  const start_p0 = {
    x: out_shu_start.x,
    y: out_shu_start.y + start_length - start_gap,
  }
  const start_p1 = {
    x: out_shu_start.x - 2 * d,
    y: out_shu_start.y + start_length - start_gap,
  }
  const start_p2 = {
    x: out_shu_start.x - 2 * d,
    y: out_shu_start.y + 0.6 * start_length - start_gap,
  }
  const start_p3 = {
    x: out_shu_start.x - 2 * d,
    y: out_shu_start.y + 0.9 * start_length - start_gap,
  }
  const start_p4 = {
    x: out_shu_start.x + d,
    y: out_shu_start.y + 0.9 * start_length - start_gap,
  }
  const start_p5 = {
    x: out_shu_start.x,
    y: out_shu_start.y + 0.9 * start_length - start_gap,
  }
  const start_p6 = {
    x: out_shu_start.x,
    y: out_shu_start.y + 0.75 * start_length - start_gap,
  }
  const start_p7 = {
    x: out_shu_start.x,
    y: out_shu_start.y + 0.6 * start_length - start_gap,
  }
  const start_p8 = {
    x: out_shu_start.x + d,
    y: out_shu_start.y + 0.6 * start_length - start_gap,
  }
  const start_p9 = {
    x: out_shu_start.x + d,
    y: out_shu_start.y + 0.4 * start_length - start_gap,
  }
  const start_p10 = {
    x: out_shu_start.x + d,
    y: out_shu_start.y + 0.2 * start_length - start_gap,
  }
  const start_p11 = {
    x: out_shu_start.x - (0.3 * weight - d),
    y: out_shu_start.y + 0.2 * start_length - start_gap,
  }
  const start_p12 = {
    x: out_shu_start.x - (0.3 * weight - d),
    y: out_shu_start.y - start_gap,
  }
  const start_p13 = {
    x: out_shu_start.x - weight * 0.7,
    y: out_shu_start.y - start_gap,
  }
  const start_p14 = {
    x: out_shu_start.x - weight * 0.7,
    y: out_shu_start.y + 0.2 * start_length - start_gap,
  }
  const start_p15 = {
    x: in_shu_start.x,
    y: in_shu_start.y + 0.2 * start_length - start_gap,
  }
  const start_p16 = {
    x: in_shu_start.x,
    y: in_shu_start.y + 0.45 * start_length - start_gap,
  }

  const turn_p6 = turn_data.turn_control_1
  const turn_p3 = FP.getPointOnLineByPercentage(turn_data.turn_end_1, turn_data.turn_end_2, turn_ratio)
  const turn_p5 = FP.turnRight(turn_p3, turn_p6, d * 1.5 * 2)
  const turn_p4 = FP.turnLeft(turn_p6, turn_p3, d * 1.5 * 2)
  const turn_p0 = turn_data.turn_control_2
  const turn_p2 = FP.turnRight(turn_p0, turn_p3, d * 0.75 * 2)
  const turn_p1 = FP.turnLeft(turn_p3, turn_p0, d * 0.75 * 2)

  const gou_vecter_end = FP.turnAngle(in_gou_end, out_gou_end, -Math.PI / 4, 100)
  let { corner: gou_control } = FP.getIntersection(
    { type: 'line', start: out_radius_end_zhe2_gou, end: out_gou_end },
    { type: 'line', start: in_gou_end, end: gou_vecter_end },
  )
  if (!FP.isPointOnLineSegment(gou_control, out_radius_end_zhe2_gou, out_gou_end)) {
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
  pen.quadraticBezierTo(start_p5.x, start_p5.y, start_p6.x, start_p6.y)
  pen.bezierTo(start_p7.x, start_p7.y, start_p8.x, start_p8.y, start_p9.x, start_p9.y)
  pen.quadraticBezierTo(start_p10.x, start_p10.y, start_p11.x, start_p11.y)
  pen.bezierTo(start_p12.x, start_p12.y, start_p13.x, start_p13.y, start_p14.x, start_p14.y)
  pen.quadraticBezierTo(start_p15.x, start_p15.y, start_p16.x, start_p16.y)

  pen.lineTo(in_corner_shu_zhe1.x, in_corner_shu_zhe1.y)
  // 绘制内侧折1折2圆角
  pen.lineTo(in_radius_start_zhe1_zhe2.x, in_radius_start_zhe1_zhe2.y)
  pen.quadraticBezierTo(in_corner_zhe1_zhe2.x, in_corner_zhe1_zhe2.y, in_radius_end_zhe1_zhe2.x, in_radius_end_zhe1_zhe2.y)
  // 绘制内侧折2钩圆角
  pen.lineTo(in_radius_start_zhe2_gou.x, in_radius_start_zhe2_gou.y)
  pen.quadraticBezierTo(in_corner_zhe2_gou.x, in_corner_zhe2_gou.y, in_radius_end_zhe2_gou.x, in_radius_end_zhe2_gou.y)

  pen.lineTo(in_gou_end.x, in_gou_end.y)
  
  // 绘制钩
  pen.quadraticBezierTo(gou_control.x, gou_control.y, out_radius_end_zhe2_gou.x, out_radius_end_zhe2_gou.y)
  pen.quadraticBezierTo(out_corner_zhe2_gou.x, out_corner_zhe2_gou.y, out_radius_start_zhe2_gou.x, out_radius_start_zhe2_gou.y)

  // 绘制转角样式
  pen.lineTo(turn_p0.x, turn_p0.y)
  pen.bezierTo(turn_p1.x, turn_p1.y, turn_p2.x, turn_p2.y, turn_p3.x, turn_p3.y)
  pen.bezierTo(turn_p4.x, turn_p4.y, turn_p5.x, turn_p5.y, turn_p6.x, turn_p6.y)

  pen.lineTo(out_corner_shu_zhe1.x, out_corner_shu_zhe1.y)
  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)