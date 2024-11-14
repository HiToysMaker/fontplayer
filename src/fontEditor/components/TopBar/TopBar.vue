<script setup lang="ts">
  /**
   * 顶部菜单栏
   */
  /**
   * top bar to show menus
   */
  import { web_handlers } from '../../menus/handlers'
  import { ENV } from '../../stores/system'
  import { web_menu, traverse_web_menu } from '../../menus/web_menus'
  import { editStatus, Status } from '../../stores/font'
  import { app } from '../../../main'
  import { selectedFile } from '../../stores/files'

	interface IDisabledMap {
    [key: string]: Function;
  }

	interface IIconsMap {
    [key: string]: any;
  }

	const enable = () => {
		return true
	}

	const enableAtEdit = () => {
		if (editStatus.value === Status.Edit) {
			return true
		}
		return false
	}

	const enableAtList = () => {
		if (editStatus.value === Status.CharacterList || editStatus.value === Status.GlyphList || editStatus.value === Status.StrokeGlyphList || editStatus.value === Status.RadicalGlyphList || editStatus.value === Status.CompGlyphList) {
			return true
		}
		return false
	}

  const TemplateEnable = () => {
		if (selectedFile.value && editStatus.value === Status.CharacterList || editStatus.value === Status.GlyphList || editStatus.value === Status.StrokeGlyphList || editStatus.value === Status.RadicalGlyphList || editStatus.value === Status.CompGlyphList) {
			return true
		}
		return false
	}

	const web_disabled: IDisabledMap = {
    'create-file': enableAtList,
    'open-file': enableAtList,
		'save-file': enable,
		'clear-cache': enable,
		'save-as-json': enable,
    'undo': enableAtEdit,
    'redo': enableAtEdit,
    'cut': enableAtEdit,
    'copy': enableAtEdit,
    'paste': enableAtEdit,
    'delete': enableAtEdit,
    'import-font-file': enableAtList,
    'import-templates-file': enableAtList,
    'import-glyphs': enableAtList,
    'import-pic': enableAtEdit,
    'import-svg': enableAtEdit,
    'export-font-file': enable,
    'export-glyphs': enableAtList,
    'export-jpeg': enableAtEdit,
    'export-png': enableAtEdit,
    'export-svg': enableAtEdit,
    'add-character': enableAtList,
    'add-icon': enableAtList,
    'font-settings': enable,
    'preference-settings': enable,
    'language-settings': enable,
    'template-1': TemplateEnable,
	}

	const web_menu_icons: IIconsMap = {
    'file': app.component('Files'),
		'edit': app.component('Edit'),
		'import': app.component('Upload'),
		'export': app.component('Download'),
    'character': app.component('Tickets'),
		'settings': app.component('Setting'),
    'templates': app.component('List'),
	}

	const _menus = traverse_web_menu(web_handlers, web_menu)

	const handleSelect = async (key: string) => {
		web_handlers[key] && web_handlers[key]()
  }
</script>

<template>
  <div class="top-bar" v-if="ENV === 'web'">
    <el-row class="top-bar-row">
      <el-menu
        class="el-menu top-bar"
        mode="horizontal"
        @select="handleSelect"
      >
        <el-sub-menu :index="menu.key" v-for="menu in _menus">
          <template #title>
							<el-icon>
								<component :is="web_menu_icons[menu.key]"></component>
							</el-icon>
							{{ menu.label }}
					</template>
          <el-menu-item
						:index="subMenu.key"
						:disabled="!web_disabled[subMenu.key]()"
						v-for="subMenu in menu.submenu"
					>
            {{ subMenu.label }}
				  </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-row>
  </div>
</template>

<style scoped>
  .top-bar, .top-bar-row {
    width: 100%;
  }
</style>