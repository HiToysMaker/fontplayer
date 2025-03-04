const horizonalSpan = glyph.getParam('水平延伸')
const verticalSpan = glyph.getParam('竖直延伸')
const bendCursor = glyph.getParam('弯曲游标')
const bendDegree = glyph.getParam('弯曲度')
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

const start = new FP.Joint(
  'start',
  {
    x: ox - horizonalSpan / 2,
    y: oy + verticalSpan / 2,
  },
)
const end = new FP.Joint(
  'end',
  {
    x: ox + horizonalSpan / 2,
    y: oy - verticalSpan / 2,
  },
)

const length = distance(start, end)
const cursor_x = end.x - bendCursor * horizonalSpan
const cursor_y = end.y + bendCursor * verticalSpan
const angle = Math.atan2(verticalSpan, horizonalSpan)

const bend = new FP.Joint(
  'bend',
  {
    x: cursor_x + bendDegree * Math.sin(angle),
    y: cursor_y + bendDegree * Math.cos(angle),
  },
)

glyph.addJoint(start)
glyph.addJoint(end)
glyph.addJoint(bend)

const skeloton = {
  start,
  end,
  bend,
}

glyph.addRefLine(refline(start, bend))
glyph.addRefLine(refline(bend, end))