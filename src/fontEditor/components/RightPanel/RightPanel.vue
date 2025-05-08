<script setup lang="ts">
  /**
   * 右面板
   */
  /**
   * right panel
   */

  import SettingsPanel from '../SettingsPanel/SettingsPanel.vue'
  import PenEditPanel from '../paramsEditPanels/PenEditPanel.vue'
  import PolygonEditPanel from '../paramsEditPanels/PolygonEditPanel.vue'
  import PictureEditPanel from '../paramsEditPanels/PictureEditPanel.vue'
  import RectangleEditPanel from '../paramsEditPanels/RectangleEditPanel.vue'
  import EllipseEditPanel from '../paramsEditPanels/EllipseEditPanel.vue'
  import FontPicEditPanel from '../paramsEditPanels/FontPicEditPanel.vue'
  import GlyphEditPanel from '../paramsEditPanels/GlyphEditPanel.vue'
  import GlyphEditPanelGlyph from '../paramsEditPanels/GlyphEditPanel_Glyph.vue'
  import GlyphParamsPanel from '../paramsEditPanels/GlyphParamsPanel.vue'
  import LayoutEditPanel from '../paramsEditPanels/LayoutEditPanel.vue'
  import MetricsEditPanel from '../paramsEditPanels/MetricsEditPanel.vue'
  import { selectedComponent, selectedComponentUUID,} from '../../stores/files'
  import { selectedComponent as selectedComponent_glyph, selectedComponentUUID as selectedComponentUUID_glyph,} from '../../stores/glyph'
  import { editStatus, Status } from '../../stores/font'
  import { tool } from '../../stores/global'
</script>

<template>
  <div class="right-panel" v-if="editStatus !== Status.Glyph">
    <layout-edit-panel
      v-if="editStatus === Status.Edit && tool === 'grid'"
    ></layout-edit-panel>
    <metrics-edit-panel
      v-else-if="editStatus === Status.Edit && tool === 'metrics'"
    ></metrics-edit-panel>
    <settings-panel
      v-else-if="!selectedComponentUUID && editStatus === Status.Edit"
    ></settings-panel>
    <pen-edit-panel
      v-else-if="selectedComponentUUID && selectedComponent.type === 'pen'"
    ></pen-edit-panel>
    <ellipse-edit-panel
      v-else-if="selectedComponentUUID && selectedComponent.type === 'ellipse'"
    ></ellipse-edit-panel>
    <rectangle-edit-panel
      v-else-if="selectedComponentUUID && selectedComponent.type === 'rectangle'"
    ></rectangle-edit-panel>
    <polygon-edit-panel
      v-else-if="selectedComponentUUID && selectedComponent.type === 'polygon'"
    ></polygon-edit-panel>
    <picture-edit-panel
      v-else-if="selectedComponentUUID && selectedComponent.type === 'picture'"
    ></picture-edit-panel>
    <glyph-edit-panel
      v-else-if="tool !== 'grid' && editStatus === Status.Edit && selectedComponentUUID && selectedComponent.type === 'glyph'"
    ></glyph-edit-panel>
    <font-pic-edit-panel
      v-else-if="editStatus === Status.Pic"
    ></font-pic-edit-panel>
  </div>
  <div class="right-panel" v-else>
    <!-- <settings-panel
      v-if="!selectedComponentUUID_glyph && editStatus === Status.Edit"
    ></settings-panel> -->
    <pen-edit-panel
      v-if="selectedComponentUUID_glyph && selectedComponent_glyph.type === 'pen'"
    ></pen-edit-panel>
    <ellipse-edit-panel
      v-if="selectedComponentUUID_glyph && selectedComponent_glyph.type === 'ellipse'"
    ></ellipse-edit-panel>
    <rectangle-edit-panel
      v-if="selectedComponentUUID_glyph && selectedComponent_glyph.type === 'rectangle'"
    ></rectangle-edit-panel>
    <polygon-edit-panel
      v-if="selectedComponentUUID_glyph && selectedComponent_glyph.type === 'polygon'"
    ></polygon-edit-panel>
    <glyph-params-panel
      v-if="tool === 'params'"
    ></glyph-params-panel>
    <glyph-edit-panel-glyph
      v-if="tool !== 'params' && editStatus === Status.Glyph && selectedComponentUUID_glyph && selectedComponent_glyph.type === 'glyph'"
    ></glyph-edit-panel-glyph>
  </div>
</template>

<style scoped>
  .right-panel {
    width: 100%;
    height: 100%;
    text-align: left;
    border-left: solid 1px var(--dark-4);
    overflow-y: scroll;
    z-index: 99;
    background-color: white;
  }
</style>