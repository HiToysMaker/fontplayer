<script setup lang="ts">
  /**
	 * 导入模板窗口
	 */
	/**
	 * dialog for import template component
	 */

  import { parseLayout } from '../../../features/layout'
  import { importTemplatesDialogVisible, setImportTemplatesDialogVisible } from '../../stores/dialogs'
	import { addCharacterForCurrentFile, selectedFile } from '../../stores/files'
	import { templates } from '../../stores/global'
	import { genUUID, toUnicode } from '../../../utils/string'
	import { useI18n } from 'vue-i18n'
  const { tm, t } = useI18n()

  const handleCancel = () => {
    setImportTemplatesDialogVisible(false)
  }

  const importTemplate = async (template) => {
		const res = await fetch(template.path)
		const data = await res.text()
		if (!data) return
		const chars = JSON.parse(data)
		for (let i = 0; i < chars.length; i++) {
			const character = chars[i]
			const characterComponent = {
        uuid: genUUID(),
        text: character.char,
        unicode: toUnicode(character.char),
        components: [],
      }
			const uuid = genUUID()
      const characterFile = {
        uuid,
        type: 'text',
        character: characterComponent,
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
            centerSquareSize: selectedFile.value.width / 3,
            size: selectedFile.value.width,
            default: true,
          },
          layout: character.layout,
          layoutTree: parseLayout(character.layout),
        },
				script: `function script_${uuid.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`,
      }
      addCharacterForCurrentFile(characterFile)
		}
    setImportTemplatesDialogVisible(false)
	}
</script>

<template>
  <el-dialog
    v-model="importTemplatesDialogVisible"
    :title="tm('dialogs.importTemplatesDialog.title')"
    class="import-templates-dialog"
    width="800px"
  >
    <div class="dialog-content">
      <el-scrollbar>
        <main class="list">
          <div
            class="template"
            v-for="template in templates"
            :key="template.name"
            @pointerdown="importTemplate(template)"
          >
            <span class="info">
              <span class="name">{{ template.name }}</span>
            </span>
          </div>
        </main>
      </el-scrollbar>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="handleCancel">{{ t('dialogs.glyphComponentDialog.cancel') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
  .import-template-dialog {
    .dialog-content {
      height: 300px;
      .list {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill,86px);
        gap: 10px;
        .template {
          width: 80px;
          height: 32px;
          display: flex;
          flex-direction: column;
          border: 3px solid var(--primary-0);
          box-sizing: content-box;
          cursor: pointer;
          &:hover {
            border: 3px solid var(--primary-1);
            .info {
              background-color: var(--primary-1);
              .unicode {
                background-color: var(--primary-1);
              }
            }
          }
          .info {
            display: flex;
            flex-direction: row;
            flex: 0 0 32px;
            line-height: 32px;
            background-color: var(--primary-0);
            color: var(--primary-5);
            justify-content: center;
            text-align: center;
            .name {
              font-size: 18px;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: 100%;
              overflow: hidden;
              font-weight: bold;
              line-height: 30px;
              text-align: center;
            }
          }
        }
      }
    }
  }
</style>