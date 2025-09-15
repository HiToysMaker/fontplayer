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
  pie_horizonalSpan: glyph.getParam('撇-水平延伸'),
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
  glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
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
  const pie_horizonal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const wangou_vertical_span_range = glyph.getParamRange('弯钩-竖直延伸')
  const wangou_bend_cursor_range = glyph.getParamRange('弯钩-弯曲游标')
  const wangou_bend_degree_range = glyph.getParamRange('弯钩-弯曲度')
  const heng_length = range(heng_end.x - heng_start.x, heng_length_range)
  const pie_horizonalSpan = range(pie_start.x - pie_end.x, pie_horizonal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const wangou_verticalSpan = range(wangou_end.y - wangou_start.y, wangou_vertical_span_range)
  const wangou_bendCursor = range((wangou_bend.y - wangou_start.y) / wangou_verticalSpan, wangou_bend_cursor_range)
  const wangou_bendDegree = range(wangou_bend.x - wangou_start.x, wangou_bend_degree_range)
  return {
    heng_length,
    pie_horizonalSpan,
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
    pie_horizonalSpan,
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
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  // 弯钩
  const wangou_start = new FP.Joint(
    'wangou_start',
    {
      x: pie_start.x - pie_horizonalSpan,
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

  const start_length = 100
  const end_length = 60
  const d = 20
  const turn_ratio = 0.85

  const end_right_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_wangou_curves_final),
    end_length * 0.45,
    true,
  )
  const end_left_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_wangou_curves),
    end_length,
    true,
  )

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

  const end_p10 = end_left_data.point
  const end_p9 = FP.turnLeft(end_left_data.tangent.end, end_p10, 2 * d)
  const end_p8 = FP.turnRight(end_p10, end_p9, 0.3 * end_length)
  const end_p7 = FP.turnRight(end_p10, end_p9, 0.15 * end_length)
  const end_p6 = FP.turnRight(end_p9, end_p7, 0.9 * d)
  const end_p5 = FP.goStraight(end_p7, end_p6, 1.3 * d)
  const end_p4 = FP.turnLeft(end_p6, end_p5, 0.425 * end_length)
  const end_p1 = FP.goStraight(end_right_data.tangent.end, end_right_data.tangent.start, 0.45 * end_length)
  const end_p0 = end_right_data.point//FP.turnLeft(end_p2, end_p1, 0.45 * end_length)
  const end_p2 = FP.turnRight(end_p0, end_p1, weight - 2 * d + 0.9 * d)
  const end_p3 = FP.turnRight(end_p0, end_p1, weight - 2 * d + 2.2 * d)

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

  pen.lineTo(in_corner_heng_pie.x, in_corner_heng_pie.y)
  pen.lineTo(in_corner_pie_wangou.x, in_corner_pie_wangou.y)

  for (let i = end_left_data.final_curves.length - 1; i >= 0; i--) {
    const curve = end_left_data.final_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制收笔样式
  pen.lineTo(end_p10.x, end_p10.y)
  pen.quadraticBezierTo(end_p9.x, end_p9.y, end_p8.x, end_p8.y)
  pen.quadraticBezierTo(end_p7.x, end_p7.y, end_p6.x, end_p6.y)
  pen.quadraticBezierTo(end_p5.x, end_p5.y, end_p4.x, end_p4.y)
  pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p2.x, end_p2.y)
  pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p0.x, end_p0.y)

  for (let i = 0; i < end_right_data.final_curves.length; i++) {
    const curve = end_right_data.final_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  
  pen.lineTo(out_corner_pie_wangou.x, out_corner_pie_wangou.y)

  // 绘制转角样式
  pen.lineTo(turn_p0.x, turn_p0.y)
  pen.bezierTo(turn_p1.x, turn_p1.y, turn_p2.x, turn_p2.y, turn_p3.x, turn_p3.y)
  pen.bezierTo(turn_p4.x, turn_p4.y, turn_p5.x, turn_p5.y, turn_p6.x, turn_p6.y)

  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)