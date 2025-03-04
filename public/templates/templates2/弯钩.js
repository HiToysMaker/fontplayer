const wan_length = glyph.getParam('弯-长度')
const wan_bendDegree = glyph.getParam('弯-弯曲度')
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

// 弯
const wan_start = new FP.Joint(
  'wan_start',
  {
    x: ox,
    y: oy - wan_length / 2,
  },
)
const wan_end = new FP.Joint(
  'wan_end',
  {
    x: ox,
    y: wan_start.y + wan_length,
  },
)
const wan_bend = new FP.Joint(
  'wan_bend',
  {
    x: ox + wan_bendDegree,
    y: wan_start.y + wan_length / 2,
  },
)

// 钩
const gou_start = wan_end
const gou_end = new FP.Joint(
  'gou_end',
  {
    x: gou_start.x - gou_horizonalSpan,
    y: gou_start.y + gou_verticalSpan,
  },
)

glyph.addJoint(wan_start)
glyph.addJoint(wan_bend)
glyph.addJoint(wan_end)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeloton = {
  wan_start,
  wan_bend,
  wan_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(wan_start, wan_bend))
glyph.addRefLine(refline(wan_bend, wan_end))
glyph.addRefLine(refline(gou_start, gou_end))