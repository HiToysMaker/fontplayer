const shu_horizonalSpan = glyph.getParam('竖-水平延伸')
const shu_verticalSpan = glyph.getParam('竖-竖直延伸')
const zhe_length = glyph.getParam('折-长度')
const weight = glyph.getParam('字重') || 40
const ox = 500
const oy = 500

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

// 竖
const shu_start = new FP.Joint(
  'shu_start',
  {
    x: ox - (shu_horizonalSpan + zhe_length) / 2,
    y: oy - shu_verticalSpan / 2,
  },
)
const shu_end = new FP.Joint(
  'shu_end',
  {
    x: shu_start.x + shu_horizonalSpan,
    y: shu_start.y + shu_verticalSpan,
  },
)

// 折
const zhe_start = shu_end
const zhe_end = new FP.Joint(
  'zhe_end',
  {
    x: zhe_start.x + zhe_length,
    y: zhe_start.y,
  },
)

glyph.addJoint(shu_start)
glyph.addJoint(shu_end)
glyph.addJoint(zhe_start)
glyph.addJoint(zhe_end)

const skeloton = {
  shu_start,
  shu_end,
  zhe_start,
  zhe_end,
}

glyph.addRefLine(refline(shu_start, shu_end))
glyph.addRefLine(refline(zhe_start, zhe_end))