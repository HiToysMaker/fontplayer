const heng1_length = glyph.getParam('横1-长度')
const zhe1_horizonalSpan = glyph.getParam('折1-水平延伸')
const zhe1_verticalSpan = glyph.getParam('折1-竖直延伸')
const heng2_length = glyph.getParam('横2-长度')
const zhe2_horizonalSpan = glyph.getParam('折2-水平延伸')
const zhe2_verticalSpan = glyph.getParam('折2-竖直延伸')
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

// 横1
const heng1_start = new FP.Joint(
  'heng1_start',
  {
    x: ox - (heng1_length + heng2_length) / 2,
    y: oy - (zhe1_verticalSpan + zhe2_verticalSpan) / 2,
  },
)
const heng1_end = new FP.Joint(
  'heng1_end',
  {
    x: heng1_start.x + heng1_length,
    y: heng1_start.y,
  },
)

// 折1
const zhe1_start = heng1_end
const zhe1_end = new FP.Joint(
  'zhe1_end',
  {
    x: zhe1_start.x - zhe1_horizonalSpan,
    y: zhe1_start.y + zhe1_verticalSpan,
  },
)

// 横2
const heng2_start = zhe1_end
const heng2_end = new FP.Joint(
  'heng2_end',
  {
    x: heng2_start.x + heng2_length,
    y: heng2_start.y,
  },
)

// 折2
const zhe2_start = heng2_end
const zhe2_end = new FP.Joint(
  'zhe2_end',
  {
    x: zhe2_start.x - zhe2_horizonalSpan,
    y: zhe2_start.y + zhe2_verticalSpan,
  },
)

glyph.addJoint(heng1_start)
glyph.addJoint(heng1_end)
glyph.addJoint(zhe1_start)
glyph.addJoint(zhe1_end)
glyph.addJoint(heng2_start)
glyph.addJoint(heng2_end)
glyph.addJoint(zhe2_start)
glyph.addJoint(zhe2_end)

const skeloton = {
  heng1_start,
  heng1_end,
  zhe1_start,
  zhe1_end,
  heng2_start,
  heng2_end,
  zhe2_start,
  zhe2_end,
}

glyph.addRefLine(refline(heng1_start, heng1_end))
glyph.addRefLine(refline(zhe1_start, zhe1_end))
glyph.addRefLine(refline(heng2_start, heng2_end))
glyph.addRefLine(refline(zhe2_start, zhe2_end))