<script setup lang="ts">
	/**
	 * 字体编辑器底部栏，主要包含移动画布，缩放等辅助功能
	 */
	/**
	 * bottom bar of character editor, contains canvas moving and scaling tool
	 */

  import { modifyGlyph, editGlyph, editGlyphUUID } from '../../stores/glyph'
  import { tool, setTool } from '../../stores/global'
  import { coordsText } from '../../stores/font'
  import { ref, type Ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
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
    editGlyph
  ], () => {
    if (!editGlyph.value) return
    translateText.value = `${editGlyph.value.view.translateX},${editGlyph.value.view.translateY}`
  })

  // 重置translateText
  // reset translateText
  const resetTranslate = () => {
    if (editGlyph.value && editGlyph.value.view) {
      editGlyph.value.view.translateX = 0
      editGlyph.value.view.translateY = 0
    }
  }

  // 缩小
  // zoom out
  const zoomEditOut = () => {
    modifyGlyph(editGlyphUUID.value, {
      view: {
        zoom: editGlyph.value.view.zoom - zoomScale >= 0 ? editGlyph.value.view.zoom - zoomScale : 0,
      }
    })
    emitter.emit('updateGlyphView')
  }

  // 放大
	// zoom in
  const zoomEditIn = () => {
    modifyGlyph(editGlyphUUID.value, {
      view: {
        zoom: editGlyph.value.view.zoom + zoomScale <= 200 ? editGlyph.value.view.zoom + zoomScale : 200,
      }
    })
    emitter.emit('updateGlyphView')
  }

	const onZoomChange = (value) => {
		const _value = value <= 200 ? (value >= 0 ? value : 0) : 200
    modifyGlyph(editGlyphUUID.value, {
      view: {
        zoom: _value
      }
    })
    emitter.emit('updateGlyphView')
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
    <el-row class="bottom-bar-row">
      <span class="tools-wrapper">
        <span class="translate-wrapper">
          <el-input
            v-model="translateText"
            class="translate-text"
            :disabled="true"
            v-if="tool === 'translateMover'"
          >
            <template #append>
              <el-button @click="resetTranslate">{{ t('panels.bottomBar.reset') }}</el-button>
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
            v-else-if="tool === 'translateMover'"
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
          <el-input class="zoom-value" :model-value="editGlyph && editGlyph.view.zoom" @input="onZoomChange">
            <template #append>%</template>
          </el-input>
          <span class="zoom-in" @click="zoomEditIn">
            <el-icon><ZoomIn /></el-icon>
          </span>
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