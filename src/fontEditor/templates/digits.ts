import { ParameterType } from "../stores/glyph"
const xHeight = 500
const ascender = 800
const capitalHeight = 750
const width = 360
const capitalWidth = 500
const descender = -200

let digits = [
  {
    name: '0',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'w1',
        value: width,
        min: 0,
        max: 1000,
        step: 1,
        default: width,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
  {
    name: '1',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'h2',
        value: capitalHeight * 0.2,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight * 0.2,
      },
      {
        name: 'w1',
        value: width / 2,
        min: 0,
        max: 1000,
        step: 1,
        default: width / 2,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
  {
    name: '2',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'h2',
        value: 150,
        min: 0,
        max: 1000,
        step: 1,
        default: 150,
      },
      {
        name: 'h3',
        value: capitalHeight * 0.5,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight * 0.5,
      },
      {
        name: 'w1',
        value: width,
        min: 0,
        max: 1000,
        step: 1,
        default: width,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
  {
    name: '3',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'h2',
        value: 150,
        min: 0,
        max: 1000,
        step: 1,
        default: 150,
      },
      {
        name: 'w1',
        value: width,
        min: 0,
        max: 1000,
        step: 1,
        default: width,
      },
      {
        name: 'w2',
        value: width * 0.6,
        min: 0,
        max: 1000,
        step: 1,
        default: width * 0.6,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
  {
    name: '4',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'h2',
        value: capitalHeight * 0.75,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight * 0.75,
      },
      {
        name: 'h3',
        value: 0,
        min: 0,
        max: 1000,
        step: 1,
        default: 0,
      },
      {
        name: 'w1',
        value: width,
        min: 0,
        max: 1000,
        step: 1,
        default: width,
      },
      {
        name: 'w2',
        value: width * 0.75,
        min: 0,
        max: 1000,
        step: 1,
        default: width * 0.75,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
  {
    name: '5',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'h2',
        value: capitalHeight * 0.45,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight * 0.45,
      },
      {
        name: 'h3',
        value: 120,
        min: 0,
        max: 1000,
        step: 1,
        default: 120,
      },
      {
        name: 'h4',
        value: 150,
        min: 0,
        max: 1000,
        step: 1,
        default: 150,
      },
      {
        name: 'w1',
        value: width,
        min: 0,
        max: 1000,
        step: 1,
        default: width,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
  {
    name: '6',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'h2',
        value: capitalHeight * 0.5,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight * 0.5,
      },
      {
        name: 'h3',
        value: 80,
        min: 0,
        max: 1000,
        step: 1,
        default: 80,
      },
      {
        name: 'w1',
        value: width,
        min: 0,
        max: 1000,
        step: 1,
        default: width,
      },
      {
        name: 'w2',
        value: width * 0.65,
        min: 0,
        max: 1000,
        step: 1,
        default: width * 0.65,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
  {
    name: '7',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'w1',
        value: width,
        min: 0,
        max: 1000,
        step: 1,
        default: width,
      },
      {
        name: 'w2',
        value: width * 0.65,
        min: 0,
        max: 1000,
        step: 1,
        default: width * 0.65,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
  {
    name: '8',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'w1',
        value: width,
        min: 0,
        max: 1000,
        step: 1,
        default: width,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
  {
    name: '9',
    params: [
      {
        name: 'h1',
        value: capitalHeight,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight,
      },
      {
        name: 'h2',
        value: capitalHeight * 0.5,
        min: 0,
        max: 1000,
        step: 1,
        default: capitalHeight * 0.5,
      },
      {
        name: 'h3',
        value: 80,
        min: 0,
        max: 1000,
        step: 1,
        default: 80,
      },
      {
        name: 'w1',
        value: width,
        min: 0,
        max: 1000,
        step: 1,
        default: width,
      },
      {
        name: 'w2',
        value: width * 0.65,
        min: 0,
        max: 1000,
        step: 1,
        default: width * 0.65,
      },
    ],
    globalParams: [
      {
        name: '字重',
        value: 40,
        min: 0,
        max: 1000,
        step: 1,
        default: 40,
      },
    ],
  },
]

digits = digits.map((digit) => {
  digit.globalParams.push({
    name: '衬线类型',
    // @ts-ignore
    type: ParameterType.Enum,
    value: 1,
    default: 1,
    options: [
      {
        value: 0,
        label: '无衬线',
      },
      {
        value: 1,
        label: '衬线类型1',
      },
    ]
  })
  digit.globalParams.push({
    name: '衬线大小',
    // @ts-ignore
    type: ParameterType.Number,
    value: 2.0,
    min: 1.0,
    max: 3.0,
    step: 0.1,
    default: 2.0,
  })
  return digit
})

export {
  digits,
}