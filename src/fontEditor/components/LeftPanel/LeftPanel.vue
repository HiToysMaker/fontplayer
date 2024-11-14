<script setup lang="ts">
  /**
   * 左面板
   */
  /**
   * left panel
   */

  import CharacterComponentList from '../../components/List/CharacterComponentList.vue'
  import GlyphComponentList from '../../components/List/GlyphComponentList.vue'
  import ViewList from '../../components/ViewList/ViewList.vue'
  import CharacterSubComponentList from '../../components/List/CharacterSubComponentList.vue'
  import { editCharacterFile } from '../../stores/files'
  import GlyphSubComponentList from '../../components/List/GlyphSubComponentList.vue'
  import { editGlyph } from '../../stores/glyph'
  import { editPanelCompFilter, glyphPanelCompFilter, editStatus, setEditPanelCompFilter, setGlyphPanelCompFilter, setPicPanelCompFilter, Status } from '../../stores/font'
  import { useI18n } from 'vue-i18n'
  const { tm, t } = useI18n()

  const editFilterOptions = [
    {
      value: 'all',
    },
    {
      value: 'font',
    },
  ]

  const handleEditPanelSelect = (value: string) => {
    setEditPanelCompFilter(value)
  }

  const handleGlyphPanelSelect = (value: string) => {
    setGlyphPanelCompFilter(value)
  }

  // const handlePicPanelSelect = (value: string) => {
  //   setPicPanelCompFilter(value)
  // }
</script>

<template>
  <div class="left-panel">
    <div
      class="left-panel-header"
      v-show="(editCharacterFile && (!editCharacterFile.selectedComponentsTree || !editCharacterFile.selectedComponentsTree.length)) ||
              (editGlyph && (!editGlyph.selectedComponentsTree || !editGlyph.selectedComponentsTree.length))"
    >
      <el-select
        :model-value="editPanelCompFilter"
        class="edit-filter-select"
        placeholder="Select"
        v-if="editStatus === Status.Edit"
        @change="handleEditPanelSelect"
      >
        <el-option
          v-for="item in editFilterOptions"
          :key="item.value"
          :label="tm(`panels.filter.${item.value}`)"
          :value="item.value"
        />
      </el-select>
      <el-select
        :model-value="glyphPanelCompFilter"
        class="edit-filter-select"
        placeholder="Select"
        v-else-if="editStatus === Status.Glyph"
        @change="handleGlyphPanelSelect"
      >
        <el-option
          v-for="item in editFilterOptions"
          :key="item.value"
          :label="tm(`panels.filter.${item.value}`)"
          :value="item.value"
        />
      </el-select>
      <div class="view" v-if="editStatus === Status.Pic">
        {{ t('panels.view') }}
      </div>
    </div>
    <div class="left-panel-content">
      <character-sub-component-list
        v-if="editStatus === Status.Edit &&
              editCharacterFile &&
              editCharacterFile.selectedComponentsTree &&
              editCharacterFile.selectedComponentsTree.length"
      ></character-sub-component-list>
      <glyph-sub-component-list
        v-else-if="editStatus === Status.Glyph &&
              editGlyph &&
              editGlyph.selectedComponentsTree &&
              editGlyph.selectedComponentsTree.length"
      ></glyph-sub-component-list>
      <character-component-list v-else-if="editStatus === Status.Edit"></character-component-list>
      <glyph-component-list v-else-if="editStatus === Status.Glyph"></glyph-component-list>
      <view-list v-else-if="editStatus === Status.Pic"></view-list>
    </div>
  </div>
</template>

<style scoped>
  .left-panel {
    width: 100%;
    height: 100%;
    border-right: 1px solid var(--dark-4);
    z-index: 99;
    background-color: var(--dark-0);
    .left-panel-header {
      width: 100%;
      /* height: 50px; */
      border-bottom: 1px solid var(--dark-4);
      line-height: 36px;
      padding: 5px 15px 8px 15px;
      .view {
        color: var(--primary-5);
      }
    }
  }
</style>
<style>
  .left-panel {
    .el-input__wrapper {
      background-color: var(--primary-0);
      color: var(--primary-5);
      border-radius: 10px 5px 20px;
      box-shadow: 0 0 0 1px var(--primary-1,var(--primary-1)) inset;
      .el-input__inner {
        color: var(--primary-5);
      }
    }
  }
</style>