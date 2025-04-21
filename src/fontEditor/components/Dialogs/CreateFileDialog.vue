<script setup lang="ts">
  /**
   * 新建字体文件窗口
   */
  /**
   * dialog for creating new font file
   */

  import { createFileDialogVisible, setCreateFileDialogVisible } from '../../stores/dialogs'
  import { addFile, setSelectedFileUUID, type IFile } from '../../stores/files'
  import { setEditStatus, Status } from '../../stores/font'
  import { genUUID } from '../../../utils/string'
  import { ref, type Ref } from 'vue'
  import router from '../../../router'
  import { useI18n } from 'vue-i18n'
  import { getEnName, name_data, head_data, hhea_data, os2_data, post_data } from '../../stores/settings'
  const { tm, t } = useI18n()

  const name: Ref<string> = ref('untitled')
  const unitsPerEm: Ref<number> = ref(1000)
  const ascender: Ref<number> = ref(800)
  const descender: Ref<number> = ref(-200)

  const createFont = () => {
    //total.value = (glyphs.value.length + stroke_glyphs.value.length + radical_glyphs.value.length + comp_glyphs.value.length) * 2
    //loaded.value = 0
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
        value: getEnName(name.value),
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
        value: name.value + ' ' + '常规体',
        default: true,
      },
      {
        nameID: 4,
        nameLabel: 'fullName',
        platformID: 3,
        encodingID: 1,
        langID: 0x409,
        value: getEnName(name.value) + ' ' + 'Regular',
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
    addFile(file)
    setSelectedFileUUID(file.uuid)
    setEditStatus(Status.CharacterList)
    //loading.value = true
    if (router.currentRoute.value.name === 'welcome') {
      router.push('/editor')
    }
    //setTimeout(() => {
    //  //loading.value = true
    //  if (router.currentRoute.value.name === 'welcome') {
    //    router.push('/editor')
    //  }
    //}, 100)
    setCreateFileDialogVisible(false)
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
        />
      </el-form-item>
      <el-form-item label="ascender">
        <el-input-number
          v-model="ascender"
          :precision="0"
          @change="onAscenderChange"
        />
      </el-form-item>
      <el-form-item label="descender">
        <el-input-number
          v-model="descender"
          :precision="0"
          @change="onDescenderChange"
        />
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
  }
</style>