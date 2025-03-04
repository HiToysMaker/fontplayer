const length = glyph.getParam('长度')
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

const start = new FP.Joint(
  'start',
  {
    x: ox - length / 2,
    y: oy,
  },
)
const end = new FP.Joint(
  'end',
  {
    x: ox + length / 2,
    y: oy,
  },
)

glyph.addJoint(start)
glyph.addJoint(end)

const skeloton = {
  start,
  end,
}

glyph.addRefLine(refline(start, end))