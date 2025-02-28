<script setup lang="ts">
import { ref } from 'vue'
import { validators } from '../../../../fontManager/validators'
import { head_data as data } from '../../../stores/settings'

const validMap = ref({
  majorVersion: {
    valid: true,
    tip: '',
  },
  minorVersion: {
    valid: true,
    tip: '',
  },
  fontRevision: {
    valid: true,
    tip: '',
  },
  created: {
    valid: true,
    tip: '',
  },
  modified: {
    valid: true,
    tip: '',
  },
  lowestRecPPEM: {
    valid: true,
    tip: '',
  },
  fontDirectionHint: {
    valid: true,
    tip: '',
  },
})

const onChange = (key, value) => {
  switch(key) {
    case 'majorVersion': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为uint16'
      }
      validMap.value.majorVersion.valid = valid
      validMap.value.majorVersion.tip = tip
      break
    }
    case 'minorVersion': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为uint16'
      }
      validMap.value.minorVersion.valid = valid
      validMap.value.minorVersion.tip = tip
      break
    }
    case 'fontRevision': {
      const valid = validators.Fixed(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误'
      }
      validMap.value.fontRevision.valid = valid
      validMap.value.fontRevision.tip = tip
      break
    }
    case 'created': {
      const valid = validators.LONGDATETIME(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误'
      }
      validMap.value.created.valid = valid
      validMap.value.created.tip = tip
      break
    }
    case 'modified': {
      const valid = validators.LONGDATETIME(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误'
      }
      validMap.value.modified.valid = valid
      validMap.value.modified.tip = tip
      break
    }
    case 'lowestRecPPEM': {
      const valid = validators.uint16(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为uint16'
      }
      validMap.value.lowestRecPPEM.valid = valid
      validMap.value.lowestRecPPEM.tip = tip
      break
    }
    case 'fontDirectionHint': {
      const valid = validators.int16(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为int16'
      }
      validMap.value.fontDirectionHint.valid = valid
      validMap.value.fontDirectionHint.tip = tip
      break
    }
  }
}

const updateCreated = (date) => {
  data.value.created.timestamp = Math.floor(date.getTime() / 1000) + 2082844800
}

const updateModified = (date) => {
  data.value.modified.timestamp = Math.floor(date.getTime() / 1000) + 2082844800
}

const descriptions = {
  majorVersion: '表版本的主版本号，格式为uint16',
  minorVersion: '表版本的次版本号，格式为uint16',
  fontRevision: '字体版本号，由字体开发者定义，格式为Fixed',
  created: '字体的创建时间，表示自 1904-01-01 零时以来的秒数。以 64 位整数表示',
  modified: '字体的最后修改时间，表示自 1904-01-01 零时以来的秒数。以 64 位整数表示',
  lowestRecPPEM: '字体建议的最小每字符像素尺寸 (Pixels Per Em)',
  fontDirectionHint: '字体的排版方向提示信息，通常为 0（左到右排版）',
}

const flagsDescriptions = [
  '字体基线位于 `y=0`',
  '左侧起始点位于 `x=0`（仅与 TrueType 光栅化器相关）——参见有关可变字体的附加信息',
  '指令可能依赖于点大小（point size）',
  '强制内部缩放器的所有数学运算使用整数的 ppem（每 Em 单位的像素数值）；如果此位未设置，则可以使用小数 ppem 值。**强烈建议在启用了 hinting（轮廓微调）的字体中设置此位**',
  '指令可能会更改前进宽度（advance width），即前进宽度可能不会线性缩放',
  '此位在 OpenType 中未使用，为了确保在所有平台上的兼容行为，不应设置此位。如果设置，可能导致某些平台的垂直布局行为不同。（详见 Apple 规范中有关 Apple 平台的行为说明。）',
  '在 OpenType 中未使用，且应始终清零',
  '在 OpenType 中未使用，且应始终清零',
  '在 OpenType 中未使用，且应始终清零',
  '在 OpenType 中未使用，且应始终清零',
  '在 OpenType 中未使用，且应始终清零',
  '字体数据是“无损的”，即经过优化转换和/或压缩（例如符合 ISO/IEC 14496-18、MicroType® Express、WOFF 2.0 或类似的压缩机制），保留了原始字体的功能和特性，但输入和输出字体文件之间的二进制兼容性无法保证。由于所应用的转换，DSIG 表可能也会失效。',
  '字体已被转换（生成兼容的度量信息）',
  '字体针对 ClearType® 进行了优化。',
  '备用字体（Last Resort font）',
  '保留位，必须设置为 0。',
]

const macStyleDescritions = [
  '粗体',
  '斜体',
  '下划线',
  '轮廓字体',
  '阴影',
  '窄体',
  '宽体',
  '保留位',
  '保留位',
  '保留位',
  '保留位',
  '保留位',
  '保留位',
  '保留位',
  '保留位',
  '保留位',
]
</script>

<template>
  <el-scrollbar height="460px">
    <div class="table-item">
      <div class="item-name">majorVersion</div>
      <div class="item-content">
        <el-input-number v-model="data.majorVersion" @change="(value) => onChange('majorVersion', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.majorVersion"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.majorVersion.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">minorVersion</div>
      <div class="item-content">
        <el-input-number v-model="data.minorVersion" @change="(value) => onChange('minorVersion', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.minorVersion"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.minorVersion.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">fontRevision</div>
      <div class="item-content">
        <el-input-number v-model="data.fontRevision" @change="(value) => onChange('fontRevision', value)" :controls="false" :precision="3"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.fontRevision"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.fontRevision.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">flags</div>
      <div class="item-content" :style="{
        flexDirection: 'column'
      }">
        <div class="flags-item">
          <div class="flags-item-checkbox">
            <el-checkbox v-model="data.flags[0]"></el-checkbox>
          </div>
          <div class="flags-item-name">Bit-0</div>
          <div class="flags-item-description">{{ flagsDescriptions[0] }}</div>
        </div>
        <div class="flags-item">
          <div class="flags-item-checkbox">
            <el-checkbox v-model="data.flags[1]"></el-checkbox>
          </div>
          <div class="flags-item-name">Bit-1</div>
          <div class="flags-item-description">{{ flagsDescriptions[1] }}</div>
        </div>
        <div class="flags-item">
          <div class="flags-item-checkbox">
            <el-checkbox v-model="data.flags[2]"></el-checkbox>
          </div>
          <div class="flags-item-name">Bit-2</div>
          <div class="flags-item-description">{{ flagsDescriptions[2] }}</div>
        </div>
        <div class="flags-item">
          <div class="flags-item-checkbox">
            <el-checkbox v-model="data.flags[3]"></el-checkbox>
          </div>
          <div class="flags-item-name">Bit-3</div>
          <div class="flags-item-description">{{ flagsDescriptions[3] }}</div>
        </div>
        <div class="flags-item">
          <div class="flags-item-checkbox">
            <el-checkbox v-model="data.flags[4]"></el-checkbox>
          </div>
          <div class="flags-item-name">Bit-4</div>
          <div class="flags-item-description">{{ flagsDescriptions[1] }}</div>
        </div>
        <div class="flags-item">
          <div class="flags-item-checkbox">
            <el-checkbox v-model="data.flags[11]"></el-checkbox>
          </div>
          <div class="flags-item-name">Bit-11</div>
          <div class="flags-item-description">{{ flagsDescriptions[11] }}</div>
        </div>
        <div class="flags-item">
          <div class="flags-item-checkbox">
            <el-checkbox v-model="data.flags[12]"></el-checkbox>
          </div>
          <div class="flags-item-name">Bit-12</div>
          <div class="flags-item-description">{{ flagsDescriptions[12] }}</div>
        </div>
        <div class="flags-item">
          <div class="flags-item-checkbox">
            <el-checkbox v-model="data.flags[13]"></el-checkbox>
          </div>
          <div class="flags-item-name">Bit-13</div>
          <div class="flags-item-description">{{ flagsDescriptions[13] }}</div>
        </div>
        <div class="flags-item">
          <div class="flags-item-checkbox">
            <el-checkbox v-model="data.flags[14]"></el-checkbox>
          </div>
          <div class="flags-item-name">Bit-14</div>
          <div class="flags-item-description">{{ flagsDescriptions[14] }}</div>
        </div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">created</div>
      <div class="item-content">
        <el-input-number v-model="data.created.timestamp" :controls="false" :precision="0" disabled></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.created"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <el-date-picker
          class="date-picker"
          v-model="data.created.value"
          @change="updateCreated"
          type="datetime"
          placeholder="Select date and time"
        />
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">modified</div>
      <div class="item-content">
        <el-input-number v-model="data.modified.timestamp" :controls="false" :precision="0" disabled></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.modified"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <el-date-picker
          class="date-picker"
          v-model="data.modified.value"
          @change="updateModified"
          type="datetime"
          placeholder="Select date and time"
        />
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">macStyle</div>
      <div class="item-content" :style="{
        flexDirection: 'column'
      }">
        <div class="mac-style-item">
          <div class="mac-style-item-checkbox">
            <el-checkbox v-model="data.macStyle[0]"></el-checkbox>
          </div>
          <div class="mac-style-item-name">Bit-0</div>
          <div class="mac-style-item-description">{{ macStyleDescritions[0] }}</div>
        </div>
        <div class="mac-style-item">
          <div class="mac-style-item-checkbox">
            <el-checkbox v-model="data.macStyle[1]"></el-checkbox>
          </div>
          <div class="mac-style-item-name">Bit-1</div>
          <div class="mac-style-item-description">{{ macStyleDescritions[1] }}</div>
        </div>
        <div class="mac-style-item">
          <div class="mac-style-item-checkbox">
            <el-checkbox v-model="data.macStyle[2]"></el-checkbox>
          </div>
          <div class="mac-style-item-name">Bit-2</div>
          <div class="mac-style-item-description">{{ macStyleDescritions[2] }}</div>
        </div>
        <div class="mac-style-item">
          <div class="mac-style-item-checkbox">
            <el-checkbox v-model="data.macStyle[3]"></el-checkbox>
          </div>
          <div class="mac-style-item-name">Bit-3</div>
          <div class="mac-style-item-description">{{ macStyleDescritions[3] }}</div>
        </div>
        <div class="mac-style-item">
          <div class="mac-style-item-checkbox">
            <el-checkbox v-model="data.macStyle[4]"></el-checkbox>
          </div>
          <div class="mac-style-item-name">Bit-4</div>
          <div class="mac-style-item-description">{{ macStyleDescritions[4] }}</div>
        </div>
        <div class="mac-style-item">
          <div class="mac-style-item-checkbox">
            <el-checkbox v-model="data.macStyle[5]"></el-checkbox>
          </div>
          <div class="mac-style-item-name">Bit-5</div>
          <div class="mac-style-item-description">{{ macStyleDescritions[5] }}</div>
        </div>
        <div class="mac-style-item">
          <div class="mac-style-item-checkbox">
            <el-checkbox v-model="data.macStyle[6]"></el-checkbox>
          </div>
          <div class="mac-style-item-name">Bit-6</div>
          <div class="mac-style-item-description">{{ macStyleDescritions[6] }}</div>
        </div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">lowestRecPPEM</div>
      <div class="item-content">
        <el-input-number v-model="data.lowestRecPPEM" @change="(value) => onChange('lowestRecPPEM', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.lowestRecPPEM"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.lowestRecPPEM.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">fontDirectionHint</div>
      <div class="item-content">
        <el-input-number v-model="data.fontDirectionHint" @change="(value) => onChange('fontDirectionHint', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.fontDirectionHint"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.fontDirectionHint.tip }}</div>
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
    .flags-item {
      display: flex;
      flex-direction: row;
      line-height: 32px;
      color: var(--light-0);
      .flags-item-name {
        flex: 0 0 60px;
      }
      .flags-item-description {
        flex: 0 0 360px;
      }
      .flags-item-checkbox {
        margin-right: 10px;
      }
    }
    .mac-style-item {
      display: flex;
      flex-direction: row;
      line-height: 32px;
      color: var(--light-0);
      .mac-style-item-name {
        flex: 0 0 60px;
      }
      .mac-style-item-description {
        flex: 0 0 360px;
      }
      .mac-style-item-checkbox {
        margin-right: 10px;
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