const ox = 500
const oy = 500
const x0 = 500
const y0 = 250
const params = {
  length: glyph.getParam('长度'),
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

const getJointsMap = (data) => {
  const { draggingJoint, deltaX, deltaY } = data
  const jointsMap = Object.assign({}, glyph.tempData)
  switch (draggingJoint.name) {
    case 'end': {
      jointsMap['end'] = {
        x: glyph.tempData['end'].x,
        y: glyph.tempData['end'].y + deltaY,
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
  glyph.setParam('长度', _params.length)
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
  const { start, end } = jointsMap
  const length_range = glyph.getParamRange('长度')
  const length = range(end.y - start.y, length_range)
  return {
    length,
    skeletonRefPos: glyph.getParam('参考位置'),
  }
}

const updateGlyphByParams = (params, global_params) => {
  const {
    length,
    skeletonRefPos,
  } = params
  const { weight } = global_params

  let start, end
  const start_ref = new FP.Joint(
    'start_ref',
    {
      x: x0,
      y: y0,
    },
  )
  const end_ref = new FP.Joint(
    'end_ref',
    {
      x: start_ref.x,
      y: start_ref.y + length,
    },
  )
  if (skeletonRefPos === 1) {
    // 骨架参考位置为右侧（上侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x - weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x - weight / 2,
        y: end_ref.y,
      },
    )
  } else if (skeletonRefPos === 2) {
    // 骨架参考位置为左侧（下侧）
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x + weight / 2,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x + weight / 2,
        y: end_ref.y,
      },
    )
  } else {
    // 默认骨架参考位置，即骨架参考位置为中间实际绘制的骨架位置
    start = new FP.Joint(
      'start',
      {
        x: start_ref.x,
        y: start_ref.y,
      },
    )
    end = new FP.Joint(
      'end',
      {
        x: end_ref.x,
        y: end_ref.y,
      },
    )
  }
  glyph.addJoint(start_ref)
  glyph.addJoint(end_ref)
  glyph.addRefLine(refline(start_ref, end_ref, 'ref'))
  
  glyph.addJoint(start)
  glyph.addJoint(end)
  
  const skeleton = {
    start,
    end,
  }
  
  glyph.addRefLine(refline(start, end))

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
  const { start, end } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start: start, shu_end: end }, weight, {
    unticlockwise: true,
  })

  const start_length = 100
  const end_length = 50
  const d = 10
  const start_gap = 20

  const start_p0 = {
    x: in_shu_start.x,
    y: in_shu_start.y + start_length - start_gap,
  }
  const start_p1 = {
    x: in_shu_start.x - 2 * d,
    y: in_shu_start.y + start_length - start_gap,
  }
  const start_p2 = {
    x: in_shu_start.x - 2 * d,
    y: in_shu_start.y + 0.6 * start_length - start_gap,
  }
  const start_p3 = {
    x: in_shu_start.x - 2 * d,
    y: in_shu_start.y + 0.9 * start_length - start_gap,
  }
  const start_p4 = {
    x: in_shu_start.x + d,
    y: in_shu_start.y + 0.9 * start_length - start_gap,
  }
  const start_p5 = {
    x: in_shu_start.x,
    y: in_shu_start.y + 0.9 * start_length - start_gap,
  }
  const start_p6 = {
    x: in_shu_start.x,
    y: in_shu_start.y + 0.75 * start_length - start_gap,
  }
  const start_p7 = {
    x: in_shu_start.x,
    y: in_shu_start.y + 0.6 * start_length - start_gap,
  }
  const start_p8 = {
    x: in_shu_start.x + d,
    y: in_shu_start.y + 0.6 * start_length - start_gap,
  }
  const start_p9 = {
    x: in_shu_start.x + d,
    y: in_shu_start.y + 0.4 * start_length - start_gap,
  }
  const start_p10 = {
    x: in_shu_start.x + d,
    y: in_shu_start.y + 0.2 * start_length - start_gap,
  }
  const start_p11 = {
    x: in_shu_start.x - (0.3 * weight - d),
    y: in_shu_start.y + 0.2 * start_length - start_gap,
  }
  const start_p12 = {
    x: in_shu_start.x - (0.3 * weight - d),
    y: in_shu_start.y - start_gap,
  }
  const start_p13 = {
    x: in_shu_start.x - weight * 0.7,
    y: in_shu_start.y - start_gap,
  }
  const start_p14 = {
    x: in_shu_start.x - weight * 0.7,
    y: in_shu_start.y + 0.2 * start_length - start_gap,
  }
  const start_p15 = {
    x: out_shu_start.x,
    y: out_shu_start.y + 0.2 * start_length - start_gap,
  }
  const start_p16 = {
    x: out_shu_start.x,
    y: out_shu_start.y + 0.45 * start_length - start_gap,
  }

  const end_p0 = {
    x: out_shu_end.x,
    y: out_shu_end.y - 0.7 *end_length,
  }
  const end_p1 = {
    x: out_shu_end.x,
    y: out_shu_end.y - 0.4 * end_length,
  }
  const end_p2 = {
    x: out_shu_end.x + 0.3 * weight,
    y: out_shu_end.y - 0.4 * end_length,
  }
  const end_p3 = {
    x: out_shu_end.x + 0.6 * weight,
    y: out_shu_end.y - 0.4 * end_length,
  }
  const end_p4 = {
    x: out_shu_end.x + 0.6 * weight,
    y: out_shu_end.y - 0.7 * end_length,
  }
  const end_p5 = {
    x: out_shu_end.x + 0.6 * weight,
    y: out_shu_end.y - 1 * end_length,
  }
  const end_p6 = {
    x: out_shu_end.x + 0.3 * weight,
    y: out_shu_end.y - 1 * end_length,
  }
  const end_p7 = {
    x: out_shu_end.x + 0.8 * weight,
    y: out_shu_end.y - 1 * end_length,
  }
  const end_p8 = {
    x: out_shu_end.x + 0.8 * weight,
    y: out_shu_end.y - 0.5 * end_length,
  }
  const end_p9 = {
    x: out_shu_end.x + 0.8 * weight,
    y: out_shu_end.y,
  }
  const end_p10 = {
    x: out_shu_end.x,
    y: out_shu_end.y,
  }
  const end_p11 = {
    x: in_shu_end.x,
    y: in_shu_end.y,
  }
  const end_p12 = {
    x: in_shu_end.x,
    y: in_shu_end.y - 0.7 * end_length,
  }
  
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

  // 绘制左侧（外侧）轮廓
  pen.lineTo(end_p0.x, end_p0.y)

  // 绘制收笔样式
  pen.quadraticBezierTo(end_p1.x, end_p1.y, end_p2.x, end_p2.y)
  pen.quadraticBezierTo(end_p3.x, end_p3.y, end_p4.x, end_p4.y)
  pen.quadraticBezierTo(end_p5.x, end_p5.y, end_p6.x, end_p6.y)
  pen.quadraticBezierTo(end_p7.x, end_p7.y, end_p8.x, end_p8.y)
  pen.quadraticBezierTo(end_p9.x, end_p9.y, end_p10.x, end_p10.y)
  pen.quadraticBezierTo(end_p11.x, end_p11.y, end_p12.x, end_p12.y)

  // 绘制右侧（内侧）轮廓
  pen.lineTo(start_p0.x, start_p0.y)

  pen.closePath()
  return [ pen ]
}

updateGlyphByParams(params, global_params)