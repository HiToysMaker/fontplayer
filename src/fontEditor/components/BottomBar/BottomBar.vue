<script setup lang="ts">
	/**
	 * 字体编辑器底部栏，主要包含移动画布，缩放等辅助功能
	 */
	/**
	 * bottom bar of character editor, contains canvas moving and scaling tool
	 */

  import { modifyCharacterFile, editCharacterFile, editCharacterFileUUID } from '../../stores/files'
  import { editStatus, picZoom, setPicZoom, Status } from '../../stores/font'
  import { tool, setTool } from '../../stores/global'
  import { ref, type Ref, watch } from 'vue'
  import { coordsText } from '../../stores/font'
  import { useI18n } from 'vue-i18n'
  import { editGlyphUUID, modifyGlyph } from '../../stores/glyph'
  import { emitter } from '../../Event/bus'
  import { ZoomOut, ZoomIn } from '@element-plus/icons-vue'
  const { t } = useI18n()

  // 移动画布时，显示的移动坐标
  // translation coordinates on canvas moving
  const translateText: Ref<string> = ref('')

  // 每次缩放时的单位缩放百分比步长
  // zoom step
  const zoomScale = 10

  // 移动画布时，更新translateText
  // update translateText when canvas moving
  watch([
    editCharacterFile
  ], () => {
    if (!editCharacterFile.value) return
    translateText.value = `${editCharacterFile.value.view.translateX},${editCharacterFile.value.view.translateY}`
  }, {
    deep: true,
  })

  // 重置translateText
  // reset translateText
  const resetTranslate = () => {
    if (editCharacterFile.value && editCharacterFile.value.view) {
      editCharacterFile.value.view.translateX = 0
      editCharacterFile.value.view.translateY = 0
    }
  }

  // 缩小
  // zoom out
  const zoomEditOut = () => {
    modifyCharacterFile(editCharacterFileUUID.value, {
      view: {
        zoom: editCharacterFile.value.view.zoom - zoomScale >= 0 ? editCharacterFile.value.view.zoom - zoomScale : 0,
      }
    })
    emitter.emit('updateCharacterView')
  }

  // 放大
	// zoom in
  const zoomEditIn = () => {
    modifyCharacterFile(editCharacterFileUUID.value, {
      view: {
        zoom: editCharacterFile.value.view.zoom + zoomScale <= 200 ? editCharacterFile.value.view.zoom + zoomScale : 200,
      }
    })
    emitter.emit('updateCharacterView')
  }

	const onZoomChange = (value) => {
		const _value = value <= 200 ? (value >= 0 ? value : 0) : 200
    modifyCharacterFile(editCharacterFileUUID.value, {
      view: {
        zoom: _value
      }
    })
    emitter.emit('updateCharacterView')
	}

	// 从图片中提取时使用，缩小
	// used in extracting from pic, zoom out
  const zoomPicOut = () => {
    const zoom = picZoom.value - zoomScale >= 0 ? picZoom.value - zoomScale : 0
    setPicZoom(zoom)
  }

	// 从图片中提取时使用，放大
	// used in extracting from pic, zoom in
  const zoomPicIn = () => {
    const zoom = picZoom.value + zoomScale <= 200 ? picZoom.value + zoomScale : 200
    setPicZoom(zoom)
  }

	// 切换至移动画布工具
	// switch tool to translate
  const onTranslate = () => {
    setTool('translateMover')
  }

	// 切换至选择工具
	// switch tool to select
  const offTranslate = () => {
    setTool('select')
  }

  // 切换至坐标查看工具
	// switch tool to coords viewer
  const onCoordsViewer = () => {
    setTool('coordsViewer')
  }

	// 切换至选择工具
	// switch tool to select
  const offCoordsViewer = () => {
    setTool('select')
  }
</script>

<template>
  <div class="bottom-bar">
    <el-row class="bottom-bar-row" v-if="editStatus === Status.Edit">
      <span class="tools-wrapper">
        <span class="translate-wrapper">
          <el-input
            v-model="translateText"
            class="translate-text"
            :disabled="true"
            v-if="tool === 'translateMover'"
          >
            <template #append>
              <el-button @click="resetTranslate">归零</el-button>
            </template>
          </el-input>
          <font-awesome-icon
            class="translate-btn"
            @click="onTranslate"
            icon="fa-regular fa-hand"
            v-if="tool !== 'translateMover'"
          />
          <font-awesome-icon
            class="translate-edit-btn"
            @click="offTranslate"
            icon="fa-solid fa-hand"
            v-if="tool === 'translateMover'"
          />
        </span>
        <span class="coords-wrapper">
          <el-input
            v-model="coordsText"
            class="coords-text"
            :disabled="true"
            v-if="tool === 'coordsViewer'"
          >
            <template #prepend>
              {{ t('panels.bottomBar.coords') }}
            </template>
          </el-input>
          <font-awesome-icon
            class="coords-btn"
            @click="onCoordsViewer"
            icon="fa-solid fa-arrow-pointer"
            v-if="tool !== 'coordsViewer'"
          />
          <font-awesome-icon
            class="coords-edit-btn"
            @click="offCoordsViewer"
            icon="fa-solid fa-arrow-pointer"
            v-else-if="tool === 'coordsViewer'"
          />
        </span>
        <span class="zoom-settings-wrapper">
          <span class="zoom-out" @click="zoomEditOut">
            <el-icon><ZoomOut /></el-icon>
          </span>
          <el-input class="zoom-value" :model-value="editCharacterFile && editCharacterFile.view.zoom" @input="onZoomChange">
            <template #append>%</template>
          </el-input>
          <span class="zoom-in" @click="zoomEditIn">
            <el-icon><ZoomIn /></el-icon>
          </span>
        </span>
      </span>
    </el-row>
    <el-row class="bottom-bar-row" v-if="editStatus === Status.Pic">
      <span class="zoom-settings-wrapper">
        <span class="zoom-out" @click="zoomPicOut">
          <el-icon><ZoomOut /></el-icon>
        </span>
        <el-input class="zoom-value" :model-value="picZoom">
          <template #append>%</template>
        </el-input>
        <span class="zoom-in" @click="zoomPicIn">
          <el-icon><ZoomIn /></el-icon>
        </span>
      </span>
    </el-row>
  </div>
</template>

<style scoped>
  .bottom-bar, .bottom-bar-row {
    width: 100%;
    position: relative;
    z-index: 99;
    background-color: white;
  }
  .tools-wrapper {
    position: absolute;
    right: 5px;
    display: flex;
    flex-direction: row;
  }
  .translate-wrapper {
    line-height: 30px;
    .translate-btn, .translate-edit-btn {
      cursor: pointer;
    }
  }
  .coords-wrapper {
    line-height: 30px;
    margin: 0 10px;
    .coords-btn, .coords-edit-btn {
      cursor: pointer;
    }
    .coords-text {
      width: 160px;
    }
  }
  .zoom-settings-wrapper {
    display: flex;
    flex-direction: row;
    width: 180px;
    margin-left: auto;
  }
  .el-icon {
    width: 100%;
    height: 100%;
  }
  .zoom-out, .zoom-in {
    flex: 0 0 36px;
    cursor: pointer;
  }
  .zoom-value, .translate-text, .coords-text {
    flex: auto;
    border-radius: 0;
    height: 20px;
    margin: 6px 0;
  }
  .translate-text, .coords-text {
    width: 120px;
    margin: 0 10px;
  }
</style>