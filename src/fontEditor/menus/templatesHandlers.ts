import {
  setImportTemplatesDialogVisible,
  tipsDialogVisible,
} from '../stores/dialogs'
import {
  files,
  addFile,
  ICharacterFile,
  IFile,
  setSelectedFileUUID,
  generateCharacterTemplate,
  addCharacterTemplate,
  addCharacterForCurrentFile,
} from '../stores/files'
import { base, loaded, tips, total } from '../stores/global'
import { genUUID } from '../../utils/string'
import { emitter } from '../Event/bus'
import {
  setEditStatus,
  maxError,
  type IPenComponent,
  Status,
  curvesComponents,
} from '../stores/font'
import { IParameter, ParameterType, addComponentsForGlyph, addGlyph, addGlyphTemplate, comp_glyphs, constants, constantsMap, getGlyphByUUID, glyphs, radical_glyphs, stroke_glyphs } from '../stores/glyph'
import { ParametersMap } from '../programming/ParametersMap'
import router from '../../router'
import { nextTick } from 'vue'
import { loading } from '../stores/global'
import { getEnName, name_data } from '../stores/settings'
import { hei_strokes, kai_strokes, li_strokes } from '../templates/strokes_1'
import { lowercaseLetters } from '../templates/lowercase_letters'
import { capitalLetters } from '../templates/capital_letters'
import { digits } from '../templates/digits'
import { strokeFnMap } from '../templates/strokeFnMap'
import { instanceGlyph, updateParameters } from './fileHandlers'
import { generateCharFile } from './toolsHandlers'
import { thumbnail } from './importHandlers'

const importTemplates = () => {
  setImportTemplatesDialogVisible(true)
}

const importTemplate2 = async (options) => {
  for (let i = 0; i < hei_strokes.length; i++) {
    loaded.value += 1
    const stroke = hei_strokes[i]
    let { name, params, uuid } = stroke
    if (!options.useDefaultUUID) {
      uuid = genUUID()
    }
    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.default,
        min: param.min || 0,
        max: param.max === 0 ? 0 : param.max || 1000,
      })
    }
    // 添加Enum参数骨架参考位置
    // 骨架参考位置用于当字重变化时，固定参考位置
    // 如果不设置骨架参考位置，当字重变化时，很可能横竖交叠处会露出棱角，变得不规则
    parameters.push({
      uuid: genUUID(),
      name: '参考位置',
      type: ParameterType.Enum,
      value: 0,
      options: [
        {
          value: 0,
          label: '默认',
        },
        {
          value: 1,
          label: '右侧（上侧）',
        },
        {
          value: 2,
          label: '左侧（下侧）',
        }
      ]
    })
    // 添加Enum参数起笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '起笔风格',
      type: ParameterType.Enum,
      value: 2,
      options: [
        {
          value: 0,
          label: '无起笔样式',
        },
        {
          value: 1,
          label: '凸笔起笔',
        },
        {
          value: 2,
          label: '凸笔圆角起笔',
        }
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '起笔数值',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
    // 添加Enum参数转角风格类型
    parameters.push({
      uuid: genUUID(),
      name: '转角风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '默认转角样式',
        },
        {
          value: 1,
          label: '转角圆滑凸起',
        }
      ]
    })
    // 添加转角数值
    parameters.push({
      uuid: genUUID(),
      name: '转角数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 2,
    })
    // 添加字重变化
    parameters.push({
      uuid: genUUID(),
      name: '字重变化',
      type: ParameterType.Number,
      value: 0,
      min: 0,
      max: 2,
    })
    // 添加弯曲程度
    parameters.push({
      uuid: genUUID(),
      name: '弯曲程度',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
    let stroke_script_res = base ? await fetch(base + `/templates/templates2/${name}.js`) : await fetch(`templates/templates2/${name}.js`)
    let stroke_script = await stroke_script_res.text()

    //const uuid = genUUID()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      style: '字玩标准黑体',
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${stroke_script}\n}`,
    }
    addGlyph(glyph, Status.StrokeGlyphList)
    addGlyphTemplate(glyph, Status.StrokeGlyphList)
  }
  emitter.emit('renderStrokeGlyphPreviewCanvas')
  setEditStatus(Status.StrokeGlyphList)
}

const importTemplate4 = async () => {
  for (let i = 0; i < hei_strokes.length; i++) {
    loaded.value += 1
    const stroke = hei_strokes[i]
    const { name, params } = stroke
    const uuid = genUUID()
    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.default,
        min: param.min || 0,
        max: param.max === 0 ? 0 : param.max || 1000,
      })
    }
    // 添加Enum参数骨架参考位置
    // 骨架参考位置用于当字重变化时，固定参考位置
    // 如果不设置骨架参考位置，当字重变化时，很可能横竖交叠处会露出棱角，变得不规则
    parameters.push({
      uuid: genUUID(),
      name: '参考位置',
      type: ParameterType.Enum,
      value: 0,
      options: [
        {
          value: 0,
          label: '默认',
        },
        {
          value: 1,
          label: '右侧（上侧）',
        },
        {
          value: 2,
          label: '左侧（下侧）',
        }
      ]
    })
    // 添加Enum参数起笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '起笔风格',
      type: ParameterType.Enum,
      value: 2,
      options: [
        {
          value: 0,
          label: '无起笔样式',
        },
        {
          value: 1,
          label: '凸笔起笔',
        },
        {
          value: 2,
          label: '凸笔圆角起笔',
        }
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '起笔数值',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
    // 添加Enum参数转角风格类型
    parameters.push({
      uuid: genUUID(),
      name: '转角风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '默认转角样式',
        },
        {
          value: 1,
          label: '转角圆滑凸起',
        }
      ]
    })
    // 添加转角数值
    parameters.push({
      uuid: genUUID(),
      name: '转角数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 2,
    })
    // 添加字重变化
    parameters.push({
      uuid: genUUID(),
      name: '字重变化',
      type: ParameterType.Number,
      value: 0,
      min: 0,
      max: 2,
    })
    // 添加弯曲程度
    parameters.push({
      uuid: genUUID(),
      name: '弯曲程度',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
    let stroke_script_res = base ? await fetch(base + `/templates/stroke_template_1/${name}.js`) : await fetch(`templates/stroke_template_1/${name}.js`)
    let stroke_script = await stroke_script_res.text()

    //const uuid = genUUID()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      style: '字玩腾云体',
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${stroke_script}\n}`,
    }
    addGlyph(glyph, Status.StrokeGlyphList)
    addGlyphTemplate(glyph, Status.StrokeGlyphList)
  }
  emitter.emit('renderStrokeGlyphPreviewCanvas')
  setEditStatus(Status.StrokeGlyphList)
}

const importTemplate5 = async () => {
  for (let i = 0; i < hei_strokes.length; i++) {
    loaded.value += 1
    const stroke = hei_strokes[i]
    const { name, params } = stroke
    const uuid = genUUID()
    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.default,
        min: param.min || 0,
        max: param.max === 0 ? 0 : param.max || 1000,
      })
    }
    parameters.push({
      uuid: genUUID(),
      name: '竖横比',
      type: ParameterType.Number,
      value: 3,
      min: 1,
      max: 5,
    })
    // 添加Enum参数骨架参考位置
    // 骨架参考位置用于当字重变化时，固定参考位置
    // 如果不设置骨架参考位置，当字重变化时，很可能横竖交叠处会露出棱角，变得不规则
    parameters.push({
      uuid: genUUID(),
      name: '参考位置',
      type: ParameterType.Enum,
      value: 0,
      options: [
        {
          value: 0,
          label: '默认',
        },
        {
          value: 1,
          label: '右侧（上侧）',
        },
        {
          value: 2,
          label: '左侧（下侧）',
        }
      ]
    })
    // 添加Enum参数起笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '起笔风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '无起笔样式',
        },
        {
          value: 1,
          label: '衬线起笔',
        }
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '起笔数值',
      type: ParameterType.Number,
      value: 2,
      min: 1,
      max: 3,
    })
    // 添加Enum参数收笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '收笔风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '无收笔样式',
        },
        {
          value: 1,
          label: '衬线收笔',
        },
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '收笔数值',
      type: ParameterType.Number,
      value: 2,
      min: 1,
      max: 3,
    })
    // 添加Enum参数转角风格类型
    parameters.push({
      uuid: genUUID(),
      name: '转角风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '默认转角样式',
        },
        {
          value: 1,
          label: '衬线转角',
        }
      ]
    })
    // 添加转角数值
    parameters.push({
      uuid: genUUID(),
      name: '转角数值',
      type: ParameterType.Number,
      value: 2,
      min: 1,
      max: 3,
    })
    // 添加字重变化
    parameters.push({
      uuid: genUUID(),
      name: '字重变化',
      type: ParameterType.Number,
      value: 0,
      min: 0,
      max: 2,
    })
    // 添加弯曲程度
    parameters.push({
      uuid: genUUID(),
      name: '弯曲程度',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
    let stroke_script_res = base ? await fetch(base + `/templates/stroke_template_song/${name}.js`) : await fetch(`templates/stroke_template_song/${name}.js`)
    let stroke_script = await stroke_script_res.text()

    //const uuid = genUUID()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      style: '字玩标准宋体',
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${stroke_script}\n}`,
    }
    addGlyph(glyph, Status.StrokeGlyphList)
    addGlyphTemplate(glyph, Status.StrokeGlyphList)
  }
  emitter.emit('renderStrokeGlyphPreviewCanvas')
  setEditStatus(Status.StrokeGlyphList)
}

const importTemplate6 = async () => {
  for (let i = 0; i < kai_strokes.length; i++) {
    loaded.value += 1
    const stroke = kai_strokes[i]
    const { name, params } = stroke
    const uuid = genUUID()
    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.name === '字重' ? 35 : param.default,
        min: param.min || 0,
        max: param.max || 1000,
      })
    }
    // 添加Enum参数骨架参考位置
    // 骨架参考位置用于当字重变化时，固定参考位置
    // 如果不设置骨架参考位置，当字重变化时，很可能横竖交叠处会露出棱角，变得不规则
    parameters.push({
      uuid: genUUID(),
      name: '参考位置',
      type: ParameterType.Enum,
      value: 0,
      options: [
        {
          value: 0,
          label: '默认',
        },
        {
          value: 1,
          label: '右侧（上侧）',
        },
        {
          value: 2,
          label: '左侧（下侧）',
        }
      ]
    })
    // 添加Enum参数起笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '起笔风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '无起笔样式',
        },
        {
          value: 1,
          label: '衬线起笔',
        }
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '起笔数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 3,
    })
    // 添加Enum参数收笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '收笔风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '无收笔样式',
        },
        {
          value: 1,
          label: '衬线收笔',
        },
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '收笔数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 3,
    })
    // 添加Enum参数转角风格类型
    parameters.push({
      uuid: genUUID(),
      name: '转角风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '默认转角样式',
        },
        {
          value: 1,
          label: '衬线转角',
        }
      ]
    })
    // 添加转角数值
    parameters.push({
      uuid: genUUID(),
      name: '转角数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 3,
    })
    // 添加字重变化
    parameters.push({
      uuid: genUUID(),
      name: '字重变化',
      type: ParameterType.Number,
      value: 0,
      min: 0,
      max: 2,
    })
    // 添加弯曲程度
    parameters.push({
      uuid: genUUID(),
      name: '弯曲程度',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
    let stroke_script_res = base ? await fetch(base + `/templates/stroke_template_fangsong/${name}.js`) : await fetch(`templates/stroke_template_fangsong/${name}.js`)
    let stroke_script = await stroke_script_res.text()

    //const uuid = genUUID()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      style: '字玩标准仿宋',
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${stroke_script}\n}`,
    }
    addGlyph(glyph, Status.StrokeGlyphList)
    addGlyphTemplate(glyph, Status.StrokeGlyphList)
  }
  emitter.emit('renderStrokeGlyphPreviewCanvas')
  setEditStatus(Status.StrokeGlyphList)
}

const importTemplate7 = async () => {
  for (let i = 0; i < kai_strokes.length; i++) {
    loaded.value += 1
    const stroke = kai_strokes[i]
    const { name, params } = stroke
    const uuid = genUUID()
    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.name === '字重' ? 60 : param.default,
        min: param.min || 0,
        max: param.max || 1000,
      })
    }
    // 添加Enum参数骨架参考位置
    // 骨架参考位置用于当字重变化时，固定参考位置
    // 如果不设置骨架参考位置，当字重变化时，很可能横竖交叠处会露出棱角，变得不规则
    parameters.push({
      uuid: genUUID(),
      name: '参考位置',
      type: ParameterType.Enum,
      value: 0,
      options: [
        {
          value: 0,
          label: '默认',
        },
        {
          value: 1,
          label: '右侧（上侧）',
        },
        {
          value: 2,
          label: '左侧（下侧）',
        }
      ]
    })
    // 添加Enum参数起笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '起笔风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '无起笔样式',
        },
        {
          value: 1,
          label: '衬线起笔',
        }
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '起笔数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 3,
    })
    // 添加Enum参数收笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '收笔风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '无收笔样式',
        },
        {
          value: 1,
          label: '衬线收笔',
        },
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '收笔数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 3,
    })
    // 添加Enum参数转角风格类型
    parameters.push({
      uuid: genUUID(),
      name: '转角风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '默认转角样式',
        },
        {
          value: 1,
          label: '衬线转角',
        }
      ]
    })
    // 添加转角数值
    parameters.push({
      uuid: genUUID(),
      name: '转角数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 3,
    })
    // 添加字重变化
    parameters.push({
      uuid: genUUID(),
      name: '字重变化',
      type: ParameterType.Number,
      value: 0,
      min: 0,
      max: 2,
    })
    // 添加弯曲程度
    parameters.push({
      uuid: genUUID(),
      name: '弯曲程度',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
    let stroke_script_res = base ? await fetch(base + `/templates/stroke_template_kai/${name}.js`) : await fetch(`templates/stroke_template_kai/${name}.js`)
    let stroke_script = await stroke_script_res.text()

    //const uuid = genUUID()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      style: '字玩标准楷体',
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${stroke_script}\n}`,
    }
    addGlyph(glyph, Status.StrokeGlyphList)
    addGlyphTemplate(glyph, Status.StrokeGlyphList)
  }
  emitter.emit('renderStrokeGlyphPreviewCanvas')
  setEditStatus(Status.StrokeGlyphList)
}

const importTemplate8 = async () => {
  for (let i = 0; i < li_strokes.length; i++) {
    loaded.value += 1
    const stroke = li_strokes[i]
    const { name, params } = stroke
    const uuid = genUUID()
    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.name === '字重' ? 35 : param.default,
        min: param.min || 0,
        max: param.max || 1000,
      })
    }
    // 添加Enum参数骨架参考位置
    // 骨架参考位置用于当字重变化时，固定参考位置
    // 如果不设置骨架参考位置，当字重变化时，很可能横竖交叠处会露出棱角，变得不规则
    parameters.push({
      uuid: genUUID(),
      name: '参考位置',
      type: ParameterType.Enum,
      value: 0,
      options: [
        {
          value: 0,
          label: '默认',
        },
        {
          value: 1,
          label: '右侧（上侧）',
        },
        {
          value: 2,
          label: '左侧（下侧）',
        }
      ]
    })
    // 添加Enum参数起笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '起笔风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '无起笔样式',
        },
        {
          value: 1,
          label: '衬线起笔',
        }
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '起笔数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 3,
    })
    // 添加Enum参数收笔风格类型
    parameters.push({
      uuid: genUUID(),
      name: '收笔风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '无收笔样式',
        },
        {
          value: 1,
          label: '衬线收笔',
        },
      ]
    })
    // 添加起笔数值
    parameters.push({
      uuid: genUUID(),
      name: '收笔数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 3,
    })
    // 添加Enum参数转角风格类型
    parameters.push({
      uuid: genUUID(),
      name: '转角风格',
      type: ParameterType.Enum,
      value: 1,
      options: [
        {
          value: 0,
          label: '默认转角样式',
        },
        {
          value: 1,
          label: '衬线转角',
        }
      ]
    })
    // 添加转角数值
    parameters.push({
      uuid: genUUID(),
      name: '转角数值',
      type: ParameterType.Number,
      value: 1,
      min: 1,
      max: 3,
    })
    // 添加字重变化
    parameters.push({
      uuid: genUUID(),
      name: '字重变化',
      type: ParameterType.Number,
      value: 0,
      min: 0,
      max: 2,
    })
    // 添加弯曲程度
    parameters.push({
      uuid: genUUID(),
      name: '弯曲程度',
      type: ParameterType.Number,
      value: 1,
      min: 0,
      max: 2,
    })
    let stroke_script_res = base ? await fetch(base + `/templates/stroke_template_li/${name}.js`) : await fetch(`templates/stroke_template_li/${name}.js`)
    let stroke_script = await stroke_script_res.text()

    //const uuid = genUUID()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      style: '字玩标准隶书',
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${stroke_script}\n}`,
    }
    addGlyph(glyph, Status.StrokeGlyphList)
    addGlyphTemplate(glyph, Status.StrokeGlyphList)
  }
  emitter.emit('renderStrokeGlyphPreviewCanvas')
  setEditStatus(Status.StrokeGlyphList)
}

const importTemplateDigits = async () => {
  for (let i = 0; i < digits.length; i++) {
    loaded.value += 1
    const digit = digits[i]
    const { name, params, globalParams } = digit
    const uuid = genUUID()
    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.default,
        min: param.min || 0,
        max: param.max || 1000,
      })
    }
    for (let j = 0; j < globalParams.length; j++) {
      const param = globalParams[j]
      // @ts-ignore
      if (param.type === ParameterType.Enum) {
        parameters.push({
          uuid: genUUID(),
          name: param.name,
          // @ts-ignore
          type: ParameterType.Enum,
          value: param.default,
          // @ts-ignore
          options: param.options,
        })
      } else {
        parameters.push({
          uuid: genUUID(),
          name: param.name,
          // @ts-ignore
          type: param.type || ParameterType.Number,
          value: param.default,
          min: param.min || 0,
          max: param.max || 1000,
        })
      }
    }
    let letter_script_res = base ? await fetch(base + `/templates/digits/${name}.js`) : await fetch(`templates/digits/${name}.js`)
    let letter_script = await letter_script_res.text()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      style: '字玩数字模板',
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${letter_script}\n}`,
    }
    addGlyph(glyph, Status.GlyphList)
    addGlyphTemplate(glyph, Status.GlyphList)
  }
  await nextTick()
  emitter.emit('renderGlyphPreviewCanvas')
  setEditStatus(Status.GlyphList)
}

const importTemplateLetters = async () => {
  for (let i = 0; i < lowercaseLetters.length; i++) {
    loaded.value += 1
    const letter = lowercaseLetters[i]
    const { name, params, globalParams } = letter
    const uuid = genUUID()
    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.default,
        min: param.min || 0,
        max: param.max || 1000,
      })
    }
    for (let j = 0; j < globalParams.length; j++) {
      const param = globalParams[j]
      // @ts-ignore
      if (param.type === ParameterType.Enum) {
        parameters.push({
          uuid: genUUID(),
          name: param.name,
          // @ts-ignore
          type: ParameterType.Enum,
          value: param.default,
          // @ts-ignore
          options: param.options,
        })
      } else {
        parameters.push({
          uuid: genUUID(),
          name: param.name,
          // @ts-ignore
          type: param.type || ParameterType.Number,
          value: param.default,
          min: param.min || 0,
          max: param.max || 1000,
        })
      }
    }
    let letter_script_res = base ? await fetch(base + `/templates/lowercase_letters/${name}.js`) : await fetch(`templates/lowercase_letters/${name}.js`)
    let letter_script = await letter_script_res.text()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      style: '字玩小写字母模板',
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${letter_script}\n}`,
    }
    addGlyph(glyph, Status.GlyphList)
    addGlyphTemplate(glyph, Status.GlyphList)
  }
  for (let i = 0; i < capitalLetters.length; i++) {
    loaded.value += 1
    const letter = capitalLetters[i]
    const { name, params, globalParams } = letter
    const uuid = genUUID()
    const parameters: Array<IParameter> = []
    for (let j = 0; j < params.length; j++) {
      const param = params[j]
      parameters.push({
        uuid: genUUID(),
        name: param.name,
        type: ParameterType.Number,
        value: param.default,
        min: param.min || 0,
        max: param.max || 1000,
      })
    }
    for (let j = 0; j < globalParams.length; j++) {
      const param = globalParams[j]
      // @ts-ignore
      if (param.type === ParameterType.Enum) {
        parameters.push({
          uuid: genUUID(),
          name: param.name,
          // @ts-ignore
          type: ParameterType.Enum,
          value: param.default,
          // @ts-ignore
          options: param.options,
        })
      } else {
        parameters.push({
          uuid: genUUID(),
          name: param.name,
          // @ts-ignore
          type: param.type || ParameterType.Number,
          value: param.default,
          min: param.min || 0,
          max: param.max || 1000,
        })
      }
    }
    let letter_script_res = base ? await fetch(base + `/templates/capital_letters/${name}.js`) : await fetch(`templates/capital_letters/${name}.js`)
    let letter_script = await letter_script_res.text()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap(parameters),
      joints: [],
      style: '字玩大写字母模板',
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t${letter_script}\n}`,
    }
    addGlyph(glyph, Status.GlyphList)
    addGlyphTemplate(glyph, Status.GlyphList)
  }
  await nextTick()
  emitter.emit('renderGlyphPreviewCanvas')
  setEditStatus(Status.GlyphList)
}

const importTemplate1 = async () => {
  if (files.value && files.value.length) {
    tips.value = '导入模板会覆盖当前工程，请关闭当前工程再导入。注意，关闭工程前请保存工程以避免数据丢失。'
    tipsDialogVisible.value = true
  } else {
    if (router.currentRoute.value.name === 'welcome') {
      router.push('/editor')
    }
    const name = '朴韵简隶'
    const file: IFile = {
      uuid: genUUID(),
      width: 1000,
      height: 1000,
      name: '朴韵简隶',
      saved: false,
      characterList: [],
      iconsCount: 0,
      fontSettings: {
        unitsPerEm: 1000,
        ascender: 800,
        descender: -200,
      }
    }
    name_data.value = [
      {
        nameID: 1,
        nameLabel: 'fontFamily',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: name,
        default: true,
      },
      {
        nameID: 1,
        nameLabel: 'fontFamily',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: getEnName(name),
        default: true,
      },
      {
        nameID: 2,
        nameLabel: 'fontSubfamily',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: '常规体',
        default: true,
      },
      {
        nameID: 2,
        nameLabel: 'fontSubfamily',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: 'Regular',
        default: true,
      },
      {
        nameID: 4,
        nameLabel: 'fullName',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: name + ' ' + '常规体',
        default: true,
      },
      {
        nameID: 4,
        nameLabel: 'fullName',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: getEnName(name) + ' ' + 'Regular',
        default: true,
      },
      {
        nameID: 5,
        nameLabel: 'version',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: '版本 1.0',
        default: true,
      },
      {
        nameID: 5,
        nameLabel: 'version',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: 'Version 1.0',
        default: true,
      },
      {
        nameID: 6,
        nameLabel: 'postScriptName',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: (getEnName(name) + '-' + 'Regular').replace(/\s/g, '').slice(0, 63),
        default: true,
      },
      {
        nameID: 6,
        nameLabel: 'postScriptName',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: (getEnName(name) + '-' + 'Regular').replace(/\s/g, '').slice(0, 63),
        default: true,
      }
    ]
    addFile(file)
    setSelectedFileUUID(file.uuid)
    setEditStatus(Status.CharacterList)
    total.value = 0
    loading.value = true
    let charRes = base ? await fetch(base + '/templates/template1.json') : await fetch('templates/template1.json')
    let charData = await charRes.text()
    console.time('timer1')
    let res = base ? await fetch(base + '/glyphs/stroke_glyphs_data_v7_v4.json') : await fetch('glyphs/stroke_glyphs_data_v7_v4.json')
    let data = await res.text()
    if (data) {
      const obj = JSON.parse(data)
      for (let n = 0; n < obj.constants.length; n++) {
        if (!constantsMap.getByUUID(obj.constants[n].uuid)) {
          constants.value.push(obj.constants[n])
        }
      }
      let plainGlyphs = obj.glyphs
      let _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph, {
        updateContoursAndPreview: true,
        unitsPerEm: 1000,
        descender: -200,
        advanceWidth: 1000,
      }))
      _glyphs.map((glyph) => {
        addGlyph(glyph, Status.StrokeGlyphList)
      })
    }
  
    res = base ? await fetch(base + '/glyphs/radical_glyphs_data_v7_v5.json') : await fetch('glyphs/radical_glyphs_data_v7_v5.json')
    data = await res.text()
    if (data) {
      const obj = JSON.parse(data)
      for (let n = 0; n < obj.constants.length; n++) {
        if (!constantsMap.getByUUID(obj.constants[n].uuid)) {
          constants.value.push(obj.constants[n])
        }
      }
      let plainGlyphs = obj.glyphs
      let _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph, {
        updateContoursAndPreview: true,
        unitsPerEm: 1000,
        descender: -200,
        advanceWidth: 1000,
      }))
      _glyphs.map((glyph) => {
        addGlyph(glyph, Status.RadicalGlyphList)
      })
    }

    res = base ? await fetch(base + '/glyphs/comp_glyphs_data_v7_v4.json') : await fetch('glyphs/comp_glyphs_data_v7_v4.json')
    data = await res.text()
    if (data) {
      const obj = JSON.parse(data)
      for (let n = 0; n < obj.constants.length; n++) {
        if (!constantsMap.getByUUID(obj.constants[n].uuid)) {
          constants.value.push(obj.constants[n])
        }
      }
      let plainGlyphs = obj.glyphs
      let _glyphs = plainGlyphs.map((plainGlyph) => instanceGlyph(plainGlyph, {
        updateContoursAndPreview: true,
        unitsPerEm: 1000,
        descender: -200,
        advanceWidth: 1000,
      }))
      _glyphs.map((glyph) => {
        addGlyph(glyph, Status.CompGlyphList)
      })
    }

    console.timeEnd('timer1')
    // loading.value = false
  
    let charObj = null
    if (charData) {
      charObj = JSON.parse(charData)
    }
  
    const charLength = charObj ? charObj.template.length : 0
    total.value = charLength + (glyphs.value.length + stroke_glyphs.value.length + radical_glyphs.value.length + comp_glyphs.value.length) * 2
    loaded.value = 0
  
    if (charObj) {
      for (let n = 0; n < charObj.template.length; n++) {
        loaded.value += 1
        const charInfo = charObj.template[n]
        const charInfo2 = parseLayout(charInfo)
        const charFile: ICharacterFile = generateCharFile(charInfo2)
        addCharacterForCurrentFile(charFile)
        addCharacterTemplate(generateCharacterTemplate(charFile))
        emitter.emit('renderPreviewCanvasByUUID', charFile.uuid)
      }
    }
  
    stroke_glyphs.value.map((glyph) => {
      addGlyphTemplate(glyph, Status.StrokeGlyphList)
    })
    radical_glyphs.value.map((glyph) => {
      addGlyphTemplate(glyph, Status.RadicalGlyphList)
    })
    comp_glyphs.value.map((glyph) => {
      addGlyphTemplate(glyph, Status.CompGlyphList)
    })
    glyphs.value.map((glyph) => {
      addGlyphTemplate(glyph, Status.GlyphList)
    })
  
    emitter.emit('renderPreviewCanvas')
    emitter.emit('renderGlyphPreviewCanvas')
    emitter.emit('renderStrokeGlyphPreviewCanvas')
    emitter.emit('renderRadicalGlyphPreviewCanvas')
    emitter.emit('renderCompGlyphPreviewCanvas')
  }
}

const importTemplate3 = async () => {
  loaded.value = 0
  total.value = hei_strokes.length
  loading.value = true
  const uuids = []
  // 新建32个笔画
  for (let i = 0; i < hei_strokes.length; i++) {
    const stroke = hei_strokes[i]
    const { name } = stroke

    const uuid = genUUID()
    const glyph = {
      uuid,
      type: 'system',
      name,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap([]),
      joints: [],
      style: '测试手绘风格',
      script: '',
    }
    uuids.push({
      uuid,
      name,
    })
    addGlyph(glyph, Status.StrokeGlyphList)
    addGlyphTemplate(glyph, Status.StrokeGlyphList)
  }

  // 识别手绘图片
  for (let i = 0; i < uuids.length; i++) {
    const { uuid, name } = uuids[i]
    // 识别手绘笔画图片，并生成笔画字形
    try {
      const response = await fetch(`/strokes/${name}.png`);
      const blob = await response.blob();
      
      // 转换为 Image 对象用于 Canvas 渲染
      await new Promise((resolve, reject) => {
        const img = new Image();
        const data = URL.createObjectURL(blob);
        img.onload = () => {
          maxError.value = 5
          thumbnail(data, img, 1000)
          const components = []
          for (let i = 0; i < curvesComponents.value.length; i++) {
            const component = curvesComponents.value[i]
            const points = (component.value as unknown as IPenComponent).points
            let totalLength = 0
            let lastPoint = points[0]
            for (let j = 1; j < points.length; j++) {
              const point = points[j]
              totalLength += Math.sqrt(Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2))
              lastPoint = point
            }
            if (totalLength > 200) {
              components.push(component)
            }
          }
          addComponentsForGlyph(uuid, components)
          maxError.value = 2
          resolve(img);
        }
        img.onerror = reject;
        img.src = data;
      });
    } catch (error) {
      console.error('Failed to fetch font image:', error);
      throw error;
    }

    loaded.value++
    if (loaded.value >= total.value) {
      loading.value = false
      loaded.value = 0
      total.value = 0
    }
    // emitter.emit('renderStrokeGlyphPreviewCanvasByUUID', uuid)
  }

  for (let i = 0; i < uuids.length; i++) {
    const { uuid, name } = uuids[i]
    const strokeGlyph = getGlyphByUUID(uuid)
    // 绑定骨架
    const type = name
    const skeleton = {
      type,
      ox: 0,
      oy: 0,
      dynamicWeight: false,
    }
    strokeGlyph.skeleton = skeleton

    // 根据骨架设置字形参数
    const stroke = hei_strokes.find((stroke) => stroke.name === type)
    if (stroke) {
      const parameters = strokeGlyph.parameters.parameters
      for (let j = 0; j < stroke.params.length; j++) {
        const param = stroke.params[j]
        parameters.push({
          uuid: genUUID(),
          name: param.name,
          type: ParameterType.Number,
          value: param.default,
          min: param.min || 0,
          max: param.max || 1000,
        })
      }
      parameters.push({
        uuid: genUUID(),
        name: '参考位置',
        type: ParameterType.Enum,
        value: 0,
        options: [
          {
            value: 0,
            label: '默认',
          },
          {
            value: 1,
            label: '右侧（上侧）',
          },
          {
            value: 2,
            label: '左侧（下侧）',
          }
        ]
      })
      // 添加弯曲程度参数
      parameters.push({
        uuid: genUUID(),
        name: '弯曲程度',
        type: ParameterType.Number,
        value: 1,
        min: 0,
        max: 2,
      })
    }
    const strokeFn = strokeFnMap[type]
    strokeFn && strokeFn.instanceBasicGlyph(strokeGlyph)
    strokeFn.bindSkeletonGlyph(strokeGlyph)
    strokeFn.updateSkeletonListenerAfterBind(strokeGlyph._o)
    emitter.emit('renderStrokeGlyphPreviewCanvasByUUID', uuid)
  }

  loading.value = false

  // emitter.emit('renderStrokeGlyphPreviewCanvas')
  setEditStatus(Status.StrokeGlyphList)
}

const parseLayout = (info) => {
  const { char, layout, data } = info
  if (layout === '左右') {
    const cursor = data.indexOf('右')
    const part1 = data.slice(2, cursor - 1)
    const part2 = data.slice(cursor + 2, data.length - 1)
    return {
      name: char,
      layout,
      left: parseData(part1),
      right: parseData(part2),
    }
  }
  return {
    name: char,
    layout,
  }
}

const parseData = (data) => {
  const arr = data.split(',')
  const glyph_name = arr[0]
  const x = Number(arr[1])
  const y = Number(arr[2])
  const w = Number(arr[3])
  const h = Number(arr[4])
  return {
    glyph_name,
    x,
    y,
    w,
    h,
  }
}

export {
  importTemplates,
  importTemplate1,
  importTemplate2,
  importTemplate3,
  importTemplate4,
  importTemplate5,
  importTemplate6,
  importTemplate7,
  importTemplate8,
  importTemplateDigits,
  importTemplateLetters,
}