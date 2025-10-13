<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { styles, selectedStyle, sampleCharacters, isEditingSample, updatePreviewList_styleSwitch, updateSampleCharactersList, updateCharactersList_styleSwitch, onStrokeReplacement, updateCharactersAndPreview_styleSwitch, selectedStyleUUID } from '../../stores/advancedEdit'
import { ParameterType } from '../../stores/glyph'
import { genUUID } from '../../../utils/string'
import { ArrowLeft } from '@element-plus/icons-vue'

const showParamsPanel = ref(false)
onMounted(() => {
  styles.value = [
    {
      uuid: 'default',
      name: '默认风格',
      strokeStyle: '默认风格',
      constants: [],
      parameters: [],
    },
    {
      uuid: genUUID(),
      name: '字玩标准黑体',
      strokeStyle: '字玩标准黑体',
      constants: [
        {
          name: '起笔风格',
          value: 2,
        },
        {
          name: '起笔数值',
          value: 1,
        },
        {
          name: '转角风格',
          value: 1,
        },
        {
          name: '转角数值',
          value: 1,
        },
        {
          name: '字重变化',
          value: 0,
        },
        {
          name: '弯曲程度',
          value: 1,
        },
      ],
      parameters: [
        {
          name: '字重',
          value: 50,
          min: 40,
          max: 100,
          type: ParameterType.Number,
        },
      ]
    },
    {
      uuid: genUUID(),
      name: '字玩标准黑体-圆角',
      strokeStyle: '字玩标准黑体',
      constants: [
        {
          name: '起笔风格',
          value: 2,
        },
        {
          name: '起笔数值',
          value: 1,
        },
        {
          name: '转角风格',
          value: 0,
        },
        {
          name: '转角数值',
          value: 1,
        },
        {
          name: '字重变化',
          value: 0,
        },
        {
          name: '弯曲程度',
          value: 2,
        },
      ],
      parameters: [
        {
          name: '字重',
          value: 50,
          min: 40,
          max: 100,
          type: ParameterType.Number,
        },
      ]
    },
    {
      uuid: genUUID(),
      name: '测试手绘风格',
      strokeStyle: '测试手绘风格',
      constants: [],
      parameters: [
        {
          name: '字重',
          value: 50,
          min: 40,
          max: 100,
          type: ParameterType.Number,
        },
      ]
    },
    {
      uuid: genUUID(),
      name: '字玩腾云体',
      strokeStyle: '字玩腾云体',
      constants: [],
      parameters: [
        {
          name: '字重',
          value: 50,
          min: 40,
          max: 100,
          type: ParameterType.Number,
        },
      ],
    },
    {
      uuid: genUUID(),
      name: '字玩标准宋体',
      strokeStyle: '字玩标准宋体',
      constants: [],
      parameters: [
        {
          name: '字重',
          value: 50,
          min: 40,
          max: 100,
          type: ParameterType.Number,
        },
      ],
    },
    {
      uuid: genUUID(),
      name: '字玩标准仿宋',
      strokeStyle: '字玩标准仿宋',
      constants: [],
      parameters: [
        {
          name: '字重',
          value: 30,
          min: 40,
          max: 100,
          type: ParameterType.Number,
        },
      ],
    },
    {
      uuid: genUUID(),
      name: '字玩标准楷体',
      strokeStyle: '字玩标准楷体',
      constants: [],
      parameters: [
        {
          name: '字重',
          value: 50,
          min: 40,
          max: 100,
          type: ParameterType.Number,
        },
      ],
    },
    {
      uuid: genUUID(),
      name: '字玩标准隶书',
      strokeStyle: '字玩标准隶书',
      constants: [],
      parameters: [
        {
          name: '字重',
          value: 50,
          min: 40,
          max: 100,
          type: ParameterType.Number,
        },
      ],
    },
  ]
  updateSampleCharactersList()
  updatePreviewList_styleSwitch()
})

onUnmounted(() => {
  styles.value = []
  selectedStyleUUID.value = 'default'
})

// 功能函数（留空）
const handleToggleEditSample = () => {
  // TODO: 实现编辑样例字符功能
  isEditingSample.value = !isEditingSample.value
  if (!isEditingSample.value) {
    updateSampleCharactersList()
    updatePreviewList_styleSwitch()
  }
}

const handleUpdateAllCharacters = () => {
  // TODO: 实现一键更新全部字符功能
  updateCharactersList_styleSwitch()
}

const handleSelectStyle = (style) => {
  if (selectedStyle.value.uuid === style.uuid && style.uuid !== 'default') {
    showParamsPanel.value = true
    return
  }
  selectedStyleUUID.value = style.uuid
  // updatePreviewList_styleSwitch()
  updateCharactersAndPreview_styleSwitch()
}

const handleChangeParameter = (parameter, value, setValue = false) => {
  if (setValue) {
    parameter.value = value
  }
}

watch(() => selectedStyle.value?.parameters, () => {
  updateCharactersAndPreview_styleSwitch()
}, {
  deep: true,
})
</script>

<template>
  <div class="wrap">
    <div class="style-switch-panel">
      <div class="left">
        <div class="sample-characters-section">
          <h3>样例字符</h3>
          <el-form-item>
            <el-input
              v-model="sampleCharacters"
              type="textarea"
              :rows="4"
              :disabled="!isEditingSample"
              placeholder="请输入最多20个字符，每个字符不能重复"
              maxlength="20"
              show-word-limit
            />
          </el-form-item>
          <el-button
            :type="isEditingSample ? 'success' : 'primary'"
            @click="handleToggleEditSample"
            style="width: 100%; margin-bottom: 20px;"
          >
            {{ isEditingSample ? '确认' : '编辑预览样例字符' }}
          </el-button>
        </div>

        <div class="update-section">
          <el-button 
            type="danger" 
            size="large"
            @click="handleUpdateAllCharacters"
          >
            一键更新全部字库
          </el-button>
        </div>
      </div>
      <div class="main">
        <!-- <canvas id="advanced-edit-canvas" width="1000" height="1000" :style="{
          width: '500px',
          height: '500px',
        }"></canvas> -->
        <div class="characters" id="advanced-edit-characters-list">
        </div>
      </div>
      <div class="right">
        <div class="stroke-list-section" v-if="!showParamsPanel">
          <div class="title">风格列表</div>
          <el-scrollbar>
            <el-button
              class="style-item"
              v-for="style in styles"
              :key="style.uuid"
              :type="style.uuid === selectedStyle.uuid ? 'primary' : 'default'"
              :class="{ 'selected': style.uuid === selectedStyle.uuid }"
              @click="handleSelectStyle(style)"
            >
              {{ style.name }}
            </el-button>
          </el-scrollbar>
        </div>
        <div class="parameters-wrap" v-if="showParamsPanel">
          <div class="title">
            <el-icon class="arrow-left-icon" @click="showParamsPanel = false"><ArrowLeft /></el-icon>
            <span>可调参数</span>
          </div>
          <el-form
            class="parameters-form"
            label-width="80px"
          >
            <el-form-item :label="parameter.name" v-for="parameter in selectedStyle.parameters">
              <div class="param-wrapper" v-if="parameter.type === ParameterType.Number">
                <el-input-number
                  :model-value="parameter.value"
                  :step="parameter.max <= 10 ? 0.01 : 1"
                  :min="parameter.min"
                  :max="parameter.max"
                  :precision="parameter.max <= 10 ? 2 : 0"
                  @change="(value) => handleChangeParameter(parameter, value, true)"
                />
                <el-slider
                  :step="parameter.max <= 10 ? 0.01 : 1"
                  :min="parameter.min"
                  :max="parameter.max"
                  :precision="parameter.max <= 10 ? 2 : 0"
                  @input="(value) => handleChangeParameter(parameter, value, false)"
                  v-model="parameter.value" v-show="parameter.type === ParameterType.Number"
                />
              </div>
            </el-form-item>
          </el-form>
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
.style-switch-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;

  .arrow-left-icon {
    flex: 0 0 32px;
    &:hover {
      cursor: pointer;
      color: var(--primary-5);
    }
  }

  .title {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .characters {
    flex: 0 0 450px;
    /* display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 10px; */
    .character-preview {
      display: inline-block;
      margin: 10px;
      width: 100px;
      height: 100px;
      box-sizing: border-box;
      cursor: pointer;
    }
  }
  .left {
    border-right: 1px solid var(--light-5);
    flex: 0 0 300px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    box-sizing: border-box;
    height: calc(100% - 50px);

    .sample-characters-section {
      h3 {
        margin: 0 0 15px 0;
        color: var(--light-0);
        font-size: 16px;
      }
    }

    .update-section {
      margin-top: auto;
      text-align: center;
      .el-button {
        width: 80%;
        height: 48px;
        font-size: 18px;
        background-color: #F56C6C;
        color: white;
        border-radius: 10px;
      }
    }
  }
  .main {
    flex: auto;
  }
  .right {
    height: calc(100% - 50px);
    flex: 0 0 260px;
    border-left: 1px solid var(--light-5);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    flex-direction: column;
    .parameters-wrap {
      width: 100%;
      height: 100%;
    }
    .stroke-list-section {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      .style-item {
        width: calc(100% - 20px);
        margin-top: 10px;
        margin-left: 10px;
        margin-right: 10px;
      }
    }
    .el-scrollbar {
      width: 100%;
    }
    .title {
      background-color: var(--primary-0);
      color: var(--light-0);
    }
    .el-form-item {
      flex: 0 0 50px;
      margin: 10px;
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
    .title {
      width: 100%;
      height: 36px;
      line-height: 36px;
      padding: 0 10px;
      border-bottom: 1px solid var(--light-5);
    }

    .el-form {
      margin: 10px 0;
    }
    .el-checkbox {
      display: flex;
      margin: 0 20px;
      color: var(--light-3);
    }
    .el-slider {
      margin: 5px 0;
      margin-right: 20px;
    }
    .el-select {
      width: 150px;
    }
    :deep(.el-slider__button) {
      border-radius: 0;
      width: 14px;
      height: 14px;
    }
    .param-wrapper {
      width: 100%;
    }
  }
  :deep(.el-form-item__label) {
    color: var(--primary-0);
  }
}
</style>