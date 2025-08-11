<script setup lang="ts">
  /**
	 * 选择全局变量窗口
	 */
	/**
	 * dialog for select global param
	 */

	import { emitter } from '../../Event/bus'
	import { setSelectGlobalParamDialogVisible, selectGlobalParamDialogVisible } from '../../stores/dialogs'
	import { editCharacterFile, editCharacterFileUUID, executeCharacterScript, selectedComponent as selectedComponent_character } from '../../stores/files'
	import { constantGlyphMap, ConstantGlyphPair, constants, constantsMap, ConstantType, convertGlyphType, editGlyph, editGlyphUUID, executeScript, getGlyphType, GlyphType, ParameterType, selectedComponent, selectedParam, selectedParamType } from '../../stores/glyph'
  import { Ref, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t } = useI18n()

	const parameter: Ref<string> = ref('')

  const handleCancel = () => {
    setSelectGlobalParamDialogVisible(false)
  }

  const handleClick = () => {
		if (parameter.value && selectedParam.value) {
			if (selectedParamType.value === 'glyph_components') {
				for (let i = 0; i < selectedComponent.value.value.parameters.parameters.length; i++) {
					if (selectedComponent.value.value.parameters.parameters[i].uuid === selectedParam.value.uuid) {
						selectedComponent.value.value.parameters.parameters[i].value = parameter.value
						selectedComponent.value.value.parameters.parameters[i].type = ParameterType.Constant
						selectedComponent.value.value.parameters.parameters[i].ratio = ''
						selectedComponent.value.value.parameters.parameters[i].ratioed = false
						if (selectedComponent.value.value.system_script && selectedComponent.value.value.system_script[selectedComponent.value.value.parameters.parameters[i].name]) {
							delete selectedComponent.value.value.system_script[selectedComponent.value.value.parameters.parameters[i].name]
						}
						const type = getGlyphType(editGlyphUUID.value)
						if (!constantGlyphMap.get(parameter.value)) {
							constantGlyphMap.set(parameter.value, [])
						}
						const arr = constantGlyphMap.get(parameter.value)
						arr.push({
							constantType: ConstantType.Component,
							glyphType: convertGlyphType(type),
							parameterUUID: selectedParam.value.uuid,
							parentUUID: editGlyphUUID.value,
							glyphUUID: selectedComponent.value.uuid,
						} as ConstantGlyphPair)
					}
					executeScript(editGlyph.value)
					emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
					emitter.emit('renderGlyph')
				}
			} else if (selectedParamType.value === 'character_components') {
				for (let i = 0; i < selectedComponent_character.value.value.parameters.parameters.length; i++) {
					if (selectedComponent_character.value.value.parameters.parameters[i].uuid === selectedParam.value.uuid) {
						selectedComponent_character.value.value.parameters.parameters[i].value = parameter.value
						selectedComponent_character.value.value.parameters.parameters[i].type = ParameterType.Constant
						selectedComponent_character.value.value.parameters.parameters[i].ratio = ''
						selectedComponent_character.value.value.parameters.parameters[i].ratioed = false
						if (selectedComponent_character.value.value.system_script && selectedComponent_character.value.value.system_script[selectedComponent_character.value.value.parameters.parameters[i].name]) {
							delete selectedComponent_character.value.value.system_script[selectedComponent_character.value.value.parameters.parameters[i].name]
						}
						if (!constantGlyphMap.get(parameter.value)) {
							constantGlyphMap.set(parameter.value, [])
						}
						const arr = constantGlyphMap.get(parameter.value)
						arr.push({
							constantType: ConstantType.Component,
							glyphType: GlyphType.Char,
							parameterUUID: selectedParam.value.uuid,
							parentUUID: editCharacterFileUUID.value,
							glyphUUID: selectedComponent_character.value.uuid,
						} as ConstantGlyphPair)
						if (selectedComponent_character.value.value.type === 'glyph') {
							executeScript(selectedComponent_character.value.value)
						}
						emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
						emitter.emit('renderCharacter')
					}
				}
			} else if (selectedParamType.value === 'glyph_params') {
				for (let i = 0; i < editGlyph.value.parameters.parameters.length; i++) {
					if (editGlyph.value.parameters.parameters[i].uuid === selectedParam.value.uuid) {
						editGlyph.value.parameters.parameters[i].value = parameter.value
						editGlyph.value.parameters.parameters[i].type = ParameterType.Constant
						editGlyph.value.parameters.parameters[i].ratio = ''
						editGlyph.value.parameters.parameters[i].ratioed = false
						if (editGlyph.value.value.system_script && editGlyph.value.value.system_script[editGlyph.value.value.parameters.parameters[i].name]) {
							delete editGlyph.value.value.system_script[editGlyph.value.value.parameters.parameters[i].name]
						}
						const type = getGlyphType(editGlyphUUID.value)
						if (!constantGlyphMap.get(parameter.value)) {
							constantGlyphMap.set(parameter.value, [])
						}
						const arr = constantGlyphMap.get(parameter.value)
						arr.push({
							constantType: ConstantType.Parameter,
							glyphType: convertGlyphType(type),
							parameterUUID: selectedParam.value.uuid,
							glyphUUID: editGlyphUUID.value,
						} as ConstantGlyphPair)
						executeScript(editGlyph.value)
						emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
						emitter.emit('renderGlyph')
					}
				}
			}
		}
		parameter.value = ''
    setSelectGlobalParamDialogVisible(false)
  }
</script>

<template>
  <el-dialog
    v-model="selectGlobalParamDialogVisible"
    :title="tm('dialogs.selectGlobalParamDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <el-form label-width="80px">
        <el-form-item :label="tm('dialogs.selectGlobalParamDialog.globalParam')">
					<el-select v-model="parameter" class="parameter-const-select">
							<el-option
								v-for="item in constants"
								:key="item.uuid"
								:label="item.name"
								:value="item.uuid"
							/>
						</el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="handleCancel">{{ t('dialogs.selectGlobalParamDialog.cancel') }}</el-button>
        <el-button type="primary" @pointerdown="handleClick">
          {{ t('dialogs.selectGlobalParamDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>