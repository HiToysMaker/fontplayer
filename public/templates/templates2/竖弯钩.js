const ox = 500
const oy = 500
const x0 = 370
const y0 = 250
const params = {
  shu_length: glyph.getParam('竖-长度'),
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
        x: glyph.tempData['shu_end'].x,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x,
        y: glyph.tempData['wan_end'].y + deltaY,
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
    case 'wan_start': {
      jointsMap['shu_end'] = {
        x: glyph.tempData['shu_end'].x,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x,
        y: glyph.tempData['wan_end'].y + deltaY,
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
  glyph.setParam('竖-长度', _params.shu_length)
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
  const shu_length_range = glyph.getParamRange('竖-长度')
  const wan_length_range = glyph.getParamRange('弯-长度')
  const gou_horizontal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const shu_length = range(shu_end.y - shu_start.y, shu_length_range)
  const wan_length = range(wan_end.x - wan_start.x, wan_length_range)
  const gou_horizontalSpan = range(gou_end.x - gou_start.x, gou_horizontal_span_range)
  const gou_verticalSpan = range(gou_start.y - gou_end.y, gou_vertical_span_range)
  return {
    shu_length,
    wan_length,
    gou_horizontalSpan,
    gou_verticalSpan,
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    shu_length,
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
      x: shu_start.x,
      y: shu_start.y + shu_length,
    },
  )

  // 弯
  const wan_start = new FP.Joint(
    'wan_start',
    {
      x: shu_start.x,
      y: shu_start.y + shu_length,
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

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, weight, {
    unticlockwise: true,
  })
  const { out_wan_start, out_wan_end, in_wan_start, in_wan_end } = FP.getLineContours('wan', { wan_start, wan_end }, weight, {
    unticlockwise: true,
  })
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight, {
    unticlockwise: true,
  })
  const { corner: in_corner_shu_wan } = FP.getIntersection(
    { type: 'line', start: in_shu_start, end: in_shu_end },
    { type: 'line', start: in_wan_start, end: in_wan_end },
  )
  const { corner: out_corner_shu_wan } = FP.getIntersection(
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
  const in_radius_start_shu_wan = {
    x: in_corner_shu_wan.x,
    y: in_corner_shu_wan.y - in_radius_shu_wan,
  }
  const in_radius_end_shu_wan = {
    x: in_corner_shu_wan.x + in_radius_shu_wan,
    y: in_corner_shu_wan.y,
  }
  const out_radius_start_shu_wan = {
    x: out_shu_end.x,
    y: out_shu_end.y - out_radius_shu_wan,
  }
  const out_radius_end_shu_wan = {
    x: out_wan_start.x + out_radius_shu_wan,
    y: out_wan_start.y,
  }

  // 计算弯钩拐角处内外圆角相关的点与数据
  let in_radius_wan_gou = 30 * bending_degree
  let out_radius_wan_gou = 30 * bending_degree
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
  const in_radius_start_wan_gou = {
    x: in_corner_wan_gou.x - in_radius_wan_gou,
    y: in_corner_wan_gou.y,
  }
  const in_radius_end_wan_gou = getRadiusPoint({
    start: in_corner_wan_gou,
    end: in_gou_end,
    radius: in_radius_wan_gou,
  })
  const out_radius_start_wan_gou = {
    x: out_wan_end.x - out_radius_wan_gou,
    y: out_wan_end.y,
  }
  const out_radius_end_wan_gou = getRadiusPoint({
    start: out_gou_start,
    end: out_gou_end,
    radius: out_radius_wan_gou,
  })

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制左侧（外侧）轮廓
  if (start_style_type === 0) {
    // 无起笔样式
    pen.moveTo(out_shu_start.x, out_shu_start.y)
  } else if (start_style_type === 1) {
    // 起笔左右凸起长方形
    pen.moveTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
    pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y + start_style.start_style_decorator_height)
    pen.lineTo(out_shu_start.x, out_shu_start.y + start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔左右凸起长方形，长方形内侧转角为圆角
    pen.moveTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
    pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y + start_style.start_style_decorator_height)
    pen.quadraticBezierTo(
      out_shu_start.x,
      out_shu_start.y + start_style.start_style_decorator_height,
      out_shu_start.x,
      out_shu_start.y + start_style.start_style_decorator_height + start_style.start_style_decorator_radius,
    )
  }
  // 绘制外侧竖弯圆角
  pen.lineTo(out_radius_start_shu_wan.x, out_radius_start_shu_wan.y)
  pen.quadraticBezierTo(out_corner_shu_wan.x, out_corner_shu_wan.y, out_radius_end_shu_wan.x, out_radius_end_shu_wan.y)
  // 绘制外侧弯钩圆角
  pen.lineTo(out_radius_start_wan_gou.x, out_radius_start_wan_gou.y)
  pen.quadraticBezierTo(out_corner_wan_gou.x, out_corner_wan_gou.y, out_radius_end_wan_gou.x, out_radius_end_wan_gou.y)
  // 绘制外侧钩
  pen.lineTo(out_gou_end.x, out_gou_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_gou_end.x, in_gou_end.y)

  // 绘制右侧（内侧）轮廓
  // 绘制内侧弯钩圆角
  pen.lineTo(in_radius_end_wan_gou.x, in_radius_end_wan_gou.y)
  pen.quadraticBezierTo(in_corner_wan_gou.x, in_corner_wan_gou.y, in_radius_start_wan_gou.x, in_radius_start_wan_gou.y)
  // 绘制内侧竖弯圆角
  pen.lineTo(in_radius_end_shu_wan.x, in_radius_end_shu_wan.y)
  pen.quadraticBezierTo(in_corner_shu_wan.x, in_corner_shu_wan.y, in_radius_start_shu_wan.x, in_radius_start_shu_wan.y)
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(in_shu_start.x, in_shu_start.y)
  } else if (start_style_type === 1) {
    // 起笔左右凸起长方形
    pen.lineTo(in_shu_start.x, in_shu_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y)
  } else if (start_style_type === 2) {
    // 起笔左右凸起长方形，长方形内侧转角为圆角
    pen.lineTo(in_shu_start.x, in_shu_start.y + start_style.start_style_decorator_height + start_style.start_style_decorator_radius)
    pen.quadraticBezierTo(
      in_shu_start.x,
      in_shu_start.y + start_style.start_style_decorator_height,
      in_shu_start.x + start_style.start_style_decorator_width,
      in_shu_start.y + start_style.start_style_decorator_height
    )
    pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y)
  }
  // 绘制轮廓连接线
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(out_shu_start.x, out_shu_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
  }
  

  // // 按顺时针方向绘制轮廓
  // // 绘制右侧（内侧）轮廓
  // if (start_style_type === 0) {
  //   // 无起笔样式
  //   pen.moveTo(in_shu_start.x, in_shu_start.y)
  // } else if (start_style_type === 1) {
  //   // 起笔左右凸起长方形
  //   pen.moveTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y)
  //   pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y + start_style.start_style_decorator_height)
  //   pen.lineTo(in_shu_start.x, in_shu_start.y + start_style.start_style_decorator_height)
  // } else if (start_style_type === 2) {
  //   // 起笔左右凸起长方形，长方形内侧转角为圆角
  //   pen.moveTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y)
  //   pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y + start_style.start_style_decorator_height)
  //   pen.quadraticBezierTo(
  //     in_shu_start.x,
  //     in_shu_start.y + start_style.start_style_decorator_height,
  //     in_shu_start.x,
  //     in_shu_start.y + start_style.start_style_decorator_height + start_style.start_style_decorator_radius,
  //   )
  // }
  // // 绘制内侧竖弯圆角
  // pen.lineTo(in_radius_start_shu_wan.x, in_radius_start_shu_wan.y)
  // pen.quadraticBezierTo(in_corner_shu_wan.x, in_corner_shu_wan.y, in_radius_end_shu_wan.x, in_radius_end_shu_wan.y)
  // // 绘制内侧弯钩圆角
  // pen.lineTo(in_radius_start_wan_gou.x, in_radius_start_wan_gou.y)
  // pen.quadraticBezierTo(in_corner_wan_gou.x, in_corner_wan_gou.y, in_radius_end_wan_gou.x, in_radius_end_wan_gou.y)
  // pen.lineTo(in_gou_end.x, in_gou_end.y)

  // // 绘制轮廓连接线
  // pen.lineTo(out_gou_end.x, out_gou_end.y)

  // // 绘制左侧（外侧）轮廓
  // // 绘制外侧弯钩圆角
  // pen.lineTo(out_radius_end_wan_gou.x, out_radius_end_wan_gou.y)
  // pen.quadraticBezierTo(out_corner_wan_gou.x, out_corner_wan_gou.y, out_radius_start_wan_gou.x, out_radius_start_wan_gou.y)
  // // 绘制外侧竖弯圆角
  // pen.lineTo(out_radius_end_shu_wan.x, out_radius_end_shu_wan.y)
  // pen.quadraticBezierTo(out_corner_shu_wan.x, out_corner_shu_wan.y, out_radius_start_shu_wan.x, out_radius_start_shu_wan.y)
  // if (start_style_type === 0) {
  //   // 无起笔样式
  //   pen.lineTo(out_shu_start.x, out_shu_start.y)
  // } else if (start_style_type === 1) {
  //   // 起笔上下凸起长方形
  //   pen.lineTo(out_shu_start.x, out_shu_start.y + start_style.start_style_decorator_height)
  //   pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y + start_style.start_style_decorator_height)
  //   pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
  // } else if (start_style_type === 2) {
  //   // 起笔上下凸起长方形，长方形内侧转角为圆角
  //   pen.lineTo(
  //     out_shu_start.x,
  //     out_shu_start.y + start_style.start_style_decorator_height + start_style.start_style_decorator_radius,
  //   )
  //   pen.quadraticBezierTo(
  //     out_shu_start.x,
  //     out_shu_start.y + start_style.start_style_decorator_height,
  //     out_shu_start.x - start_style.start_style_decorator_width,
  //     out_shu_start.y + start_style.start_style_decorator_height,
  //   )
  //   pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
  // }

  // // 绘制轮廓连接线
  // if (start_style_type === 0) {
  //   // 无起笔样式
  //   pen.lineTo(in_shu_start.x, in_shu_start.y)
  // } else if (start_style_type === 1) {
  //   // 起笔上下凸起长方形
  //   pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y)
  // } else if (start_style_type === 2) {
  //   // 起笔上下凸起长方形，长方形内侧转角为圆角
  //   pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y)
  // }

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)