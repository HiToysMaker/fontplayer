<script setup lang="ts">
	/**
	 * 字体结构编辑面板
	 */
	/**
	 * layout editing panel for character
	 */

  import { useI18n } from 'vue-i18n'
  import { ref, type Ref, computed, watch } from 'vue'
	import {
		editCharacterFile, editCharacterFileUUID,
		orderedListWithItemsForCharacterFile,
		orderedListWithItemsForCurrentCharacterFile,
		selectedFile,
	} from '../../stores/files'
	import type { IGlyphComponent } from '../../stores/glyph'
	import type { ICustomGlyph } from '../../stores/glyph'
	import { executeScript } from '../../stores/glyph'
	import {
		gridChanged,
		gridSettings,
		layoutOptions,
		tips,
	} from '../../stores/global'
	import * as R from 'ramda'
	import {
    formatLayout,
		parseLayout, parseValue
	} from '../../../features/layout'
	import { DocumentCopy, Edit } from '@element-plus/icons-vue'
	import { Plus } from '@element-plus/icons-vue'
	import { emitter } from '../../Event/bus'
	import { ElMessage } from 'element-plus'
	import { OpType, saveState, StoreType } from '../../stores/edit'
  import { formatCharacterGlyphComponents } from '../../utils/formatGlyphComponents'
	import { formatGridComponents } from '../../canvas/canvas'
  import { setTipsDialogVisible } from '../../stores/dialogs'
	
	const { tm, t, locale } = useI18n()

	interface LayoutNode {
		id: string;
		coords: Array<any>;
		label: string;
		layout: string;
		children?: LayoutNode[];
		rect: {
			x: number;
			y: number;
			w: number;
			h: number;
		},
		showCoords?: string,
		coordsSegment?: number,
	}
	const onLayoutEdit = ref(false)
	const onLayoutReset = (layout) => {
		const info = R.clone(editCharacterFile.value.info)
		info.layout = layout
		let layoutTree = parseLayout(layout)
		const { dx, dy, centerSquareSize, size } = info.gridSettings
		const x1 = Math.round((size - centerSquareSize) / 2) + dx
		const x2 =  Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dx
		const y1 = Math.round((size - centerSquareSize) / 2) + dy
		const y2 = Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dy
		const l = size
		formatLayout(
			layoutTree,
			{ x: 0, y: 0, w: l, h: l, },
			1,
			{ x1, x2, y1, y2, l: size },
		)
		info.layoutTree = layoutTree
		editCharacterFile.value.info = info
		onLayoutEdit.value = false
	}
	const selectedNode : Ref<null | LayoutNode> = ref(null)
	const handleLayoutNodeClick = (node: LayoutNode) => {
		if (editingNode.value) {
			editingNode.value = ''
		}
		selectedNode.value = node
	}
	const onLayoutAddNodes = (node: LayoutNode, layout) => {
		const level = node.id.split('-').length
		parseValue(layout, node.children, level)
		editingNode.value = ''
	}
	const copyID = () => {
		window.navigator.clipboard.writeText((selectedNode.value as LayoutNode).id)
	}
	const defaultProps = {
		children: 'children',
		label: 'label',
	}
	const editingNode = ref('')
	
	// 检查是否所有组件都是glyph类型且都有skeleton（通过getSkeleton方法）
	const canUseSkeletonGrid = computed(() => {
		if (!editCharacterFile.value) return false
		
		const components = orderedListWithItemsForCurrentCharacterFile.value
		if (!components || components.length === 0) return false
		
		// 检查所有组件是否都是glyph类型
		const allAreGlyphs = components.every(component => component && component.type === 'glyph')
		if (!allAreGlyphs) return false
		
		// 检查所有glyph是否都有getSkeleton方法（通过glyph._o.getSkeleton）
		const allHaveGetSkeleton = components.every(component => {
			if (!component || component.type !== 'glyph') return false
			const glyphComponent = component as IGlyphComponent
			const glyph = glyphComponent.value as ICustomGlyph
			
			if (!glyph) return false
			
			// 确保glyph._o存在，如果没有则尝试执行脚本创建
			if (!glyph._o) {
				try {
					executeScript(glyph)
				} catch (e) {
					console.error('Error executing script for glyph:', e)
					return false
				}
			}
			
			// 检查glyph._o.getSkeleton方法是否存在（是函数且不为null）
			// 同时检查getComponentsBySkeleton方法是否存在
			return glyph._o && 
			       typeof glyph._o.getSkeleton === 'function' && 
			       typeof glyph._o.getComponentsBySkeleton === 'function'
		})
		
		return allHaveGetSkeleton
	})
	
	// 创建一个 computed 来绑定 useSkeletonGrid 值
	const useSkeletonGridValue = computed({
		get: () => {
			return editCharacterFile.value?.info?.useSkeletonGrid || false
		},
		set: (value: boolean) => {
			if (!canUseSkeletonGrid.value && value) {
				// 如果条件不满足但尝试开启，阻止操作
				ElMessage.warning('仅当所有组件都是字形组件且都有骨架时才能使用骨架变换')
				return
			}
			const characterFile = editCharacterFile.value
			if (!characterFile) return
			
			if (!characterFile.info) {
				characterFile.info = {}
			}
			// 直接修改 editCharacterFile.value 的属性
			characterFile.info.useSkeletonGrid = value
		}
	})
	
	// 监听条件变化，当条件不满足时自动关闭开关
	watch(canUseSkeletonGrid, (newValue) => {
		if (!newValue && editCharacterFile.value?.info?.useSkeletonGrid) {
			// 条件不满足且开关是开启状态，自动关闭
			if (!editCharacterFile.value.info) {
				editCharacterFile.value.info = {}
			}
			editCharacterFile.value.info.useSkeletonGrid = false
		}
	})
	
	const confirmGridChange = () => {
		// // 保存状态
		// saveState('应用布局', [
		// 	StoreType.Grid,
		// 	StoreType.EditCharacter,
		// ],
		// 	OpType.Undo,
		// )
		// gridChanged.value = false
		// editCharacterFile.value.info.gridSettings = {
		// 	dx: gridSettings.value.dx,
		// 	dy: gridSettings.value.dy,
		// 	size: gridSettings.value.size,
		// 	centerSquareSize: gridSettings.value.centerSquareSize,
		// 	default: false,
		// }

		tips.value = t('panels.paramsPanel.layoutEditing.applyGridConfirmMsg')
		setTipsDialogVisible(true, () => {
			// 格式化所有组件，并将布局变换应用到组件上
			formatCharacterGlyphComponents(editCharacterFile.value)
			formatGridComponents(orderedListWithItemsForCharacterFile(editCharacterFile.value), {
				grid: {
					dx: gridSettings.value.dx,
					dy: gridSettings.value.dy,
					size: gridSettings.value.size,
					centerSquareSize: gridSettings.value.centerSquareSize,
					default: false,
				},
				offset: { x: 0, y: 0 },
			})

			gridChanged.value = false
			emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
			ElMessage({
				type: 'success',
				message: tm('panels.paramsPanel.layoutEditing.applyGridTransform'),
			})

			editCharacterFile.value.info.gridSettings = {
				dx: 0,
				dy: 0,
				centerSquareSize: selectedFile.value.width / 3,
				size: selectedFile.value.width,
				default: true,
			}

			gridSettings.value = {
				dx: 0,
				dy: 0,
				centerSquareSize: selectedFile.value.width / 3,
				size: selectedFile.value.width,
				default: true,
			}
		})
	}
	const resetGrid = () => {
		// // 保存状态
		// saveState('重置布局', [
		// 	StoreType.Grid,
		// 	StoreType.EditCharacter,
		// ],
		// 	OpType.Undo,
		// )
		editCharacterFile.value.info.gridSettings = {
			dx: 0,
			dy: 0,
			centerSquareSize: selectedFile.value.width / 3,
			size: selectedFile.value.width,
			default: true,
		}
		gridSettings.value = {
			dx: 0,
			dy: 0,
			centerSquareSize: selectedFile.value.width / 3,
			size: selectedFile.value.width,
			default: true,
		}
		emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
		ElMessage({
			type: 'success',
			message: tm('panels.paramsPanel.resetGridTransform'),
		})
	}
</script>

<template>
  <div class="character-edit-panel">
		<!-- <div class="layout-settings">
			<el-button class="layout-btn" v-show="!onLayoutEdit" @pointerdown="onLayoutEdit = true">{{ !editCharacterFile.info.layout ? '设置字体结构' : '重置字体结构' }}</el-button>
			<el-select placeholder="Select" style="width: 100%" @change="onLayoutReset" v-show="onLayoutEdit">
				<el-option
					v-for="item in layoutOptions"
					:key="item.value"
					:label="item.label"
					:value="item.layout"
				/>
			</el-select>
		</div>
		<div class="layout-tree" v-if="editCharacterFile.info.layout && editCharacterFile.info.layoutTree">
			<el-tree
				style="max-width: 100%"
				:data="editCharacterFile.info.layoutTree"
				node-key="id"
				default-expand-all
				:expand-on-click-node="false"
				@node-click="handleLayoutNodeClick"
				:props="defaultProps"
			>
				<template #default="{ node, data }">
					<span class="custom-tree-node">
						<span>{{ node.label }}</span>
						<span :style="{
							'margin-left': 'auto',
    					'margin-right': '10px',
							'display': 'flex',
						}">
							<el-icon v-if="editingNode !== node.id" @pointerdown="(e) => {
								e.stopPropagation()
								editingNode = node.id
							}"><Plus /></el-icon>
							<el-select placeholder="Select" style="width: 80px" @change="(layout) => onLayoutAddNodes(data, layout)" v-show="editingNode === node.id">
								<el-option
									v-for="item in layoutOptions"
									:key="item.value"
									:label="item.label"
									:value="item.subLayout"
								/>
							</el-select>
						</span>
					</span>
				</template>
			</el-tree>
		</div>
		<div class="layout-node-info" v-if="selectedNode">
			<el-form
        class="parameters-form"
        label-width="80px"
      >
				<el-form-item label="PART">
					<el-input v-model="selectedNode.label" disabled></el-input>
				</el-form-item>
				<el-form-item label="ID">
					<el-input v-model="selectedNode.id" disabled>
						<template #append>
							<el-button :icon="DocumentCopy" @pointerdown="copyID"/>
						</template>
					</el-input>
				</el-form-item>
				<el-form-item label="起始">
					<el-input v-model="selectedNode.coords[0]" disabled>
						<template #append>
							<el-button :icon="Edit" />
						</template>
					</el-input>
				</el-form-item>
				<el-form-item label="结束">
					<el-input v-model="selectedNode.coords[1]" disabled>
						<template #append>
							<el-button :icon="Edit" />
						</template>
					</el-input>
				</el-form-item>
				<el-form-item label="标点" v-if="!selectedNode.children || !selectedNode.children.length">
					<el-radio-group v-model="selectedNode.showCoords" class="radio-group">
						<el-radio value="none" label="none">无</el-radio>
						<el-radio value="default" label="default">默认比例</el-radio>
						<el-radio value="ratio" label="ratio">布局比例</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="标点分段" v-if="!selectedNode.children || !selectedNode.children.length">
					<el-input-number
						:disabled="selectedNode.showCoords === 'none'"
						v-model="selectedNode.coordsSegment"
						:min="10"
						:max="100"
						precision="1"
					/>
				</el-form-item>
			</el-form>
		</div> -->
		<div class="grid-settings">
			<el-button class="grid-confirm-btn" :disabled="!gridChanged" @pointerdown="confirmGridChange" type="primary">
				{{ t('panels.paramsPanel.applyGridTransform') }}
			</el-button>
			<el-button class="grid-reset-btn" @pointerdown="resetGrid">
				{{ t('panels.paramsPanel.resetGridTransform') }}
			</el-button>
			<el-form-item label-width="120px" label="使用骨架变换">
				<el-switch
					v-model="useSkeletonGridValue"
					:disabled="!canUseSkeletonGrid"
				/>
      </el-form-item>
		</div>
  </div>
</template>

<style scoped>
	.grid-settings {
		.grid-confirm-btn, .grid-reset-btn {
			width: 100%;
			margin: 0 0 10px 0;
		}
	}
	.character-edit-panel {
		padding: 10px;
	}
	.layout-settings {
		.layout-btn {
			width: 100%;
		}
	}
	.custom-tree-node {
		display: flex;
    align-items: center;
    width: 100%;
    flex-direction: row;
    text-align: left;
	}
	:deep(.el-tree-node__content) {
		height: 48px;
	}
	.el-tree {
		margin: 10px 0;
	}
</style>