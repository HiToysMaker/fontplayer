const ox = 500
const oy = 500
const x0 = 370
const y0 = 245
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
const params = {
  heng_horizontalSpan: glyph.getParam('横-水平延伸'),
  heng_verticalSpan: glyph.getParam('横-竖直延伸'),
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
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y + deltaY,
      }
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
    case 'pie_start': {
      const heng_vertical_span_range = glyph.getParamRange('横-竖直延伸')
      deltaY = range(deltaY, heng_vertical_span_range)
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y + deltaY,
      }
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y + deltaY,
      }
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
  glyph.setParam('横-水平延伸', _params.heng_horizontalSpan)
  glyph.setParam('横-竖直延伸', _params.heng_verticalSpan)
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
  const heng_horizontalSpan_range = glyph.getParamRange('横-水平延伸')
  const heng_verticalSpan_range = glyph.getParamRange('横-竖直延伸')
  const pie_horizontal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const wangou_vertical_span_range = glyph.getParamRange('弯钩-竖直延伸')
  const wangou_bend_cursor_range = glyph.getParamRange('弯钩-弯曲游标')
  const wangou_bend_degree_range = glyph.getParamRange('弯钩-弯曲度')
  const heng_horizontalSpan = range(heng_end.x - heng_start.x, heng_horizontalSpan_range)
  const heng_verticalSpan = range(heng_start.y - heng_end.y, heng_verticalSpan_range)
  const pie_horizontalSpan = range(pie_start.x - pie_end.x, pie_horizontal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const wangou_verticalSpan = range(wangou_end.y - wangou_start.y, wangou_vertical_span_range)
  const wangou_bendCursor = range((wangou_bend.y - wangou_start.y) / wangou_verticalSpan, wangou_bend_cursor_range)
  const wangou_bendDegree = range(wangou_bend.x - wangou_start.x, wangou_bend_degree_range)
  return {
    heng_horizontalSpan,
    heng_verticalSpan,
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
    heng_horizontalSpan,
    heng_verticalSpan,
    pie_horizontalSpan,
    pie_verticalSpan,
    wangou_verticalSpan,
    wangou_bendCursor,
    wangou_bendDegree,
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

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: heng_end.x,
      y: heng_end.y,
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
    pie_start,
    pie_end,
    wangou_start,
    wangou_bend,
    wangou_end,
  } = skeleton

  // 竖横比，竖的厚度比横的厚度
  const serif_size = 2.0
  const radius = 10
  const _weight = weight / stress_ratio
  const _wangou_weight = weight * 1.2
  const turn_angle_1 = FP.degreeToRadius(10)
  const turn_angle_2 = FP.degreeToRadius(15)
  const end_length = 100

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, _weight)
  const { out_pie_start, out_pie_end, in_pie_start, in_pie_end } = FP.getLineContours('pie', { pie_start, pie_end }, weight, {
    endWeight: weight * 0.5,
  })
  const { out_wangou_curves, out_wangou_points, in_wangou_curves, in_wangou_points } = FP.getCurveContours('wangou', { wangou_start, wangou_bend, wangou_end }, _wangou_weight, {
    weightsVariationFnType: 'bezier1',
    weightsVariation: 'bezier',
  })
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
  {
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
  // 绘制左侧（内侧）轮廓
  pen.moveTo(in_heng_start.x, in_heng_start.y)
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

  // 绘制转角衬线
  pen.lineTo(turn_p0.x, turn_p0.y)
  pen.lineTo(turn_p1_radius_before.x, turn_p1_radius_before.y)
  pen.quadraticBezierTo(turn_p1.x, turn_p1.y, turn_p1_radius_after.x, turn_p1_radius_after.y)
  pen.lineTo(turn_p2_radius_before.x, turn_p2_radius_before.y)
  pen.quadraticBezierTo(turn_p2.x, turn_p2.y, turn_p2_radius_after.x, turn_p2_radius_after.y)
  pen.lineTo(turn_p3.x, turn_p3.y)

  // 绘制上侧横
  pen.lineTo(out_heng_start.x, out_heng_start.y)

  // 绘制轮廓连接线
  pen.lineTo(in_heng_start.x, in_heng_start.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)