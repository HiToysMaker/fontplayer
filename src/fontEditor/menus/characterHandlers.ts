import { setAddTextDialogVisible, setAddIconDialogVisible } from '../stores/dialogs'

const addCharacter = () => {
  setAddTextDialogVisible(true)
}

const addIcon = () => {
  setAddIconDialogVisible(true)
}

export {
  addCharacter,
  addIcon,
}

