<script setup lang="ts">
import { computed, ref } from 'vue'
import { validators } from '../../../../fontManager/validators'
import { os2_data as data } from '../../../stores/settings'
import { useI18n } from 'vue-i18n'
const { locale } = useI18n()

const validMap = ref({
  version: {
    valid: true,
    tip: '',
  },
  usWeightClass: {
    valid: true,
    tip: '',
  },
  usWidthClass: {
    valid: true,
    tip: '',
  },
  fsType: {
    valid: true,
    tip: '',
  },
  ySubscriptXSize: {
    valid: true,
    tip: '',
  },
  ySubscriptYSize: {
    valid: true,
    tip: '',
  },
  ySubscriptXOffset: {
    valid: true,
    tip: '',
  },
  ySubscriptYOffset: {
    valid: true,
    tip: '',
  },
  ySuperscriptXSize: {
    valid: true,
    tip: '',
  },
  ySuperscriptYSize: {
    valid: true,
    tip: '',
  },
  ySuperscriptXOffset: {
    valid: true,
    tip: '',
  },
  ySuperscriptYOffset: {
    valid: true,
    tip: '',
  },
  yStrikeoutSize: {
    valid: true,
    tip: '',
  },
  yStrikeoutPosition: {
    valid: true,
    tip: '',
  },
  sFamilyClass: {
    valid: true,
    tip: '',
  },
  achVendID: {
    valid: true,
    tip: '',
  },
  // usDefaultChar: hasChar(font, ' ') ? 32 : 0,
  // usBreakChar: hasChar(font, ' ') ? 32 : 0,
  usMaxContext: {
    valid: true,
    tip: '',
  },
  usLowerOpticalPointSize: {
    valid: true,
    tip: '',
  },
  usUpperOpticalPointSize: {
    valid: true,
    tip: '',
  },
})

const onChange = (key, value) => {
  switch(key) {
    case 'version': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为uint16'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: uint16 required'
        }
      }
      validMap.value.version.valid = valid
      validMap.value.version.tip = tip
      break
    }
    case 'usWeightClass': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为uint16'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: uint16 required'
        }
      }
      validMap.value.usWeightClass.valid = valid
      validMap.value.usWeightClass.tip = tip
      break
    }
    case 'usWidthClass': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为uint16'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: uint16 required'
        }
      }
      validMap.value.usWidthClass.valid = valid
      validMap.value.usWidthClass.tip = tip
      break
    }
    case 'fsType': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误'
        } else if (locale.value === 'en') {
          tip = 'Invalid format'
        }
      }
      validMap.value.fsType.valid = valid
      validMap.value.fsType.tip = tip
      break
    }
    case 'ySubscriptXSize': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.ySubscriptXSize.valid = valid
      validMap.value.ySubscriptXSize.tip = tip
      break
    }
    case 'ySubscriptYSize': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.ySubscriptYSize.valid = valid
      validMap.value.ySubscriptYSize.tip = tip
      break
    }
    case 'ySubscriptXOffset': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.ySubscriptXOffset.valid = valid
      validMap.value.ySubscriptXOffset.tip = tip
      break
    }
    case 'ySubscriptYOffset': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.ySubscriptYOffset.valid = valid
      validMap.value.ySubscriptYOffset.tip = tip
      break
    }
    case 'ySuperscriptXSize': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.ySuperscriptXSize.valid = valid
      validMap.value.ySuperscriptXSize.tip = tip
      break
    }
    case 'ySuperscriptYSize': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.ySuperscriptYSize.valid = valid
      validMap.value.ySuperscriptYSize.tip = tip
      break
    }
    case 'ySuperscriptXOffset': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.ySuperscriptXOffset.valid = valid
      validMap.value.ySuperscriptXOffset.tip = tip
      break
    }
    case 'ySuperscriptYOffset': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.ySuperscriptXOffset.valid = valid
      validMap.value.ySuperscriptYOffset.tip = tip
      break
    }
    case 'yStrikeoutSize': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.yStrikeoutSize.valid = valid
      validMap.value.yStrikeoutSize.tip = tip
      break
    }
    case 'yStrikeoutPosition': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为FWORD'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: FWORD required'
        }
      }
      validMap.value.yStrikeoutPosition.valid = valid
      validMap.value.yStrikeoutPosition.tip = tip
      break
    }
    case 'sFamilyClass': {
      const valid = validators.int16(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为int16'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: int16 required'
        }
      }
      validMap.value.sFamilyClass.valid = valid
      validMap.value.sFamilyClass.tip = tip
      break
    }
    case 'achVendID': {
      const valid = validators.Tag(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为Tag achVendID'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: Tag achVendID required'
        }
      }
      validMap.value.achVendID.valid = valid
      validMap.value.achVendID.tip = tip
      break
    }
    case 'usMaxContext': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为uint16'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: uint16 required'
        }
      }
      validMap.value.usMaxContext.valid = valid
      validMap.value.usMaxContext.tip = tip
      break
    }
    case 'usLowerOpticalPointSize': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为int16'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: int16 required'
        }
      }
      validMap.value.usLowerOpticalPointSize.valid = valid
      validMap.value.usLowerOpticalPointSize.tip = tip
      break
    }
    case 'usUpperOpticalPointSize': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        if (locale.value === 'zh') {
          tip = '格式错误，应为int16'
        } else if (locale.value === 'en') {
          tip = 'Invalid format: int16 required'
        }
      }
      validMap.value.usUpperOpticalPointSize.valid = valid
      validMap.value.usUpperOpticalPointSize.tip = tip
      break
    }
  }
}

const descriptions_zh = {
  version: '表的版本号',
  usWeightClass: '字体的字重（Weight），范围为 1–1000，常见值如 400（Regular）、700（Bold）。',
  usWidthClass: '字体的宽度类别，范围为 1（Ultra-condensed）到 9（Ultra-expanded）。',
  fsType: '字体的嵌入许可权限，如禁止嵌入、仅打印预览等。',
  ySubscriptXSize: '下标字符的推荐宽度',
  ySubscriptYSize: '下标字符的推荐高度',
  ySubscriptXOffset: '下标字符相对基线的 X 轴偏移量',
  ySubscriptYOffset: '下标字符相对基线的 Y 轴偏移量',
  ySuperscriptXSize: '上标字符的推荐宽度',
  ySuperscriptYSize: '上标字符的推荐高度',
  ySuperscriptXOffset: '上标字符相对基线的 X 轴偏移量',
  ySuperscriptYOffset: '上标字符相对基线的 Y 轴偏移量',
  yStrikeoutSize: '删除线的厚度',
  yStrikeoutPosition: '删除线相对基线的位置',
  sFamilyClass: '字体家族类别，用于定义字体的设计风格（如 Serif、Sans-serif）。',
  panose: '用于描述字体外观的 PANOSE 分类编号系统',
  achVendID: '字体供应商的 4 字符标识符',
  fsSelection: '字体样式选择标志，例如 Italic、Bold、Regular',
  // usDefaultChar: hasChar(font, ' ') ? 32 : 0,
  // usBreakChar: hasChar(font, ' ') ? 32 : 0,
  usMaxContext: '字体上下文长度的最大值（如字形替换所需的上下文长度）',
  usLowerOpticalPointSize: '字体的最低推荐光学字号',
  usUpperOpticalPointSize: '字体的最高推荐光学字号',
}

const panoseDescriptions_zh = [
  {
    name: 'Family Type (字节 1)',
    description: '表示字体的家族类型，比如无衬线字体、衬线字体、等宽字体等。',
    range: '取值范围：0-11（每个值对应一个家族类型，如无衬线、衬线、手写等）。',
  },
  {
    name: 'Serif Style (字节 2)',
    description: '仅适用于衬线字体，用于描述衬线的样式。比如直线衬线、弯曲衬线等。',
    range: '取值范围：0-5（不同的衬线样式）。'
  },
  {
    name: 'Weight (字节 3)',
    description: '字体的粗细程度。例如轻、正常、粗体等。',
    range: '取值范围：0-9（从极细到极粗的不同等级）。',
  },
  {
    name: 'Proportion (字节 4)',
    description: '字体的宽度，比如标准宽度、压缩宽度或扩展宽度等。',
    range: '取值范围：0-5（从低对比到高对比）。',
  },
  {
    name: 'Contrast (字节 5)',
    description: '字体笔画的对比度，即笔画的粗细变化。高对比度和低对比度的字体外观不同。',
    range: '取值范围：0-5（从低对比到高对比）。',
  },
  {
    name: 'Stroke Variation (字节 6)',
    description: '字体的笔画变化，描述字体笔画的粗细变化。是否有均匀的笔画，还是有变化的笔画。',
    range: '取值范围：0-3（均匀笔画、变化笔画等）。',
  },
  {
    name: 'Arm Style (字节 7)',
    description: '字母中横臂的样式。不同的字体会在横向的笔画上有所不同，可能是水平的、倾斜的等。',
    range: '取值范围：0-3（均匀笔画、变化笔画等）。',
  },
  {
    name: 'Letterform (字节 8)',
    description: '字母的形态，指字形的样式。例如圆形字形、方形字形等。',
    range: '取值范围：0-2（如上中线、下中线、无中线）。',
  },
  {
    name: 'Midline (字节 9)',
    description: '字母的中线，指的是字母的中部。例如是高、中、低等。',
    range: '取值范围：0-2（如上中线、下中线、无中线）。',
  },
  {
    name: 'X-height (字节 10)',
    description: '字母的 X 高度，指的是小写字母（如 "x"）的高度。X 高度是字体中小写字母的标高，影响字体的视觉效果。',
    range: '取值范围：0-5（小到大不同的 X 高度值）。',
  }
]

const fsSelectionDescriptions_zh = [
  {
    name: 'Italic',
    description: '如果勾选，则表明字体是斜体。'
  },
  {
    name: 'Underscore',
    description: '如果勾选，则表明字体支持下划线功能（很少使用）。'
  },
  {
    name: 'Negative',
    description: '如果勾选，则表明字体是倒影（白色轮廓字体，背景填充黑色，通常用于特殊效果）。'
  },
  {
    name: 'Outlined',
    description: '如果勾选，则表明字体是轮廓字体。'
  },
  {
    name: 'Strikeout',
    description: '如果勾选，则表明字体支持删除线功能。'
  },
  {
    name: 'Bold',
    description: '如果勾选，则表明字体是斜体。则表明字体是粗体。'
  },
  {
    name: 'Regular',
    description: '如果勾选，则表明字体是常规样式（非斜体、非粗体等）。'
  },
  {
    name: 'UseTypoMetrics',
    description: '如果勾选，应用程序应该使用 OS/2 表中的 sTypoAscender 和 sTypoDescender。'
  },
  {
    name: 'WWS',
    description: '如果勾选，则表明字体支持“宽度、权重和样式”（Weight, Width, Slope）的命名方案。'
  },
  {
    name: 'Oblique',
    description: '如果勾选，则表明字体是倾斜体（与 Italic 区别在于更机械化的倾斜）。'
  }
]

const descriptions_en = {
  version: 'Table version number',
  usWeightClass: 'Font weight (1–1000 range, e.g. 400=Regular, 700=Bold)',
  usWidthClass: 'Font width classification (1=Ultra-condensed to 9=Ultra-expanded)',
  fsType: 'Font embedding licensing permissions (e.g., print-only embedding restrictions)',
  ySubscriptXSize: 'Recommended horizontal size for subscript characters',
  ySubscriptYSize: 'Recommended vertical size for subscript characters',
  ySubscriptXOffset: 'X-axis offset from baseline for subscript positioning',
  ySubscriptYOffset: 'Y-axis offset from baseline for subscript positioning',
  ySuperscriptXSize: 'Recommended horizontal size for superscript characters',
  ySuperscriptYSize: 'Recommended vertical size for superscript characters',
  ySuperscriptXOffset: 'X-axis offset from baseline for superscript positioning',
  ySuperscriptYOffset: 'Y-axis offset from baseline for superscript positioning',
  yStrikeoutSize: 'Strikeout stroke thickness',
  yStrikeoutPosition: 'Vertical position of strikeout relative to baseline',
  sFamilyClass: 'Font family classification (e.g., Serif/Sans-serif design categories)',
  panose: 'PANOSE classification system for visual font characteristics',
  achVendID: '4-character font vendor identifier',
  fsSelection: 'Font style flags (bitmask for Italic/Bold/Regular etc.)',
  usMaxContext: 'Maximum context length required for glyph substitution',
  usLowerOpticalPointSize: 'Minimum recommended optical size for this font',
  usUpperOpticalPointSize: 'Maximum recommended optical size for this font'
}

const panoseDescriptions_en = [
  {
    name: 'Family Type (Byte 1)',
    description: 'Font classification category (e.g., Sans-serif, Serif, Monospace)',
    range: 'Range: 0-11 (No Fit/Text Display/Decorative etc.)'
  },
  {
    name: 'Serif Style (Byte 2)',
    description: 'Serif design characteristics (applies to Serif fonts)',
    range: 'Range: 0-5 (No Serif/Square/Thin etc.)'
  },
  {
    name: 'Weight (Byte 3)',
    description: 'Stroke thickness progression from light to black',
    range: 'Range: 0-9 (Light/Medium/Bold etc.)'
  },
  {
    name: 'Proportion (Byte 4)',
    description: 'Character width characteristics',
    range: 'Range: 0-5 (Monospace/Proportional/Old Style etc.)'
  },
  {
    name: 'Contrast (Byte 5)',
    description: 'Stroke thickness variation between vertical/horizontal elements',
    range: 'Range: 0-5 (No Contrast/Low/Medium/High etc.)'
  },
  {
    name: 'Stroke Variation (Byte 6)',
    description: 'Transition between thick/thin stroke elements',
    range: 'Range: 0-3 (No Variation/Gradual/Abrupt etc.)'
  },
  {
    name: 'Arm Style (Byte 7)',
    description: 'Terminal treatment of non-curved strokes',
    range: 'Range: 0-3 (Straight/Single Serif etc.)'
  },
  {
    name: 'Letterform (Byte 8)',
    description: 'Overall letter shape characteristics',
    range: 'Range: 0-2 (Normal/Contact/Weighted etc.)'
  },
  {
    name: 'Midline (Byte 9)',
    description: 'Position of character midline',
    range: 'Range: 0-2 (Standard/High/Low)'
  },
  {
    name: 'X-height (Byte 10)',
    description: 'Relative height of lowercase letters (without ascenders/descenders)',
    range: 'Range: 0-5 (Constant/Small/Medium etc.)'
  }
]

const fsSelectionDescriptions_en = [
  {
    name: 'Italic',
    description: 'Indicates italic style'
  },
  {
    name: 'Underscore',
    description: 'Font contains underline metadata (rarely used)'
  },
  {
    name: 'Negative',
    description: 'Reverse-video outline effect (white foreground fill)'
  },
  {
    name: 'Outlined',
    description: 'Font uses outline effect styling'
  },
  {
    name: 'Strikeout',
    description: 'Font contains strikeout metadata'
  },
  {
    name: 'Bold',
    description: 'Indicates bold weight style'
  },
  {
    name: 'Regular',
    description: 'Base style flag (non-italic/non-bold)'
  },
  {
    name: 'UseTypoMetrics',
    description: 'Use OS/2 table’s sTypoAscender/sTypoDescender for layout'
  },
  {
    name: 'WWS',
    description: 'Font follows Weight-Width-Slope naming scheme'
  },
  {
    name: 'Oblique',
    description: 'Mechanical slant style (distinct from italic)'
  }
]

const descriptions = computed(() => {
  if (locale.value === 'zh') {
    return descriptions_zh
  } else if (locale.value === 'en') {
    return descriptions_en
  }
  return descriptions_zh
})

const panoseDescriptions = computed(() => {
  if (locale.value === 'zh') {
    return panoseDescriptions_zh
  } else if (locale.value === 'en') {
    return panoseDescriptions_en
  }
  return panoseDescriptions_zh
})

const fsSelectionDescriptions = computed(() => {
  if (locale.value === 'zh') {
    return fsSelectionDescriptions_zh
  } else if (locale.value === 'en') {
    return fsSelectionDescriptions_en
  }
  return fsSelectionDescriptions_zh
})
</script>

<template>
  <el-scrollbar height="460px">
    <div class="table-item">
      <div class="item-name">version</div>
      <div class="item-content">
        <el-input-number v-model="data.version" @change="(value) => onChange('version', value)" :controls="false" :precision="0" disabled></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.version"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.version.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">usWeightClass</div>
      <div class="item-content">
        <el-input-number v-model="data.usWeightClass" @change="(value) => onChange('usWeightClass', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.usWeightClass"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.usWeightClass.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">usWidthClass</div>
      <div class="item-content">
        <el-input-number v-model="data.usWidthClass" @change="(value) => onChange('usWidthClass', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.usWidthClass"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.usWidthClass.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">fsType</div>
      <div class="item-content">
        <el-input-number v-model="data.fsType" @change="(value) => onChange('fsType', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.fsType"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.fsType.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">ySubscriptXSize</div>
      <div class="item-content">
        <el-input-number v-model="data.ySubscriptXSize" @change="(value) => onChange('ySubscriptXSize', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.ySubscriptXSize"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.ySubscriptXSize.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">ySubscriptYSize</div>
      <div class="item-content">
        <el-input-number v-model="data.ySubscriptYSize" @change="(value) => onChange('ySubscriptYSize', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.ySubscriptYSize"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.ySubscriptYSize.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">ySubscriptXOffset</div>
      <div class="item-content">
        <el-input-number v-model="data.ySubscriptXOffset" @change="(value) => onChange('ySubscriptXOffset', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.ySubscriptXOffset"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.ySubscriptXOffset.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">ySubscriptYOffset</div>
      <div class="item-content">
        <el-input-number v-model="data.ySubscriptXOffset" @change="(value) => onChange('ySubscriptYOffset', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.ySubscriptYOffset"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.ySubscriptYOffset.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">ySuperscriptXSize</div>
      <div class="item-content">
        <el-input-number v-model="data.ySuperscriptXSize" @change="(value) => onChange('ySuperscriptXSize', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.ySuperscriptXSize"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.ySuperscriptXSize.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">ySuperscriptYSize</div>
      <div class="item-content">
        <el-input-number v-model="data.ySuperscriptYSize" @change="(value) => onChange('ySuperscriptYSize', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.ySuperscriptYSize"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.ySuperscriptYSize.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">ySuperscriptXOffset</div>
      <div class="item-content">
        <el-input-number v-model="data.ySuperscriptXOffset" @change="(value) => onChange('ySuperscriptXOffset', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.ySuperscriptXOffset"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.ySuperscriptXOffset.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">ySuperscriptYOffset</div>
      <div class="item-content">
        <el-input-number v-model="data.ySuperscriptYOffset" @change="(value) => onChange('ySuperscriptYOffset', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.ySuperscriptYOffset"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.ySuperscriptYOffset.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">yStrikeoutSize</div>
      <div class="item-content">
        <el-input-number v-model="data.yStrikeoutSize" @change="(value) => onChange('yStrikeoutSize', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.yStrikeoutSize"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.yStrikeoutSize.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">yStrikeoutPosition</div>
      <div class="item-content">
        <el-input-number v-model="data.yStrikeoutPosition" @change="(value) => onChange('yStrikeoutPosition', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.yStrikeoutPosition"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.yStrikeoutPosition.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">sFamilyClass</div>
      <div class="item-content">
        <el-input-number v-model="data.sFamilyClass" @change="(value) => onChange('sFamilyClass', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.sFamilyClass"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.sFamilyClass.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">panose</div>
      <div class="item-content" :style="{
        flexDirection: 'column'
      }">
        <div class="panose-item" v-for="(item, index) in data.panose">
          <div class="panose-item-input">
            <el-input-number v-model="data.panose[index]" :controls="false" :precision="0" :style="{ width: '80px' }"></el-input-number>
          </div>
          <el-tooltip
            class="tips"
            effect="dark"
            :content="panoseDescriptions[index].range"
            placement="bottom"
          >
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
          <div class="panose-item-description">{{ panoseDescriptions[index].description }}</div>
        </div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">achVendID</div>
      <div class="item-content">
        <el-input v-model="data.yStrikeoutPosition" @change="(value) => onChange('yStrikeoutPosition', value)" :controls="false"></el-input>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.achVendID"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.achVendID.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">fsSelection</div>
      <div class="item-content" :style="{
        flexDirection: 'column'
      }">
        <div class="fs-selection-item" v-for="(item, index) in data.fsSelection">
          <div class="fs-selection-item-checkbox">
            <el-checkbox v-model="data.fsSelection[index]"></el-checkbox>
          </div>
          <div class="fs-selection-item-name">Bit-{{ index }}</div>
          <div class="fs-selection-item-description">{{ fsSelectionDescriptions[index].description }}</div>
        </div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">usMaxContext</div>
      <div class="item-content">
        <el-input-number v-model="data.usMaxContext" @change="(value) => onChange('usMaxContext', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.usMaxContext"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.usMaxContext.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">usLowerOpticalPointSize</div>
      <div class="item-content">
        <el-input-number v-model="data.usLowerOpticalPointSize" @change="(value) => onChange('usLowerOpticalPointSize', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.usLowerOpticalPointSize"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.usLowerOpticalPointSize.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">usUpperOpticalPointSize</div>
      <div class="item-content">
        <el-input-number v-model="data.usUpperOpticalPointSize" @change="(value) => onChange('usUpperOpticalPointSize', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.usUpperOpticalPointSize"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.usUpperOpticalPointSize.tip }}</div>
      </div>
    </div>
  </el-scrollbar>
</template>

<style scoped>
  .table-item {
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
    .item-name {
      flex: 0 0 160px;
      text-align: center;
      color: var(--light-0);
      line-height: 32px;
    }
    .item-content {
      flex: auto;
      display: flex;
      flex-direction: row;
    }
    .fs-selection-item {
      display: flex;
      flex-direction: row;
      line-height: 32px;
      color: var(--light-0);
      .fs-selection-item-name {
        flex: 0 0 60px;
      }
      .fs-selection-item-description {
        flex: 0 0 360px;
      }
      .fs-selection-item-checkbox {
        margin-right: 10px;
      }
    }
    .panose-item {
      display: flex;
      flex-direction: row;
      line-height: 32px;
      .panose-item-name {
        flex: 0 0 60px;
      }
      .panose-item-description {
        color: var(--light-0);
        flex: 0 0 360px;
      }
      .panose-item-range {
        flex: 0 0 200px;
      }
    }
  }
  .el-icon {
    margin-left: 20px;
    margin-right: 20px;
    height: 32px;
    font-size: 18px;
  }
  .tips {
    width: 200px;
    color: #a51f1f;
    line-height: 32px;
  }
</style>