import {
  setFontSettingsDialogVisible,
  setPreferenceSettingsDialogVisible,
  setLanguageSettingsDialogVisible,
} from '../stores/dialogs'

const fontSettings = () => {
  setFontSettingsDialogVisible(true)
}

const preferenceSettings = () => {
  setPreferenceSettingsDialogVisible(true)
}

const languageSettings = () => {
  setLanguageSettingsDialogVisible(true)
}

export {
  fontSettings,
  preferenceSettings,
  languageSettings,
}

