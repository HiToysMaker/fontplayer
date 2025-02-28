<script setup lang="ts">
import { ref } from 'vue';
import { validators } from '../../../../fontManager/validators'
import { hhea_data as data } from '../../../stores/settings';

const validMap = ref({
  majorVersion: {
    valid: true,
    tip: '',
  },
  minorVersion: {
    valid: true,
    tip: '',
  },
  lineGap: {
    valid: true,
    tip: '',
  },
  caretSlopeRise: {
    valid: true,
    tip: '',
  },
  caretSlopeRun: {
    valid: true,
    tip: '',
  },
  caretOffset: {
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
    case 'lineGap': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误'
      }
      validMap.value.lineGap.valid = valid
      validMap.value.lineGap.tip = tip
      break
    }
    case 'caretSlopeRise': {
      const valid = validators.int16(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为int16'
      }
      validMap.value.caretSlopeRise.valid = valid
      validMap.value.caretSlopeRise.tip = tip
      break
    }
    case 'caretSlopeRun': {
      const valid = validators.int16(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为int16'
      }
      validMap.value.caretSlopeRun.valid = valid
      validMap.value.caretSlopeRun.tip = tip
      break
    }
    case 'caretOffset': {
      const valid = validators.int16(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为int16'
      }
      validMap.value.caretOffset.valid = valid
      validMap.value.caretOffset.tip = tip
      break
    }
  }
}

const descriptions = {
  majorVersion: '表版本的主版本号，格式为uint16',
  minorVersion: '表版本的次版本号，格式为uint16',
  lineGap: '行间距的额外空间，指两行文本之间的额外间隔，格式为FWORD',
  caretSlopeRise: '光标的斜率的分子部分，定义插入符的倾斜角度（通常为 1）。格式为int16',
  caretSlopeRun: '光标的斜率的分母部分，定义插入符的倾斜角度（通常为 0）。格式为int16',
  caretOffset: '光标相对于标准位置的水平偏移量，通常为 0。格式为int16',
}
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
      <div class="item-name">lineGap</div>
      <div class="item-content">
        <el-input-number v-model="data.lineGap" @change="(value) => onChange('lineGap', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.lineGap"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.lineGap.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">caretSlopeRise</div>
      <div class="item-content">
        <el-input-number v-model="data.caretSlopeRise" @change="(value) => onChange('caretSlopeRise', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.caretSlopeRise"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.caretSlopeRise.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">caretSlopeRun</div>
      <div class="item-content">
        <el-input-number v-model="data.caretSlopeRun" @change="(value) => onChange('caretSlopeRun', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.caretSlopeRun"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.caretSlopeRun.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">caretOffset</div>
      <div class="item-content">
        <el-input-number v-model="data.caretOffset" @change="(value) => onChange('caretOffset', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.caretOffset"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.caretOffset.tip }}</div>
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