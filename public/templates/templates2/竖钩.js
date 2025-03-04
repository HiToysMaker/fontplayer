const shu_length = glyph.getParam('竖-长度')
const gou_horizonalSpan = glyph.getParam('钩-水平延伸')
const gou_verticalSpan = glyph.getParam('钩-竖直延伸')
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
    x: ox,
    y: oy - shu_length / 2,
  },
)
const shu_end = new FP.Joint(
  'shu_end',
  {
    x: ox,
    y: shu_start.y + shu_length,
  },
)

// 钩
const gou_start = shu_end
const gou_end = new FP.Joint(
  'gou_end',
  {
    x: gou_start.x - gou_horizonalSpan,
    y: gou_start.y + gou_verticalSpan,
  },
)

glyph.addJoint(shu_start)
glyph.addJoint(shu_end)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeloton = {
  shu_start,
  shu_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(shu_start, shu_end))
glyph.addRefLine(refline(gou_start, gou_end))