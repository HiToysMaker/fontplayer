<script lang="ts" setup>
import { activePanel, PanelType, setActivePanel } from '../../stores/advancedEdit'
import GlobalParamsPanel from './GlobalParamsPanel.vue'
import ConditionFilterPanel from './ConditionFilterPanel.vue'
import ScriptsPanel from './ScriptsPanel.vue'
import { setEditStatus, Status } from '../../stores/font'
import { Grid } from '@element-plus/icons-vue'
import StrokeReplacePanel from './StrokeReplacePanel.vue'
import StyleSwitchPanel from './StyleSwitchPanel.vue'

const toList = () => {
  setEditStatus(Status.CharacterList)
}
</script>

<template>
  <div class="advanced-edit-panel">
    <header class="advanced-edit-panel-header">
      <div class="title">
        <el-button
          @pointerdown="() => setActivePanel(PanelType.GlobalVariables)"
          :type="activePanel === PanelType.GlobalVariables ? 'primary' : 'default'">
          <el-icon><Tools /></el-icon>
          全局变量
        </el-button>
        <el-button
          @pointerdown="() => setActivePanel(PanelType.StrokeReplace)"
          :type="activePanel === PanelType.StrokeReplace ? 'primary' : 'default'">
          <el-icon><Tools /></el-icon>
          笔画替换
        </el-button>
        <el-button
          @pointerdown="() => setActivePanel(PanelType.StyleSwitch)"
          :type="activePanel === PanelType.StyleSwitch ? 'primary' : 'default'">
          <el-icon><Tools /></el-icon>
          风格切换
        </el-button>
        <el-button
          @pointerdown="() => setActivePanel(PanelType.ConditionFilter)"
          :type="activePanel === PanelType.ConditionFilter ? 'primary' : 'default'">
          <el-icon><Tools /></el-icon>
          条件筛选
        </el-button>
        <el-button
          @pointerdown="() => setActivePanel(PanelType.Script)"
          :type="activePanel === PanelType.Script ? 'primary' : 'default'">
          <el-icon><Tools /></el-icon>
          脚本
        </el-button>
      </div>
      <div class="to-list" @pointerdown="toList">
        <el-icon class="to-list-icon"><Grid /></el-icon>
        <span class="to-list-label">字符列表</span>
      </div>
    </header>
    <main class="advanced-edit-panel-main">
      <global-params-panel v-if="activePanel === PanelType.GlobalVariables"></global-params-panel>
      <condition-filter-panel v-if="activePanel === PanelType.ConditionFilter"></condition-filter-panel>
      <scripts-panel v-if="activePanel === PanelType.Script"></scripts-panel>
      <stroke-replace-panel v-if="activePanel === PanelType.StrokeReplace"></stroke-replace-panel>
      <style-switch-panel v-if="activePanel === PanelType.StyleSwitch"></style-switch-panel>
    </main>
  </div>
</template>

<style scoped>
.advanced-edit-panel {
  width: 100%;
  height: 100%;
  .advanced-edit-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;
    padding-left: 5px;
    .to-list {
      margin: 5px;
      margin-left: auto;
      line-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 100px;
      cursor: pointer;
      background-color: var(--primary-5);
      &:hover {
        background-color: var(--primary-4);
      }
      .el-icon {
        flex: 0 0 32px;
      }
    }
  }
  .advanced-edit-panel-main {
    width: 100%;
    height: 100%;
    background-color: white;
  }
}
</style>