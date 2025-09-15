const ox = 500
const oy = 500
const x0 = 400
const y0 = 350
const params = {
  shu_length: glyph.getParam('竖-长度'),
  wan_length: glyph.getParam('弯-长度'),
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
      jointsMap['wan_start'] = {
        x: glyph.tempData['wan_start'].x,
        y: glyph.tempData['wan_start'].y + deltaY,
      }
      jointsMap['wan_end'] = {
        x: glyph.tempData['wan_end'].x,
        y: glyph.tempData['wan_end'].y + deltaY,
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
  glyph.setParam('竖-长度', _params.shu_length)
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
  const { shu_start, shu_end, wan_start, wan_end } = jointsMap
  const shu_length_range = glyph.getParamRange('竖-长度')
  const wan_length_range = glyph.getParamRange('弯-长度')
  const shu_length = range(shu_end.y - shu_start.y, shu_length_range)
  const wan_length = range(wan_end.x - wan_start.x, wan_length_range)
  return {
    shu_length,
    wan_length,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    shu_length,
    wan_length,
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

  glyph.addJoint(shu_start)
  glyph.addJoint(shu_end)
  glyph.addJoint(wan_start)
  glyph.addJoint(wan_end)

  const skeleton = {
    shu_start,
    shu_end,
    wan_start,
    wan_end,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
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
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, weight, {
    unticlockwise: true,
  })
  const { out_wan_start, out_wan_end, in_wan_start, in_wan_end } = FP.getLineContours('wan', { wan_start, wan_end }, weight, {
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

  // 计算竖弯拐角处内外圆角相关的点与数据
  let in_radius_shu_wan = 60 * bending_degree
  let out_radius_shu_wan = 80 * bending_degree
  // 如果in_radius超出竖或弯长度，取竖或弯的最小长度
  const in_radius_min_length_shu_wan = Math.min(
    getDistance(in_corner_shu_wan, in_shu_start),
    getDistance(in_corner_shu_wan, in_wan_end),
  )
  const out_radius_min_length_shu_wan = Math.min(
    getDistance(out_wan_end, out_shu_start),
    getDistance(out_wan_start, out_wan_end),
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
  const in_radius_end_shu_wan = getRadiusPoint({
    start: in_corner_shu_wan,
    end: in_wan_end,
    radius: in_radius_shu_wan,
  })
  const out_radius_start_shu_wan = {
    x: out_corner_shu_wan.x,
    y: out_corner_shu_wan.y - out_radius_shu_wan,
  }
  const out_radius_end_shu_wan = getRadiusPoint({
    start: out_corner_shu_wan,
    end: out_wan_end,
    radius: out_radius_shu_wan,
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
  // 绘制外侧弯
  pen.lineTo(out_wan_end.x, out_wan_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_wan_end.x, in_wan_end.y)

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
  // // 绘制内侧弯
  // pen.lineTo(in_wan_end.x, in_wan_end.y)

  // // 绘制轮廓连接线
  // pen.lineTo(out_wan_end.x, out_wan_end.y)

  // // 绘制左侧（外侧）轮廓
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