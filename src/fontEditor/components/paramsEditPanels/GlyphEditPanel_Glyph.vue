<script setup lang="ts">
	/**
	 * 字形组件参数编辑面板
	 */
	/**
	 * params editing panel for pen component
	 */
  import { parameterCompKey, modifyComponentForCurrentGlyph, editGlyph, selectedComponent, selectedComponentUUID, getRatioOptions, ParameterType, getConstant, IParameter, executeScript, IRingParameter, IParameter2, getRatioLayout, getRatioLayout2, selectedParam, selectedParamType, constantGlyphMap, ConstantType, getGlyphByUUID, GlyphType } from '../../stores/glyph'
	import { editStatus, Status } from '../../stores/font'
  import { useI18n } from 'vue-i18n'
  import { canvas, dragOption, draggable, checkJoints, checkRefLines } from '../../stores/global'
  import { ComputedRef, computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { emitter } from '../../Event/bus'
	import RingController from '../../components/Widgets/RingController.vue'
	import { editing as editingLayout } from '../../stores/glyphLayoutResizer_glyph'
	import { setSelectGlobalParamDialogVisible, setSetAsGlobalParamDialogVisible } from '../../stores/dialogs'
	import { selectedFile, selectedItemByUUID } from '../../stores/files'
	import {
    SubComponents,
    SubComponentsRoot,
    selectedSubComponent,
		modifySubComponent,
  } from '../../stores/glyph'
	import { OpType, saveState, StoreType } from '../../stores/edit'
	import { More } from '@element-plus/icons-vue'

	const saveGlyphEditState = (options) => {
    // 保存状态
		saveState('编辑字形组件参数', [
			editStatus.value === Status.Glyph ? StoreType.EditGlyph : StoreType.EditCharacter
		],
			OpType.Undo,
			options,
		)
  }

	let timer = null
  let opstatus = false
	watch(editGlyph, (newValue, oldValue) => {
		if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      opstatus = false
			clearTimeout(timer)
    }, 500)
    if (!opstatus) {
			saveGlyphEditState({
				editGlyph: oldValue,
				newRecord: true,
			})
      opstatus = true
    }
	}, {
		deep: true,
	})

	const _selectedComponent: ComputedRef<any> = computed(() => {
		let comp = selectedComponent.value
    if (editGlyph.value.selectedComponentsTree && editGlyph.value.selectedComponentsTree.length) {
			if (selectedSubComponent.value) {
				comp = selectedSubComponent.value
			} else {
				comp = SubComponentsRoot.value
			}
    }
    return comp
  })
  const { tm, t } = useI18n()

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

  const jointsCheckedMap = ref({})
  _selectedComponent.value.value._o?.getJoints().map((joint) => {
		if (joint) {
			jointsCheckedMap.value[joint.name] = false
		}
  })

  watch(_selectedComponent, () => {
    jointsCheckedMap.value = {}
    _selectedComponent.value.value._o?.getJoints().map((joint) => {
			if (joint) {
				jointsCheckedMap.value[joint.name] = false
			}
    })
  })

  const handleChangeOX = (ox: number) => {
		if (editGlyph.value.selectedComponentsTree && editGlyph.value.selectedComponentsTree.length) {
			modifySubComponent({
				ox,
			})
		} else {
			modifyComponentForCurrentGlyph(selectedComponentUUID.value, {
				ox,
			})
		}
  }

  const handleChangeOY = (oy: number) => {
		if (editGlyph.value.selectedComponentsTree && editGlyph.value.selectedComponentsTree.length) {
			modifySubComponent({
				oy,
			})
		} else {
			modifyComponentForCurrentGlyph(selectedComponentUUID.value, {
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
			if (editGlyph.value.selectedComponentsTree && editGlyph.value.selectedComponentsTree.length && selectedSubComponent.value) {
				// 选中子字形组件
				let layout = getRatioLayout2(SubComponentsRoot.value.value, parameter.ratio)
				if (layout) {
					const script = `window.comp_glyph.setParam('${parameter.name}',window.glyph.getRatioLayout('${parameter.ratio}') / ${layout} * ${value});`
					_selectedComponent.value.value.system_script[parameter.name] = script
				}
			} else {
				// 父级直接为字符
				let layout = getRatioLayout(editGlyph.value, parameter.ratio)
				if (layout) {
					const script = `window.comp_glyph.setParam('${parameter.name}',window.glyph.getRatioLayout('${parameter.ratio}') / ${layout} * ${value});`
					_selectedComponent.value.value.system_script[parameter.name] = script
				}
			}
    }
		//executeScript(_selectedComponent.value.value)
    executeScript(editGlyph.value)
    _selectedComponent.value.value._o.getJoints().map((joint) => {
      joint.component = _selectedComponent.value
    })
    emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
    emitter.emit('renderGlyph')
  }

	const handleRatioOptionChange = (parameter: IParameter | IParameter2, value: string) => {
    if (parameter.ratioed) {
      if (!_selectedComponent.value.value.system_script) {
        _selectedComponent.value.value.system_script = {}
      }
			if (editGlyph.value.selectedComponentsTree && editGlyph.value.selectedComponentsTree.length && selectedSubComponent.value) {
				// 选种子字形组件
				let layout = getRatioLayout2(SubComponentsRoot.value.value, parameter.ratio)
				if (layout) {
					const script = `window.comp_glyph.setParam('${parameter.name}',window.glyph.getRatioLayout('${parameter.ratio}') / ${layout} * ${parameter.value});`
					_selectedComponent.value.value.system_script[parameter.name] = script
				}
			} else {
				// 父级直接为字符
				let layout = getRatioLayout(editGlyph.value, parameter.ratio)
				if (layout) {
					const script = `window.comp_glyph.setParam('${parameter.name}',window.glyph.getRatioLayout('${parameter.ratio}') / ${layout} * ${parameter.value});`
					_selectedComponent.value.value.system_script[parameter.name] = script
				}
			}
    }
		//executeScript(_selectedComponent.value.value)
    executeScript(editGlyph.value)
    emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
    emitter.emit('renderGlyph')
  }

  watch(jointsCheckedMap, () => {
    if (editStatus.value === Status.Edit) {
      emitter.emit('renderCharacter')
    } else if (editStatus.value === Status.Glyph) {
      emitter.emit('renderGlyph')
    }
    _selectedComponent.value.value._o.renderJoints(canvas.value, {
      type: 'selected',
      joints: Object.keys(jointsCheckedMap.value).filter((name) => !!jointsCheckedMap.value[name]),
    })
  }, {
    deep: true,
  })

	watch([checkJoints, checkRefLines], () => {
    emitter.emit('renderGlyph')
  })

  watch(dragOption, () => {
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
    executeScript(editGlyph.value)
		emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
		emitter.emit('renderGlyph', true)
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
		selectedParamType.value = 'glyph_components'
		setSetAsGlobalParamDialogVisible(true)
	}

	const selectGlobalParam = (parameter: IParameter) => {
		selectedParam.value = parameter
		selectedParamType.value = 'glyph_components'
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

	const onLayoutChange = () => {
		executeScript(_selectedComponent.value.value)
		executeScript(editGlyph.value)
		emitter.emit('renderGlyph_forceUpdate', true)
		emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
	}
</script>

<template>
  <div class="glyph-edit-panel">
    <div class="character-glyph-edit-panel" v-if="editStatus === Status.Glyph">
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
							<el-input-number v-model="_selectedComponent.value.layout.params[key]" @change="onLayoutChange"/>
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
				<div class="interactive-settings">
					<div class="title">交互设定</div>
					<el-form
						class="name-form"
						label-width="80px"
					>
						<el-form-item label="拖拽设定">
							<el-checkbox
								v-model="draggable"
								class="draggable-check"
							>
								可拖拽
							</el-checkbox>
						</el-form-item>
						<el-form-item label="吸附设定">
							<el-radio-group v-model="dragOption" class="radio-group">
								<el-radio value="none" label="none">无</el-radio>
								<el-radio value="default" label="default">默认标点</el-radio>
								<el-radio
									value="layout"
									label="layout"
									:disabled="(!SubComponentsRoot && !editGlyph.layout) || (!!SubComponentsRoot && !SubComponentsRoot.value.layout)"
								>布局比例</el-radio>
							</el-radio-group>
						</el-form-item>
					</el-form>
				</div>
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
								>取消全局变量</el-button>
								<el-button
									@pointerdown="setAsGlobalParam(parameter)"
								>设为全局变量</el-button>
								<el-button
									@pointerdown="selectGlobalParam(parameter)"
								>选择全局变量</el-button>
								<el-button
									v-show="parameter.type === ParameterType.Constant"
									type="primary"
									@pointerdown="updateGlobalParam(parameter)"
								>更新全局变量</el-button>
							</div>
						</el-popover>
						<div
							class="global-param-note"
							v-show="parameter.type === ParameterType.Constant"
							:class="{
								ring: parameter.type === ParameterType.Constant && getConstant(parameter.value).type === ParameterType.RingController
							}"
						>全局变量</div>
						<div v-if="parameter.type === ParameterType.Number">
							<el-input-number
								:model-value="parameter.value"
								:step="parameter.max <= 10 ? 0.01 : 1"
								:min="parameter.min"
								:max="parameter.max"
								:precision="parameter.max <= 10 ? 2 : 0"
								@change="(value) => handleChangeParameter(parameter, value)"
							/>
							<el-slider
								:step="parameter.max <= 10 ? 0.01 : 1"
								:min="parameter.min"
								:max="parameter.max"
								:precision="parameter.max <= 10 ? 2 : 0"
								@input="(value) => handleChangeParameter(parameter, value)"
								v-model="parameter.value"
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
												:precision="(parameter.value as IRingParameter).degree.max <= 10 ? 2 : 0"
                      	:step="(parameter.value as IRingParameter).degree.max <= 10 ? 0.01 : 1"
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
														class="parameter-value test"
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