<script setup lang="ts">
	import { Ref, ref, onMounted, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { GlyphLayout, IConstant, IParameter, IRingParameter, ParameterType } from '../../fontEditor/stores/glyph'
	import { genUUID } from '../../utils/string'
	import * as monaco from 'monaco-editor'
  const { t, tm } = useI18n()

	const constants: Ref<Array<IConstant>> = ref([])
	const parameters: Ref<Array<IParameter>> = ref([])
	const script: Ref<string> = ref('')
	let isWeb = true

	const editMap: Ref<Object> = ref({})

	const activeTab: Ref<string> = ref('global-constants')
	let codeEditor

	const parameterOptions = [
		{
			value: ParameterType.Constant,
			key: 'constant',
		},
		{
			value: ParameterType.Number,
			key: 'number',
		},
		{
			value: ParameterType.RingController,
			key: 'ring',
		}
	]

	onMounted(() => {
		constants.value = window.opener['__constants']
		parameters.value = window.opener['__parameters']
		script.value = window.opener['__script']
		isWeb = window.opener['__is_web']

		constants.value.map((constant) => {
			editMap.value[constant.uuid] = false
		})

		parameters.value.map((parameter) => {
			editMap.value[parameter.uuid] = false
		})

		codeEditor = monaco.editor.create(document.getElementById('codes-container'), {
			value: script.value,
			language: 'typescript',
			theme: "vs-dark",
			tabSize: 2,
			quickSuggestions: { other: true, comments: true, strings: true },
		})

		codeEditor.getModel().onDidChangeContent(() => {
			script.value = codeEditor.getModel().getValue()
		})

		if (!isWeb) {
			// 监听来自父窗口的消息
			window.addEventListener('message', (e) => {
				if(e.data === 'paste-ready') {
					const text = localStorage.getItem('clipboard')
					codeEditor.executeEdits('', [{ range: codeEditor.getSelection(), text }]); // 粘贴到编辑器
				}
			});

			codeEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
				const selection = codeEditor.getSelection();
				const selectedText = codeEditor.getModel().getValueInRange(selection);
				sendCopyCommand(selectedText)
				// 复制到剪贴板
			});

			codeEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
				sendPasteCommand()
			});
		}
	})

	const toggleEdit = (uuid: string, value: boolean) => {
		editMap.value[uuid] = value
	}

	const addConstant = () => {
		const uuid = genUUID()
		constants.value.push({
			uuid,
			name: uuid.slice(0, 5),
			value: 0,
			type: ParameterType.Number,
			min: 0,
			max: 1000,
		})
	}

	const addParameter = () => {
		const uuid = genUUID()
		parameters.value.push({
			uuid,
			name: uuid.slice(0, 5).replaceAll('-', '_'),
			type: ParameterType.Number,
			value: 0,
			min: 0,
			max: 1000,
		})
	}

	const removeConstant = (uuid: string) => {
		constants.value.map((constant, index) => {
			if (constant.uuid === uuid) {
				constants.value.splice(index, 1)
			}
		})
	}

	const removeParameter = (uuid: string) => {
		parameters.value.map((parameter, index) => {
			if (parameter.uuid === uuid) {
				parameters.value.splice(index, 1)
			}
		})
	}

	const sortDownParameter = (uuid: string) => {
		let sorted = false
		parameters.value.map((parameter, index) => {
			if (parameter.uuid === uuid && index !== parameters.value.length - 1 && !sorted) {
				const param = parameters.value.splice(index, 1)
				parameters.value.splice(index + 1, 0, param[0])
				sorted = true
			}
		})
	}

	const sortUpParameter = (uuid: string) => {
		let sorted = false
		parameters.value.map((parameter, index) => {
			if (parameter.uuid === uuid && index !== 0 && !sorted) {
				const param = parameters.value.splice(index, 1)
				parameters.value.splice(index - 1, 0, param[0])
				sorted = true
			}
		})
	}

	const sortDownConstant = (uuid: string) => {
		let sorted = false
		constants.value.map((parameter, index) => {
			if (parameter.uuid === uuid && index !== constants.value.length - 1 && !sorted) {
				const param = constants.value.splice(index, 1)
				constants.value.splice(index + 1, 0, param[0])
				sorted = true
			}
		})
	}

	const sortUpConstant = (uuid: string) => {
		let sorted = false
		constants.value.map((parameter, index) => {
			if (parameter.uuid === uuid && index !== 0 && !sorted) {
				const param = constants.value.splice(index, 1)
				constants.value.splice(index - 1, 0, param[0])
				sorted = true
			}
		})
	}

	watch([
		constants,
		parameters,
		script,
	], () => {
		syncInfo()
	}, {
		deep: true,
	})

	const syncInfo = () => {
		localStorage.setItem('constants', JSON.stringify(constants.value))
		localStorage.setItem('parameters', JSON.stringify(parameters.value))
		localStorage.setItem('script', script.value)
		window.opener.postMessage('sync-info', location.origin)
	}

	const sendCopyCommand = (text) => {
		localStorage.setItem('clipboard', text)
		window.opener.postMessage('copy', location.origin)
	}

	const sendPasteCommand = () => {
		window.opener.postMessage('paste', location.origin)
	}

	const executeScript = () => {
		window.opener.postMessage('execute-script', location.origin)
	}

	const addParam = (param) => {
		param.params.push({
			name: '',
			min: 0,
			max: 1000,
			value: 500,
		})
	}

	const onParamTypeChange = (param) => {
		if (param.type === ParameterType.Number) {
			param.value = 0
		} else if (param.type === ParameterType.Constant) {
			param.value = ''
		} else if (param.type === ParameterType.RingController) {
			param.value = {
				radius: {
					name: '',
					min: 0,
					max: 1000,
					value: 500,
				},
				degree: {
					name: '',
					min: 0,
					max: 360,
					value: 60,
				},
				params: [],
			}
		}
	}
</script>

<template>
  <div class="glyph-programming-editor">
		<div class="left-panel">
			<el-tabs v-model="activeTab" class="tabs">
				<el-tab-pane :label="tm('programming.global-constants')" name="global-constants">
					<el-scrollbar>
						<el-button class="add-constant-button" @click="addConstant">{{ t('programming.new-constant') }}</el-button>
						<div class="constant-item" v-for="parameter in constants">
							<div class="parameter-name">
								<span class="parameter-name-label" v-show="!editMap[parameter.uuid]">{{ parameter.name }}</span>
								<el-input
									class="parameter-name-input"
									v-show="editMap[parameter.uuid]" v-model="parameter.name"
									@keyup.enter.native="toggleEdit(parameter.uuid, false)"
								></el-input>
								<el-icon class="edit-icon" v-show="!editMap[parameter.uuid]" @click="toggleEdit(parameter.uuid, true)"><Edit /></el-icon>
							</div>
							<el-select v-model="parameter.type" class="parameter-type-select" :placeholder="tm('programming.type')" @change="onParamTypeChange(parameter)">
								<el-option
									v-for="item in parameterOptions"
									:key="item.key"
									:label="tm(`programming.${item.key}`)"
									:value="item.value"
								/>
							</el-select>
							<div v-if="parameter.type === ParameterType.Number">
								<el-input-number class="parameter-value" v-model="parameter.value"></el-input-number>
								<el-form-item label="min" label-width="42px">
									<el-input-number class="parameter-value" v-model="parameter.min"></el-input-number>
								</el-form-item>
								<el-form-item label="max" label-width="42px">
									<el-input-number class="parameter-value" v-model="parameter.max"></el-input-number>
								</el-form-item>
							</div>
							<el-select v-model="parameter.value" class="parameter-const-select" :placeholder="tm('programming.value')" v-else-if="parameter.type === ParameterType.Constant">
								<el-option
									v-for="item in constants"
									:key="item.uuid"
									:label="item.name"
									:value="item.uuid"
								/>
							</el-select>
							<div v-else-if="parameter.type === ParameterType.RingController">
								<el-tabs type="border-card">
									<el-tab-pane label="radius">
										<el-form-item label="name" label-width="42px">
											<el-input class="parameter-value" v-model="(parameter.value as IRingParameter).radius.name"></el-input>
										</el-form-item>
										<el-form-item label="value" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).radius.value"></el-input-number>
										</el-form-item>
										<el-form-item label="min" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).radius.min"></el-input-number>
										</el-form-item>
										<el-form-item label="max" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).radius.max"></el-input-number>
										</el-form-item>
									</el-tab-pane>
									<el-tab-pane label="degree">
										<el-form-item label="name" label-width="42px">
											<el-input class="parameter-value" v-model="(parameter.value as IRingParameter).degree.name"></el-input>
										</el-form-item>
										<el-form-item label="value" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).degree.value"></el-input-number>
										</el-form-item>
										<el-form-item label="min" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).degree.min"></el-input-number>
										</el-form-item>
										<el-form-item label="max" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).degree.max"></el-input-number>
										</el-form-item>
									</el-tab-pane>
									<el-tab-pane label="params">
										<el-button class="add-parameter-button" @click="addParam(parameter.value)">{{ t('programming.new-parameter') }}</el-button>
										<el-collapse>
											<el-collapse-item v-for="param in (parameter.value as IRingParameter).params" :title="param.name" name="1">
												<el-form-item label="name" label-width="42px">
													<el-input class="parameter-value" v-model="param.name"></el-input>
												</el-form-item>
												<el-form-item label="value" label-width="42px">
													<el-input-number class="parameter-value" v-model="param.value"></el-input-number>
												</el-form-item>
												<el-form-item label="min" label-width="42px">
													<el-input-number class="parameter-value" v-model="param.min"></el-input-number>
												</el-form-item>
												<el-form-item label="max" label-width="42px">
													<el-input-number class="parameter-value" v-model="param.max"></el-input-number>
												</el-form-item>
											</el-collapse-item>
										</el-collapse>
									</el-tab-pane>
								</el-tabs>
							</div>
							<el-icon class="sort-down-btn" @click="sortDownConstant(parameter.uuid)"><SortDown /></el-icon>
							<el-icon class="sort-up-btn" @click="sortUpConstant(parameter.uuid)"><SortUp /></el-icon>
							<el-icon class="remove-btn" @click="removeConstant(parameter.uuid)"><Close /></el-icon>
						</div>
					</el-scrollbar>
				</el-tab-pane>
				<el-tab-pane :label="tm('programming.glyph-parameters')" name="glyph-parameters">
					<el-scrollbar>
						<el-button class="add-parameter-button" @click="addParameter">{{ t('programming.new-parameter') }}</el-button>
						<div class="parameter-item" v-for="parameter in parameters">
							<div class="parameter-name">
								<span class="parameter-name-label" v-show="!editMap[parameter.uuid]">{{ parameter.name }}</span>
								<el-input
									class="parameter-name-input"
									v-show="editMap[parameter.uuid]" v-model="parameter.name"
									@keyup.enter.native="toggleEdit(parameter.uuid, false)"
								></el-input>
								<el-icon class="edit-icon" v-show="!editMap[parameter.uuid]" @click="toggleEdit(parameter.uuid, true)"><Edit /></el-icon>
							</div>
							<el-select v-model="parameter.type" class="parameter-type-select" :placeholder="tm('programming.type')" @change="onParamTypeChange(parameter)">
								<el-option
									v-for="item in parameterOptions"
									:key="item.key"
									:label="tm(`programming.${item.key}`)"
									:value="item.value"
								/>
							</el-select>
							<div v-if="parameter.type === ParameterType.Number">
								<el-input-number class="parameter-value" v-model="parameter.value"></el-input-number>
								<el-form-item label="min" label-width="42px">
									<el-input-number class="parameter-value" v-model="parameter.min"></el-input-number>
								</el-form-item>
								<el-form-item label="max" label-width="42px">
									<el-input-number class="parameter-value" v-model="parameter.max"></el-input-number>
								</el-form-item>
							</div>
							<el-select v-model="parameter.value" class="parameter-const-select" :placeholder="tm('programming.value')" v-else-if="parameter.type === ParameterType.Constant">
								<el-option
									v-for="item in constants"
									:key="item.uuid"
									:label="item.name"
									:value="item.uuid"
								/>
							</el-select>
							<div v-else-if="parameter.type === ParameterType.RingController">
								<el-tabs type="border-card">
									<el-tab-pane label="radius">
										<el-form-item label="name" label-width="42px">
											<el-input class="parameter-value" v-model="(parameter.value as IRingParameter).radius.name"></el-input>
										</el-form-item>
										<el-form-item label="value" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).radius.value"></el-input-number>
										</el-form-item>
										<el-form-item label="min" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).radius.min"></el-input-number>
										</el-form-item>
										<el-form-item label="max" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).radius.max"></el-input-number>
										</el-form-item>
									</el-tab-pane>
									<el-tab-pane label="degree">
										<el-form-item label="name" label-width="42px">
											<el-input class="parameter-value" v-model="(parameter.value as IRingParameter).degree.name"></el-input>
										</el-form-item>
										<el-form-item label="value" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).degree.value"></el-input-number>
										</el-form-item>
										<el-form-item label="min" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).degree.min"></el-input-number>
										</el-form-item>
										<el-form-item label="max" label-width="42px">
											<el-input-number class="parameter-value" v-model="(parameter.value as IRingParameter).degree.max"></el-input-number>
										</el-form-item>
									</el-tab-pane>
									<el-tab-pane label="params">
										<el-button class="add-parameter-button" @click="addParam(parameter.value)">{{ t('programming.new-parameter') }}</el-button>
										<el-collapse>
											<el-collapse-item v-for="param in (parameter.value as IRingParameter).params" :title="param.name" name="1">
												<el-form-item label="name" label-width="42px">
													<el-input class="parameter-value" v-model="param.name"></el-input>
												</el-form-item>
												<el-form-item label="value" label-width="42px">
													<el-input-number class="parameter-value" v-model="param.value"></el-input-number>
												</el-form-item>
												<el-form-item label="min" label-width="42px">
													<el-input-number class="parameter-value" v-model="param.min"></el-input-number>
												</el-form-item>
												<el-form-item label="max" label-width="42px">
													<el-input-number class="parameter-value" v-model="param.max"></el-input-number>
												</el-form-item>
											</el-collapse-item>
										</el-collapse>
									</el-tab-pane>
								</el-tabs>
							</div>
							<el-icon class="sort-down-btn" @click="sortDownParameter(parameter.uuid)"><SortDown /></el-icon>
							<el-icon class="sort-up-btn" @click="sortUpParameter(parameter.uuid)"><SortUp /></el-icon>
							<el-icon class="remove-btn" @click="removeParameter(parameter.uuid)"><Close /></el-icon>
						</div>
					</el-scrollbar>
				</el-tab-pane>
			</el-tabs>
		</div>
		<div class="right-panel">
			<div class="codes-header">
				<div class="codes-title">{{ t('programming.script') }}</div>
				<el-button class="reset-btn">{{ t('programming.reset') }}</el-button>
				<el-button class="execute-btn" type="primary" @click="executeScript()">{{ t('programming.execute') }}</el-button>
			</div>
			<div id="codes-container"></div>
		</div>
	</div>
</template>

<style scoped>
	.glyph-programming-editor {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: row;
		:deep(.el-form-item__label) {
    	color: black;
		}
		.el-input-number {
			width: 100%;
		}
		.el-form-item {
			margin: 5px 0;
		}
		.right-panel {
			.codes-header {
				background-color: white;
				height: 40px;
				display: flex;
				align-items: center;
				justify-content: end;
				padding: 5px;
				.codes-title {
					margin-right: auto;
					font-weight: bold;
				}
			}
			#codes-container {
				height: calc(100% - 32px);
			}
		}
		.left-panel {
			flex: 0 0 300px;
			padding: 10px;
			border-right: 1px solid var(--primary-0);
			.add-constant-button, .add-parameter-button {
				width: 100%;
				margin-bottom: 10px;
			}
			.constant-item {
				margin-bottom: 10px;
				position: relative;
				.constant-name {
					display: flex;
					flex-direction: row;
					align-items: center;
					height: 32px;
					line-height: 32px;
					margin-bottom: 5px;
				}
				.edit-icon {
    			cursor: pointer;
				}
				.remove-btn, .sort-up-btn, .sort-down-btn {
					display: none;
					position: absolute;
					right: 5px;
					top: 5px;
					background-color: var(--primary-0);
    			color: var(--light-0);
					cursor: pointer;
				}
				.sort-up-btn {
					right: 25px;
				}
				.sort-down-btn {
					right: 45px;
				}
				&:hover {
					.remove-btn, .sort-up-btn, .sort-down-btn {
						display: block;
					}
				}
				.constant-value {
					width: 100%;
				}
			}
			.parameter-item, .constant-item {
				margin-bottom: 10px;
				position: relative;
				.parameter-name {
					display: flex;
					flex-direction: row;
					align-items: center;
					height: 32px;
					line-height: 32px;
					margin-bottom: 5px;
				}
				.edit-icon {
    			cursor: pointer;
				}
				.remove-btn, .sort-up-btn, .sort-down-btn {
					display: none;
					position: absolute;
					right: 5px;
					top: 5px;
					background-color: var(--primary-0);
    			color: var(--light-0);
					cursor: pointer;
				}
				.sort-up-btn {
					right: 25px;
				}
				.sort-down-btn {
					right: 45px;
				}
				&:hover {
					.remove-btn, .sort-up-btn, .sort-down-btn {
						display: block;
					}
				}
				.parameter-type-select {
					width: 100%;
					margin-bottom: 5px;
				}
				.parameter-const-select {
					width: 100%;
				}
				.parameter-value {
					width: 100%;
				}
			}
		}
		.right-panel {
			flex: auto;
		}
	}
	:deep(.el-input__wrapper) {
		border-radius: 0;
		background-color: white;
    color: var(--primary-0);
	}
	:deep(.el-input__inner) {
		color: var(--primary-0) !important;
	}
	:deep(.el-tab-pane) {
		height: calc(100% - 50px);
	}
	:deep(.el-tabs__content) {
		height: 100%;
	}
	:deep(.el-tabs) {
		height: 100%;
	}
	.el-select {
    --el-select-border-color-hover: var(--primary-0);
		--el-select-input-focus-border-color: var(--primary-0);
	}
	:deep(.el-tabs__item.is-active) {
		color: var(--primary-0);
	}
	:deep(.el-tabs__active-bar) {
    background-color: var(--primary-0);
	}
	:deep(.el-tabs__item:hover) {
		color: var(--primary-0);
	}
</style>