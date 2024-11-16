<script setup lang="ts">
  /**
   * 展示文件名称tab的栏目
   */
  /**
   * files bar to show file name
   */

  import { files, removeFile, setSelectedFileUUID, selectedFileUUID, editCharacterFile, selectedFile } from '../../stores/files'
  import { editGlyph, stroke_glyphs, radical_glyphs, comp_glyphs, glyphs } from '../../stores/glyph'
  import { editStatus, Status } from '../../stores/font'
  import { setCloseFileTipDialogVisible, setFontSettingsDialogVisible } from '../../stores/dialogs'
  import { Close, Search, InfoFilled, Tools } from '@element-plus/icons-vue'

  // 关闭文件
  // close file
  const closeFile = (uuid: string) => {
    // removeFile(uuid)
    setCloseFileTipDialogVisible(true)
  }

  // 选择文件
  // select file
  const selectFile = (uuid: string) => {
    setSelectedFileUUID(uuid)
  }
</script>

<template>
  <div class="files-bar" :style="{
    'border-bottom': (editStatus === Status.CharacterList || editStatus === Status.GlyphList || editStatus === Status.StrokeGlyphList || editStatus === Status.RadicalGlyphList || editStatus === Status.CompGlyphList) ? 'none' : '1px solid var(--dark-4)',
  }">
    <el-row class="files-bar-row row-1" v-if="editStatus === Status.CharacterList || editStatus === Status.GlyphList || editStatus === Status.StrokeGlyphList || editStatus === Status.RadicalGlyphList || editStatus === Status.CompGlyphList">
      <span
        v-for="file in files.value"
        :class="{
          'file-tag': true,
          'selected': file.uuid === selectedFileUUID
        }"
      >
        <span class="file-info-wrapper" @click="() => selectFile(file.uuid)">
          <span class="file-name">
            {{ file.name }}
          </span>
          <!--<span class="unsave-mark" v-if="!file.saved">
            <font-awesome-icon icon="fa-solid fa-circle" />
          </span>-->
        </span>
        <span class="close-btn" @click="() => closeFile(file.uuid)">
          <el-icon><Close /></el-icon>
        </span>
      </span>
      <div class="right-btns" v-if="selectedFile">
        <el-icon class="right-btn"><Search /></el-icon>
        <el-popover
            placement="bottom-end"
            :width="120"
            trigger="hover"
            popper-class="info-popover"
          >
            <template #reference>
              <el-icon class="right-btn"><InfoFilled /></el-icon>
            </template>
            <div class="info-list">
              <div class="info-item">
                <span class="info-item-name">字符数量：</span>
                <span class="info-item-content">{{ selectedFile.characterList.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-item-name">笔画数量：</span>
                <span class="info-item-content">{{ stroke_glyphs.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-item-name">部首数量：</span>
                <span class="info-item-content">{{ radical_glyphs.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-item-name">字形数量：</span>
                <span class="info-item-content">{{ comp_glyphs.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-item-name">组件数量：</span>
                <span class="info-item-content">{{ glyphs.length }}</span>
              </div>
            </div>
          </el-popover>
        <el-icon class="right-btn" @click="setFontSettingsDialogVisible(true)"><Tools /></el-icon>
      </div>
    </el-row>
		<el-row class="files-bar-row" v-else-if="editStatus === Status.Edit">
			<span
        :class="{
          'file-tag': true,
          'selected': true,
        }"
      >
        <span class="file-info-wrapper">
          <span class="file-name">
            {{ editCharacterFile?.character.text }}
          </span>
        </span>
      </span>
		</el-row>
    <el-row class="files-bar-row" v-else-if="editStatus === Status.Glyph">
			<span
        :class="{
          'file-tag': true,
          'selected': true,
        }"
      >
        <span class="file-info-wrapper">
          <span class="file-name">
            {{ editGlyph.name }}
          </span>
        </span>
      </span>
		</el-row>
  </div>
</template>

<style scoped>
  .file-info-wrapper {
    display: flex;
    flex: auto;
    margin-left: 5px;
  }
  .row-1 {
    justify-content: space-between;
  }
  .info-list {
    .info-item {
      margin-bottom: 5px;
    }
  }
  .right-btns {
    font-size: 22px;
    line-height: 36px;
    margin-right: 5px;
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;
    color: var(--primary-0);
    .right-btn {
      cursor: pointer;
      &:hover {
        color: var(--primary-2);
      }
    }
  }
  .files-bar {
    width: 100%;
    z-index: 99;
    background-color: white;
    border-bottom: 1px solid var(--dark-4);
    box-sizing: border-box;
    .files-bar-row {
      width: 100%;
      .file-tag {
        display: flex;
        width: 120px;
        height: 36px;
        line-height: 36px;
        flex-direction: row;
        text-align: center;
        border-right: 1px solid var(--dark-4);
        cursor: pointer;
        padding-right: 10px;
        background-color: var(--light-2);
        color: var(--primary-0);
        &.selected {
          /*background-color: var(--primary-0);
          color: var(--primary-5);*/
          background-color: var(--primary-5);
          border: none;
          color: var(--primary-0);
          font-weight: bold;
        }
        &:hover {
          /*background-color: var(--primary-0);
          color: var(--primary-5);*/
        }
        .close-btn {
          cursor: pointer;
          flex: 0 0 16px;
          .el-icon {
            margin: 10px 0;
            &:hover {
              background-color: var(--primary-2)
            }
          }
        }
        .file-name {
          flex: auto;
          text-overflow: ellipsis;
        }
        .unsave-mark {
          flex: 0 0 10px;
          margin-right: 5px;
        }
      }
    }
  }
  svg {
    width: 100%;
    height: 100%;
  }
</style>