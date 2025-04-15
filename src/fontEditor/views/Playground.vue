<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import GridController from '../components/Widgets/GridController_playground.vue'
import { gridSettings, constants, updateCharactersAndPreview, initPlayground, renderPreview } from '../stores/playground'
import { IConstant } from '../stores/glyph'

const test_chars = ref([])

onMounted(() => {
  // for (let i = 0; i < 20; i++) {
  //   test_chars.value.push(i)
  // }
  initPlayground()
})

const onGridChange = (dx, dy, centerSquareSize) => {
  gridSettings.value.dx = dx
  gridSettings.value.dy = dy
  gridSettings.value.centerSquareSize = centerSquareSize
  renderPreview()
}

let timer = null
watch(constants, () => {
  updateCharactersAndPreview()
  // if (timer) {
  //   clearTimeout(timer)
  // } else {
  //   updateCharactersAndPreview()
  //   timer = setTimeout(() => {
  //     timer = null
  //   }, 100)
  // }
}, {
  deep: true,
})

const switchStarterStyle = () => {
  let value = constants.value[0].value
  value += 1
  if (value >= (constants.value[0] as IConstant).options.length) {
    value = 0
  }
  constants.value[0].value = value
}

const switchTurningStyle = () => {
  let value = constants.value[2].value
  value += 1
  if (value >= (constants.value[2] as IConstant).options.length) {
    value = 0
  }
  constants.value[2].value = value
}

// 读取初始字符以及字形数据
// 点击列表中字符时，编辑该字符，重新渲染编辑面板
// 更新GridController逻辑
// 全局参数更新时，更新字符列表以及当前编辑字符
// 导出字库，自动去除重叠
</script>

<template>
  <div class="wrap">
    <div class="playground">
      <div class="left">
        <div class="characters" id="playground-characters-list">
          <div class="character-preview" v-for="item in test_chars">
            {{ item }}
          </div>
        </div>
        <div class="params-panel">
          <div class="column column-1">
            <el-form-item label-width="80px" label="起笔风格">
              <el-button size="small" @pointerdown="switchStarterStyle">切换风格</el-button>
              <!-- <el-input-number size="small" v-model="constants[1].value"></el-input-number> -->
              <el-slider size="small" :step="0.05" v-model="constants[1].value" :min="constants[1].min" :max="constants[1].max"></el-slider>
            </el-form-item>
            <el-form-item label-width="80px" label="转角风格">
              <el-button size="small" @pointerdown="switchTurningStyle">切换风格</el-button>
              <!-- <el-input-number size="small" v-model="constants[3].value"></el-input-number> -->
              <el-slider size="small" :step="0.05" v-model="constants[3].value" :min="constants[3].min" :max="constants[3].max"></el-slider>
            </el-form-item>
          </div>
          <div class="column">
            <el-form-item label-width="80px" label="字重">
              <!-- <el-input-number size="small" v-model="constants[6].value"></el-input-number> -->
              <el-slider size="small" v-model="constants[6].value" :min="constants[6].min" :max="constants[6].max"></el-slider>
            </el-form-item>
            <el-form-item label-width="80px" label="弯曲程度">
              <!-- <el-input-number size="small" v-model="constants[4].value"></el-input-number> -->
              <el-slider size="small" :step="0.05" v-model="constants[5].value" :min="constants[5].min" :max="constants[5].max"></el-slider>
            </el-form-item>
            <el-form-item label-width="80px" label="字重变化">
              <!-- <el-input-number size="small" v-model="constants[5].value"></el-input-number> -->
              <el-slider size="small" :step="0.05" v-model="constants[4].value" :min="constants[4].min" :max="constants[4].max"></el-slider>
            </el-form-item>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="edit-panel">
          <grid-controller
            :size="gridSettings.size"
            :dx="gridSettings.dx"
            :dy="gridSettings.dy"
            :centerSquareSize="gridSettings.centerSquareSize"
            :onChange="onGridChange"
          ></grid-controller>
        </div>
        <div class="tips"></div>
        <div class="control-panel">
          <el-button>生成卡片</el-button>
          <el-button type="primary">导出字库</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.wrap {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--dark-3);
}
.playground {
  width: 1200px;
  height: 680px;
  display: flex;
  flex-direction: row;
  .left {
    flex: 0 0 600px;
    display: flex;
    flex-direction: column;
    .characters {
      flex: 0 0 450px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 10px;
      .character-preview {
        width: 100px;
        height: 100px;
        box-sizing: border-box;
        cursor: pointer;
      }
    }
    .params-panel {
      flex: 0 0 270px;
      padding-top: 50px;
      padding-right: 10px;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      gap: 10px;
      .column-1 {
        margin-right: 20px;
      }
      .column {
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 0 0 280px;
        .el-form-item {
          flex: 0 0 50px;
          margin: 0;
          .el-form-item__content {
            flex-direction: column;
            gap: 8px;
            margin-left: 10px;
          }
          .el-button {
            width: 100%;
            margin-bottom: 5px;
            margin-top: 6px;
          }
          .el-input-number {
            width: 100%;
            margin-bottom: 5px;
          }
          .el-slider {
            width: 100%;
            margin-bottom: 5px;
          }
        }
      }
    }
  }
  .right {
    flex: 0 0 600px;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    flex-direction: column;
    .edit-panel {
      flex: 0 0 500px;
    }
    .tips {
      flex: auto;
    }
    .control-panel {
      width: 100%;
      flex: 0 0 48px;
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      .el-button {
        height: 48px;
        width: 150px;
      }
    }
  }
  :deep(.el-form-item__label) {
    color: var(--primary-0);
  }
}
</style>