const shu_horizonalSpan = glyph.getParam('竖-水平延伸')
const shu_verticalSpan = glyph.getParam('竖-竖直延伸')
const wan_length = glyph.getParam('弯-长度')
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
    x: ox - (shu_horizonalSpan + wan_length) / 2,
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

// 弯
const wan_start = shu_end
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

const skeloton = {
  shu_start,
  shu_end,
  wan_start,
  wan_end,
}

glyph.addRefLine(refline(shu_start, shu_end))
glyph.addRefLine(refline(wan_start, wan_end))