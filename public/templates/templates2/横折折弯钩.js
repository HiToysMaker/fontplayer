const heng_length = glyph.getParam('横-长度')
const zhe1_horizonalSpan = glyph.getParam('折1-水平延伸')
const zhe1_verticalSpan = glyph.getParam('折1-竖直延伸')
const zhe2_length = glyph.getParam('折2-长度')
const wan_horizonalSpan = glyph.getParam('弯-水平延伸')
const wan_verticalSpan = glyph.getParam('弯-竖直延伸')
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

// 横
const heng_start = new FP.Joint(
  'heng_start',
  {
    x: ox - heng_length / 2,
    y: oy - (zhe1_verticalSpan + wan_verticalSpan) / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: ox + heng_length / 2,
    y: heng_start.y,
  },
)

// 折1
const zhe1_start = heng_end
const zhe1_end = new FP.Joint(
  'zhe1_end',
  {
    x: zhe1_start.x - zhe1_horizonalSpan,
    y: zhe1_start.y + zhe1_verticalSpan,
  },
)

// 折2
const zhe2_start = zhe1_end
const zhe2_end = new FP.Joint(
  'zhe2_end',
  {
    x: zhe2_start.x + zhe2_length,
    y: zhe2_start.y,
  },
)

// 弯
const wan_start = zhe2_end
const wan_end = new FP.Joint(
  'wan_end',
  {
    x: wan_start.x - wan_horizonalSpan,
    y: wan_start.y + wan_verticalSpan,
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

glyph.addJoint(heng_start)
glyph.addJoint(heng_end)
glyph.addJoint(zhe1_start)
glyph.addJoint(zhe1_end)
glyph.addJoint(zhe2_start)
glyph.addJoint(zhe2_end)
glyph.addJoint(wan_start)
glyph.addJoint(wan_end)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeloton = {
  heng_start,
  heng_end,
  zhe1_start,
  zhe1_end,
  zhe2_start,
  zhe2_end,
  wan_start,
  wan_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(heng_start, heng_end))
glyph.addRefLine(refline(zhe1_start, zhe1_end))
glyph.addRefLine(refline(zhe2_start, zhe2_end))
glyph.addRefLine(refline(wan_start, wan_end))
glyph.addRefLine(refline(gou_start, gou_end))