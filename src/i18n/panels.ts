const panels = {
	zh: {
		filter: {
			all: '全部组件',
			font: '字体组件',
		},
		view: '视图',
		componentList: {
			menu: {
				cut: '剪切',
				copy: '复制',
				paste: '粘贴',
				delete: '删除',
			},
		},
		viewList: {
			thumbnail: {
				title: '缩略图片',
				description: '原图的适应屏幕缩略图片',
			},
			bitmap: {
				title: '黑白位图',
				description: '经过黑白二分化处理的图片',
			},
			contours: {
				title: '轮廓',
				description: '从图片中提取的轮廓线',
			},
			curves: {
				title: '曲线拟合',
				description: '从轮廓中拟合的曲线集合',
			},
			preview: {
				title: '预览',
				description: '填色效果预览',
			}
		},
		paramsPanel: {
			componentName: {
				title: '组件名称',
				label: '名称',
			},
			transform: {
				title: '变换',
				x: '位置X',
				y: '位置Y',
				w: '缩放W',
				h: '缩放H',
				rotation: '旋转',
				flipX: '横向翻转',
				flipY: '纵向翻转',
			},
			opacity: {
				title: '样式',
				opacity: '透明度',
			},
			editMode: {
				title: '编辑模式',
				label: '开启',
			},
			transformToCurve: {
				title: '转换为钢笔路径',
				label: '确认转换为钢笔路径',
			},
			layout: {
				title: '布局',
				add: '添加布局',
				modify: '修改布局',
				type: '类型',
				null: '无布局',
				rect: '矩形布局',
			},
			params: {
				title: '参数',
			},
			joints: {
				title: '关键点',
			},
			fillColor: {
				title: '填充颜色',
				label: '颜色',
			},
			layoutEditing: '编辑结构',
			interactive: '交互设定',
			draggable: '可拖拽',
			draggableOption: '拖拽设定',
			dragOption: '拖拽参考',
			dragOptionNone: '无',
			dragOptionDefault: '默认标点',
			dragOptionLayout: '布局比例',
			globalParam: '全局变量',
			cancelGlobalParam: '取消全局变量',
			setAsGlobalParam: '设为全局变量',
			selectGlobalParam: '选择全局变量',
			updateGlobalParam: '更新全局变量',
			applyGridTransform: '应用布局变换',
			resetGridTransform: '重置布局变换',
			applyMetricsTransform: '应用度量变换',
			resetMetricsTransform: '重置度量变换',
			loadingMsg: '加载中，请稍候……',
			loadedMsg: '加载中，请稍候……已加载{percent}%',
		},
		picEditPanel: {
			cancel: '取消',
			confirm: '确定',
			remove: '删除',
			reset: '重置',
			edit: '编辑',
			step1: {
				title: '步骤一：黑白二分化',
				tip: '效果不佳？试试',
				localBrush: '局部笔刷',
				brush: '笔刷',
			},
			step2: {
				title: '步骤二：提取轮廓路径',
				content: '系统会根据第一步的结果自动提取轮廓',
			},
			step3: {
				title: '步骤三：将轮廓拟合成曲线',
				maxError: '平滑',
				dropThresholding: '过滤',
			},
			step4: {
				title: '步骤四：填充轮廓',
				content: '已自动填充为黑色',
			}
		},
		settingsPanel: {
			background: {
				background: '背景',
				style: '样式',
				color: '纯色',
				transparent: '透明',
			},
			mesh: {
				mesh: '网格',
				style: '样式',
				none: '无',
				mi: '米字格',
				precision: '精度',
				layout: '布局',
			},
			render: {
				render: '渲染',
				style: '样式',
				contour: '线框',
				black: '黑白',
				color: '彩色',
				title: '预览模式',
			},
		},
		bottomBar: {
			reset: '归零',
			coords: '坐标',
		},
	},
	en: {
		filter: {
			all: 'All Componnents',
			font: 'Font COmponnents',
		},
		view: 'View',
		componentList: {
			menu: {
				cut: 'Cut',
				copy: 'Copy',
				paste: 'Paste',
				delete: 'Delete',
			},
		},
		viewList: {
			thumbnail: {
				title: 'Picture Thumbnail',
				description: 'Thumbnail of original picture',
			},
			bitmap: {
				title: 'Bitmap',
				description: 'Bitmap picture after thresholding processing',
			},
			contours: {
				title: 'Contours',
				description: 'Contours extracted from picture',
			},
			curves: {
				title: 'Curves',
				description: 'Curves fitted from contours',
			},
			preview: {
				title: 'Preview',
				description: 'Components preview',
			}
		},
		paramsPanel: {
			componentName: {
				title: 'Component Name',
				label: 'Name',
			},
			transform: {
				title: 'Transform',
				x: 'X',
				y: 'Y',
				w: 'W',
				h: 'H',
				rotation: 'Rotation',
				flipX: 'flipX',
				flipY: 'flipY',
			},
			opacity: {
				title: 'Style',
				opacity: 'Opacity',
			},
			editMode: {
				title: 'Edit Mode',
				label: 'Open'
			},
			transformToCurve: {
				title: 'Transform To Pen Curve',
				label: 'Confirm to transform'
			},
			layout: {
				title: 'Layout',
				add: 'Add Layout',
				modify: 'Modify Layout',
				type: 'Type',
				null: 'Empty Layout',
				rect: 'Rect Layout',
			},
			params: {
				title: 'Parameters',
			},
			joints: {
				title: 'Key Points',
			},
			fillColor: {
				title: 'Fill Color',
				label: 'Color',
			},
			layoutEditing: 'Layout Editing',
			interactive: 'Interactive Settings',
			draggable: 'Draggable',
			draggableOption: 'Option',
			dragOption: 'Reference',
			dragOptionNone: 'None',
			dragOptionDefault: 'Default Punctuation',
			dragOptionLayout: 'Layout Proportion',
			globalParam: 'Global Parameter',
			cancelGlobalParam: 'Clear Global Parameter',
			setAsGlobalParam: 'Set as Global Parameter',
			selectGlobalParam: 'Select Global Parameter',
			updateGlobalParam: 'Update Global Parameter',
			applyGridTransform: 'Apply Grid Transform',
			resetGridTransform: 'Reset Grid Transform',
			applyMetricsTransform: 'Apply Metrics Transform',
			resetMetricsTransform: 'Reset Metrics Transform',
			loadingMsg: 'Loading, please wait...',
			loadedMsg: 'Loading in progress ({percent}% completed)',
		},
		picEditPanel: {
			cancel: 'Cancel',
			confirm: 'Confirm',
			remove: 'Delete',
			reset: 'Reset',
			edit: 'Edit',
			step1: {
				title: 'Step 1: Bitmap Thresholding',
				tip: 'The effect is poor? Try',
				localBrush: 'Local Brush',
				brush: 'Brush',
			},
			step2: {
				title: 'Step 2: Extract Contours',
				content: 'Extract contours accordding to step 1\'s result',
			},
			step3: {
				title: 'Step 3: Fit Curve',
				maxError: 'Smoothing',
				dropThresholding: 'Filter',
			},
			step4: {
				title: 'Step 4: Fill Color',
				content: 'Auto-fill with black color',
			}
		},
		settingsPanel: {
			background: {
				background: 'Background',
				style: 'Style',
				color: 'Color',
				transparent: 'Transparent',
			},
			mesh: {
				mesh: 'Mesh',
				style: 'Style',
				none: 'None',
				mi: 'Mi',
				precision: 'Pricision',
				layout: 'Layout',
			},
			render: {
				render: 'Render',
				style: 'Style',
				contour: 'Contour',
				black: 'Black',
				color: 'Color',
				title: 'Preview Style',
			},
		},
		bottomBar: {
			reset: 'Reset',
			coords: 'Coords',
		},
	}
}

export {
	panels,
}