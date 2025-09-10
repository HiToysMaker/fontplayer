const ox = 500
const oy = 500
const x0 = 420
const y0 = 250
const params = {
  shu_length: glyph.getParam('竖-长度'),
  tiao_horizonalSpan: glyph.getParam('挑-水平延伸'),
  tiao_verticalSpan: glyph.getParam('挑-竖直延伸'),
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
      jointsMap['tiao_start'] = {
        x: glyph.tempData['tiao_start'].x,
        y: glyph.tempData['tiao_start'].y + deltaY,
      }
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x,
        y: glyph.tempData['tiao_end'].y + deltaY,
      }
      break
    }
    case 'tiao_start': {
      jointsMap['shu_end'] = {
        x: glyph.tempData['shu_end'].x,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['tiao_start'] = {
        x: glyph.tempData['tiao_start'].x,
        y: glyph.tempData['tiao_start'].y + deltaY,
      }
      jointsMap['tiao_end'] = {
        x: glyph.tempData['tiao_end'].x,
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
  glyph.setParam('竖-长度', _params.shu_length)
  glyph.setParam('挑-水平延伸', _params.tiao_horizonalSpan)
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
  const { shu_start, shu_end, tiao_start, tiao_end } = jointsMap
  const shu_length_range = glyph.getParamRange('竖-长度')
  const tiao_horizonal_span_range = glyph.getParamRange('挑-水平延伸')
  const tiao_vertical_span_range = glyph.getParamRange('挑-竖直延伸')
  const shu_length = range(shu_end.y - shu_start.y, shu_length_range)
  const tiao_horizonalSpan = range(tiao_end.x - tiao_start.x, tiao_horizonal_span_range)
  const tiao_verticalSpan = range(tiao_start.y - tiao_end.y, tiao_vertical_span_range)
  return {
    shu_length,
    tiao_horizonalSpan,
    tiao_verticalSpan,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    shu_length,
    tiao_horizonalSpan,
    tiao_verticalSpan,
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

  // 挑
  const tiao_start = new FP.Joint(
    'tiao_start',
    {
      x: shu_start.x,
      y: shu_start.y + shu_length,
    },
  )
  const tiao_end = new FP.Joint(
    'tiao_end',
    {
      x: tiao_start.x + tiao_horizonalSpan,
      y: tiao_start.y - tiao_verticalSpan,
    },
  )

  glyph.addJoint(shu_start)
  glyph.addJoint(shu_end)
  glyph.addJoint(tiao_start)
  glyph.addJoint(tiao_end)

  const skeleton = {
    shu_start,
    shu_end,
    tiao_start,
    tiao_end,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
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

  // 根据骨架计算轮廓关键点
  const {
    shu_start,
    shu_end,
    tiao_start,
    tiao_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, weight, {
    unticlockwise: true,
  })
  const { out_tiao_start, out_tiao_end, in_tiao_start, in_tiao_end } = FP.getLineContours('tiao', { tiao_start, tiao_end }, weight, {
    unticlockwise: true,
  })
  const { corner: out_corner_shu_tiao } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: out_tiao_start, end: out_tiao_end },
  )
  const { corner: in_corner_shu_tiao } = FP.getIntersection(
    { type: 'line', start: in_shu_start, end: in_shu_end },
    { type: 'line', start: in_tiao_start, end: in_tiao_end },
  )
  const tiao_angle = Math.atan2(tiao_start.y - tiao_end.y, tiao_end.x - tiao_start.x)
  const out_corner_shu_tiao_1 = {
    x: out_corner_shu_tiao.x - weight * Math.sin(tiao_angle),
    y: out_corner_shu_tiao.y - weight * Math.cos(tiao_angle)
  }
  const { corner: out_corner_shu_tiao_2 } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: in_tiao_start, end: in_tiao_end },
  )

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
  pen.lineTo(out_corner_shu_tiao_2.x, out_corner_shu_tiao_2.y)
  pen.lineTo(out_corner_shu_tiao_1.x, out_corner_shu_tiao_1.y)
  pen.lineTo(out_corner_shu_tiao.x, out_corner_shu_tiao.y)
  pen.lineTo(out_tiao_end.x, out_tiao_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_tiao_end.x, in_tiao_end.y)

  // 绘制右侧（内侧）轮廓
  pen.lineTo(in_corner_shu_tiao.x, in_corner_shu_tiao.y)
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
  // pen.lineTo(in_corner_shu_tiao.x, in_corner_shu_tiao.y)
  // pen.lineTo(in_tiao_end.x, in_tiao_end.y)

  // // 绘制轮廓连接线
  // pen.lineTo(out_tiao_end.x, out_tiao_end.y)

  // // 绘制左侧（外侧）轮廓
  // pen.lineTo(out_corner_shu_tiao.x, out_corner_shu_tiao.y)
  // pen.lineTo(out_corner_shu_tiao_1.x, out_corner_shu_tiao_1.y)
  // pen.lineTo(out_corner_shu_tiao_2.x, out_corner_shu_tiao_2.y)
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