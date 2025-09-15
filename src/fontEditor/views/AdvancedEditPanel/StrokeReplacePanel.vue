<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted } from 'vue'
import { strokeList, selectedStroke, sampleCharacters, isEditingSample, updatePreviewList_strokeReplace, updateSampleCharactersList, updateCharactersList_strokeReplace, onStrokeReplacement, selectedStrokeUUID, getStrokeList, renderStrokePreview, strokeMap } from '../../stores/advancedEdit'
import { glyphComponentsDialogVisible2 } from '../../stores/dialogs'

onMounted(async () => {
  getStrokeList()
  updateSampleCharactersList()
  updatePreviewList_strokeReplace()
  await nextTick()
  for (let i = 0; i < strokeList.value.length; i++) {
    const stroke = strokeList.value[i]
    renderStrokePreview(stroke.uuid)
  }
})

onUnmounted(() => {
  strokeList.value.length = 0
  strokeMap.clear()
})

// 功能函数（留空）
const handleToggleEditSample = () => {
  // TODO: 实现编辑样例字符功能
  isEditingSample.value = !isEditingSample.value
  if (!isEditingSample.value) {
    updateSampleCharactersList()
    updatePreviewList_strokeReplace()
  }
}

const handleUpdateAllCharacters = () => {
  // TODO: 实现一键更新全部字符功能
  updateCharactersList_strokeReplace()
}

const handleSelectStroke = async(stroke) => {
  selectedStrokeUUID.value = stroke.uuid
  await nextTick()
  renderStrokePreview(stroke.uuid)
}

const handleSetReplacementStroke = () => {
  onStrokeReplacement.value = true
  glyphComponentsDialogVisible2.value = true
}
</script>

<template>
  <div class="wrap">
    <div class="advanced-edit-params-panel">
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
          <div class="title">笔画列表</div>
          <div class="stroke-list">
            <div class="stroke-item" v-for="stroke in strokeList" :key="stroke.uuid" @click="handleSelectStroke(stroke)">
              <div class="stroke-preview">
                <canvas v-if="!stroke.replaced" :class="`stroke-preview-${stroke.uuid}`" width="100" height="100"></canvas>
                <canvas v-else="stroke.replaced" :class="`stroke-preview-${stroke.replacement.uuid}`" width="100" height="100"></canvas>
              </div>
              <div class="stroke-info">
                <div class="stroke-name">{{ stroke.name }}</div>
                <div class="stroke-style">{{ stroke.style }}</div>
                <div class="replacement-setting-btn" v-if="!stroke.replaced">
                  <el-button @click="handleSetReplacementStroke" size="small" type="primary">设置替换笔画</el-button>
                </div>
                <div class="replacement-setting-btn" v-if="stroke.replaced">
                  <el-button @click="handleSetReplacementStroke" size="small" type="primary">修改替换笔画</el-button>
                </div>
              </div>
            </div>
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
.advanced-edit-params-panel {
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
    height: calc(100% - 50px);
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
    .stroke-list {
      .stroke-item {
        display: flex;
        flex-direction: row;
        gap: 10px;
        border-bottom: 1px solid var(--light-5);
        padding: 10px;
        box-sizing: border-box;
        .stroke-preview {
          flex: 0 0 100px;
          height: 100px;
        }
        .stroke-info {
          height: 100px;
          flex: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: var(--light-0);
          .replacement-setting-btn {
            position: absolute;
            bottom: 5px;
            right: 5px;
          }
        }
      }
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