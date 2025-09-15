<script setup lang="ts">
  /**
   * 新建字体文件窗口
   */
  /**
   * dialog for creating new font file
   */

  import { createFileDialogVisible, setCreateFileDialogVisible } from '../../stores/dialogs'
  import { addCharacterForCurrentFile, addCharacterTemplate, addFile, clearCharacterRenderList, generateCharacterTemplate, setSelectedFileUUID, selectedFile, type IFile } from '../../stores/files'
  import { setEditStatus, Status } from '../../stores/font'
  import { genUUID } from '../../../utils/string'
  import { ref, type Ref } from 'vue'
  import router from '../../../router'
  import { base, loaded, loading, total } from '../../stores/global'
  import { useI18n } from 'vue-i18n'
  import { getEnName, name_data, head_data, hhea_data, os2_data, post_data } from '../../stores/settings'
  import { importTemplate2, instanceCharacter } from '../../menus/handlers'
  import { emitter } from '../../Event/bus'
  import { strokes as hei_strokes } from '../../templates/strokes_1'
  import { constants, constantsMap, IConstant, ParameterType } from '../../stores/glyph'
  const { tm, t } = useI18n()

  const name: Ref<string> = ref('untitled')
  const unitsPerEm: Ref<number> = ref(1000)
  const ascender: Ref<number> = ref(800)
  const descender: Ref<number> = ref(-200)
  const useDefaultTemplate: Ref<Boolean> = ref(true)

  const createFont = async () => {
    //total.value = (glyphs.value.length + stroke_glyphs.value.length + radical_glyphs.value.length + comp_glyphs.value.length) * 2
    //total.value = 0
    //loading.value = true
    //loaded.value = 0
    //setTimeout(() => {
    //  //loading.value = true
    //  if (router.currentRoute.value.name === 'welcome') {
    //    router.push('/editor')
    //  }
    //}, 100)
    name_data.value = [
      {
        nameID: 1,
        nameLabel: 'fontFamily',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: name.value,
        default: true,
      },
      {
        nameID: 1,
        nameLabel: 'fontFamily',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: name.value,
        default: true,
      },
      {
        nameID: 2,
        nameLabel: 'fontSubfamily',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: '常规体',
        default: true,
      },
      {
        nameID: 2,
        nameLabel: 'fontSubfamily',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: 'Regular',
        default: true,
      },
      {
        nameID: 4,
        nameLabel: 'fullName',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: name.value + ' 常规体',
        default: true,
      },
      {
        nameID: 4,
        nameLabel: 'fullName',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: name.value + ' Regular',
        default: true,
      },
      {
        nameID: 5,
        nameLabel: 'version',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: 'Version 1.0',
        default: true,
      },
      {
        nameID: 5,
        nameLabel: 'version',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: 'Version 1.0',
        default: true,
      },
      {
        nameID: 6,
        nameLabel: 'postScriptName',
        platformID: 3,
        encodingID: 1,
        langID: 0x804,
        value: (getEnName(name.value) + '-' + 'Regular').replace(/\s/g, '').slice(0, 63),
        default: true,
      },
      {
        nameID: 6,
        nameLabel: 'postScriptName',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: (getEnName(name.value) + '-' + 'Regular').replace(/\s/g, '').slice(0, 63),
        default: true,
      }
    ]
    const file: IFile = {
      uuid: genUUID(),
      width: unitsPerEm.value,
      height: unitsPerEm.value,
      name: name.value,
      saved: false,
      characterList: [],
      iconsCount: 0,
      fontSettings: {
        unitsPerEm: unitsPerEm.value,
        ascender: ascender.value,
        descender: descender.value,
        tables: {
          head: head_data.value,
          hhea: hhea_data.value,
          os2: os2_data.value,
          name: name_data.value,
          post: post_data.value,
        }
      }
    }
    
    // 添加默认的.notdef字符，放在首位
    const notdefUUID = genUUID()
    const notdefCharacter = {
      uuid: notdefUUID,
      type: 'text',
      character: {
        uuid: genUUID(),
        text: '.notdef',
        unicode: '0',
        components: [],
      },
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      info: {
        gridSettings: {
          dx: 0,
          dy: 0,
          centerSquareSize: unitsPerEm.value / 3,
          size: unitsPerEm.value,
          default: true,
        },
        useSkeletonGrid: false,
        layout: '',
        layoutTree: [],
        metrics: {
          advanceWidth: Math.max(unitsPerEm.value, unitsPerEm.value),
          lsb: 0,
        },
      },
      script: `function script_${notdefUUID.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`,
    }
    file.characterList.push(notdefCharacter)
    
    addFile(file)
    setSelectedFileUUID(file.uuid)
    setEditStatus(Status.CharacterList)
    loading.value = true
    loaded.value = 0
    total.value = useDefaultTemplate.value ? hei_strokes.length + 20 : 0
    //loading.value = true
    //setTimeout(() => {
    //  //loading.value = true
    //  if (router.currentRoute.value.name === 'welcome') {
    //    router.push('/editor')
    //  }
    //}, 100)
    if (router.currentRoute.value.name === 'welcome') {
      router.push('/editor')
    }
    setCreateFileDialogVisible(false)
    if (useDefaultTemplate.value) {
      await importDefaultTemplate()
    } else {
      loading.value = false
    }
  }

  const updateGlobalConstant = () => {
    constants.value = [
      {
        uuid: genUUID(),
        name: '起笔风格',
        type: ParameterType.Enum,
        value: 2,
        options: [
          {
            value: 0,
            label: '无起笔样式',
          },
          {
            value: 1,
            label: '凸笔起笔',
          },
          {
            value: 2,
            label: '凸笔圆角起笔',
          }
        ]
      },
      {
        uuid: genUUID(),
        name: '起笔数值',
        type: ParameterType.Number,
        value: 1,
        min: 0,
        max: 2,
      },
      {
        uuid: genUUID(),
        name: '转角风格',
        type: ParameterType.Enum,
        value: 1,
        options: [
          {
            value: 0,
            label: '默认转角样式',
          },
          {
            value: 1,
            label: '转角圆滑凸起',
          }
        ]
      },
      {
        uuid: genUUID(),
        name: '转角数值',
        type: ParameterType.Number,
        value: 1,
        min: 1,
        max: 2,
      },
      {
        uuid: genUUID(),
        name: '字重变化',
        type: ParameterType.Number,
        value: 0,
        min: 0,
        max: 2,
      },
      {
        uuid: genUUID(),
        name: '弯曲程度',
        type: ParameterType.Number,
        value: 1,
        min: 0,
        max: 2,
      },
      {
        uuid: genUUID(),
        name: '字重',
        type: ParameterType.Number,
        value: 50,
        min: 40,
        max: 100,
      },
    ]
    constantsMap.update(constants.value)
  }

  const importDefaultTemplate = async () => {
    updateGlobalConstant()
    await importTemplate2()
    const res = base ? await fetch(base + `/templates/playground.json`) : await fetch(`templates/playground.json`)
    const data = JSON.parse(await res.text())
    const file = data.file

    clearCharacterRenderList()
    
    // 保存当前的.notdef字符（如果存在）
    const notdefCharacter = selectedFile.value.characterList.find(char => char.character.text === '.notdef')
    
    // 清空字符列表并重新添加模板字符
    selectedFile.value.characterList = []
    
    // 如果有.notdef字符，先添加到首位
    if (notdefCharacter) {
      selectedFile.value.characterList.push(notdefCharacter)
      addCharacterTemplate(generateCharacterTemplate(notdefCharacter))
    }
    
    // 添加模板中的字符
    for (let i = 0; i < file.characterList.length; i++) {
      loaded.value += 1
      const character = file.characterList[i]

      // 将相应参数改成全局变量
      for (let j = 0; j < character.components.length; j++) {
        const component = character.components[j]
        if (component.type === 'glyph') {
          const glyph = component.value
          glyph.parameters.forEach(parameter => {
            const constant = constants.value.find(constant => constant.name === parameter.name)
            if (constant) {
              parameter.type = ParameterType.Constant
              parameter.value = constant.uuid
            }
          })
        }
      }
      const characterFile = instanceCharacter(character)
      addCharacterForCurrentFile(characterFile)
      addCharacterTemplate(generateCharacterTemplate(characterFile))
    }
    
    emitter.emit('renderPreviewCanvas')
    loading.value = false
  }

  const close = () => {
    setCreateFileDialogVisible(false)
  }

	const onAscenderChange = () => {
		descender.value =  ascender.value - unitsPerEm.value
	}

	const onDescenderChange = () => {
		ascender.value = (unitsPerEm.value + descender.value)
	}
</script>

<template>
  <el-dialog
    :model-value="createFileDialogVisible"
    class="create-file-dialog"
    :title="tm('dialogs.addFileDialog.title')"
    width="320px"
    :before-close="close"
  >
    <!--<div class="loading" :class="{
      show: loading
    }">
      加载中, 请稍候……
    </div>-->
    <el-form
      class="create-file-form"
      label-width="80px"
    >
      <el-form-item :label="tm('dialogs.addFileDialog.fontName')">
        <el-input
          v-model="name"
        />
      </el-form-item>
      <el-form-item label="unitsPerEm">
        <el-input-number
          v-model="unitsPerEm"
          :precision="0"
          disabled="true"
        />
      </el-form-item>
      <el-form-item label="ascender">
        <el-input-number
          v-model="ascender"
          :precision="0"
          @change="onAscenderChange"
          disabled="true"
        />
      </el-form-item>
      <el-form-item label="descender">
        <el-input-number
          v-model="descender"
          :precision="0"
          @change="onDescenderChange"
          disabled="true"
        />
      </el-form-item>
      <el-form-item :label-width="0" class="use-default-template-form-item">
        <el-checkbox v-model="useDefaultTemplate">
          {{ t('dialogs.addFileDialog.useDefaultTemplate') }}
        </el-checkbox>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="setCreateFileDialogVisible(false)">{{ t('dialogs.addFileDialog.cancel') }}</el-button>
        <el-button
          type="primary"
          @pointerdown="() => createFont()"
        >
          {{ t('dialogs.addFileDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
  .create-file-dialog {
    .el-input {
      width: 180px;
    }
    .el-input-number {
      width: 180px;
    }
    .loading {
      display: none;
      position: fixed;
      background-color: rgba(255, 255, 255, 0.8);
      /* opacity: 0.5; */
      width: 100%;
      height: 100%;
      color: black;
      text-align: center;
      &.show {
        display: flex;
      }
    }
    .use-default-template-form-item {
      margin-bottom: 0;
    }
  }
</style>