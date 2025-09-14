const ox = 500
const oy = 500
const x0 = 390
const y0 = 185
const params = {
  heng_length: glyph.getParam('横-长度'),
  zhe1_horizonalSpan: glyph.getParam('折1-水平延伸'),
  zhe1_verticalSpan: glyph.getParam('折1-竖直延伸'),
  zhe2_length: glyph.getParam('折2-长度'),
  pie_horizonalSpan: glyph.getParam('撇-水平延伸'),
  pie_verticalSpan: glyph.getParam('撇-竖直延伸'),
  pie_bendCursor: glyph.getParam('撇-弯曲游标'),
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
      jointsMap['zhe1_start'] = {
        x: glyph.tempData['zhe1_start'].x + deltaX,
        y: glyph.tempData['zhe1_start'].y,
      }
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
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y,
      }
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x + deltaX,
        y: glyph.tempData['pie_bend'].y,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y,
      }
      break
    }
    case 'zhe1_start': {
      jointsMap['heng_end'] = {
        x: glyph.tempData['heng_end'].x + deltaX,
        y: glyph.tempData['heng_end'].y,
      }
      jointsMap['zhe1_start'] = {
        x: glyph.tempData['zhe1_start'].x + deltaX,
        y: glyph.tempData['zhe1_start'].y,
      }
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
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y,
      }
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x + deltaX,
        y: glyph.tempData['pie_bend'].y,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y,
      }
      break
    }
    case 'zhe1_end': {
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x + deltaX,
        y: glyph.tempData['zhe1_end'].y + deltaY,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y + deltaY,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y + deltaY,
      }
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y + deltaY,
      }
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x + deltaX,
        y: glyph.tempData['pie_bend'].y + deltaY,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      break
    }
    case 'zhe2_start': {
      jointsMap['zhe1_end'] = {
        x: glyph.tempData['zhe1_end'].x + deltaX,
        y: glyph.tempData['zhe1_end'].y + deltaY,
      }
      jointsMap['zhe2_start'] = {
        x: glyph.tempData['zhe2_start'].x + deltaX,
        y: glyph.tempData['zhe2_start'].y + deltaY,
      }
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y + deltaY,
      }
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y + deltaY,
      }
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x + deltaX,
        y: glyph.tempData['pie_bend'].y + deltaY,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      break
    }
    case 'zhe2_end': {
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y,
      }
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y,
      }
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x + deltaX,
        y: glyph.tempData['pie_bend'].y,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y,
      }
      break
    }
    case 'pie_start': {
      jointsMap['zhe2_end'] = {
        x: glyph.tempData['zhe2_end'].x + deltaX,
        y: glyph.tempData['zhe2_end'].y,
      }
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x + deltaX,
        y: glyph.tempData['pie_start'].y,
      }
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x + deltaX,
        y: glyph.tempData['pie_bend'].y,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y,
      }
      break
    }
    case 'pie_bend': {
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x,
        y: glyph.tempData['pie_bend'].y + deltaY,
      }
      break
    }
    case 'pie_end': {
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x + deltaX,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      const newBend = getBend(jointsMap['pie_start'], jointsMap['pie_end'])
      jointsMap['pie_bend'] = {
        x: newBend.x,
        y: newBend.y,
      }
      break
    }
  }
  return jointsMap
}

const getBend = (start, end) => {
  // 改变撇end的情况下，不会改变弯曲游标，所以依据现有参数计算新的bend
  const { pie_bendCursor } = params
  const verticalSpan = Math.abs(end.y - start.y)

  const bend = {
    x: start.x,
    y: start.y + pie_bendCursor * verticalSpan,
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
  glyph.setParam('折1-水平延伸', _params.zhe1_horizonalSpan)
  glyph.setParam('折1-竖直延伸', _params.zhe1_verticalSpan)
  glyph.setParam('折2-长度', _params.zhe2_length)
  glyph.setParam('撇-水平延伸', _params.pie_horizonalSpan)
  glyph.setParam('撇-竖直延伸', _params.pie_verticalSpan)
  glyph.setParam('撇-弯曲游标', _params.pie_bendCursor)
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
  const { heng_start, heng_end, zhe1_start, zhe1_end, zhe2_start, zhe2_end, pie_start, pie_bend, pie_end } = jointsMap
  const heng_length_range = glyph.getParamRange('横-长度')
  const zhe1_horizonal_span_range = glyph.getParamRange('折1-水平延伸')
  const zhe1_vertical_span_range = glyph.getParamRange('折1-竖直延伸')
  const zhe2_length_range = glyph.getParamRange('折2-长度')
  const pie_horizonal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const pie_bend_cursor_range = glyph.getParamRange('撇-弯曲游标')
  const heng_length = range(heng_end.x - heng_start.x, heng_length_range)
  const zhe1_horizonalSpan = range(zhe1_start.x - zhe1_end.x, zhe1_horizonal_span_range)
  const zhe1_verticalSpan = range(zhe1_end.y - zhe1_start.y, zhe1_vertical_span_range)
  const zhe2_length = range(zhe2_end.x - zhe2_start.x, zhe2_length_range)
  const pie_horizonalSpan = range(pie_start.x - pie_end.x, pie_horizonal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const pie_bendCursor = range((pie_bend.y - pie_start.y) / pie_verticalSpan, pie_bend_cursor_range)
  return {
    heng_length,
    zhe1_horizonalSpan,
    zhe1_verticalSpan,
    zhe2_length,
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    heng_length,
    zhe1_horizonalSpan,
    zhe1_verticalSpan,
    zhe2_length,
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
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

  // 折1
  const zhe1_start = new FP.Joint(
    'zhe1_start',
    {
      x: heng_start.x + heng_length,
      y: heng_start.y,
    },
  )
  const zhe1_end = new FP.Joint(
    'zhe1_end',
    {
      x: zhe1_start.x - zhe1_horizonalSpan,
      y: zhe1_start.y + zhe1_verticalSpan,
    },
  )

  // 折2
  const zhe2_start = new FP.Joint(
    'zhe2_start',
    {
      x: zhe1_start.x - zhe1_horizonalSpan,
      y: zhe1_start.y + zhe1_verticalSpan,
    },
  )
  const zhe2_end = new FP.Joint(
    'zhe2_end',
    {
      x: zhe2_start.x + zhe2_length,
      y: zhe2_start.y,
    },
  )

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: zhe2_start.x + zhe2_length,
      y: zhe2_start.y,
    },
  )
  const pie_end = new FP.Joint(
    'pie_end',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  const pie_bend = new FP.Joint(
    'pie_bend',
    {
      x: pie_start.x,
      y: pie_start.y + pie_bendCursor * pie_verticalSpan,
    },
  )

  glyph.addJoint(heng_start)
  glyph.addJoint(heng_end)
  glyph.addJoint(zhe1_start)
  glyph.addJoint(zhe1_end)
  glyph.addJoint(zhe2_start)
  glyph.addJoint(zhe2_end)
  glyph.addJoint(pie_start)
  glyph.addJoint(pie_end)
  glyph.addJoint(pie_bend)

  const skeleton = {
    heng_start,
    heng_end,
    zhe1_start,
    zhe1_end,
    zhe2_start,
    zhe2_end,
    pie_start,
    pie_end,
    pie_bend,
  }

  glyph.addRefLine(refline(heng_start, heng_end))
  glyph.addRefLine(refline(zhe1_start, zhe1_end))
  glyph.addRefLine(refline(zhe2_start, zhe2_end))
  glyph.addRefLine(refline(pie_start, pie_bend))
  glyph.addRefLine(refline(pie_bend, pie_end))

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
    zhe1_start,
    zhe1_end,
    zhe2_start,
    zhe2_end,
    pie_start,
    pie_end,
    pie_bend,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, weight)
  const { out_zhe1_start, out_zhe1_end, in_zhe1_start, in_zhe1_end } = FP.getLineContours('zhe1', { zhe1_start, zhe1_end }, weight)
  const { out_zhe2_start, out_zhe2_end, in_zhe2_start, in_zhe2_end } = FP.getLineContours('zhe2', { zhe2_start, zhe2_end }, weight)
  const { out_pie_curves, out_pie_points, in_pie_curves, in_pie_points } = FP.getCurveContours('pie', { pie_start, pie_bend, pie_end }, weight, {
    weightsVariation: 'pow',
    weightsVariationDir: 'reverse',
    weightsVariationPower: weights_variation_power,
  })
  const { corner: in_corner_heng_zhe1 } = FP.getIntersection(
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: in_heng_start, end: in_heng_end }
  )
  const { corner: out_corner_heng_zhe1 } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: out_heng_start, end: out_heng_end }
  )
  const { corner: in_corner_1_zhe1_zhe2 } = FP.getIntersection(
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end }
  )
  const in_corner_2_zhe1_zhe2 = {
    x: in_corner_1_zhe1_zhe2.x,
    y: in_corner_1_zhe1_zhe2.y + weight
  }
  const { corner: out_corner_zhe1_zhe2 } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: out_zhe1_end },
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end }
  )
  const { corner: in_corner_zhe2_pie, corner_index: in_corner_index_zhe2_pie } = FP.getIntersection(
    { type: 'line', start: in_zhe2_start, end: in_zhe2_end },
    { type: 'curve', points: in_pie_points }
  )
  const { corner: out_corner_zhe2_pie, corner_index: out_corner_index_zhe2_pie } = FP.getIntersection(
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end },
    { type: 'line', start: out_pie_curves[0].start, end: out_pie_curves[0].control1 }
  )
  let { curves: out_pie_curves_final } = FP.fitCurvesByPoints(out_pie_points.slice(out_corner_index_zhe2_pie))
  let { curves: in_pie_curves_final } = FP.fitCurvesByPoints(in_pie_points.slice(in_corner_index_zhe2_pie))
  const { corner: out_corner_heng_zhe1_down } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: in_heng_start, end: in_heng_end }
  )
  const out_corner_heng_zhe1_up = {
    x: out_corner_heng_zhe1_down.x,
    y: out_corner_heng_zhe1_down.y - weight,
  }

  let turn_data_heng_zhe1 = {}
  let turn_data_zhe2_pie = {}
  if (turn_style_type === 1) {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    {
      const turn_length = 20 * turn_style_value
      const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_heng_start, out_corner_heng_zhe1, out_zhe1_end)
      const inner_corner_length = weight
      const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
      const turn_control_1 = {
        x: out_corner_heng_zhe1.x - corner_radius,
        y: out_corner_heng_zhe1.y,
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
        start: out_corner_heng_zhe1,
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
      turn_data_heng_zhe1 = {
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
      const inner_angle = Math.PI / 2
      const mid_angle = Math.PI / 4
      const inner_corner_length = weight
      const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
      const turn_control_1 = {
        x: out_corner_zhe2_pie.x - corner_radius,
        y: out_corner_zhe2_pie.y,
      }
      const turn_start_1 = {
        x: turn_control_1.x - corner_radius,
        y: turn_control_1.y,
      }
      const turn_end_1 = {
        x: turn_control_1.x + turn_length * Math.cos(mid_angle),
        y: turn_control_1.y - turn_length * Math.sin(mid_angle),
      }
      const turn_control_2_data = FP.getRadiusPointsOnCurve(
        FP.getCurvesPoints(out_pie_curves_final),
        corner_radius - weight / 2,
      )
      const turn_control_2 = turn_control_2_data.point
      const turn_start_2_data = FP.getRadiusPointsOnCurve(
        FP.getCurvesPoints(turn_control_2_data.final_curves),
        corner_radius,
      )
      const turn_start_2 = turn_start_2_data.point
      const turn_end_2 = {
        x: turn_control_2.x + turn_length * Math.cos(mid_angle),
        y: turn_control_2.y - turn_length * Math.sin(mid_angle),
      }
      out_pie_curves_final = turn_start_2_data.final_curves
      turn_data_zhe2_pie = {
        turn_start_1,
        turn_control_1,
        turn_end_1,
        turn_start_2,
        turn_control_2,
        turn_end_2,
      }
    }
  }

  const start_length = 60
  const end_length = 80
  const d = 20
  const turn_ratio = 0.85
  const turn_radius = 40

  const end_right_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_pie_curves_final),
    end_length,
    true,
  )
  const end_left_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_pie_curves_final),
    end_length * 0.7,
    true,
  )

  const start_p10 = FP.getPointOnLine(out_heng_start, out_heng_end, start_length)
  const start_p9 = FP.turnLeft(out_heng_end, start_p10, 2 * d)
  const start_p8 = FP.turnRight(start_p10, start_p9, 0.3 * start_length)
  const start_p7 = FP.turnRight(start_p10, start_p9, 0.15 * start_length)
  const start_p6 = FP.turnRight(start_p9, start_p7, 0.9 * d)
  const start_p5 = FP.goStraight(start_p7, start_p6, 1.3 * d)
  const start_p4 = FP.turnLeft(start_p6, start_p5, 0.425 * start_length)
  const start_p3 = FP.goStraight(start_p5, start_p4, 0.425 * start_length)
  const start_p2 = FP.turnLeft(start_p4, start_p3, 1.3 * d)
  const start_p1 = in_heng_start
  const start_p0 = FP.turnLeft(start_p2, start_p1, 0.45 * start_length)

  const turn_1_p6 = turn_data_heng_zhe1.turn_control_1
  const turn_1_p3 = FP.getPointOnLineByPercentage(turn_data_heng_zhe1.turn_end_1, turn_data_heng_zhe1.turn_end_2, turn_ratio)
  const turn_1_p5 = FP.turnRight(turn_1_p3, turn_1_p6, d * 1.5)
  const turn_1_p4 = FP.turnLeft(turn_1_p6, turn_1_p3, d * 1.5)
  const turn_1_p0 = turn_data_heng_zhe1.turn_control_2
  const turn_1_p2 = FP.turnRight(turn_1_p0, turn_1_p3, d * 0.75)
  const turn_1_p1 = FP.turnLeft(turn_1_p3, turn_1_p0, d * 0.75)

  const turn_2_p6 = turn_data_zhe2_pie.turn_control_1
  const turn_2_p3 = FP.getPointOnLineByPercentage(turn_data_zhe2_pie.turn_end_1, turn_data_zhe2_pie.turn_end_2, turn_ratio)
  const turn_2_p5 = FP.turnRight(turn_2_p3, turn_2_p6, d * 1.5)
  const turn_2_p4 = FP.turnLeft(turn_2_p6, turn_2_p3, d * 1.5)
  const turn_2_p0 = turn_data_zhe2_pie.turn_control_2
  const turn_2_p2 = FP.turnRight(turn_2_p0, turn_2_p3, d * 0.75)
  const turn_2_p1 = FP.turnLeft(turn_2_p3, turn_2_p0, d * 0.75)

  const end_p0 = end_left_data.point
  const end_p1 = FP.goStraight(end_left_data.tangent.end, end_left_data.tangent.start, 0.7 * end_length)
  const end_p2 = FP.turnRight(end_p0, end_p1, d * 0.5)
  const end_p3 = FP.goStraight(end_p2, end_p1, 0.5 * weight)
  const end_p10 = end_right_data.point
  const end_p9 = FP.turnRight(end_right_data.tangent.end, end_right_data.tangent.start, 0.5 * weight)
  const end_p8 = FP.turnLeft(end_p10, end_p9, 0.1 * end_length)
  const end_p7 = FP.turnLeft(end_p9, end_p8, 0.5 * weight + d * 0.5)
  const end_p6 = FP.turnRight(end_p8, end_p7, 0.225 * end_length)
  const end_p5 = FP.goStraight(end_p7, end_p6, 0.225 * end_length)
  const end_p4 = FP.turnRight(end_p6, end_p5, 0.5 * weight + d * 0.5)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 按逆时针方向绘制轮廓
  // 绘制起笔样式
  pen.moveTo(start_p10.x, start_p10.y)
  pen.quadraticBezierTo(start_p9.x, start_p9.y, start_p8.x, start_p8.y)
  pen.quadraticBezierTo(start_p7.x, start_p7.y, start_p6.x, start_p6.y)
  pen.quadraticBezierTo(start_p5.x, start_p5.y, start_p4.x, start_p4.y)
  pen.quadraticBezierTo(start_p3.x, start_p3.y, start_p2.x, start_p2.y)
  pen.quadraticBezierTo(start_p1.x, start_p1.y, start_p0.x, start_p0.y)

  pen.lineTo(in_corner_heng_zhe1.x, in_corner_heng_zhe1.y)
  pen.lineTo(in_corner_1_zhe1_zhe2.x, in_corner_1_zhe1_zhe2.y)
  pen.lineTo(in_corner_2_zhe1_zhe2.x, in_corner_2_zhe1_zhe2.y)
  pen.lineTo(
    end_left_data.final_curves[end_left_data.final_curves.length - 1].start.x,
    end_left_data.final_curves[end_left_data.final_curves.length - 1].start.y,
  )
  for (let i = end_left_data.final_curves.length - 1; i >= 0; i--) {
    const curve = end_left_data.final_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制收笔样式
  pen.lineTo(end_p0.x, end_p0.y)
  pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2.x, end_p2.y)
  pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p4.x, end_p4.y)
  pen.quadraticBezierTo(end_p5.x, end_p5.y, end_p6.x, end_p6.y)
  pen.quadraticBezierTo(end_p7.x, end_p7.y, end_p8.x, end_p8.y)
  pen.quadraticBezierTo(end_p9.x, end_p9.y, end_p10.x, end_p10.y)

  for (let i = 0; i < end_right_data.final_curves.length; i++) {
    const curve = end_right_data.final_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  // 绘制转角样式
  pen.lineTo(turn_2_p0.x, turn_2_p0.y)
  pen.bezierTo(turn_2_p1.x, turn_2_p1.y, turn_2_p2.x, turn_2_p2.y, turn_2_p3.x, turn_2_p3.y)
  pen.bezierTo(turn_2_p4.x, turn_2_p4.y, turn_2_p5.x, turn_2_p5.y, turn_2_p6.x, turn_2_p6.y)

  pen.lineTo(out_corner_zhe1_zhe2.x, out_corner_zhe1_zhe2.y)

  // 绘制转角样式
  pen.lineTo(turn_1_p0.x, turn_1_p0.y)
  pen.bezierTo(turn_1_p1.x, turn_1_p1.y, turn_1_p2.x, turn_1_p2.y, turn_1_p3.x, turn_1_p3.y)
  pen.bezierTo(turn_1_p4.x, turn_1_p4.y, turn_1_p5.x, turn_1_p5.y, turn_1_p6.x, turn_1_p6.y)

  pen.lineTo(start_p10.x, start_p10.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)