import { ref, type Ref } from 'vue'

// 新建字体文件窗口
// dialog for creating new font file
const createFileDialogVisible: Ref<boolean> = ref(false)
const setCreateFileDialogVisible = (visible: boolean) => {
	createFileDialogVisible.value = visible
}

// 字体设置窗口
// dialog for font setting
const fontSettingsDialogVisible: Ref<boolean> = ref(false)
const setFontSettingsDialogVisible = (visible: boolean) => {
	fontSettingsDialogVisible.value = visible
}

// 字体设置窗口
// dialog for font setting
const fontSettings2DialogVisible: Ref<boolean> = ref(false)
const setFontSettings2DialogVisible = (visible: boolean) => {
	fontSettings2DialogVisible.value = visible
}

// 偏好设置窗口
// dialog for preference setting
const preferenceSettingsDialogVisible: Ref<boolean> = ref(false)
const setPreferenceSettingsDialogVisible = (visible: boolean) => {
	preferenceSettingsDialogVisible.value = visible
}

// 添加字符窗口
// dialog for adding character(text) file
const addTextDialogVisible: Ref<boolean> = ref(false)
const setAddTextDialogVisible = (visible: boolean) => {
	addTextDialogVisible.value = visible
}

// 添加字形窗口
// dialog for adding glyph
const addGlyphDialogVisible: Ref<boolean> = ref(false)
const setAddGlyphDialogVisible = (visible: boolean) => {
	addGlyphDialogVisible.value = visible
}

// 复制字形窗口
// dialog for copying glyph
const copyGlyphDialogVisible: Ref<boolean> = ref(false)
const setCopyGlyphDialogVisible = (visible: boolean) => {
	copyGlyphDialogVisible.value = visible
}

// 编辑字形名称窗口
// dialog for editing glyph name
const editGlyphDialogVisible: Ref<boolean> = ref(false)
const setEditGlyphDialogVisible = (visible: boolean) => {
	editGlyphDialogVisible.value = visible
}

// 复制字符窗口
// dialog for copying character
const copyCharacterDialogVisible: Ref<boolean> = ref(false)
const setCopyCharacterDialogVisible = (visible: boolean) => {
	copyCharacterDialogVisible.value = visible
}

// 编辑字符名称窗口
// dialog for editing character name
const editCharacterDialogVisible: Ref<boolean> = ref(false)
const setEditCharacterDialogVisible = (visible: boolean) => {
	editCharacterDialogVisible.value = visible
}

// 添加字形组件窗口
// dialog for adding glyph component
const glyphComponentsDialogVisible: Ref<boolean> = ref(false)
const setGlyphComponentsDialogVisible = (visible: boolean) => {
	glyphComponentsDialogVisible.value = visible
}

// 添加web图标窗口
// dialog for adding character(icon) file
const addIconDialogVisible: Ref<boolean> = ref(false)
const setAddIconDialogVisible = (visible: boolean) => {
	addIconDialogVisible.value = visible
}

// 语言设置窗口
// dialog for language settings
const languageSettingsDialogVisible: Ref<boolean> = ref(false)
const setLanguageSettingsDialogVisible = (visible: boolean) => {
	languageSettingsDialogVisible.value = visible
}

// 导入模板窗口
// dialog for import templates file
const importTemplatesDialogVisible: Ref<boolean> = ref(false)
const setImportTemplatesDialogVisible = (visible: boolean) => {
	importTemplatesDialogVisible.value = visible
}

// 设置为全局变量窗口
// dialog for set as global param
const setAsGlobalParamDialogVisible: Ref<boolean> = ref(false)
const setSetAsGlobalParamDialogVisible = (visible: boolean) => {
	setAsGlobalParamDialogVisible.value = visible
}

// 选择全局变量窗口
// dialog for select global param
const selectGlobalParamDialogVisible: Ref<boolean> = ref(false)
const setSelectGlobalParamDialogVisible = (visible: boolean) => {
	selectGlobalParamDialogVisible.value = visible
}

// tips窗口
// dialog for tips
const tipsDialogVisible: Ref<boolean> = ref(false)
const setTipsDialogVisible = (visible: boolean) => {
	tipsDialogVisible.value = visible
}

// 关闭文件tips窗口
// dialog for close file tips
const closeFileTipDialogVisible: Ref<boolean> = ref(false)
const setCloseFileTipDialogVisible = (visible: boolean) => {
	closeFileTipDialogVisible.value = visible
}

// 保存文件tips窗口
// dialog for save file tips
const saveFileTipDialogVisible: Ref<boolean> = ref(false)
const setSaveFileTipDialogVisible = (visible: boolean) => {
	saveFileTipDialogVisible.value = visible
}

// 导出工程窗口
// dialog for export project
const exportDialogVisible: Ref<boolean> = ref(false)
const setExportDialogVisible = (visible: boolean) => {
	exportDialogVisible.value = visible
}

// 保存窗口
// dialog for save project
const saveDialogVisible: Ref<boolean> = ref(false)
const setSaveDialogVisible = (visible: boolean) => {
	saveDialogVisible.value = visible
}

// 另存为窗口
// dialog for saveAs project
const saveAsDialogVisible: Ref<boolean> = ref(false)
const setSaveAsDialogVisible = (visible: boolean) => {
	saveAsDialogVisible.value = visible
}

// 导出字体窗口
// dialog for export font
const exportFontDialogVisible: Ref<boolean> = ref(false)
const setExportFontDialogVisible = (visible: boolean) => {
	exportFontDialogVisible.value = visible
}

// electron导出字体窗口
// dialog for export font for electron
const exportFontTauriDialogVisible: Ref<boolean> = ref(false)
const setExportFontTauriDialogVisible = (visible: boolean) => {
	exportFontTauriDialogVisible.value = visible
}

const copiedGlyphUUID: Ref<string> = ref('')
const copiedCharacterUUID: Ref<string> = ref('')
const editedGlyphUUID: Ref<string> = ref('')
const editedCharacterUUID: Ref<string> = ref('')

const glyphComponentsDialogVisible2: Ref<boolean> = ref(false)

// 导出可变字体窗口
// dialog for export var font
const exportVarFontDialogVisible: Ref<boolean> = ref(false)
const setExportVarFontDialogVisible = (visible: boolean) => {
	exportVarFontDialogVisible.value = visible
}

// tauri导出可变字体窗口
// dialog for export var font for tauri
const exportVarFontTauriDialogVisible: Ref<boolean> = ref(false)
const setExportVarFontTauriDialogVisible = (visible: boolean) => {
	exportVarFontTauriDialogVisible.value = visible
}

export {
	createFileDialogVisible,
	fontSettingsDialogVisible,
	preferenceSettingsDialogVisible,
	addTextDialogVisible,
	addIconDialogVisible,
	addGlyphDialogVisible,
	languageSettingsDialogVisible,
	glyphComponentsDialogVisible,
	importTemplatesDialogVisible,
	setImportTemplatesDialogVisible,
	setAddIconDialogVisible,
	setCreateFileDialogVisible,
	setFontSettingsDialogVisible,
	setPreferenceSettingsDialogVisible,
	setAddTextDialogVisible,
	setAddGlyphDialogVisible,
	setLanguageSettingsDialogVisible,
	setGlyphComponentsDialogVisible,
	copiedGlyphUUID,
	copiedCharacterUUID,
	editedGlyphUUID,
	copyGlyphDialogVisible,
	copyCharacterDialogVisible,
	editGlyphDialogVisible,
	editCharacterDialogVisible,
	setCopyGlyphDialogVisible,
	setCopyCharacterDialogVisible,
	setEditGlyphDialogVisible,
	setEditCharacterDialogVisible,
	glyphComponentsDialogVisible2,
	setSetAsGlobalParamDialogVisible,
	setAsGlobalParamDialogVisible,
	setSelectGlobalParamDialogVisible,
	selectGlobalParamDialogVisible,
	editedCharacterUUID,
	tipsDialogVisible,
	setTipsDialogVisible,
	closeFileTipDialogVisible,
	setCloseFileTipDialogVisible,
	saveFileTipDialogVisible,
	setSaveFileTipDialogVisible,
	exportDialogVisible,
	setExportDialogVisible,
	saveDialogVisible,
	setSaveDialogVisible,
	saveAsDialogVisible,
	setSaveAsDialogVisible,
	exportFontDialogVisible,
	setExportFontDialogVisible,
	exportFontTauriDialogVisible,
	setExportFontTauriDialogVisible,
	fontSettings2DialogVisible,
	setFontSettings2DialogVisible,
	exportVarFontDialogVisible,
	setExportVarFontDialogVisible,
	exportVarFontTauriDialogVisible,
	setExportVarFontTauriDialogVisible,
}