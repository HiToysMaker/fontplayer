<script setup lang="ts">
  /**
	 * 组件列表
	 */
	/**
	 * component list
	 */

  import {
    orderedListWithItemsForCurrentGlyph,
    SubComponents,
    SubComponentsRoot,
    selectedSubComponent,
    editGlyph,
  } from '../../stores/glyph'
  import {
    type IComponent,
		selectedItemByUUID,
  } from '../../stores/files'
  import * as R from 'ramda'
  import { ref, type Ref, reactive } from 'vue'
  import { useI18n } from 'vue-i18n'
	import { setTool } from '../../stores/global'
  import { ArrowLeftBold, Lock, Unlock, Hide, View } from '@element-plus/icons-vue'
  const { t } = useI18n()

  const popoverVisibleMap: any = reactive((() => {
    const map: any = {}
    orderedListWithItemsForCurrentGlyph.value.map((component: IComponent) => {
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
    const component = selectedItemByUUID(SubComponentsRoot.value.value.components, uuid)
    component.lock = lock
  }

  const toggleVisibility = (uuid: string, visible: boolean) => {
    const component = selectedItemByUUID(SubComponentsRoot.value.value.components, uuid)
    component.visible = visible
  }

  const selectComponent = (e: MouseEvent, uuid: string) => {
    if (!editGlyph.value.selectedComponentsTree || editGlyph.value.selectedComponentsTree.length < 2) return
    editGlyph.value.selectedComponentsTree[editGlyph.value.selectedComponentsTree.length - 1] = uuid
    const component = selectedItemByUUID(SubComponentsRoot.value.value.components, uuid)
    if (component.type === 'glyph' && component.value.components && component.value.components.length) {
      let hasGlyph = false
      for (let i = 0; i < component.value.components.length; i++) {
        if (component.value.components[i].type === 'glyph') {
          hasGlyph = true
          break
        }
      }
      if (hasGlyph) {
        editGlyph.value.selectedComponentsTree.push('null')
      }
    } else if (component.type === 'glyph') {
      setTool('glyphDragger')
    }
  }

  const onDragStart = (e: DragEvent, uuid: string) => {
    draggedItem = uuid
  }

  const onDragOver = (e: DragEvent, uuid: string) => {
    e.preventDefault()
    const list = SubComponentsRoot.value.value.orderedList
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
    const list: Array<{ type: string, uuid: string }> = R.clone(SubComponentsRoot.value.value.orderedList)
    if (fromIndex === toIndex) return
    list.splice(fromIndex, 1)
    if (fromIndex <= insertIndex) {
      insertIndex -= 1
    }
    list.splice(insertIndex, 0, {
      type: 'component',
      uuid: draggedItem,
    })
    SubComponentsRoot.value.value.orderedList = list
  }

  const clip = (uuid: string) => {
    // 剪切
    //if (!selectedComponent.value) return
    //setClipBoard(R.clone(selectedComponents.value))
    //selectedComponents.value.map((component: IComponent) => {
    //  removeComponentForCurrentCharacterFile(component.uuid)
    //})
    //setSelectionForCurrentCharacterFile('')
    //onPopover.value = false
    //popoverVisibleMap[uuid] = false
  }

  const copy = (uuid: string) => {
    // 复制
    //if (!selectedComponent.value) return
    //setClipBoard(R.clone(selectedComponents.value))
    //onPopover.value = false
    //popoverVisibleMap[uuid] = false
  }

  const paste = (uuid: string) => {
    // 粘贴
    //const components = clipBoard.value
    //components.map((component: IComponent) => {
    //  component.uuid = genUUID()
    //  addComponentForCurrentCharacterFile(component)
    //})
    //setClipBoard([])
    //onPopover.value = false
    //popoverVisibleMap[uuid] = false
  }

  const remove = (uuid: string) => {
    // 删除
    const rootComponent = SubComponentsRoot.value
    const index = (() => {
      for (let i = 0; i < rootComponent.value.components.length; i++) {
        if (rootComponent.value.components[i].uuid === uuid)
        return i
      }
      return -1
    })()
    rootComponent.value.components.splice(index, 1)
    const index2= (() => {
      for (let i = 0; i < rootComponent.value.orderedList.length; i++) {
        if (rootComponent.value.orderedList[i].uuid === uuid)
        return i
      }
      return -1
    })()
    if (index2 >= 0) {
      rootComponent.value.orderedList.splice(index2, 1)
    }

    if (selectedSubComponent.value === uuid) {
      let tree = editGlyph.value.selectedComponentsTree
      if (tree[tree.length - 1] !== 'null') {
        tree[tree.length - 1] = 'null'
      }
    }

    if (SubComponentsRoot.value.value.glyph_script && SubComponentsRoot.value.value.glyph_script[uuid]) {
      delete SubComponentsRoot.value.value.glyph_script[uuid]
    }
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

  const onRootClick = () => {
    let tree = editGlyph.value.selectedComponentsTree
    if (tree[tree.length - 1] !== 'null') {
      tree[tree.length - 1] = 'null'
    }
    editGlyph.value.selectedComponentsTree = tree
  }

  const onBackClick = (e) => {
    e.stopPropagation()
    let tree = editGlyph.value.selectedComponentsTree
    if (tree.length <= 2) {
      tree = null
    } else {
      tree.splice(tree.length - 2, 2)
      tree.push('null')
    }
    editGlyph.value.selectedComponentsTree = tree
  }
</script>

<template>
  <div class="list-wrapper">
    <div
      class="list-head"
      :class="{
        'selected': !selectedSubComponent,
      }"
      @click="onRootClick"
    >
      <el-icon class="back-icon" @click="onBackClick"><ArrowLeftBold /></el-icon>
      <div
        class="root-sub-component"
      >{{ SubComponentsRoot.value.name }}</div>
    </div>
		<el-scrollbar>
			<div class="all-components-list">
				<div class="component-item-wrapper" v-for="component in SubComponents">
					<el-popover placement="right" :width="200" trigger="manual" :visible="popoverVisibleMap[component.uuid]">
						<template #reference>
							<div
								:class="{
									'component': true,
									'selected': selectedSubComponent && selectedSubComponent.uuid === component.uuid,
								}"
								:draggable="true"
								@dragstart="(e: DragEvent) => onDragStart(e, component.uuid)"
								@dragover="(e: DragEvent) => onDragOver(e, component.uuid)"
								@dragend="(e: DragEvent) => onDragEnd(e, component.uuid)"
								@drop="(e: DragEvent) => onDrop(e, component.uuid)"
								@click="(e: MouseEvent) => selectComponent(e, component.uuid)"
								@contextmenu="(e: MouseEvent) => openPopover(e, component.uuid)"
							>
								<span class="type">
									{{ component.name || component.type }}
								</span>
								<span class="tool-wrapper">
									<el-icon
										class="tool-icon lock"
										@click="(e: MouseEvent) => toggleLock(component.uuid, !component.lock)"
									>
										<Unlock v-if="component.lock"/>
										<Lock v-if="!component.lock"/>
									</el-icon>
									<el-icon
										class="tool-icon visible"
										@click="(e: MouseEvent) =>
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
              <!-- <div class="component-menu-item" @click="(e: MouseEvent) => clip(component.uuid)">
								{{ t('panels.componentList.menu.cut') }}
							</div>
							<div class="component-menu-item" @click="(e: MouseEvent) => copy(component.uuid)">
								{{ t('panels.componentList.menu.copy') }}
							</div>
							<div class="component-menu-item" @click="(e: MouseEvent) => paste(component.uuid)">
								{{ t('panels.componentList.menu.paste') }}
							</div> -->
							<div class="component-menu-item" @click="(e: MouseEvent) => remove(component.uuid)">
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
    .list-head {
      display: flex;
      flex-direction: row;
      height: 48px;
      align-items: center;
      color: white;
      border-bottom: 1px solid gray;
      cursor: pointer;
      &.selected {
        background-color: var(--primary-0);
      }
      &:hover {
        background-color: var(--primary-0);
      }
      .back-icon {
        cursor: pointer;
        &:hover {
          color: var(--primary-5)
        }
        flex: 0 0 32px;
      }
      .root-sub-component {
        white-space: nowrap;
        max-width: 180px;
        overflow-x: hidden;
        text-overflow: ellipsis;
      }
    }
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
          .type {
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