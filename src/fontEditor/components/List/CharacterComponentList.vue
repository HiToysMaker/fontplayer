<script setup lang="ts">
  /**
	 * 组件列表
	 */
	/**
	 * component list
	 */

  import {
    setOrderedListForCurrentCharacterFile,
    modifyComponentForCurrentCharacterFile,
    setSelectionForCurrentCharacterFile,
    addComponentForCurrentCharacterFile,
    removeComponentForCurrentCharacterFile,
    setClipBoard,
    clipBoard,
    orderedListWithItemsForCurrentCharacterFile,
    selectedComponentsUUIDs,
    orderedListForCurrentCharacterFile,
    selectedComponents,
    usedComponents,
    selectedComponent,
    type IComponent,
		selectedItemByUUID,
		editCharacterFile,
    insertComponentForCurrentCharacterFile,
    enableMultiSelect,
  } from '../../stores/files'
  import { editPanelCompFilter } from '../../stores/font'
  import * as R from 'ramda'
  import { ref, type Ref, reactive } from 'vue'
  import { genUUID } from '../../../utils/string'
  import { useI18n } from 'vue-i18n'
	import { setTool } from '../../stores/global'
  import { CircleCheck, CircleClose, Unlock, Lock, View, Hide } from '@element-plus/icons-vue'
  const { t } = useI18n()

  const popoverVisibleMap: any = reactive((() => {
    const map: any = {}
    orderedListWithItemsForCurrentCharacterFile.value.map((component: IComponent) => {
      map[component.uuid] = false
    })
    return map
  })())

  const onPopover: Ref<boolean> = ref(false)

  let draggedItem = ''
  let fromIndex = -1
  let toIndex = -1
  let insertIndex = -1

  const toggleLock = (uuid: string, lock: boolean) => {
    modifyComponentForCurrentCharacterFile(uuid, {
      lock,
    })
  }

  const toggleVisibility = (uuid: string, visible: boolean) => {
    modifyComponentForCurrentCharacterFile(uuid, {
      visible,
    })
  }

  const toggleUsedInCharacter = (uuid: string, usedInCharacter: boolean, type: string) => {
    if (type === 'pucture' || type === 'pressPen') return
    modifyComponentForCurrentCharacterFile(uuid, {
      usedInCharacter,
    })
  }

  const selectComponent = (e: MouseEvent, uuid: string) => {
    let hasSelected = true
    if (!selectedComponent.value || (selectedComponent.value && selectedComponent.value.uuid !== uuid)) {
      hasSelected = false
    }
    if (selectedComponentsUUIDs.value.indexOf(uuid) !== -1) {
      hasSelected = true
    }
    !hasSelected && setSelectionForCurrentCharacterFile(uuid)
    const component = selectedItemByUUID(editCharacterFile.value.components, uuid)
    if (component.type === 'glyph' && component.value.components && component.value.components.length) {
      let hasGlyph = false
      for (let i = 0; i < component.value.components.length; i++) {
        if (component.value.components[i].type === 'glyph') {
          hasGlyph = true
          break
        }
      }
      if (hasGlyph && hasSelected) {
        if (!editCharacterFile.value.selectedComponentsTree) {
          editCharacterFile.value.selectedComponentsTree = []
        }
        editCharacterFile.value.selectedComponentsTree.push(uuid)
        editCharacterFile.value.selectedComponentsTree.push('null')
      }
    }
    if (component.type === 'glyph') {
      setTool('glyphDragger')
    }
  }

  const onDragStart = (e: DragEvent, uuid: string) => {
    draggedItem = uuid
  }

  const onDragOver = (e: DragEvent, uuid: string) => {
    e.preventDefault()
    const list = orderedListForCurrentCharacterFile.value
    for (let i = 0; i < list.length; i++) {
      if (draggedItem === list[i].uuid) {
        fromIndex = i
      }
      if (uuid === list[i].uuid) {
        toIndex = i
      }
    }
    if (e.offsetY < ((e.target) as HTMLDivElement).offsetHeight / 2) {
      insertIndex  = toIndex
    } else if (e.offsetY > ((e.target) as HTMLDivElement).offsetHeight / 2) {
      insertIndex  = toIndex + 1
    }
  }
  
  const onDragEnd = (e: DragEvent, uuid: string) => {
    draggedItem = ''
    draggedItem = ''
    fromIndex = -1
    toIndex = -1
    insertIndex = -1
  }

  const onDrop = (e: DragEvent, uuid: string) => {
    const list: Array<{ type: string, uuid: string }> = R.clone(orderedListForCurrentCharacterFile.value)
    if (fromIndex === toIndex) return
    list.splice(fromIndex, 1)
    if (fromIndex <= insertIndex) {
      insertIndex -= 1
    }
    list.splice(insertIndex, 0, {
      type: 'component',
      uuid: draggedItem,
    })
    setOrderedListForCurrentCharacterFile(list)
  }

  const clip = (uuid: string) => {
    // 剪切
    if (!selectedComponents.value || !selectedComponents.value.length) {
      const component = selectedItemByUUID(editCharacterFile.value.components, uuid)
      setClipBoard(R.clone(component))
      removeComponentForCurrentCharacterFile(uuid)
    } else {
      let mark = false
      if (selectedComponents.value) {
        for (let i = 0; i < selectedComponents.value?.length; i++) {
          if (selectedComponents.value[i].uuid === uuid) {
            mark = true
          }
        }
      }
      if (mark) {
        // 右键菜单对应的组件为选中组件或之一，剪切所有选中组件
        setClipBoard(R.clone(selectedComponents.value))
        selectedComponents.value.map((component: IComponent) => {
          removeComponentForCurrentCharacterFile(component.uuid)
        })
      } else {
        // 右键菜单对应的组件不是选中组件或之一，剪切菜单对应组件
        const component = selectedItemByUUID(editCharacterFile.value.components, uuid)
        setClipBoard(R.clone(component))
        removeComponentForCurrentCharacterFile(uuid)
      }
    }
    setSelectionForCurrentCharacterFile('')
    onPopover.value = false
    popoverVisibleMap[uuid] = false
  }

  const copy = (uuid: string) => {
    // 复制
    if (!selectedComponents.value || !selectedComponents.value.length) {
      const component = selectedItemByUUID(editCharacterFile.value.components, uuid)
      setClipBoard(R.clone(component))
    } else {
      let mark = false
      if (selectedComponents.value) {
        for (let i = 0; i < selectedComponents.value?.length; i++) {
          if (selectedComponents.value[i].uuid === uuid) {
            mark = true
          }
        }
      }
      if (mark) {
        // 右键菜单对应的组件为选中组件或之一，复制所有选中组件
        setClipBoard(R.clone(selectedComponents.value))
      } else {
        // 右键菜单对应的组件不是选中组件或之一，复制菜单对应组件
        const component = selectedItemByUUID(editCharacterFile.value.components, uuid)
        setClipBoard(R.clone(component))
      }
    }
    onPopover.value = false
    popoverVisibleMap[uuid] = false
  }

  const paste = (uuid: string) => {
    // 粘贴
    const components = clipBoard.value
    for (let i = components.length - 1; i >= 0; i--) {
      const component = components[i]
      component.uuid = genUUID()
      insertComponentForCurrentCharacterFile(component, { uuid, pos: 'next' })
    }
    setClipBoard([])
    onPopover.value = false
    popoverVisibleMap[uuid] = false
  }

  const remove = (uuid: string) => {
    // 删除
    if (!selectedComponents.value || !selectedComponents.value.length) {
      removeComponentForCurrentCharacterFile(uuid)
    } else {
      let mark = false
      if (selectedComponents.value) {
        for (let i = 0; i < selectedComponents.value?.length; i++) {
          if (selectedComponents.value[i].uuid === uuid) {
            mark = true
          }
        }
      }
      if (mark) {
        // 右键菜单对应的组件为选中组件或之一，删除所有选中组件
        selectedComponents.value.map((component: IComponent) => {
          removeComponentForCurrentCharacterFile(component.uuid)
        })
      } else {
        // 右键菜单对应的组件不是选中组件或之一，删除菜单对应组件
        removeComponentForCurrentCharacterFile(uuid)
      }
    }
    setSelectionForCurrentCharacterFile('')
    onPopover.value = false
    popoverVisibleMap[uuid] = false
  }

  const openPopover = (e: MouseEvent, uuid: string) => {
    e.preventDefault()
    if (onPopover.value) return
    onPopover.value = true
    popoverVisibleMap[uuid] = true

    const onMouseDown = (e: MouseEvent) => {
      const inside = (e.target as HTMLElement).closest('.component.menu')
      if (!inside) {
        onPopover.value = false
        popoverVisibleMap[uuid] = false
      }
    }

    document.addEventListener('mousedown', onMouseDown)
  }
</script>

<template>
  <div class="list-wrapper">
		<el-scrollbar v-if="editPanelCompFilter === 'all'">
			<div class="all-components-list" v-if="editPanelCompFilter === 'all'">
				<div class="component-item-wrapper" v-for="component in orderedListWithItemsForCurrentCharacterFile">
					<el-popover placement="right" :width="200" trigger="manual" :visible="popoverVisibleMap[component.uuid]">
						<template #reference>
							<div
								:class="{
									'component': true,
									'selected': selectedComponentsUUIDs.indexOf(component.uuid) !== -1,
								}"
								:draggable="true"
								@dragstart="(e: DragEvent) => onDragStart(e, component.uuid)"
								@dragover="(e: DragEvent) => onDragOver(e, component.uuid)"
								@dragend="(e: DragEvent) => onDragEnd(e, component.uuid)"
								@drop="(e: DragEvent) => onDrop(e, component.uuid)"
								@pointerdown="(e: MouseEvent) => selectComponent(e, component.uuid)"
								@contextmenu="(e: MouseEvent) => openPopover(e, component.uuid)"
							>
								<span class="name">
									{{ component.name || component.type }}
								</span>
								<span class="tool-wrapper">
									<el-icon
										class="tool-icon used-in-character"
										@pointerdown="(e: MouseEvent) => toggleUsedInCharacter(component.uuid, !component.usedInCharacter, component.type)"
									>
										<CircleCheck v-if="component.usedInCharacter" />
										<CircleClose v-if="!component.usedInCharacter" />
									</el-icon>
									<el-icon
										class="tool-icon lock"
										@pointerdown="(e: MouseEvent) => toggleLock(component.uuid, !component.lock)"
									>
										<Unlock v-if="component.lock"/>
										<Lock v-if="!component.lock"/>
									</el-icon>
									<el-icon
										class="tool-icon visible"
										@pointerdown="(e: MouseEvent) =>
											toggleVisibility(
												component.uuid,
												!component.visible
											)"
									>
										<View v-if="component.visible"/>
										<Hide v-if="!component.visible"/>
									</el-icon>
								</span>
							</div>
						</template>
						<div class="component-menu">
							<div class="component-menu-item" @pointerdown="(e: MouseEvent) => clip(component.uuid)">
								{{ t('panels.componentList.menu.cut') }}
							</div>
							<div class="component-menu-item" @pointerdown="(e: MouseEvent) => copy(component.uuid)">
								{{ t('panels.componentList.menu.copy') }}
							</div>
							<div class="component-menu-item" @pointerdown="(e: MouseEvent) => paste(component.uuid)">
								{{ t('panels.componentList.menu.paste') }}
							</div>
							<div class="component-menu-item" @pointerdown="(e: MouseEvent) => remove(component.uuid)">
								{{ t('panels.componentList.menu.delete') }}
							</div>
						</div>
					</el-popover>
				</div>
			</div>
		</el-scrollbar>
		<el-scrollbar v-if="editPanelCompFilter === 'font'">
			<div class="font-components-list" v-if="editPanelCompFilter === 'font'">
				<div class="component-item-wrapper" v-for="component in usedComponents">
					<el-popover placement="right" :width="200" trigger="contextmenu">
						<template #reference>
							<div
								:class="{
									'component': true,
									'selected': selectedComponentsUUIDs.indexOf(component.uuid) !== -1,
								}"
								@pointerdown="(e: MouseEvent) => selectComponent(e, component.uuid)"
							>
								<span class="name">
									{{ component.name || component.type }}
								</span>
								<span class="tool-wrapper">
									<el-icon
										class="tool-icon used-in-character"
										@pointerdown="(e: MouseEvent) => toggleUsedInCharacter(component.uuid, !component.usedInCharacter, component.type)"
									>
										<CircleCheck v-if="component.usedInCharacter" />
										<CircleClose v-if="!component.usedInCharacter" />
									</el-icon>
									<el-icon
										class="tool-icon lock"
										@pointerdown="(e: MouseEvent) => toggleLock(component.uuid, !component.lock)"
									>
										<Unlock v-if="component.lock"/>
										<Lock v-if="!component.lock"/>
									</el-icon>
									<el-icon
										class="tool-icon visible"
										@pointerdown="(e: MouseEvent) =>
											toggleVisibility(
												component.uuid,
												!component.visible
											)"
									>
										<View v-if="component.visible"/>
										<Hide v-if="!component.visible"/>
									</el-icon>
								</span>
							</div>
						</template>
						<div class="component-menu">
							<div class="component-menu-item" @pointerdown="(e: MouseEvent) => clip(component.uuid)">
								{{ t('panels.componentList.menu.cut') }}
							</div>
							<div class="component-menu-item" @pointerdown="(e: MouseEvent) => copy(component.uuid)">
								{{ t('panels.componentList.menu.copy') }}
							</div>
							<div class="component-menu-item" @pointerdown="(e: MouseEvent) => paste(component.uuid)">
								{{ t('panels.componentList.menu.paste') }}
							</div>
							<div class="component-menu-item" @pointerdown="(e: MouseEvent) => remove(component.uuid)">
								{{ t('panels.componentList.menu.delete') }}
							</div>
						</div>
					</el-popover>
				</div>
			</div>
		</el-scrollbar>
  </div>
</template>

<style scoped>
  .list-wrapper {
		height: 100%;
    .all-components-list, .font-components-list {
			height: 100%;
      margin-top: 5px;
      .component-item-wrapper {
        padding: 3px 5px;
        .component {
          width: 100%;
          height: 36px;
          display: flex;
          cursor: pointer;
          padding: 5px 10px;
          border: 1px solid #54648a;
          background-color: var(--primary-0);
          color: var(--primary-5);
          &:hover {
            background-color: var(--primary-3);
          }
          &.selected {
            background-color: var(--primary-3);
          }
          .tool-wrapper {
            flex: 0 0 80px;
            display: flex;
            align-items: center;
          }
          .name {
            white-space: nowrap;
            text-overflow: ellipsis;
            max-width: 120px;
            display: inline-block;
            overflow-x: hidden;
            flex: auto;
          }
          .tool-icon {
            margin: 0 5px;
            cursor: pointer;
          }
        }
      }
    }
  }
  .component-menu-item {
    height: 30px;
    line-height: 30px;
    cursor: pointer;
    color: var(--primary-0);
  }
  .component-menu-item:hover {
    background-color: var(--primary-3);
    color: var(--primary-5);
  }
  .component-menu-item:not(:last-child) {
    border-bottom: 1px solid var(--light-0);
  }
</style>