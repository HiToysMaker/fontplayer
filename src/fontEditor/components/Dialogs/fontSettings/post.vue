<script setup lang="ts">
import { ref } from 'vue'
import { validators } from '../../../../fontManager/validators'
import { post_data as data } from '../../../stores/settings'

const validMap = ref({
  italicAngle: {
    valid: true,
    tip: '',
  },
  underlinePosition: {
    valid: true,
    tip: '',
  },
  underlineThickness: {
    valid: true,
    tip: '',
  },
  isFixedPitch: {
    valid: true,
    tip: '',
  },
  minMemType42: {
    valid: true,
    tip: '',
  },
  maxMemType42: {
    valid: true,
    tip: '',
  },
  minMemType1: {
    valid: true,
    tip: '',
  },
  maxMemType1: {
    valid: true,
    tip: '',
  },
})

const onChange = (key, value) => {
  switch(key) {
    case 'italicAngle': {
      const valid = validators.Fixed(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为Fixed'
      }
      validMap.value.italicAngle.valid = valid
      validMap.value.italicAngle.tip = tip
      break
    }
    case 'underlinePosition': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为FWORD'
      }
      validMap.value.underlinePosition.valid = valid
      validMap.value.underlinePosition.tip = tip
      break
    }
    case 'underlineThickness': {
      const valid = validators.FWORD(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误'
      }
      validMap.value.underlineThickness.valid = valid
      validMap.value.underlineThickness.tip = tip
      break
    }
    case 'isFixedPitch': {
      const valid = validators.uint32(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为uint32'
      }
      validMap.value.isFixedPitch.valid = valid
      validMap.value.isFixedPitch.tip = tip
      break
    }
    case 'minMemType42': {
      const valid = validators.uint32(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为uint32'
      }
      validMap.value.minMemType42.valid = valid
      validMap.value.minMemType42.tip = tip
      break
    }
    case 'maxMemType42': {
      const valid = validators.uint32(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为uint32'
      }
      validMap.value.maxMemType42.valid = valid
      validMap.value.maxMemType42.tip = tip
      break
    }
    case 'minMemType1': {
      const valid = validators.uint32(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为uint32'
      }
      validMap.value.minMemType1.valid = valid
      validMap.value.minMemType1.tip = tip
      break
    }
    case 'maxMemType1': {
      const valid = validators.uint32(value)
      let tip = ''
      if (!valid) {
        tip = '格式错误，应为uint32'
      }
      validMap.value.maxMemType1.valid = valid
      validMap.value.maxMemType1.tip = tip
      break
    }
  }
}

const descriptions = {
  version: 'version 3.0',
  italicAngle: '斜体角度是指从垂直方向开始，逆时针计算的角度。对于直立文本，斜体角度为零；对于向右倾斜（前倾）的文本，斜体角度为负值。',
  underlinePosition: '建议的下划线顶部的 y 坐标。',
  underlineThickness: '建议的下划线粗细值。通常，下划线的粗细应与下划线字符（U+005F LOW LINE）的粗细相匹配，并且应与在 OS/2 表中指定的删除线粗细相匹配。',
  isFixedPitch: '如果字体是等宽字体，则设置为非零值；如果字体是比例间距字体，则设置为 0。',
  minMemType42: '下载 OpenType 字体时的最小内存使用量。',
  maxMemType42: '下载 OpenType 字体时的最大内存使用量。',
  minMemType1: '当 OpenType 字体以 Type 1 字体格式下载时的最小内存使用量。',
  maxMemType1: '当 OpenType 字体以 Type 1 字体格式下载时的最大内存使用量。',
}
</script>

<template>
  <el-scrollbar height="460px">
    <div class="table-item">
      <div class="item-name">version</div>
      <div class="item-content">
        <el-input :model-value="'version 3.0'" :controls="false" disabled></el-input>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.version"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">italicAngle</div>
      <div class="item-content">
        <el-input-number v-model="data.italicAngle" @change="(value) => onChange('italicAngle', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.italicAngle"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.italicAngle.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">lineGap</div>
      <div class="item-content">
        <el-input-number v-model="data.underlinePosition" @change="(value) => onChange('underlinePosition', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.underlinePosition"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.underlinePosition.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">underlineThickness</div>
      <div class="item-content">
        <el-input-number v-model="data.underlineThickness" @change="(value) => onChange('underlineThickness', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.underlineThickness"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.underlineThickness.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">isFixedPitch</div>
      <div class="item-content">
        <el-input-number v-model="data.isFixedPitch" @change="(value) => onChange('isFixedPitch', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.isFixedPitch"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.isFixedPitch.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">minMemType42</div>
      <div class="item-content">
        <el-input-number v-model="data.minMemType42" @change="(value) => onChange('minMemType42', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.minMemType42"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.minMemType42.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">maxMemType42</div>
      <div class="item-content">
        <el-input-number v-model="data.maxMemType42" @change="(value) => onChange('maxMemType42', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.maxMemType42"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.maxMemType42.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">minMemType1</div>
      <div class="item-content">
        <el-input-number v-model="data.minMemType1" @change="(value) => onChange('minMemType1', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.minMemType1"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.minMemType1.tip }}</div>
      </div>
    </div>
    <div class="table-item">
      <div class="item-name">maxMemType1</div>
      <div class="item-content">
        <el-input-number v-model="data.maxMemType1" @change="(value) => onChange('maxMemType1', value)" :controls="false" :precision="0"></el-input-number>
        <el-tooltip
          class="tips"
          effect="dark"
          :content="descriptions.maxMemType1"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
        <div class="tips">{{ validMap.maxMemType1.tip }}</div>
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