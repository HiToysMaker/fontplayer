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
    y: oy - verticalSpan / 2,
  },
)
const end = new FP.Joint(
  'end',
  {
    x: ox + horizonalSpan / 2,
    y: oy + verticalSpan / 2,
  },
)

const bend = new FP.Joint(
  'bend',
  {
    x: start.x + horizonalSpan * bendCursor,
    y: start.y + bendDegree,
  },
)

glyph.addJoint(start)
glyph.addJoint(end)
glyph.addJoint(bend)

const skeloton = {
  start,
  bend,
  end,
}

glyph.addRefLine(refline(start, bend))
glyph.addRefLine(refline(bend, end))