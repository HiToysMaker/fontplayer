<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { IConstant, ParameterType, getConstant, constantsMap } from '../../stores/glyph'
import { loading, loaded, total } from '../../stores/global'
import { useI18n } from 'vue-i18n'
import { constants, sampleCharacters, isEditingSample, updatePreviewList, updateSampleCharactersList, updateCharactersAndPreview, updateCharactersList } from '../../stores/advancedEdit'
import { glyphs, constants as globalConstants } from '../../stores/glyph'
import * as R from 'ramda'

onMounted(() => {
  constants.value = R.clone(globalConstants.value)
  updateSampleCharactersList()
  updatePreviewList()
})

// 功能函数（留空）
const handleToggleEditSample = () => {
  // TODO: 实现编辑样例字符功能
  isEditingSample.value = !isEditingSample.value
  if (!isEditingSample.value) {
    updateSampleCharactersList()
    updatePreviewList()
  }
}

const handleUpdateAllCharacters = () => {
  // TODO: 实现一键更新全部字符功能
  updateCharactersList()
}

const handleChangeParameter = (parameter, value, setValue = false) => {
  if (setValue) {
    parameter.value = value
  }
}

watch(constants, () => {
  updateCharactersAndPreview()
}, {
  deep: true,
})
</script>

<template>
  <div class="wrap">
    <div class="global-params-panel">
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
        <div class="characters" id="advanced-edit-characters-list">
        </div>
      </div>
      <div class="right">
        <el-scrollbar>
          <div class="parameters-wrap">
            <div class="title">全局变量</div>
            <el-form
              class="parameters-form"
              label-width="80px"
            >
              <el-form-item :label="parameter.name" v-for="parameter in constants">
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
                <div class="param-wrapper" v-else-if="parameter.type === ParameterType.Enum">
                  <el-select
                    v-model="parameter.value" class="enum-param-select" placeholder="Select"
                    @change="(value) => handleChangeParameter(parameter, value, false)"
                  >
                    <el-option
                      v-for="option in parameter.options"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-scrollbar>
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
.global-params-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;

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
    flex: 0 0 260px;
    border-left: 1px solid var(--light-5);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    flex-direction: column;
    .parameters-wrap {
      width: 100%;
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