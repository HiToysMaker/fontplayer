import { describe, it, assert, vi, beforeEach, afterEach } from 'vitest'
import { genPenComponent } from '@/fontEditor/tools/pen'
import { genUUID } from '@/utils/string'

describe('pen tool', () => {
  beforeEach(() => {
    vi.mock('nanoid', () => {
      return { nanoid: () => 'xxxxxx' }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generate correct pen component', () => {
    const points = JSON.parse('[{"uuid":"H6KVuacOKld2sod4qRrYu","type":"anchor","x":183,"y":116,"origin":null,"isShow":true},{"uuid":"FjPN70Y5cjPduRVzEHr8G","type":"control","x":202.25,"y":87.65,"origin":"H6KVuacOKld2sod4qRrYu","isShow":true},{"uuid":"FfFRWBkOWAJbHZ5yhenRX","type":"control","x":253.05,"y":58.449999999999996,"origin":"7qOC_If1exPFlrkOwJVeW","isShow":true},{"uuid":"7qOC_If1exPFlrkOwJVeW","type":"anchor","x":281,"y":102,"origin":null,"isShow":true},{"uuid":"D9H4jF22zNSZXzTeIvG8k","type":"control","x":324,"y":169,"origin":"7qOC_If1exPFlrkOwJVeW","isShow":true},{"uuid":"d0wNWDOQqejnpGLetGvGa","type":"control","x":354.05,"y":214.15,"origin":"TL9E_zrb2eIjeSc1ofdWP","isShow":true},{"uuid":"TL9E_zrb2eIjeSc1ofdWP","type":"anchor","x":304,"y":233,"origin":null,"isShow":true},{"uuid":"2Iy6zIRsFyTLQ5sWz5Cen","type":"control","x":227,"y":262,"origin":"TL9E_zrb2eIjeSc1ofdWP","isShow":true},{"uuid":"gOoAWiYqAaH7wPI3z15qG","type":"control","x":225.35,"y":260.15,"origin":"HXQUQ1H36drbLzSZxWzV-","isShow":true},{"uuid":"HXQUQ1H36drbLzSZxWzV-","type":"anchor","x":200,"y":240,"origin":null,"isShow":true},{"uuid":"Fh57yjYmxnWlEEE-7Pimh","type":"control","x":161,"y":209,"origin":"HXQUQ1H36drbLzSZxWzV-","isShow":true},{"uuid":"MNCZEuXOUpeEQvMzZ-omH","type":"control","x":187.55,"y":135.5,"origin":"ZSY2soQHtlbYn5BePiDwe","isShow":true},{"uuid":"ZSY2soQHtlbYn5BePiDwe","type":"anchor","x":183,"y":116,"origin":null,"isShow":true},{"uuid":"p9ImBNEDbsGOZEFo39wDB","type":"control","x":176,"y":86,"origin":"ZSY2soQHtlbYn5BePiDwe","isShow":true}]')
    const w = 193.05
    const h = 203.55
    const x = 161
    const y = 58.449999999999996
    const closePath = true
    const pen1 = {
        uuid: genUUID(),
        type: 'pen',
        name: 'pen',
        lock: false,
        visible: true,
        value: {
          points: points,
          fillColor: '',
          strokeColor: '#000',
          closePath,
          editMode: false,
        },
        x,
        y,
        w,
        h,
        rotation: 0,
        flipX: false,
        flipY: false,
        usedInCharacter: true,
      }
    const pen2 = genPenComponent(points, closePath)
    //@ts-ignore
		delete pen2.value.preview
		//@ts-ignore
		delete pen2.value.contour
    //@ts-ignore
    assert.deepEqual(pen1, pen2)
  })
})