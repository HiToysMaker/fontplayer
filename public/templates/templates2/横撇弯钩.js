const ox = 500
const oy = 500
const x0 = 370
const y0 = 245
const global_params = {
  weights_variation_power: glyph.getParam('字重变化'),
  start_style_type: glyph.getParam('起笔风格'),
  start_style_value: glyph.getParam('起笔数值'),
  turn_style_type: glyph.getParam('转角风格'),
  turn_style_value: glyph.getParam('转角数值'),
  bending_degree: glyph.getParam('弯曲程度'),
  weight: glyph.getParam('字重') || 40,
}
const params = {
  heng_length: glyph.getParam('横-长度'),
  pie_horizontalSpan: glyph.getParam('撇-水平延伸'),
  pie_verticalSpan: glyph.getParam('撇-竖直延伸'),
  wangou_verticalSpan: glyph.getParam('弯钩-竖直延伸'),
  wangou_bendCursor: glyph.getParam('弯钩-弯曲游标'),
  wangou_bendDegree: glyph.getParam('弯钩-弯曲度') + 30 * global_params.bending_degree,
  skeletonRefPos: glyph.getParam('参考位置'),
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
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y,
      }
      jointsMap['wangou_start'] = {
        x: glyph.tempData['wangou_start'].x + deltaX,
        y: glyph.tempData['wangou_start'].y,
      }
      jointsMap['wangou_bend'] = {
        x: glyph.tempData['wangou_bend'].x + deltaX,
        y: glyph.tempData['wangou_bend'].y,
      }
      jointsMap['wangou_end'] = {
        x: glyph.tempData['wangou_end'].x + deltaX,
        y: glyph.tempData['wangou_end'].y,
      }
      break
    }
    case 'pie_start': {
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y,
      }
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y,
      }
      jointsMap['wangou_start'] = {
        x: glyph.tempData['wangou_start'].x + deltaX,
        y: glyph.tempData['wangou_start'].y,
      }
      jointsMap['wangou_bend'] = {
        x: glyph.tempData['wangou_bend'].x + deltaX,
        y: glyph.tempData['wangou_bend'].y,
      }
      jointsMap['wangou_end'] = {
        x: glyph.tempData['wangou_end'].x + deltaX,
        y: glyph.tempData['wangou_end'].y,
      }
      break
    }
    case 'pie_end': {
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      jointsMap['wangou_start'] = {
        x: glyph.tempData['wangou_start'].x + deltaX,
        y: glyph.tempData['wangou_start'].y + deltaY,
      }
      jointsMap['wangou_bend'] = {
        x: glyph.tempData['wangou_bend'].x + deltaX,
        y: glyph.tempData['wangou_bend'].y + deltaY,
      }
      jointsMap['wangou_end'] = {
        x: glyph.tempData['wangou_end'].x + deltaX,
        y: glyph.tempData['wangou_end'].y + deltaY,
      }
      break
    }
    case 'wangou_start': {
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      jointsMap['wangou_start'] = {
        x: glyph.tempData['wangou_start'].x + deltaX,
        y: glyph.tempData['wangou_start'].y + deltaY,
      }
      jointsMap['wangou_bend'] = {
        x: glyph.tempData['wangou_bend'].x + deltaX,
        y: glyph.tempData['wangou_bend'].y + deltaY,
      }
      jointsMap['wangou_end'] = {
        x: glyph.tempData['wangou_end'].x + deltaX,
        y: glyph.tempData['wangou_end'].y + deltaY,
      }
      break
    }
    case 'wangou_bend': {
      jointsMap['wangou_bend'] = {
        x: glyph.tempData['wangou_bend'].x + deltaX,
        y: glyph.tempData['wangou_bend'].y + deltaY,
      }
      break
    }
    case 'wangou_end': {
      jointsMap['wangou_end'] = {
        x: glyph.tempData['wangou_end'].x,
        y: glyph.tempData['wangou_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['wangou_start'], jointsMap['wangou_end'])
      jointsMap['wangou_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      break
    }
  }
  return jointsMap
}

const getBend = (start, end) => {
  // 改变end的情况下，不会改变弯曲度和弯曲游标，所以依据现有参数计算新的bend
  const { wangou_bendCursor: bendCursor, wangou_bendDegree: bendDegree } = params
  const verticalSpan = end.y - start.y
  const wangou_cursor_x = start.x
  const wangou_cursor_y = start.y + bendCursor * verticalSpan

  const bend = {
    x: wangou_cursor_x + bendDegree,
    y: wangou_cursor_y,
  }

  return bend
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
  glyph.setParam('撇-水平延伸', _params.pie_horizontalSpan)
  glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
  glyph.setParam('弯钩-竖直延伸', _params.wangou_verticalSpan)
  glyph.setParam('弯钩-弯曲游标', _params.wangou_bendCursor)
  glyph.setParam('弯钩-弯曲度', _params.wangou_bendDegree - 30 * global_params.bending_degree)
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
  const { heng_start, heng_end, pie_start, pie_end, wangou_start, wangou_bend, wangou_end } = jointsMap
  const heng_length_range = glyph.getParamRange('横-长度')
  const pie_horizontal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const wangou_vertical_span_range = glyph.getParamRange('弯钩-竖直延伸')
  const wangou_bend_cursor_range = glyph.getParamRange('弯钩-弯曲游标')
  const wangou_bend_degree_range = glyph.getParamRange('弯钩-弯曲度')
  const heng_length = range(heng_end.x - heng_start.x, heng_length_range)
  const pie_horizontalSpan = range(pie_start.x - pie_end.x, pie_horizontal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const wangou_verticalSpan = range(wangou_end.y - wangou_start.y, wangou_vertical_span_range)
  const wangou_bendCursor = range((wangou_bend.y - wangou_start.y) / wangou_verticalSpan, wangou_bend_cursor_range)
  const wangou_bendDegree = range(wangou_bend.x - wangou_start.x, wangou_bend_degree_range)
  return {
    heng_length,
    pie_horizontalSpan,
    pie_verticalSpan,
    wangou_verticalSpan,
    wangou_bendCursor,
    wangou_bendDegree,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_length,
    pie_horizontalSpan,
    pie_verticalSpan,
    wangou_verticalSpan,
    wangou_bendCursor,
    wangou_bendDegree,
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

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: heng_start.x + heng_length,
      y: heng_start.y,
    },
  )
  const pie_end = new FP.Joint(
    'pie_end',
    {
      x: pie_start.x - pie_horizontalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  // 弯钩
  const wangou_start = new FP.Joint(
    'wangou_start',
    {
      x: pie_start.x - pie_horizontalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )
  const wangou_end = new FP.Joint(
    'wangou_end',
    {
      x: wangou_start.x,
      y: wangou_start.y + wangou_verticalSpan,
    },
  )

  const wangou_length = distance(wangou_start, wangou_end)
  const wangou_cursor_x = wangou_start.x
  const wangou_cursor_y = wangou_start.y + wangou_bendCursor * wangou_verticalSpan

  const wangou_bend = new FP.Joint(
    'wangou_bend',
    {
      x: wangou_cursor_x + wangou_bendDegree,
      y: wangou_cursor_y,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(pie_start)
  glyph.addJoint(pie_end)
  glyph.addJoint(wangou_start)
  glyph.addJoint(wangou_bend)
  glyph.addJoint(wangou_end)

  const skeleton = {
    heng_start,
    heng_end,
    pie_start,
    pie_end,
    wangou_start,
    wangou_bend,
    wangou_end,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
  glyph.addRefLine(refline(pie_start, pie_end))
  glyph.addRefLine(refline(wangou_start, wangou_bend))
  glyph.addRefLine(refline(wangou_bend, wangou_end))

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
    pie_start,
    pie_end,
    wangou_start,
    wangou_bend,
    wangou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, weight)
  const { out_pie_start, out_pie_end, in_pie_start, in_pie_end } = FP.getLineContours('pie', { pie_start, pie_end }, weight)
  const { out_wangou_curves, out_wangou_points, in_wangou_curves, in_wangou_points } = FP.getCurveContours('wangou', { wangou_start, wangou_bend, wangou_end }, weight)
  const { corner: in_corner_heng_pie } = FP.getIntersection(
    { type: 'line', start: in_pie_start, end: in_pie_end },
    { type: 'line', start: in_heng_start, end: in_heng_end }
  )
  const { corner: out_corner_heng_pie } = FP.getIntersection(
    { type: 'line', start: out_pie_start, end: in_pie_end },
    { type: 'line', start: out_heng_start, end: out_heng_end }
  )
  const { corner: in_corner_pie_wangou } = FP.getIntersection(
    { type: 'line', start: in_pie_start, end: in_pie_end },
    { type: 'line', start: in_wangou_curves[0].start, end: in_wangou_curves[0].control1 }
  )
  const { corner: out_corner_pie_wangou, corner_index: out_corner_index_pie_wangou } = FP.getIntersection(
    { type: 'line', start: out_pie_start, end: out_pie_end },
    { type: 'curve', points: out_wangou_points }
  )
  const { curves: out_wangou_curves_final } = FP.fitCurvesByPoints(out_wangou_points.slice(out_corner_index_pie_wangou))
  const { corner: out_corner_heng_pie_down } = FP.getIntersection(
    { type: 'line', start: out_pie_start, end: in_pie_end },
    { type: 'line', start: in_heng_start, end: in_heng_end }
  )
  const out_corner_heng_pie_up = {
    x: out_corner_heng_pie_down.x,
    y: out_corner_heng_pie_down.y - weight,
  }

  let turn_data = {}
  if (turn_style_type === 1) {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    const turn_length = 20 * turn_style_value
    const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_heng_start, out_corner_heng_pie, out_pie_end)
    const inner_corner_length = weight
    const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
    const turn_control_1 = {
      x: out_corner_heng_pie.x - corner_radius,
      y: out_corner_heng_pie.y,
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
      start: out_corner_heng_pie,
      end: out_corner_pie_wangou,
      radius: corner_radius,
    })
    const turn_start_2 = getRadiusPoint({
      start: turn_control_2,
      end: out_corner_pie_wangou,
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

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()
  
  // 按逆时针方向绘制轮廓
  // 绘制左侧（内侧）轮廓
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
  pen.lineTo(in_corner_heng_pie.x, in_corner_heng_pie.y)
  pen.lineTo(in_corner_pie_wangou.x, in_corner_pie_wangou.y)
  for (let i = 0; i < in_wangou_curves.length; i++) {
    const curve = in_wangou_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(out_wangou_curves_final[out_wangou_curves_final.length - 1].end.x, out_wangou_curves_final[out_wangou_curves_final.length - 1].end.y)

  // 绘制右侧（外侧）轮廓
  for (let i = out_wangou_curves_final.length - 1; i >= 0; i--) {
    const curve = out_wangou_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen.lineTo(out_corner_pie_wangou.x, out_corner_pie_wangou.y)
  if (turn_style_type === 0) {
    // 默认转角样式
    pen.lineTo(out_corner_heng_pie_down.x, out_corner_heng_pie_down.y)
    pen.lineTo(out_corner_heng_pie_up.x, out_corner_heng_pie_up.y)
  } else if (turn_style_type === 1) {
    // 转角样式1
    pen.lineTo(turn_data.turn_start_2.x, turn_data.turn_start_2.y)
    pen.quadraticBezierTo(turn_data.turn_control_2.x, turn_data.turn_control_2.y, turn_data.turn_end_2.x, turn_data.turn_end_2.y)
    pen.lineTo(turn_data.turn_end_1.x, turn_data.turn_end_1.y)
    pen.quadraticBezierTo(turn_data.turn_control_1.x, turn_data.turn_control_1.y, turn_data.turn_start_1.x, turn_data.turn_start_1.y)
  }
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
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius, out_heng_start.y)
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
  // if (turn_style_type === 0) {
  //   // 默认转角样式
  //   pen.lineTo(out_corner_heng_pie_up.x, out_corner_heng_pie_up.y)
  //   pen.lineTo(out_corner_heng_pie_down.x, out_corner_heng_pie_down.y)
  // } else if (turn_style_type === 1) {
  //   // 转角样式1
  //   pen.lineTo(turn_data.turn_start_1.x, turn_data.turn_start_1.y)
  //   pen.quadraticBezierTo(turn_data.turn_control_1.x, turn_data.turn_control_1.y, turn_data.turn_end_1.x, turn_data.turn_end_1.y)
  //   pen.lineTo(turn_data.turn_end_2.x, turn_data.turn_end_2.y)
  //   pen.quadraticBezierTo(turn_data.turn_control_2.x, turn_data.turn_control_2.y, turn_data.turn_start_2.x, turn_data.turn_start_2.y)
  // }
  // pen.lineTo(out_corner_pie_wangou.x, out_corner_pie_wangou.y)
  // for (let i = 0; i < out_wangou_curves_final.length; i++) {
  //   const curve = out_wangou_curves_final[i]
  //   pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  // }

  // // 绘制轮廓连接线
  // pen.lineTo(in_wangou_curves[in_wangou_curves.length - 1].end.x, in_wangou_curves[in_wangou_curves.length - 1].end.y)

  // // 绘制左侧（内侧）轮廓
  // for (let i = in_wangou_curves.length - 1; i >= 0; i--) {
  //   const curve = in_wangou_curves[i]
  //   pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  // }
  // pen.lineTo(in_corner_pie_wangou.x, in_corner_pie_wangou.y)
  // pen.lineTo(in_corner_heng_pie.x, in_corner_heng_pie.y)
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