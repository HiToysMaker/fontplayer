const ox = 500
const oy = 500
const x0 = 250
const y0 = 295
const params = {
  heng1_length: glyph.getParam('横1-长度'),
  zhe1_horizontalSpan: glyph.getParam('折1-水平延伸'),
  zhe1_verticalSpan: glyph.getParam('折1-竖直延伸'),
  heng2_length: glyph.getParam('横2-长度'),
  zhe2_horizontalSpan: glyph.getParam('折2-水平延伸'),
  zhe2_verticalSpan: glyph.getParam('折2-竖直延伸'),
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
    case 'heng1_end': {
      jointsMap['heng1_end'] = {
        x: glyph.tempData['heng1_end'].x + deltaX,
        y: glyph.tempData['heng1_end'].y,
      }
      jointsMap['zhe1_start'] = {
        x: glyph.tempData['zhe1_start'].x + deltaX,
        y: glyph.tempData['zhe1_start'].y,
      }
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x + deltaX,
        y: glyph.tempData['zhe1_end'].y,
      }
      jointsMap['heng2_start'] = {
        x: glyph.tempData['heng2_start'].x + deltaX,
        y: glyph.tempData['heng2_start'].y,
      }
      jointsMap['heng2_end'] = {
        x: glyph.tempData['heng2_end'].x + deltaX,
        y: glyph.tempData['heng2_end'].y,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y,
      }
      break
    }
    case 'zhe1_start': {
      jointsMap['heng1_end'] = {
        x: glyph.tempData['heng1_end'].x + deltaX,
        y: glyph.tempData['heng1_end'].y,
      }
      jointsMap['zhe1_start'] = {
        x: glyph.tempData['zhe1_start'].x + deltaX,
        y: glyph.tempData['zhe1_start'].y,
      }
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x + deltaX,
        y: glyph.tempData['zhe1_end'].y,
      }
      jointsMap['heng2_start'] = {
        x: glyph.tempData['heng2_start'].x + deltaX,
        y: glyph.tempData['heng2_start'].y,
      }
      jointsMap['heng2_end'] = {
        x: glyph.tempData['heng2_end'].x + deltaX,
        y: glyph.tempData['heng2_end'].y,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y,
      }
      break
    }
    case 'zhe1_end': {
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x + deltaX,
        y: glyph.tempData['zhe1_end'].y + deltaY,
      }
      jointsMap['heng2_start'] = {
        x: glyph.tempData['heng2_start'].x + deltaX,
        y: glyph.tempData['heng2_start'].y + deltaY,
      }
      jointsMap['heng2_end'] = {
        x: glyph.tempData['heng2_end'].x + deltaX,
        y: glyph.tempData['heng2_end'].y + deltaY,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y + deltaY,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y + deltaY,
      }
      break
    }
    case 'heng2_start': {
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x + deltaX,
        y: glyph.tempData['zhe1_end'].y + deltaY,
      }
      jointsMap['heng2_start'] = {
        x: glyph.tempData['heng2_start'].x + deltaX,
        y: glyph.tempData['heng2_start'].y + deltaY,
      }
      jointsMap['heng2_end'] = {
        x: glyph.tempData['heng2_end'].x + deltaX,
        y: glyph.tempData['heng2_end'].y + deltaY,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y + deltaY,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y + deltaY,
      }
      break
    }
    case 'heng2_end': {
      jointsMap['heng2_end'] = {
        x: glyph.tempData['heng2_end'].x + deltaX,
        y: glyph.tempData['heng2_end'].y,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y,
      }
      break
    }
    case 'zhe2_start': {
      jointsMap['heng2_end'] = {
        x: glyph.tempData['heng2_end'].x + deltaX,
        y: glyph.tempData['heng2_end'].y,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y,
      }
      break
    }
    case 'zhe2_end': {
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y + deltaY,
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
  glyph.setParam('横1-长度', _params.heng1_length)
  glyph.setParam('折1-水平延伸', _params.zhe1_horizontalSpan)
  glyph.setParam('折1-竖直延伸', _params.zhe1_verticalSpan)
  glyph.setParam('横2-长度', _params.heng2_length)
  glyph.setParam('折2-水平延伸', _params.zhe2_horizontalSpan)
  glyph.setParam('折2-竖直延伸', _params.zhe2_verticalSpan)
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
  const { heng1_start, heng1_end, zhe1_start, zhe1_end, heng2_start, heng2_end, zhe2_start, zhe2_end } = jointsMap
  const heng1_length_range = glyph.getParamRange('横1-长度')
  const zhe1_horizontal_span_range = glyph.getParamRange('折1-水平延伸')
  const zhe1_vertical_span_range = glyph.getParamRange('折1-竖直延伸')
  const heng2_length_range = glyph.getParamRange('横2-长度')
  const zhe2_horizontal_span_range = glyph.getParamRange('折2-水平延伸')
  const zhe2_vertical_span_range = glyph.getParamRange('折2-竖直延伸')
  const heng1_length = range(heng1_end.x - heng1_start.x, heng1_length_range)
  const zhe1_horizontalSpan = range(zhe1_start.x - zhe1_end.x, zhe1_horizontal_span_range)
  const zhe1_verticalSpan = range(zhe1_end.y - zhe1_start.y, zhe1_vertical_span_range)
  const heng2_length = range(heng2_end.x - heng2_start.x, heng2_length_range)
  const zhe2_horizontalSpan = range(zhe2_start.x - zhe2_end.x, zhe2_horizontal_span_range)
  const zhe2_verticalSpan = range(zhe2_end.y - zhe2_start.y, zhe2_vertical_span_range)
  return {
    heng1_length,
    zhe1_horizontalSpan,
    zhe1_verticalSpan,
    heng2_length,
    zhe2_horizontalSpan,
    zhe2_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng1_length,
    zhe1_horizontalSpan,
    zhe1_verticalSpan,
    heng2_length,
    zhe2_horizontalSpan,
    zhe2_verticalSpan,
    skeletonRefPos,
  } = params
  const { weight } = global_params

  // 横1
  let heng1_start, heng1_end
  const heng1_start_ref = new FP.Joint(
    'heng1_start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const heng1_end_ref = new FP.Joint(
    'heng1_end_ref',
    {
      x: heng1_start_ref.x + heng1_length,
      y: heng1_start_ref.y,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    heng1_start = new FP.Joint(
      'heng1_start',
      {
        x: heng1_start_ref.x,
        y: heng1_start_ref.y + weight / 2,
      },
    )
    heng1_end = new FP.Joint(
      'heng1_end',
      {
        x: heng1_end_ref.x,
        y: heng1_end_ref.y + weight / 2,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    heng1_start = new FP.Joint(
      'heng1_start',
      {
        x: heng1_start_ref.x,
        y: heng1_start_ref.y - weight / 2,
      },
    )
    heng1_end = new FP.Joint(
      'heng1_end',
      {
        x: heng1_end_ref.x,
        y: heng1_end_ref.y - weight / 2,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    heng1_start = new FP.Joint(
      'heng1_start',
      {
        x: heng1_start_ref.x,
        y: heng1_start_ref.y,
      },
    )
    heng1_end = new FP.Joint(
      'heng1_end',
      {
        x: heng1_end_ref.x,
        y: heng1_end_ref.y,
      },
    )
  }
  glyph.addJoint(heng1_start_ref)
  glyph.addJoint(heng1_end_ref)
  glyph.addRefLine(refline(heng1_start_ref, heng1_end_ref, 'ref'))

  // 折1
  const zhe1_start = new FP.Joint(
    'zhe1_start',
    {
      x: heng1_start.x + heng1_length,
      y: heng1_start.y,
    },
  )
  const zhe1_end = new FP.Joint(
    'zhe1_end',
    {
      x: zhe1_start.x - zhe1_horizontalSpan,
      y: zhe1_start.y + zhe1_verticalSpan,
    },
  )

  // 横2
  const heng2_start = new FP.Joint(
    'heng2_start',
    {
      x: zhe1_start.x - zhe1_horizontalSpan,
      y: zhe1_start.y + zhe1_verticalSpan,
    },
  )
  const heng2_end = new FP.Joint(
    'heng2_end',
    {
      x: heng2_start.x + heng2_length,
      y: heng2_start.y,
    },
  )

  // 折2
  const zhe2_start = new FP.Joint(
    'zhe2_start',
    {
      x: heng2_start.x + heng2_length,
      y: heng2_start.y,
    },
  )
  const zhe2_end = new FP.Joint(
    'zhe2_end',
    {
      x: zhe2_start.x - zhe2_horizontalSpan,
      y: zhe2_start.y + zhe2_verticalSpan,
    },
  )

  glyph.addJoint(heng1_start)
  glyph.addJoint(heng1_end)
  glyph.addJoint(zhe1_start)
  glyph.addJoint(zhe1_end)
  glyph.addJoint(heng2_start)
  glyph.addJoint(heng2_end)
  glyph.addJoint(zhe2_start)
  glyph.addJoint(zhe2_end)

  const skeleton = {
    heng1_start,
    heng1_end,
    zhe1_start,
    zhe1_end,
    heng2_start,
    heng2_end,
    zhe2_start,
    zhe2_end,
  }

  glyph.addRefLine(refline(heng1_start, heng1_end))
  glyph.addRefLine(refline(zhe1_start, zhe1_end))
  glyph.addRefLine(refline(heng2_start, heng2_end))
  glyph.addRefLine(refline(zhe2_start, zhe2_end))

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
    heng1_start,
    heng1_end,
    zhe1_start,
    zhe1_end,
    heng2_start,
    heng2_end,
    zhe2_start,
    zhe2_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng1_start, out_heng1_end, in_heng1_start, in_heng1_end } = FP.getLineContours('heng1', { heng1_start, heng1_end }, weight)
  const { out_zhe1_start, out_zhe1_end, in_zhe1_start, in_zhe1_end } = FP.getLineContours('zhe1', { zhe1_start, zhe1_end }, weight)
  const { out_heng2_start, out_heng2_end, in_heng2_start, in_heng2_end } = FP.getLineContours('heng2', { heng2_start, heng2_end }, weight)
  const { out_zhe2_start, out_zhe2_end, in_zhe2_start, in_zhe2_end } = FP.getLineContours('zhe2', { zhe2_start, zhe2_end }, weight)
  const { corner: in_corner_heng1_zhe1 } = FP.getIntersection(
    { type: 'line', start: in_heng1_start, end: in_heng1_end },
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
  )
  const { corner: out_corner_heng1_zhe1 } = FP.getIntersection(
    { type: 'line', start: out_heng1_start, end: out_heng1_end },
    { type: 'line', start: out_zhe1_start, end: out_zhe1_end },
  )
  const { corner: in_corner_zhe1_heng2 } = FP.getIntersection(
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: in_heng2_start, end: in_heng2_end },
  )
  const { corner: out_corner_zhe1_heng2 } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: out_zhe1_end },
    { type: 'line', start: out_heng2_start, end: out_heng2_end },
  )
  const { corner: in_corner_heng2_zhe2 } = FP.getIntersection(
    { type: 'line', start: in_heng2_start, end: in_heng2_end },
    { type: 'line', start: in_zhe2_start, end: in_zhe2_end },
  )
  const { corner: out_corner_heng2_zhe2 } = FP.getIntersection(
    { type: 'line', start: out_heng2_start, end: out_heng2_end },
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end },
  )
  const { corner: out_corner_heng1_zhe1_down } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: in_heng1_start, end: in_heng1_end }
  )
  const out_corner_heng1_zhe1_up = {
    x: out_corner_heng1_zhe1_down.x,
    y: out_corner_heng1_zhe1_down.y - weight,
  }
  const { corner: out_corner_heng2_zhe2_down } = FP.getIntersection(
    { type: 'line', start: out_zhe2_start, end: in_zhe2_end },
    { type: 'line', start: in_heng2_start, end: in_heng2_end }
  )
  const out_corner_heng2_zhe2_up = {
    x: out_corner_heng2_zhe2_down.x,
    y: out_corner_heng2_zhe2_down.y - weight,
  }

  // 计算横1折1拐角处内外圆角相关的点与数据
  let in_radius_heng1_zhe1 = bending_degree > 1 ? 60 * (bending_degree - 1) : 0
  let out_radius_heng1_zhe1 = bending_degree > 1 ? 80 * (bending_degree - 1) : 0
  // 如果in_radius超出横1或折1长度，取横1或折1的最小长度
  const in_radius_min_length_heng1_zhe1 = Math.min(
    getDistance(in_corner_heng1_zhe1, in_heng1_start),
    getDistance(in_corner_heng1_zhe1, in_zhe1_end),
  )
  const out_radius_min_length_heng1_zhe1 = Math.min(
    getDistance(out_zhe1_end, out_heng1_start),
    getDistance(out_zhe1_start, out_zhe1_end),
  )
  if (in_radius_heng1_zhe1 >= in_radius_min_length_heng1_zhe1) {
    in_radius_heng1_zhe1 = in_radius_min_length_heng1_zhe1
  }
  if (out_radius_heng1_zhe1 >= out_radius_min_length_heng1_zhe1) {
    out_radius_heng1_zhe1 = out_radius_min_length_heng1_zhe1
  }
  const in_radius_start_heng1_zhe1 = {
    x: in_corner_heng1_zhe1.x - in_radius_heng1_zhe1,
    y: in_corner_heng1_zhe1.y,
  }
  const in_radius_end_heng1_zhe1 = getRadiusPoint({
    start: in_corner_heng1_zhe1,
    end: in_zhe1_end,
    radius: in_radius_heng1_zhe1,
  })
  const out_radius_start_heng1_zhe1 = {
    x: out_corner_heng1_zhe1.x - out_radius_heng1_zhe1,
    y: out_corner_heng1_zhe1.y,
  }
  const out_radius_end_heng1_zhe1 = getRadiusPoint({
    start: out_corner_heng1_zhe1,
    end: out_zhe1_end,
    radius: out_radius_heng1_zhe1,
  })

  // 计算横2折2拐角处内外圆角相关的点与数据
  let in_radius_heng2_zhe2 = bending_degree > 1 ? 60 * (bending_degree - 1) : 0
  let out_radius_heng2_zhe2 = bending_degree > 1 ? 80 * (bending_degree - 1) : 0
  // 如果in_radius超出横1或折1长度，取横1或折1的最小长度
  const in_radius_min_length_heng2_zhe2 = Math.min(
    getDistance(in_corner_heng2_zhe2, in_heng2_start),
    getDistance(in_corner_heng2_zhe2, in_zhe2_end),
  )
  const out_radius_min_length_heng2_zhe2 = Math.min(
    getDistance(out_zhe2_end, out_heng2_start),
    getDistance(out_zhe2_start, out_zhe2_end),
  )
  if (in_radius_heng2_zhe2 >= in_radius_min_length_heng2_zhe2) {
    in_radius_heng2_zhe2 = in_radius_min_length_heng2_zhe2
  }
  if (out_radius_heng2_zhe2 >= out_radius_min_length_heng2_zhe2) {
    out_radius_heng2_zhe2 = out_radius_min_length_heng2_zhe2
  }
  const in_radius_start_heng2_zhe2 = {
    x: in_corner_heng2_zhe2.x - in_radius_heng2_zhe2,
    y: in_corner_heng2_zhe2.y,
  }
  const in_radius_end_heng2_zhe2 = getRadiusPoint({
    start: in_corner_heng2_zhe2,
    end: in_zhe2_end,
    radius: in_radius_heng2_zhe2,
  })
  const out_radius_start_heng2_zhe2 = {
    x: out_corner_heng2_zhe2.x - out_radius_heng2_zhe2,
    y: out_corner_heng2_zhe2.y,
  }
  const out_radius_end_heng2_zhe2 = getRadiusPoint({
    start: out_corner_heng2_zhe2,
    end: out_zhe2_end,
    radius: out_radius_heng2_zhe2,
  })

  let turn_data_heng1_zhe1 = {}
  let turn_data_heng2_zhe2
  {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    {
      const turn_length = 20 * turn_style_value
      const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_heng1_start, out_corner_heng1_zhe1, out_zhe1_end)
      const inner_corner_length = weight
      const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
      const turn_control_1 = {
        x: out_corner_heng1_zhe1.x - corner_radius,
        y: out_corner_heng1_zhe1.y,
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
        start: out_corner_heng1_zhe1,
        end: out_zhe1_end,
        radius: corner_radius,
      })
      const turn_start_2 = getRadiusPoint({
        start: turn_control_2,
        end: out_zhe1_end,
        radius: corner_radius,
      })
      const turn_end_2 = {
        x: turn_control_2.x + turn_length * Math.cos(mid_angle),
        y: turn_control_2.y - turn_length * Math.sin(mid_angle),
      }
      turn_data_heng1_zhe1 = {
        turn_start_1,
        turn_control_1,
        turn_end_1,
        turn_start_2,
        turn_control_2,
        turn_end_2,
      }
    }
    {
      const turn_length = 20 * turn_style_value
      const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_heng2_start, out_corner_heng2_zhe2, out_zhe2_end)
      const inner_corner_length = weight
      const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
      const turn_control_1 = {
        x: out_corner_heng2_zhe2.x - corner_radius,
        y: out_corner_heng2_zhe2.y,
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
        start: out_corner_heng2_zhe2,
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
      turn_data_heng2_zhe2 = {
        turn_start_1,
        turn_control_1,
        turn_end_1,
        turn_start_2,
        turn_control_2,
        turn_end_2,
      }
    }
  }

  const start_length = 100
  const end_length = 60
  const d = 20
  const turn_ratio = 0.85

  const start_p14 = {
    x: in_heng1_start.x + 0.25 * start_length,
    y: in_heng1_start.y,
  }
  const start_p13 = {
    x: in_heng1_start.x,
    y: in_heng1_start.y,
  }
  const start_p12 = {
    x: in_heng1_start.x,
    y: in_heng1_start.y - weight / 2,
  }
  const start_p11 = {
    x: out_heng1_start.x,
    y: out_heng1_start.y,
  }
  const start_p10 = {
    x: out_heng1_start.x + 0.15 * start_length,
    y: out_heng1_start.y,
  }
  const start_p9 = {
    x: out_heng1_start.x + 0.3 * start_length,
    y: out_heng1_start.y,
  }
  const start_p8 = {
    x: out_heng1_start.x + 0.3 * start_length,
    y: out_heng1_start.y - d,
  }
  const start_p7 = {
    x: out_heng1_start.x + 0.45 * start_length,
    y: out_heng1_start.y - d,
  }
  const start_p6 = {
    x: out_heng1_start.x + 0.6 * start_length,
    y: out_heng1_start.y - d,
  }
  const start_p5 = {
    x: out_heng1_start.x + 0.6 * start_length,
    y: out_heng1_start.y,
  }
  const start_p4 = {
    x: out_heng1_start.x + 0.9 * start_length,
    y: out_heng1_start.y,
  }
  const start_p3 = {
    x: out_heng1_start.x + 0.9 * start_length,
    y: out_heng1_start.y + d,
  }
  const start_p2 = {
    x: out_heng1_start.x + 0.6 * start_length,
    y: out_heng1_start.y + d,
  }
  const start_p1 = {
    x: out_heng1_start.x + 1 * start_length,
    y: out_heng1_start.y + d,
  }
  const start_p0 = {
    x: out_heng1_start.x + 1 * start_length,
    y: out_heng1_start.y,
  }

  const turn_1_p6 = turn_data_heng1_zhe1.turn_control_1
  const turn_1_p3 = FP.getPointOnLineByPercentage(turn_data_heng1_zhe1.turn_end_1, turn_data_heng1_zhe1.turn_end_2, turn_ratio)
  const turn_1_p5 = FP.turnRight(turn_1_p3, turn_1_p6, d * 1.5)
  const turn_1_p4 = FP.turnLeft(turn_1_p6, turn_1_p3, d * 1.5)
  const turn_1_p0 = turn_data_heng1_zhe1.turn_control_2
  const turn_1_p2 = FP.turnRight(turn_1_p0, turn_1_p3, d * 0.75)
  const turn_1_p1 = FP.turnLeft(turn_1_p3, turn_1_p0, d * 0.75)

  const turn_2_p6 = turn_data_heng2_zhe2.turn_control_1
  const turn_2_p3 = FP.getPointOnLineByPercentage(turn_data_heng2_zhe2.turn_end_1, turn_data_heng2_zhe2.turn_end_2, turn_ratio)
  const turn_2_p5 = FP.turnRight(turn_2_p3, turn_2_p6, d * 1.5)
  const turn_2_p4 = FP.turnLeft(turn_2_p6, turn_2_p3, d * 1.5)
  const turn_2_p0 = turn_data_heng2_zhe2.turn_control_2
  const turn_2_p2 = FP.turnRight(turn_2_p0, turn_2_p3, d * 0.75)
  const turn_2_p1 = FP.turnLeft(turn_2_p3, turn_2_p0, d * 0.75)

  const end_p10 = FP.getPointOnLine(in_zhe2_end, in_zhe2_start, end_length)
  const end_p9 = FP.turnLeft(in_zhe2_start, end_p10, 2 * d)
  const end_p8 = FP.turnRight(end_p10, end_p9, 0.3 * end_length)
  const end_p7 = FP.turnRight(end_p10, end_p9, 0.15 * end_length)
  const end_p6 = FP.turnRight(end_p9, end_p7, 0.9 * d)
  const end_p5 = FP.goStraight(end_p7, end_p6, 1.3 * d)
  const end_p4 = FP.turnLeft(end_p6, end_p5, 0.425 * end_length)
  const end_p3 = FP.goStraight(end_p5, end_p4, 0.425 * end_length)
  const end_p2 = FP.turnLeft(end_p4, end_p3, 1.3 * d)
  const end_p1 = out_zhe2_end
  const end_p0 = FP.turnLeft(end_p2, end_p1, 0.45 * end_length)

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

  // 绘制内侧横1折1圆角
  pen.lineTo(in_radius_start_heng1_zhe1.x, in_radius_start_heng1_zhe1.y)
  pen.quadraticBezierTo(in_corner_heng1_zhe1.x, in_corner_heng1_zhe1.y, in_radius_end_heng1_zhe1.x, in_radius_end_heng1_zhe1.y)
  // 绘制内侧折1
  pen.lineTo(in_corner_zhe1_heng2.x, in_corner_zhe1_heng2.y)
  // 绘制内侧横2折2圆角
  pen.lineTo(in_radius_start_heng2_zhe2.x, in_radius_start_heng2_zhe2.y)
  pen.quadraticBezierTo(in_corner_heng2_zhe2.x, in_corner_heng2_zhe2.y, in_radius_end_heng2_zhe2.x, in_radius_end_heng2_zhe2.y)
  // 绘制内侧折2
  pen.lineTo(end_p10.x, end_p10.y)
  // 绘制收笔样式
  pen.quadraticBezierTo(end_p9.x, end_p9.y, end_p8.x, end_p8.y)
  pen.quadraticBezierTo(end_p7.x, end_p7.y, end_p6.x, end_p6.y)
  pen.quadraticBezierTo(end_p5.x, end_p5.y, end_p4.x, end_p4.y)
  pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p2.x, end_p2.y)
  pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p0.x, end_p0.y)

  // 绘制外侧折2
  pen.lineTo(turn_2_p0.x, turn_2_p0.y)
  // 绘制转角样式
  pen.bezierTo(turn_2_p1.x, turn_2_p1.y, turn_2_p2.x, turn_2_p2.y, turn_2_p3.x, turn_2_p3.y)
  pen.bezierTo(turn_2_p4.x, turn_2_p4.y, turn_2_p5.x, turn_2_p5.y, turn_2_p6.x, turn_2_p6.y)

  // 绘制外侧横2
  pen.lineTo(out_corner_zhe1_heng2.x, out_corner_zhe1_heng2.y)

  // 绘制外侧折1
  pen.lineTo(turn_1_p0.x, turn_1_p0.y)
  // 绘制转角样式
  pen.bezierTo(turn_1_p1.x, turn_1_p1.y, turn_1_p2.x, turn_1_p2.y, turn_1_p3.x, turn_1_p3.y)
  pen.bezierTo(turn_1_p4.x, turn_1_p4.y, turn_1_p5.x, turn_1_p5.y, turn_1_p6.x, turn_1_p6.y)

  // 绘制外侧横1
  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)