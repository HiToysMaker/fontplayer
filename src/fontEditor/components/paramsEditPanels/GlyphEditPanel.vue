<script setup lang="ts">
	/**
	 * 字形组件参数编辑面板
	 */
	/**
	 * params editing panel for pen component
	 */

  import { editCharacterFile, getCharacterRatioLayout, modifyComponentForCurrentCharacterFile, selectedComponent, selectedComponentUUID, selectedFile, selectedItemByUUID, executeCharacterScript, modifySubComponent } from '../../stores/files'
  import { getRatioOptions, ParameterType, getConstant, IParameter, IRingParameter, IParameter2, getRatioLayout, selectedParam, selectedParamType, constantGlyphMap, ConstantType, getGlyphByUUID, GlyphType, executeScript, getRatioLayout2 } from '../../stores/glyph'
  import { editStatus, Status } from '../../stores/font'
  import { useI18n } from 'vue-i18n'
  import { canvas, dragOption, draggable, grid, GridType, checkJoints, checkRefLines, jointsCheckedMap, tips } from '../../stores/global'
  import { genUUID } from '../../../utils/string'
  import { ComputedRef, Ref, computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { emitter } from '../../Event/bus'
	import RingController from '../../components/Widgets/RingController.vue'
	import { editing as editingLayout } from '../../stores/glyphLayoutResizer'
	import {
    SubComponents,
    SubComponentsRoot,
    selectedSubComponent,
		type IComponent,
  } from '../../stores/files'
	import { setSelectGlobalParamDialogVisible, setSetAsGlobalParamDialogVisible, setTipsDialogVisible } from '../../stores/dialogs'
	import { More } from '@element-plus/icons-vue'
	import { OpType, saveState, StoreType } from '../../stores/edit'
  const { tm, t } = useI18n()

	const saveGlyphEditState = (options) => {
    // 保存状态
		saveState('编辑字形组件参数', [
			editStatus.value === Status.Glyph ? StoreType.EditGlyph : StoreType.EditCharacter
		],
			OpType.Undo,
			options,
		)
  }

	// 具体选择的最子层组件，与顶层选择的组件区分
	const _selectedComponent: ComputedRef<any> = computed(() => {
		let comp = selectedComponent.value
    if (editCharacterFile.value.selectedComponentsTree && editCharacterFile.value.selectedComponentsTree.length) {
			if (selectedSubComponent.value) {
				comp = selectedSubComponent.value
			} else {
				comp = SubComponentsRoot.value
			}
    }
    return comp
  })

	onUnmounted(() => {
    draggable.value = true
    dragOption.value = 'default'
		checkJoints.value = false
		checkRefLines.value = false
  })

	const controlType = ref(0)
	const controlTypeOptions = [
		{
			value: 0,
			key: 'widget',
		},
		{
			value: 1,
			key: 'number',
		},
	]
  const size = ref(150)

  _selectedComponent.value?.value?._o?.getJoints()?.map((joint) => {
		if (joint) {
			jointsCheckedMap.value[joint.name] = false
		}
  })

  watch([_selectedComponent, selectedComponent], () => {
    jointsCheckedMap.value = {}
    _selectedComponent.value?.value?._o?.getJoints()?.map((joint) => {
			if (joint) {
				jointsCheckedMap.value[joint.name] = false
			}
    })
  })

	let timer = null
  let opstatus = false
	watch(editCharacterFile, (newValue, oldValue) => {
		if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      opstatus = false
			clearTimeout(timer)
    }, 500)
    if (!opstatus) {
      saveGlyphEditState({
				editCharacterFile: oldValue,
				newRecord: true,
			})
      opstatus = true
    }
	})
	// }, {
	// 	deep: true,
	// })

  const handleChangeOX = (ox: number) => {
		if (editCharacterFile.value.selectedComponentsTree && editCharacterFile.value.selectedComponentsTree.length) {
			modifySubComponent({
				ox,
			})
		} else {
			modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
				ox,
			})
		}
  }

  const handleChangeOY = (oy: number) => {
		if (editCharacterFile.value.selectedComponentsTree && editCharacterFile.value.selectedComponentsTree.length) {
			modifySubComponent({
				oy,
			})
		} else {
			modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
				oy,
			})
		}
  }

  const handleChangeParameter = (parameter: IParameter | IParameter2, value: number) => {
   	parameter.value = value
		if (parameter.ratioed) {
      if (!_selectedComponent.value.value.system_script) {
        _selectedComponent.value.value.system_script = {}
      }
			if (editCharacterFile.value.selectedComponentsTree && editCharacterFile.value.selectedComponentsTree.length && selectedSubComponent.value) {
				// 选中子字形组件
				let layout = getRatioLayout2(SubComponentsRoot.value.value, parameter.ratio)
				if (layout) {
					const script = `window.comp_glyph.setParam('${parameter.name}',window.glyph.getRatioLayout('${parameter.ratio}') / ${layout} * ${value});`
					_selectedComponent.value.value.system_script[parameter.name] = script
				}
			} else {
				// 父级直接为字符
				let layout = getCharacterRatioLayout(editCharacterFile.value, parameter.ratio)
				if (layout) {
					const script = `window.comp_glyph.setParam('${parameter.name}',window.character.getRatioLayout('${parameter.ratio}') / ${layout} * ${value});`
					_selectedComponent.value.value.system_script[parameter.name] = script
				}
			}
    }
		executeScript(_selectedComponent.value.value)
    executeCharacterScript(editCharacterFile.value)
    _selectedComponent.value.value._o.getJoints().map((joint) => {
      joint.component = _selectedComponent.value
    })
    emitter.emit('renderPreviewCanvasByUUIDOnEditing', editCharacterFile.value.uuid)
    emitter.emit('renderCharacter', true)
  }

	const handleRatioOptionChange = (parameter: IParameter | IParameter2, value: string) => {
    if (parameter.ratioed) {
      if (!_selectedComponent.value.value.system_script) {
        _selectedComponent.value.value.system_script = {}
      }
			if (editCharacterFile.value.selectedComponentsTree && editCharacterFile.value.selectedComponentsTree.length && selectedSubComponent.value) {
				// 选种子字形组件
				let layout = getRatioLayout2(SubComponentsRoot.value.value, parameter.ratio)
				if (layout) {
					const script = `window.comp_glyph.setParam('${parameter.name}',window.glyph.getRatioLayout('${parameter.ratio}') / ${layout} * ${parameter.value});`
					_selectedComponent.value.value.system_script[parameter.name] = script
				}
			} else {
				// 父级直接为字符
				let layout = getCharacterRatioLayout(editCharacterFile.value, parameter.ratio)
				if (layout) {
					const script = `window.comp_glyph.setParam('${parameter.name}',window.character.getRatioLayout('${parameter.ratio}') / ${layout} * ${parameter.value});`
					_selectedComponent.value.value.system_script[parameter.name] = script
				}
			}
    }
		executeScript(_selectedComponent.value.value)
    executeCharacterScript(editCharacterFile.value)
    emitter.emit('renderPreviewCanvasByUUIDOnEditing', _selectedComponent.value.value.uuid)
    emitter.emit('renderCharacter')
  }

	watch([checkJoints, checkRefLines], () => {
    emitter.emit('renderCharacter')
  })

  watch(jointsCheckedMap, () => {
    if (editStatus.value === Status.Edit) {
      emitter.emit('renderCharacter')
    } else if (editStatus.value === Status.Glyph) {
      emitter.emit('renderGlyph')
    }
    _selectedComponent.value?.value?._o?.renderJoints(canvas.value, {
      type: 'selected',
      joints: Object.keys(jointsCheckedMap.value).filter((name) => !!jointsCheckedMap.value[name]),
    })
  }, {
    deep: true,
  })

  watch(dragOption, () => {
    if (dragOption.value === 'layout' && (!editCharacterFile.value.selectedComponentsTree || !editCharacterFile.value.selectedComponentsTree.length)) {
      grid.type = GridType.LayoutGrid
    }
  })

  let collapsedMap: any = ref({})
  onMounted(() => {
    if (editStatus.value === Status.Edit) {
      _selectedComponent.value.value.parameters?.parameters.map((param) => {
        collapsedMap.value[param.uuid] = false
      })
    } else {

    }
  })

	const onChange = (parameter, _radius: number, _degree: number, _params: Array<any>) => {
    // radius.value.value = _radius
    // degree.value.value = _degree
    // params.value = Object.assign([], _params)
    parameter.radius.value = _radius
    parameter.degree.value = _degree
    parameter.params = Object.assign([], _params)
		executeScript(_selectedComponent.value.value)
    executeCharacterScript(editCharacterFile.value)
    emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
    emitter.emit('renderCharacter', true)
  }

	const onLayoutChange = () => {
		executeScript(_selectedComponent.value.value)
		executeCharacterScript(editCharacterFile.value)
		emitter.emit('renderCharacter_forceUpdate', true)
		emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
	}

	const cancelGlobalParam = (parameter: IParameter) => {
		const param = getConstant(parameter.value as string)
		parameter.type = param.type
		parameter.value = param.value
		const arr = constantGlyphMap.get(param.uuid)
		for (let i = 0; i < arr.length; i++) {
			if (arr[i].parameterUUID === parameter.uuid) {
				arr.splice(i, 1)
				break
			}
		}
	}

	const setAsGlobalParam = (parameter: IParameter) => {
		selectedParam.value = parameter
		selectedParamType.value = 'character_components'
		setSetAsGlobalParamDialogVisible(true)
	}

	const selectGlobalParam = (parameter: IParameter) => {
		selectedParam.value = parameter
		selectedParamType.value = 'character_components'
		setSelectGlobalParamDialogVisible(true)
	}

	const updateGlobalParam = (parameter: IParameter) => {
		// 选择全局变量时，只更新当前字形的视图
		// 但是一个全局变量可能用于多个字形的组件
		// 点击更新全局变量会更新其他调用该全局变量的字形或字符的预览试图
		const arr = constantGlyphMap.get(parameter.value as unknown as string)
		for (let i = 0; i < arr.length; i++) {
			const pair = arr[i]
			let glyph = null
			if (pair.constantType === ConstantType.Parameter) {
				glyph = getGlyphByUUID(arr[i].glyphUUID)
			} else if (pair.constantType === ConstantType.Component) {
				const parentUUID = arr[i].parentUUID
				let parent = null
				if (pair.glyphType === GlyphType.Char) {
					parent = selectedItemByUUID(selectedFile.value.characterList, parentUUID)
				} else {
					parent = getGlyphByUUID(parentUUID)
				}
				glyph = parent.value
			}
			if (!glyph) continue
			executeScript(glyph)
			emitter.emit('renderGlyphPreviewCanvasByUUID', glyph.uuid)
		}
	}

	const onFillColorChange = (color: string) => {
		emitter.emit('renderCharacter', true)
	}

	const handleFormatGlyphComponent = () => {
		tips.value = t('panels.paramsPanel.formatComponent.confirmMsg')
		setTipsDialogVisible(true, () => {
			// 执行格式化逻辑
			formatGlyphComponent()
		})
	}

	const formatGlyphComponent = () => {
		if (!_selectedComponent.value || _selectedComponent.value.type !== 'glyph') {
			tips.value = '请先选择一个字形组件'
			setTipsDialogVisible(true)
			return
		}
		
		// 获取字形的所有组件
		// 1. 字形内部生成的组件（PenComponent, PolygonComponent 等类实例）
		const glyphGeneratedComponents = _selectedComponent.value.value._o?._components || []
		
		// 2. 字形包含的普通组件（pen, polygon, rectangle, ellipse 等）
		// 通过 orderedList 获取，排除掉 glyph 类型的组件（避免重复处理）
		const glyphData = _selectedComponent.value.value
		const glyphNormalComponents = (glyphData.orderedList || [])
			.map(item => {
				if (item.type === 'component') {
					// 从 components 数组中查找
					return glyphData.components.find(c => c.uuid === item.uuid)
				}
				return null
			})
			.filter(comp => comp !== null && comp.type !== 'glyph')
		
		console.log('格式化字形组件:', {
			component: _selectedComponent.value,
			glyphGeneratedComponents,
			glyphGeneratedComponentsLength: glyphGeneratedComponents.length,
			glyphNormalComponents,
			glyphNormalComponentsLength: glyphNormalComponents.length
		})
		
		if (!glyphGeneratedComponents.length && !glyphNormalComponents.length) {
			tips.value = '该字形组件没有可转换的轮廓组件'
			setTipsDialogVisible(true)
			return
		}
		
		// 将字形内部组件转换为普通组件格式
		const convertComponent = (comp, ox = 0, oy = 0) => {
			const componentData = comp.getData()
			
			console.log('转换单个组件:', {
				compType: comp.type,
				componentData,
				ox,
				oy,
				hasPoints: !!componentData.points,
				pointsLength: componentData.points?.length
			})
			
			// 映射类型名称
			const typeMap = {
				'glyph-pen': 'pen',
				'glyph-polygon': 'polygon',
				'glyph-rectangle': 'rectangle',
				'glyph-ellipse': 'ellipse',
			}
			const componentType = typeMap[comp.type] || 'pen'
			
			// 将点坐标应用偏移量（字形内部组件的坐标需要加上字形组件的偏移）
			const applyOffset = (points, ox, oy) => {
				if (!points) return points
				return points.map(p => ({
					...p,
					x: p.x + ox,
					y: p.y + oy,
				}))
			}
			
			// 应用偏移后的数据
			let transformedData = { ...componentData }
			if (componentData.points) {
				transformedData.points = applyOffset(componentData.points, ox, oy)
			}
			// contour 和 preview 已经计算过 ox, oy，不需要重新应用偏移
			
			// 计算包围盒（使用偏移后的坐标）
			const getBoundingBox = (data) => {
				if (data.points && data.points.length) {
					let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
					data.points.forEach(p => {
						if (p.x < minX) minX = p.x
						if (p.x > maxX) maxX = p.x
						if (p.y < minY) minY = p.y
						if (p.y > maxY) maxY = p.y
					})
					return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
				} else if (data.width !== undefined && data.height !== undefined) {
					// rectangle - 也需要应用偏移
					return { x: ox, y: oy, w: data.width, h: data.height }
				} else if (data.radiusX !== undefined && data.radiusY !== undefined) {
					// ellipse - 也需要应用偏移
					return { x: ox, y: oy, w: data.radiusX * 2, h: data.radiusY * 2 }
				}
				return { x: 0, y: 0, w: 0, h: 0 }
			}
			
			const bounds = getBoundingBox(transformedData)
			
			// 构造普通组件格式（ox, oy 设为 0，因为偏移已经应用到坐标上）
			const commonProps = {
				uuid: genUUID(),
				type: componentType,
				name: _selectedComponent.value.name,
				lock: false,
				visible: true,
				ox: 0,
				oy: 0,
				usedInCharacter: true,
			}
			
			// 根据不同类型构造不同的 value 结构
			if (componentType === 'pen') {
				const result = {
					...commonProps,
					...bounds,
					rotation: 0,
					flipX: false,
					flipY: false,
					value: {
						points: transformedData.points,
						fillColor: '',
						strokeColor: '#000',
						closePath: true,
						editMode: false,
						preview: transformedData.preview,
						contour: transformedData.contour,
					},
				}
				console.log('生成的 pen 组件:', {
					...result,
					pointsCount: result.value.points?.length,
					hasPreview: !!result.value.preview,
					hasContour: !!result.value.contour,
					bounds,
					firstPoint: result.value.points?.[0]
				})
				return result
			} else if (componentType === 'polygon') {
				return {
					...commonProps,
					...bounds,
					rotation: 0,
					flipX: false,
					flipY: false,
					value: {
						points: transformedData.points,
						fillColor: '',
						strokeColor: '#000',
						closePath: true,
						preview: transformedData.preview,
						contour: transformedData.contour,
					},
				}
			} else if (componentType === 'rectangle') {
				return {
					...commonProps,
					...bounds,
					rotation: 0,
					flipX: false,
					flipY: false,
					value: {
						width: componentData.width,
						height: componentData.height,
						fillColor: '',
						strokeColor: '#000',
						preview: componentData.preview,
						contour: componentData.contour,
					},
				}
			} else if (componentType === 'ellipse') {
				return {
					...commonProps,
					...bounds,
					rotation: 0,
					flipX: false,
					flipY: false,
					value: {
						radiusX: componentData.radiusX,
						radiusY: componentData.radiusY,
						fillColor: '',
						strokeColor: '#000',
						preview: componentData.preview,
						contour: componentData.contour,
					},
				}
			}
			
			// 默认返回 pen 格式
			return {
				...commonProps,
				...bounds,
				rotation: 0,
				flipX: false,
				flipY: false,
				value: componentData,
			}
		}
		
		// 将字形组件替换为普通钢笔组件
		if (editCharacterFile.value.selectedComponentsTree && editCharacterFile.value.selectedComponentsTree.length && selectedSubComponent.value) {
			// 子组件 - 暂不支持
			tips.value = '暂不支持格式化嵌套的子字形组件'
			setTipsDialogVisible(true)
			return
		} else {
			// 先保存所有需要的数据（因为后面会清除选择状态）
			const oldComponentUUID = selectedComponentUUID.value
			const oldComponentOx = _selectedComponent.value.ox
			const oldComponentOy = _selectedComponent.value.oy
			
			// 顶层组件 - 先生成新组件
			// 1. 转换字形内部生成的组件
			const convertedComponents = glyphGeneratedComponents.map(comp => 
				convertComponent(comp, oldComponentOx, oldComponentOy)
			)
			
			// 2. 复制普通组件，应用偏移量
			const copiedNormalComponents = glyphNormalComponents.map(comp => ({
				...comp,
				uuid: genUUID(), // 生成新的 UUID
				ox: comp.ox + oldComponentOx,
				oy: comp.oy + oldComponentOy,
			}))
			
			// 合并所有组件
			const newComponents = [...convertedComponents, ...copiedNormalComponents]
			
			console.log('组件转换详情:', {
				convertedComponentsCount: convertedComponents.length,
				copiedNormalComponentsCount: copiedNormalComponents.length,
				totalNewComponents: newComponents.length
			})
			
			// 立即清除选择状态，避免后续操作触发响应式访问已删除的组件
			editCharacterFile.value.selectedComponentsUUIDs = []
			editCharacterFile.value.selectedComponentsTree = []
			
			console.log('转换后的组件:', {
				newComponents,
				newComponentsLength: newComponents.length,
				oldComponentsLength: editCharacterFile.value.components.length,
				oldComponentUUID: oldComponentUUID,
				hasUndefined: newComponents.some(c => c === undefined),
				hasNull: newComponents.some(c => c === null),
				allValid: newComponents.every(c => c && c.uuid)
			})
			
			// 删除当前字形组件，并插入转换后的组件
			const index = editCharacterFile.value.components.findIndex(c => c.uuid === oldComponentUUID)
			console.log('找到组件索引:', index)
			
			if (index !== -1) {
				// 先找到 orderedList 中的索引（使用保存的 UUID）
				const orderIndex = editCharacterFile.value.orderedList.findIndex(item => 
					item && item.type === 'component' && item.uuid === oldComponentUUID
				)
				
				console.log('找到 orderedList 索引:', orderIndex)
				
				// 构建新的组件数组
				const newComponentsList = [
					...editCharacterFile.value.components.slice(0, index),
					...newComponents,
					...editCharacterFile.value.components.slice(index + 1)
				]
				
				// 构建新的 orderedList
				let newOrderedList = editCharacterFile.value.orderedList
				if (orderIndex !== -1) {
					const newOrderItems = newComponents.map(comp => ({
						type: 'component',
						uuid: comp.uuid
					}))
					
					newOrderedList = [
						...editCharacterFile.value.orderedList.slice(0, orderIndex),
						...newOrderItems,
						...editCharacterFile.value.orderedList.slice(orderIndex + 1)
					]
					
					console.log('更新 orderedList:', {
						orderIndex,
						newOrderedListLength: newOrderedList.length,
						newOrderItems
					})
				}
				
				console.log('新组件列表:', {
					newComponentsListLength: newComponentsList.length,
					hasNull: newComponentsList.some(c => c === null || c === undefined)
				})
				
				// 同时更新两个数组（减少响应式触发次数）
				editCharacterFile.value.orderedList = newOrderedList
				editCharacterFile.value.components = newComponentsList
				
				console.log('替换后组件数量:', editCharacterFile.value.components.length)
				console.log('检查所有组件:', editCharacterFile.value.components.map((c, i) => ({
					index: i,
					uuid: c?.uuid,
					type: c?.type,
					name: c?.name,
					isNull: c === null,
					isUndefined: c === undefined
				})))
			}
			
			// 然后执行脚本和渲染
			executeCharacterScript(editCharacterFile.value)
			emitter.emit('renderCharacter', true)
			emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
		}
	}
</script>

<template>
  <div class="glyph-edit-panel">
    <div class="character-glyph-edit-panel" v-if="editStatus === Status.Edit">
			<div class="character-edit-panel">
				<div class="name-wrap">
					<div class="title">{{ t('panels.paramsPanel.componentName.title') }}</div>
					<el-form
						class="name-form"
						label-width="80px"
					>
						<el-form-item :label="tm('panels.paramsPanel.componentName.label')">
							<el-input
								v-model="_selectedComponent.name"
							/>
						</el-form-item>
					</el-form>
				</div>
				<div class="layout-wrap" v-if="_selectedComponent.value.layout">
					<div class="title">{{ t('panels.paramsPanel.layout.title') }}</div>
					<el-form
						class="name-form"
						label-width="80px"
					>
						<el-form-item :label="tm('panels.paramsPanel.layout.type')">
							<el-input disabled v-model="_selectedComponent.value.layout.type"></el-input>
						</el-form-item>
						<el-form-item
							v-for="key in Object.keys(_selectedComponent.value.layout.params)"
							:label="key"
						>
							<el-input-number v-model="_selectedComponent.value.layout.params[key]" @change="onLayoutChange" :precision="2"/>
							<div class="ratio-item">
								<font-awesome-icon class="ratio-icon" :class="{
									selected: _selectedComponent.value.layout.ratioedMap && _selectedComponent.value.layout.ratioedMap[key].ratioed
								}" @pointerdown="() => {
									if (!_selectedComponent.value.layout.ratioedMap) {
										_selectedComponent.value.layout.ratioedMap = new Map()
									}
									if (!_selectedComponent.value.layout.ratioedMap[key]) {
										_selectedComponent.value.layout.ratioedMap.set(key, {ratioed: true})
									}
									_selectedComponent.value.layout.ratioedMap[key].ratioed = !_selectedComponent.value.layout.ratioedMap[key].ratioed
								}" :icon="['fas', 'percent']" />
								<el-select v-model="_selectedComponent.value.layout.ratioedMap[key].ratio" class="control-type-select" placeholder="Ratio" :disabled="!_selectedComponent.value.layout.ratioedMap || !_selectedComponent.value.layout.ratioedMap[key].ratioed">
									<el-option
										v-for="item in getRatioOptions(_selectedComponent.value)"
										:key="item.key"
										:label="item.label"
										:value="item.value"
									/>
								</el-select>
							</div>
						</el-form-item>
						<el-form-item label="编辑结构">
							<el-switch v-model="editingLayout" />
						</el-form-item>
					</el-form>
				</div>
				<!-- <div class="interactive-settings">
					<div class="title">{{ t('panels.paramsPanel.interactive') }}</div>
					<el-form
						class="name-form"
						label-width="80px"
					>
						<el-form-item :label="tm('panels.paramsPanel.draggableOption')">
							<el-checkbox
								v-model="draggable"
								class="draggable-check"
							>
								{{ t('panels.paramsPanel.draggable') }}
							</el-checkbox>
						</el-form-item>
						<el-form-item :label="tm('panels.paramsPanel.dragOption')">
							<el-radio-group v-model="dragOption" class="radio-group">
								<el-radio value="none" label="none">{{ t('panels.paramsPanel.dragOptionNone') }}</el-radio>
								<el-radio value="default" label="default">{{ t('panels.paramsPanel.dragOptionDefault') }}</el-radio>
								<el-radio
									value="layout"
									label="layout"
									:disabled="!SubComponentsRoot || (!!SubComponentsRoot && !SubComponentsRoot.value.layout)"
								>{{ t('panels.paramsPanel.dragOptionLayout') }}</el-radio>
							</el-radio-group>
						</el-form-item>
					</el-form>
				</div> -->
				<div class="transform-wrap">
					<div class="title">{{ t('panels.paramsPanel.transform.title') }}</div>
					<el-form
						class="transfom-form"
						label-width="80px"
					>
						<el-form-item :label="tm('panels.paramsPanel.transform.x')">
							<el-input-number
								:model-value="_selectedComponent.ox"
								:precision="1"
								@change="handleChangeOX"
							/>
						</el-form-item>
						<el-form-item :label="tm('panels.paramsPanel.transform.y')">
							<el-input-number
								:model-value="_selectedComponent.oy"
								:precision="1"
								@change="handleChangeOY"
							/>
						</el-form-item>
					</el-form>
				</div>
			</div>
			<div class="parameters-wrap">
				<div class="title">{{ t('panels.paramsPanel.params.title') }}</div>
				<el-form
					class="parameters-form"
					label-width="80px"
				>
					<el-form-item :label="tm('programming.joint')">
						<el-switch
							v-model="checkJoints"
						/>
					</el-form-item>
					<el-form-item :label="tm('programming.refline')">
						<el-switch
							v-model="checkRefLines"
						/>
					</el-form-item>
					<el-form-item :label="parameter.name" v-for="parameter in _selectedComponent.value.parameters.parameters">
						<el-popover placement="right" :width="250" trigger="click">
							<template #reference>
								<el-icon class="more-btn"
									:class="{
										ring: parameter.type === ParameterType.RingController || (parameter.type === ParameterType.Constant && getConstant(parameter.value).type === ParameterType.RingController),
										show: parameter.type === ParameterType.Number || (parameter.type === ParameterType.Constant && getConstant(parameter.value).type !== ParameterType.RingController) || controlType === 0
									}"
								><More /></el-icon>
							</template>
							<div class="param-btn-group">
								<el-button
									v-show="parameter.type === ParameterType.Constant"
									@pointerdown="cancelGlobalParam(parameter)"
								>{{ t('panels.paramsPanel.cancelGlobalParam') }}</el-button>
								<el-button
									@pointerdown="setAsGlobalParam(parameter)"
								>{{ t('panels.paramsPanel.setAsGlobalParam') }}</el-button>
								<el-button
									@pointerdown="selectGlobalParam(parameter)"
								>{{ t('panels.paramsPanel.selectGlobalParam') }}</el-button>
								<el-button
									v-show="parameter.type === ParameterType.Constant"
									type="primary"
									@pointerdown="updateGlobalParam(parameter)"
								>{{ t('panels.paramsPanel.updateGlobalParam') }}</el-button>
							</div>
						</el-popover>
						<div
							class="global-param-note"
							v-show="parameter.type === ParameterType.Constant"
							:class="{
								ring: parameter.type === ParameterType.Constant && getConstant(parameter.value).type === ParameterType.RingController
							}"
						>{{ t('panels.paramsPanel.globalParam') }}</div>
						<div v-if="parameter.type === ParameterType.Number">
							<el-input-number
								:model-value="parameter.value"
								:step="parameter.max <= 10 ? 0.01 : 1"
								:min="parameter.min"
								:max="parameter.max"
								:precision="parameter.max <= 10 ? 2 : 0"
								:disabled="parameter.type === ParameterType.Constant"
								@change="(value) => handleChangeParameter(parameter, value)"
							/>
							<el-slider
								:step="parameter.max <= 10 ? 0.01 : 1"
								:min="parameter.min"
								:max="parameter.max"
								:precision="parameter.max <= 10 ? 2 : 0"
								@input="(value) => handleChangeParameter(parameter, value)"
								v-model="parameter.value" v-show="parameter.type === ParameterType.Number"
							/>
							<div class="down-menu-icon-wrap" @pointerdown="collapsedMap[parameter.uuid] = !collapsedMap[parameter.uuid]">
								<font-awesome-icon :icon="['fas', 'arrow-down-wide-short']" />
							</div>
							<div class="down-menu" v-show="collapsedMap[parameter.uuid]">
								<div class="ratio-item">
									<font-awesome-icon class="ratio-icon" :class="{
										selected: parameter.ratioed
									}" @pointerdown="() => {
										parameter.ratioed = !parameter.ratioed
										if (!parameter.ratioed && _selectedComponent.value.system_script && _selectedComponent.value.system_script[parameter.name]) {
											delete _selectedComponent.value.system_script[parameter.name]
										}
									}" :icon="['fas', 'percent']" />
									<el-select
										v-model="parameter.ratio" class="control-type-select" placeholder="Ratio" :disabled="!parameter.ratioed"
										@change="(value) => handleRatioOptionChange(parameter, value)"
									>
										<el-option
											v-for="item in getRatioOptions(_selectedComponent.value)"
											:key="item.key"
											:label="item.label"
											:value="item.value"
										/>
									</el-select>
								</div>
							</div>
						</div>
						<div v-else-if="parameter.type === ParameterType.Enum">
							<el-select
								v-model="parameter.value" class="enum-param-select" placeholder="Select"
								@change="(value) => handleChangeParameter(parameter, value)"
							>
								<el-option
									v-for="option in parameter.options"
									:key="option.value"
									:label="option.label"
									:value="option.value"
								/>
							</el-select>
						</div>
						<div v-else-if="parameter.type === ParameterType.RingController">
							<el-select v-model="controlType" class="control-type-select" :placeholder="tm('programming.controlType')">
								<el-option
									v-for="item in controlTypeOptions"
									:key="item.key"
									:label="tm(`programming.${item.key}`)"
									:value="item.value"
								/>
							</el-select>
							<div v-if="controlType === 0" class="ring-controller-wrap">
								<ring-controller
									:radius="(parameter.value as IRingParameter).radius"
									:size="size"
									:degree = "(parameter.value as IRingParameter).degree"
									:params = "(parameter.value as IRingParameter).params"
									:on-change="(_radius: number, _degree: number, _params: Array<any>) => onChange(parameter.value, _radius, _degree, _params)"
								></ring-controller>
							</div>
							<div v-else-if="controlType === 1" class="number-controller-wrap">
								<el-tabs type="border-card">
									<el-tab-pane label="radius">
										<el-form-item label="name" label-width="42px">
											<el-input class="parameter-value" v-model="(parameter.value as IRingParameter).radius.name" disabled></el-input>
										</el-form-item>
										<el-form-item label="value" label-width="42px">
											<el-input-number
												class="parameter-value"
												v-model="(parameter.value as IRingParameter).radius.value"
												:min="(parameter.value as IRingParameter).radius.min"
												:max="(parameter.value as IRingParameter).radius.max"
												:precision="(parameter.value as IRingParameter).radius.max <= 10 ? 2 : 0"
                      	:step="(parameter.value as IRingParameter).radius.max <= 10 ? 0.01 : 1"
											></el-input-number>
											<el-slider
												@input="(value) => handleChangeParameter((parameter.value as IRingParameter).radius, value)"
												v-model="(parameter.value as IRingParameter).radius.value"
												:min="(parameter.value as IRingParameter).radius.min"
												:max="(parameter.value as IRingParameter).radius.max"
												:precision="(parameter.value as IRingParameter).radius.max <= 10 ? 2 : 0"
                      	:step="(parameter.value as IRingParameter).radius.max <= 10 ? 0.01 : 1"
											/>
										</el-form-item>
									</el-tab-pane>
									<el-tab-pane label="degree">
										<el-form-item label="name" label-width="42px">
											<el-input class="parameter-value" v-model="(parameter.value as IRingParameter).degree.name" disabled></el-input>
										</el-form-item>
										<el-form-item label="value" label-width="42px">
											<el-input-number
												class="parameter-value"
												v-model="(parameter.value as IRingParameter).degree.value"
												:min="(parameter.value as IRingParameter).degree.min"
												:max="(parameter.value as IRingParameter).degree.max"
												:precision="parameter.max <= 10 ? 2 : 0"
                      	:step="parameter.max <= 10 ? 0.01 : 1"
											></el-input-number>
											<el-slider
												@input="(value) => handleChangeParameter((parameter.value as IRingParameter).degree, value)"
												v-model="(parameter.value as IRingParameter).degree.value"
												:min="(parameter.value as IRingParameter).degree.min"
												:max="(parameter.value as IRingParameter).degree.max"
												:precision="(parameter.value as IRingParameter).degree.max <= 10 ? 2 : 0"
                      	:step="(parameter.value as IRingParameter).degree.max <= 10 ? 0.01 : 1"
											/>
										</el-form-item>
									</el-tab-pane>
									<el-tab-pane label="params">
										<el-collapse>
											<el-collapse-item v-for="param in (parameter.value as IRingParameter).params" :title="param.name" name="1">
												<el-form-item label="name" label-width="42px">
													<el-input class="parameter-value" v-model="param.name" disabled></el-input>
												</el-form-item>
												<el-form-item label="value" label-width="42px">
													<el-input-number
														class="parameter-value"
														v-model="param.value"
														:min="param.min"
														:max="param.max"
														:precision="param.max <= 10 ? 2 : 0"
                      			:step="param.max <= 10 ? 0.01 : 1"
													></el-input-number>
													<el-slider
														@input="(value) => handleChangeParameter(param, value)"
														v-model="param.value"
														:min="param.min"
														:max="param.max"
														:precision="param.max <= 10 ? 2 : 0"
                      			:step="param.max <= 10 ? 0.01 : 1"
													/>
												</el-form-item>
											</el-collapse-item>
										</el-collapse>
									</el-tab-pane>
								</el-tabs>
							</div>
						</div>
						<div v-else-if="parameter.type === ParameterType.Constant">
							<div v-if="getConstant(parameter.value).type === ParameterType.Number">
								<el-input-number
									:model-value="getConstant(parameter.value).value"
									:step="getConstant(parameter.value).max <= 10 ? 0.01 : 1"
									:min="getConstant(parameter.value).min"
									:max="getConstant(parameter.value).max"
									:precision="getConstant(parameter.value).max <= 10 ? 2 : 0"
									@change="(value) => handleChangeParameter(getConstant(parameter.value), value)"
								/>
								<el-slider
									:model-value="getConstant(parameter.value).value"
									:step="getConstant(parameter.value).max <= 10 ? 0.01 : 1"
									:min="getConstant(parameter.value).min"
									:max="getConstant(parameter.value).max"
									:precision="getConstant(parameter.value).max <= 10 ? 2 : 0"
									@input="(value) => handleChangeParameter(getConstant(parameter.value), value)"
									@change="(value) => handleChangeParameter(getConstant(parameter.value), value)"
								/>
							</div>
							<div v-else-if="getConstant(parameter.value).type === ParameterType.Enum">
								<el-select
									:model-value="getConstant(parameter.value).value" class="enum-param-select" placeholder="Select"
									@change="(value) => handleChangeParameter(getConstant(parameter.value), value)"
								>
									<el-option
										v-for="option in getConstant(parameter.value).options"
										:key="option.value"
										:label="option.label"
										:value="option.value"
									/>
								</el-select>
							</div>
							<div v-else-if="getConstant(parameter.value).type === ParameterType.RingController">
								<el-select v-model="controlType" class="control-type-select" :placeholder="tm('programming.controlType')">
									<el-option
										v-for="item in controlTypeOptions"
										:key="item.key"
										:label="tm(`programming.${item.key}`)"
										:value="item.value"
									/>
								</el-select>
								<div v-if="controlType === 0" class="ring-controller-wrap">
									<ring-controller
										:radius="(getConstant(parameter.value).value as IRingParameter).radius"
										:size="size"
										:degree = "(getConstant(parameter.value).value as IRingParameter).degree"
										:params = "(getConstant(parameter.value).value as IRingParameter).params"
										:on-change="(_radius: number, _degree: number, _params: Array<any>) => onChange(getConstant(parameter.value).value, _radius, _degree, _params)"
									></ring-controller>
								</div>
								<div v-else-if="controlType === 1" class="number-controller-wrap">
									<el-tabs type="border-card">
										<el-tab-pane label="radius">
											<el-form-item label="name" label-width="42px">
												<el-input class="parameter-value" :model-value="(getConstant(parameter.value).value as IRingParameter).radius.name" disabled></el-input>
											</el-form-item>
											<el-form-item label="value" label-width="42px">
												<el-input-number
													class="parameter-value"
													:model-value="(getConstant(parameter.value).value as IRingParameter).radius.value"
													:min="(getConstant(parameter.value).value as IRingParameter).radius.min"
													:max="(getConstant(parameter.value).value as IRingParameter).radius.max"
													:precision="(getConstant(parameter.value).value as IRingParameter).radius.max <= 10 ? 2 : 0"
													:step="(getConstant(parameter.value).value as IRingParameter).radius.max <= 10 ? 0.01 : 1"
													@change="(value) => handleChangeParameter(getConstant(parameter.value).value.radius, value)"
												></el-input-number>
												<el-slider
													@input="(value) => handleChangeParameter(getConstant(parameter.value).value.radius, value)"
													:model-value="(getConstant(parameter.value).value as IRingParameter).radius.value"
													:min="(getConstant(parameter.value).value as IRingParameter).radius.min"
													:max="(getConstant(parameter.value).value as IRingParameter).radius.max"
													:precision="(getConstant(parameter.value).value as IRingParameter).radius.max <= 10 ? 2 : 0"
													:step="(getConstant(parameter.value).value as IRingParameter).radius.max <= 10 ? 0.01 : 1"
												/>
											</el-form-item>
										</el-tab-pane>
										<el-tab-pane label="degree">
											<el-form-item label="name" label-width="42px">
												<el-input class="parameter-value" :model-value="(getConstant(parameter.value).value as IRingParameter).degree.name" disabled></el-input>
											</el-form-item>
											<el-form-item label="value" label-width="42px">
												<el-input-number
													class="parameter-value"
													:model-value="(getConstant(parameter.value).value as IRingParameter).degree.value"
													:min="(getConstant(parameter.value).value as IRingParameter).degree.min"
													:max="(getConstant(parameter.value).value as IRingParameter).degree.max"
													:precision="(getConstant(parameter.value).value as IRingParameter).degree.max <= 10 ? 2 : 0"
													:step="(getConstant(parameter.value).value as IRingParameter).degree.max <= 10 ? 0.01 : 1"
													@change="(value) => handleChangeParameter(getConstant(parameter.value).value.degree, value)"
												></el-input-number>
												<el-slider
													@input="(value) => handleChangeParameter(getConstant(parameter.value).value.degree, value)"
													:model-value="(getConstant(parameter.value).value as IRingParameter).degree.value"
													:min="(getConstant(parameter.value).value as IRingParameter).degree.min"
													:max="(getConstant(parameter.value).value as IRingParameter).degree.max"
													:precision="(getConstant(parameter.value).value as IRingParameter).degree.max <= 10 ? 2 : 0"
													:step="(getConstant(parameter.value).value as IRingParameter).degree.max <= 10 ? 0.01 : 1"
												/>
											</el-form-item>
										</el-tab-pane>
										<el-tab-pane label="params">
											<el-collapse>
												<el-collapse-item v-for="param in (getConstant(parameter.value).value as IRingParameter).params" :title="param.name" name="1">
													<el-form-item label="name" label-width="42px">
														<el-input class="parameter-value" :model-value="param.name" disabled></el-input>
													</el-form-item>
													<el-form-item label="value" label-width="42px">
														<el-input-number
															class="parameter-value test"
															:model-value="param.value"
															:min="param.min"
															:max="param.max"
															:precision="param.max <= 10 ? 2 : 0"
															:step="param.max <= 10 ? 0.01 : 1"
															@change="(value) => handleChangeParameter(param, value)"
														></el-input-number>
														<el-slider
															@input="(value) => handleChangeParameter(param, value)"
															v-model="param.value"
															:min="param.min"
															:max="param.max"
															:precision="param.max <= 10 ? 2 : 0"
															:step="param.max <= 10 ? 0.01 : 1"
														/>
													</el-form-item>
												</el-collapse-item>
											</el-collapse>
										</el-tab-pane>
									</el-tabs>
								</div>
							</div>
						</div>
					</el-form-item>
				</el-form>
			</div>
			<div class="joints-wrap">
				<div class="title">{{ t('panels.paramsPanel.joints.title') }}</div>
				<el-form
					class="joints-form"
					label-width="80px"
				>
					<el-checkbox
						v-model="jointsCheckedMap[joint.name]"
						:label="joint.name"
						v-for="joint in (_selectedComponent.value._o? _selectedComponent.value._o?.getJoints() : [])"
					/>
				</el-form>
			</div>
			<div class="fill-color-wrap">
				<div class="title">{{ t('panels.paramsPanel.fillColor.title') }}</div>
				<el-form
					class="name-form"
					label-width="120px"
				>
					<el-form-item :label="tm('panels.paramsPanel.fillColor.label')">
						<el-color-picker v-model="_selectedComponent.value.fillColor" show-alpha @change="onFillColorChange"/>
					</el-form-item>
				</el-form>
			</div>
			<div class="format-component-wrap" v-if="_selectedComponent.type === 'glyph'">
				<div class="title">{{ t('panels.paramsPanel.formatComponent.title') }}</div>
				<el-button class="format-button" type="warning" @pointerdown="handleFormatGlyphComponent">
					{{ t('panels.paramsPanel.formatComponent.button') }}
				</el-button>
			</div>
    </div>
  </div>
</template>

<style scoped>
  .glyph-edit-panel {
    width: 100%;
    height: 100%;
    .el-input {
      width: 150px;
    }
  }

	.format-component-wrap {
		.format-button {
			width: calc(100% - 20px);
			margin: 10px 10px;
			margin-bottom: 20px;
		}
	}

	.ratio-item {
		margin-top: 5px;
	}

	.ratio-icon {
    position: absolute;
    width: 32px;
    top: 12px;
    left: -40px;
    color: var(--light-5);
    cursor: pointer;
    &:hover, &.selected {
      color: var(--light-3);
    }
  }
  .down-menu-icon-wrap {
    width: 32px;
    position: absolute;
    left: -32px;
    top: 38px;
    color: var(--light-5);
    cursor: pointer;
    &:hover {
      color: var(--light-3);
    }
  }

	.global-param-note {
    position: absolute;
    left: -63px;
    font-size: small;
    top: 20px;
    color: #7a2703;
		font-weight: bold;
	}

	.more-btn {
		position: absolute;
		display: none;
		left: -55px;
    top: 45px;
    color: var(--light-5);
		&:hover {
			color: white;
		}
		&.ring {
			left: -32px;
		}
		&.show {
			display: block;
		}
	}

  .title {
    height: 36px;
    line-height: 36px;
    padding: 0 10px;
    border-bottom: 1px solid #dcdfe6;
  }

  .el-form {
    margin: 10px 0;
  }
  .el-checkbox {
    display: flex;
    margin: 0 20px;
    color: var(--light-3);
  }
	.el-slider {
		margin: 5px 0;
    margin-right: 20px;
	}
  .el-select {
    width: 150px;
  }
	:deep(.el-slider__button) {
		border-radius: 0;
    width: 14px;
    height: 14px;
	}
  .ring-controller-wrap {
    display: flex;
    margin: 20px 0;
  }
  .el-tabs {
    width: 216px;
    margin-left: -67px !important;
    margin: 20px 0;
    .el-form-item {
      margin: 5px 0;
    }
  }
  .radio-group {
    display: flex;
    flex-direction: column;
    align-items: start;
  }
  .draggable-check {
    margin-left: 0;
  }
	.param-btn-group {
		width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
		.el-button {
			margin: 0;
      width: 100%;
		}
		&.ring {
			top: 45px;
			left: 5px;
		}
	}
</style>