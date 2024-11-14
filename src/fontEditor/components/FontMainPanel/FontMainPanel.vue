<script setup lang="ts">
  /**
   * 主面板
   */
  /**
   * main panel
   */

  import CharacterList from '../../components/CharacterList/CharacterList.vue'
  import GlyphList from '../../components/CharacterList/GlyphList.vue'
  import StrokeGlyphList from '../../components/CharacterList/StrokeGlyphList.vue'
  import RadicalGlyphList from '../../components/CharacterList/RadicalGlyphList.vue'
  import CompGlyphList from '../../components/CharacterList/CompGlyphList.vue'
  import EditPanel from '../../components/FontEditorPanels/EditPanel.vue'
  import GlyphEditPanel from '../../components/FontEditorPanels/GlyphEditPanel.vue'
  import ThumbnailEditPanel from '../../components/FontEditorPanels/ThumbnailEditPanel.vue'
  import { editStatus, Status } from '../../stores/font'
  import { selectedFile } from '../../stores/files'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
</script>

<template>
  <main class="font-panel">
    <div class="font-panel-empty" v-show="!selectedFile"></div>
    <character-list class="character-list" v-show="selectedFile"></character-list>
    <div class="float-part" v-show="editStatus !== Status.CharacterList && selectedFile">
      <stroke-glyph-list class="stroke-glyph-list" v-show="selectedFile && editStatus === Status.StrokeGlyphList"></stroke-glyph-list>
      <radical-glyph-list class="radical-glyph-list" v-show="selectedFile && editStatus === Status.RadicalGlyphList"></radical-glyph-list>
      <comp-glyph-list class="comp-glyph-list" v-show="selectedFile && editStatus === Status.CompGlyphList"></comp-glyph-list>
      <glyph-list class="glyph-list" v-show="selectedFile && editStatus === Status.GlyphList"></glyph-list>
      <edit-panel v-if="selectedFile && editStatus === Status.Edit"></edit-panel>
      <glyph-edit-panel v-else-if="selectedFile && editStatus === Status.Glyph"></glyph-edit-panel>
      <thumbnail-edit-panel v-else-if="selectedFile && editStatus === Status.Pic"></thumbnail-edit-panel>
    </div>
    <div class="list-switch" v-show="editStatus === Status.StrokeGlyphList || editStatus === Status.CompGlyphList || editStatus === Status.RadicalGlyphList || editStatus === Status.GlyphList || editStatus === Status.CharacterList">
      <span
        class="character-list"
        @click="editStatus = Status.CharacterList"
        :class="{
          selected: editStatus === Status.CharacterList
        }"
      >{{ t('programming.character') }}</span>
      <span
        class="stroke-glyph-list"
        @click="editStatus = Status.StrokeGlyphList"
        :class="{
          selected: editStatus === Status.StrokeGlyphList
        }"
      >{{ t('programming.stroke') }}</span>
      <span
        class="radical-glyph-list"
        @click="editStatus = Status.RadicalGlyphList"
        :class="{
          selected: editStatus === Status.RadicalGlyphList
        }"
      >{{ t('programming.radical') }}</span>
      <span
        class="comp-glyph-list"
        @click="editStatus = Status.CompGlyphList"
        :class="{
          selected: editStatus === Status.CompGlyphList
        }"
      >{{ t('programming.comp') }}</span>
      <span
        class="glyph-list"
        @click="editStatus = Status.GlyphList"
        :class="{
          selected: editStatus === Status.GlyphList
        }"
      >{{ t('programming.glyph_comp') }}</span>
    </div>
  </main>
</template>

<style scoped>
  .font-panel {
    width: 100%;
    height: 100%;
    background-color: #f5f5f5;

    .font-panel-empty {
      width: 100%;
      height: 100%;
      background-color: var(--dark-0);
    }

    .float-part {
      background-color: white;
      position: absolute;
      inset: 0;
    }
    .list-switch {
      position: fixed;
      right: 20px;
      bottom: 20px;
      /* width: 200px;
      height: 40px; */
    }

    .list-switch {
      /* background-color: var(--light-2); */
      /* border-radius: 20px; */
      display: flex;
      flex-direction: row;
      cursor: pointer;
      line-height: 40px;
      gap: 5px;
      .character-list, .glyph-list, .radical-glyph-list, .stroke-glyph-list, .comp-glyph-list {
        flex: 1;
        text-align: center;
        width: auto;
        height: 40px;
        padding: 0 20px;
        box-sizing: border-box;
        color: white;
        border: 1px solid var(--primary-1);
        line-height: 40px;
        background: var(--primary-0);
        &:hover {
          color: var(--primary-1);
        }
        &.selected {
          font-weight: bold;
          color: var(--primary-0);
          border: 1px solid var(--primary-1);
          line-height: 40px;
          background: var(--primary-5);
          /* &.character-list {
            border-radius: 20px 0 0 20px;
          }
          &.glyph-list {
            border-radius: 0 20px 20px 0;
          } */
        }
      }
    }
  }
</style>