const heng_length = glyph.getParam('横-长度')
const zhe_horizonalSpan = glyph.getParam('折-水平延伸')
const zhe_verticalSpan = glyph.getParam('折-竖直延伸')
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

// 横
const heng_start = new FP.Joint(
  'heng_start',
  {
    x: ox - (heng_length + wan_length) / 2,
    y: oy - zhe_verticalSpan / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: heng_start.x + heng_length,
    y: heng_start.y,
  },
)

// 折
const zhe_start = heng_end
const zhe_end = new FP.Joint(
  'zhe_end',
  {
    x: zhe_start.x - zhe_horizonalSpan,
    y: zhe_start.y + zhe_verticalSpan,
  },
)

// 弯
const wan_start = zhe_end
const wan_end = new FP.Joint(
  'wan_end',
  {
    x: wan_start.x + wan_length,
    y: wan_start.y,
  },
)

glyph.addJoint(heng_start)
glyph.addJoint(heng_end)
glyph.addJoint(zhe_start)
glyph.addJoint(zhe_end)
glyph.addJoint(wan_start)
glyph.addJoint(wan_end)

const skeloton = {
  heng_start,
  heng_end,
  zhe_start,
  zhe_end,
  wan_start,
  wan_end,
}

glyph.addRefLine(refline(heng_start, heng_end))
glyph.addRefLine(refline(zhe_start, zhe_end))
glyph.addRefLine(refline(wan_start, wan_end))