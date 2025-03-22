<script setup lang="ts">
  /**
	 * 设置为全局变量窗口
	 */
	/**
	 * dialog for setting as global param
	 */

	import { setSetAsGlobalParamDialogVisible, setAsGlobalParamDialogVisible } from '../../stores/dialogs'
	import { constantGlyphMap, ConstantGlyphPair, constants, constantsMap, ConstantType, convertGlyphType, editGlyph, editGlyphUUID, getGlyphType, GlyphType, ParameterType, selectedComponent, selectedParam, selectedParamType } from '../../stores/glyph'
	import { editCharacterFileUUID, selectedComponent as selectedComponent_character } from '../../stores/files'
  import { genUUID } from '../../../utils/string'
	import * as R from 'ramda';
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t } = useI18n()

  const name = ref('')

  const handleCancel = () => {
    setSetAsGlobalParamDialogVisible(false)
  }

  const handleClick = () => {
		if (selectedParam.value) {
			const param = R.clone(selectedParam.value)
			param.uuid = genUUID()
			param.ratio = ''
			param.ratioed = false
			param.name = name.value
			constants.value.push(param)
			constantsMap.update(constants.value)

			if (selectedParamType.value === 'glyph_components') {
				for (let i = 0; i < selectedComponent.value.value.parameters.parameters.length; i++) {
					if (selectedComponent.value.value.parameters.parameters[i].uuid === selectedParam.value.uuid) {
						selectedComponent.value.value.parameters.parameters[i].value = param.uuid
						selectedComponent.value.value.parameters.parameters[i].type = ParameterType.Constant
						if (selectedComponent.value.value.system_script[selectedComponent.value.value.parameters.parameters[i].name]) {
							delete selectedComponent.value.value.system_script[selectedComponent.value.value.parameters.parameters[i].name]
						}
						const type = getGlyphType(editGlyphUUID.value)
						const arr = constantGlyphMap.get(param.uuid)
						arr.push({
							constantType: ConstantType.Component,
							glyphType: convertGlyphType(type),
							parameterUUID: selectedParam.value.uuid,
							parentUUID: editGlyphUUID.value,
							glyphUUID: selectedComponent.value.uuid,
						} as ConstantGlyphPair)
					}
				}
			} else if (selectedParamType.value === 'character_components') {
				for (let i = 0; i < selectedComponent_character.value.value.parameters.parameters.length; i++) {
					if (selectedComponent_character.value.value.parameters.parameters[i].uuid === selectedParam.value.uuid) {
						selectedComponent_character.value.value.parameters.parameters[i].value = param.uuid
						selectedComponent_character.value.value.parameters.parameters[i].type = ParameterType.Constant
						if (selectedComponent_character.value.value.system_script[selectedComponent_character.value.value.parameters.parameters[i].name]) {
							delete selectedComponent_character.value.value.system_script[selectedComponent_character.value.value.parameters.parameters[i].name]
						}
						const arr = constantGlyphMap.get(param.uuid)
						arr.push({
							constantType: ConstantType.Component,
							glyphType: GlyphType.Char,
							parameterUUID: selectedParam.value.uuid,
							parentUUID: editCharacterFileUUID.value,
							glyphUUID: selectedComponent_character.value.uuid,
						} as ConstantGlyphPair)
					}
				}
			} else if (selectedParamType.value === 'glyph_params') {
				for (let i = 0; i < editGlyph.value.parameters.parameters.length; i++) {
					if (editGlyph.value.parameters.parameters[i].uuid === selectedParam.value.uuid) {
						editGlyph.value.parameters.parameters[i].value = param.uuid
						editGlyph.value.parameters.parameters[i].type = ParameterType.Constant
						if (editGlyph.value.value.system_script[editGlyph.value.value.parameters.parameters[i].name]) {
							delete editGlyph.value.value.system_script[editGlyph.value.value.parameters.parameters[i].name]
						}
						const type = getGlyphType(editGlyphUUID.value)
						const arr = constantGlyphMap.get(param.uuid)
						arr.push({
							constantType: ConstantType.Parameter,
							glyphType: convertGlyphType(type),
							parameterUUID: selectedParam.value.uuid,
							glyphUUID: editGlyphUUID.value,
						} as ConstantGlyphPair)

					}
				}
			}
		}
		name.value = ''
		selectedParam.value = null
    setSetAsGlobalParamDialogVisible(false)
  }
</script>

<template>
  <el-dialog
    v-model="setAsGlobalParamDialogVisible"
    title="设置为全局变量"
    width="320px"
  >
    <div class="form-wrapper">
      <el-form label-width="80px">
        <el-form-item label="参数名称">
          <el-input v-model="name" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="handleCancel">取消</el-button>
        <el-button type="primary" @pointerdown="handleClick">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>