const ox = 500
const oy = 500
const x0 = 250
const y0 = 500
const params = {
  heng_length: glyph.getParam('横-长度'),
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
        y: glyph.tempData['heng_end'].y,
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
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y,
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
  glyph.setParam('横-长度', _params.heng_length)
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
  const heng_length_range = glyph.getParamRange('横-长度')
  const gou_horizontal_span_range = glyph.getParamRange('钩-水平延伸')
  const gou_vertical_span_range = glyph.getParamRange('钩-竖直延伸')
  const heng_length = range(heng_end.x - heng_start.x, heng_length_range)
  const gou_horizontalSpan = range(gou_start.x - gou_end.x, gou_horizontal_span_range)
  const gou_verticalSpan = range(gou_end.y - gou_start.y, gou_vertical_span_range)
  return {
    heng_length,
    gou_horizontalSpan,
    gou_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_length,
    gou_horizontalSpan,
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

  // 钩
  const gou_start = new FP.Joint(
    'gou_start',
    {
      x: heng_start.x + heng_length,
      y: heng_start.y,
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

  // 根据骨架计算轮廓关键点
  const {
    heng_start,
    heng_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
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
    x: out_corner_heng_gou.x - weight * Math.sin(gou_angle),
    y: out_corner_heng_gou.y - weight * Math.cos(gou_angle),
  }
  const { corner: out_corner_heng_gou_2 } = FP.getIntersection(
    { type: 'line', start: out_heng_start, end: out_heng_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  if (start_style_type === 0) {
    // 无起笔样式
    pen.moveTo(in_heng_start.x, in_heng_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.moveTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_heng_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_heng_start.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.moveTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_heng_start.y + start_style.start_style_decorator_height)
    pen.quadraticBezierTo(
      in_heng_start.x + start_style.start_style_decorator_width,
      in_heng_start.y,
      in_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      in_heng_start.y,
    )
  }
  // 绘制左侧（内侧）轮廓
  pen.lineTo(in_corner_heng_gou.x, in_corner_heng_gou.y)
  pen.lineTo(in_gou_end.x, in_gou_end.y)

  // 绘制轮廓连接线
  pen.lineTo(out_gou_end.x, out_gou_end.y)

  // 绘制右侧（外侧）轮廓
  pen.lineTo(out_corner_heng_gou.x, out_corner_heng_gou.y)
  pen.lineTo(out_corner_heng_gou_1.x, out_corner_heng_gou_1.y)
  pen.lineTo(out_corner_heng_gou_2.x, out_corner_heng_gou_2.y)

  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(out_heng_start.x, out_heng_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(
      out_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      out_heng_start.y,
    )
    pen.quadraticBezierTo(
      out_heng_start.x + start_style.start_style_decorator_width,
      out_heng_start.y,
      out_heng_start.x + start_style.start_style_decorator_width,
      out_heng_start.y - start_style.start_style_decorator_height,
    )
    pen.lineTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  }

  // 绘制轮廓连接线
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(in_heng_start.x, in_heng_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
  }


  // // 按顺时针方向绘制轮廓
  // // 绘制右侧（外侧）轮廓
  // if (start_style_type === 0) {
  //   // 无起笔样式
  //   pen.moveTo(out_heng_start.x, out_heng_start.y)
  // } else if (start_style_type === 1) {
  //   // 起笔上下凸起长方形
  //   pen.moveTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  //   pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y - start_style.start_style_decorator_height)
  //   pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y)
  // } else if (start_style_type === 2) {
  //   // 起笔上下凸起长方形，长方形内侧转角为圆角
  //   pen.moveTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  //   pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y - start_style.start_style_decorator_height)
  //   pen.quadraticBezierTo(
  //     out_heng_start.x + start_style.start_style_decorator_width,
  //     out_heng_start.y,
  //     out_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
  //     out_heng_start.y,
  //   )
  // }
  // pen.lineTo(out_corner_heng_gou_2.x, out_corner_heng_gou_2.y)
  // pen.lineTo(out_corner_heng_gou_1.x, out_corner_heng_gou_1.y)
  // pen.lineTo(out_corner_heng_gou.x, out_corner_heng_gou.y)
  // pen.lineTo(out_gou_end.x, out_gou_end.y)

  // // 绘制轮廓连接线
  // pen.lineTo(in_gou_end.x, in_gou_end.y)

  // // 绘制左侧（内侧）轮廓
  // pen.lineTo(in_corner_heng_gou.x, in_corner_heng_gou.y)
  // if (start_style_type === 0) {
  //   // 无起笔样式
  //   pen.lineTo(in_heng_start.x, in_heng_start.y)
  // } else if (start_style_type === 1) {
  //   // 起笔上下凸起长方形
  //   pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_heng_start.y)
  //   pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_heng_start.y + start_style.start_style_decorator_height)
  //   pen.lineTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
  // } else if (start_style_type === 2) {
  //   // 起笔上下凸起长方形，长方形内侧转角为圆角
  //   pen.lineTo(
  //     in_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
  //     in_heng_start.y,
  //   )
  //   pen.quadraticBezierTo(
  //     in_heng_start.x + start_style.start_style_decorator_width,
  //     in_heng_start.y,
  //     in_heng_start.x + start_style.start_style_decorator_width,
  //     in_heng_start.y + start_style.start_style_decorator_height,
  //   )
  //   pen.lineTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
  // }

  // // 绘制轮廓连接线
  // if (start_style_type === 0) {
  //   // 无起笔样式
  //   pen.lineTo(out_heng_start.x, out_heng_start.y)
  // } else if (start_style_type === 1) {
  //   // 起笔上下凸起长方形
  //   pen.lineTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  // } else if (start_style_type === 2) {
  //   // 起笔上下凸起长方形，长方形内侧转角为圆角
  //   pen.lineTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  // }

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)