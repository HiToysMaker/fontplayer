const ox = 500
const oy = 500
const x0 = 600
const y0 = 250
const params = {
  shu_length: glyph.getParam('竖-长度'),
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
    case 'shu_end': {
      jointsMap['shu_end'] = {
        x: glyph.tempData['shu_end'].x,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x,
        y: glyph.tempData['pie_start'].y + deltaY,
      }
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x,
        y: glyph.tempData['pie_bend'].y + deltaY,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x,
        y: glyph.tempData['pie_end'].y + deltaY,
      }
      break
    }
    case 'pie_start': {
      jointsMap['shu_end'] = {
        x: glyph.tempData['shu_end'].x,
        y: glyph.tempData['shu_end'].y + deltaY,
      }
      jointsMap['pie_start'] = {
        x: glyph.tempData['pie_start'].x,
        y: glyph.tempData['pie_start'].y + deltaY,
      }
      jointsMap['pie_bend'] = {
        x: glyph.tempData['pie_bend'].x,
        y: glyph.tempData['pie_bend'].y + deltaY,
      }
      jointsMap['pie_end'] = {
        x: glyph.tempData['pie_end'].x,
        y: glyph.tempData['pie_end'].y + deltaY,
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
  glyph.setParam('竖-长度', _params.shu_length)
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
  const { shu_start, shu_end, pie_start, pie_bend, pie_end } = jointsMap
  const shu_length_range = glyph.getParamRange('竖-长度')
  const pie_horizonal_span_range = glyph.getParamRange('撇-水平延伸')
  const pie_vertical_span_range = glyph.getParamRange('撇-竖直延伸')
  const pie_bend_cursor_range = glyph.getParamRange('撇-弯曲游标')
  const shu_length = range(shu_end.y - shu_start.y, shu_length_range)
  const pie_horizonalSpan = range(pie_start.x - pie_end.x, pie_horizonal_span_range)
  const pie_verticalSpan = range(pie_end.y - pie_start.y, pie_vertical_span_range)
  const pie_bendCursor = range((pie_bend.y - pie_start.y) / pie_verticalSpan, pie_bend_cursor_range)
  return {
    shu_length,
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    shu_length,
    pie_horizonalSpan,
    pie_verticalSpan,
    pie_bendCursor,
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

  // 撇
  const pie_start = new FP.Joint(
    'pie_start',
    {
      x: shu_start.x,
      y: shu_start.y + shu_length,
    },
  )
  const pie_bend = new FP.Joint(
    'pie_bend',
    {
      x: pie_start.x,
      y: pie_start.y + pie_bendCursor * pie_verticalSpan,
    },
  )
  const pie_end = new FP.Joint(
    'pie_end',
    {
      x: pie_start.x - pie_horizonalSpan,
      y: pie_start.y + pie_verticalSpan,
    },
  )

  glyph.addJoint(shu_start)
  glyph.addJoint(shu_end)
  glyph.addJoint(pie_start)
  glyph.addJoint(pie_end)
  glyph.addJoint(pie_bend)

  const skeleton = {
    shu_start,
    shu_end,
    pie_start,
    pie_end,
    pie_bend,
  }

  glyph.addRefLine(refline(shu_start, shu_end))
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
    pie_start,
    pie_end,
    pie_bend,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, weight)
  const { out_pie_curves, out_pie_points, in_pie_curves, in_pie_points } = FP.getCurveContours('pie', { pie_start, pie_bend, pie_end }, weight)

  const start_length = 100
  const end_length = 80
  const d = 20
  const start_gap = 20

  const end_right_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(out_pie_curves),
    end_length,
    true,
  )
  const end_left_data = FP.getRadiusPointsOnCurve(
    FP.getCurvesPoints(in_pie_curves),
    end_length * 0.7,
    true,
  )

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

  const end_p0 = end_left_data.point
  const end_p1 = FP.goStraight(end_left_data.tangent.end, end_left_data.tangent.start, 0.7 * end_length)
  const end_p2 = FP.turnRight(end_p0, end_p1, 0.5 * d)
  const end_p3 = FP.goStraight(end_p2, end_p1, 0.5 * weight)
  const end_p10 = end_right_data.point
  const end_p9 = FP.turnRight(end_right_data.tangent.end, end_right_data.tangent.start, 0.5 * weight)
  const end_p8 = FP.turnLeft(end_p10, end_p9, 0.1 * end_length)
  const end_p7 = FP.turnLeft(end_p9, end_p8, 0.5 * weight + 0.5 * d)
  const end_p6 = FP.turnRight(end_p8, end_p7, 0.225 * end_length)
  const end_p5 = FP.goStraight(end_p7, end_p6, 0.225 * end_length)
  const end_p4 = FP.turnRight(end_p6, end_p5, 0.5 * weight + 0.5 * d)

  
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

  pen.lineTo(in_pie_curves[0].start.x, in_pie_curves[0].start.y)

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

  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)