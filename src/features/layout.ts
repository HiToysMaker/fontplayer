const parseLayout = (value) => {
	tree = []
	parseValue(value, tree, 1)
	return tree
}

const parts = ['左', '右', '上', '下', '中', '内', '外']

let tree = []

const parseValue = (value, node, level) => {
	let i = 0
	let count = 1

	while (i <= value.length) {
		const v = value[i]
		let pointer = 0
		pointer += 1
		if (parts.indexOf(v) !== -1) {
			const re = /\<([0-9a-z\*\.\(\)\-\+\\]*,[0-9a-z\*\.\(\)\-\+\\]*)\>/
			const str = value.slice(i + 1)
			const rs = str.match(re)
			const coords = rs ? rs[1].split(',') : []
			let children = []
			rs && (pointer += rs[0].length)
			if (rs && value[rs[0].length + i + 1] === '(') {
				const re = /\((.*)\)/
				const rs = str.match(re)
				rs && (pointer += rs[0].length)
				if (rs) {
					parseValue(rs[1], children, level + 1)
				}
			}
			node.push({
				id: `${level}-${count}`,
				label: v,
				coords,
				children,
			})
			count++
		}
		i += pointer
	}
}

interface LayoutNode {
	id: string;
	coords: string;
	label: string;
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

interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

const formatLayout = (layoutTree: LayoutNode[], rect: Rect, level: number, params: any) => {
	//@ts-ignore
	const { x1, x2, y1, y2, l } = params
	const d = 5 * level
	let dir = 'H'
	if (layoutTree[0].label === '上') {
		dir = 'V'
	}
	for (let i = 0; i < layoutTree.length; i++) {
		const node = layoutTree[i]
		//@ts-ignore
		let { x, y, w, h } = rect
		let { x: _x, y: _y, w: _w, h: _h } = rect
		if (dir === 'H') {
			_y = rect.y
			_x = eval(node.coords[0])
			_w = eval(node.coords[1]) - _x
			_h = rect.h
		}	else {
			_x = rect.x
			_y = eval(node.coords[0])
			_w = rect.w
			_h = eval(node.coords[1]) - _y
		}
		node.rect = {
			x: _x,
			y: _y,
			w: _w,
			h: _h,
		}
		node.showCoords = node.showCoords || 'none'
		node.coordsSegment = 10
		if (node.children && node.children.length) {
			formatLayout(node.children, { x: _x, y: _y, w: _w, h: _h }, level + 1, params)
		}
	}
}

const getRatioCoords = (layout, col, row, n, params) => {
	const { x1, x2, y1, y2, l: size } = params
	const { x, y, w, h } = layout.rect
	//纵向坐标
	const vn = n * size / h
	const _row = y / size * vn + row
	let _y = 0
	if (_row <= vn / 3) {
		_y =  Math.round(_row / (vn / 3) * y1)
	} else if (_row <= vn / 3 * 2) {
		_y =  y1 + Math.round((_row - vn / 3) / (vn / 3) * (y2 - y1))
	} else {
		_y =  y2 + Math.round((_row - vn / 3 * 2) / (vn / 3) * (size - y2))
	}
	//横向坐标
	const hn = n * size / w
	const _col = x / size * hn + col
	let _x = 0
	if (_col <= hn / 3) {
		_x =  Math.round(_col / (hn / 3) * x1)
	} else if (_col <= hn / 3 * 2) {
		_x =  x1 + Math.round((_col - hn / 3) / (hn / 3) * (x2 - x1))
	} else {
		_x =  x2 + Math.round((_col - hn / 3 * 2) / (hn / 3) * (size - x2))
	}
	return {
		x: _x,
		y: _y,
	}
}

const renderLayout = (layoutTree: LayoutNode[], rect: Rect, level: number, params: any, canvas: HTMLCanvasElement) => {
	const ctx = canvas.getContext('2d')
	ctx.strokeStyle = 'red'
	ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'
	const { x1, x2, y1, y2, l } = params
	const mapCanvas = (n) => n / l * canvas.width
	const d = 5 * level
	let dir = 'H'
	if (layoutTree[0].label === '上') {
		dir = 'V'
	}
	for (let i = 0; i < layoutTree.length; i++) {
		const node = layoutTree[i]
		//@ts-ignore
		let { x, y, w, h } = rect
		let { x: _x, y: _y, w: _w, h: _h } = rect
		if (dir === 'H') {
			_y = rect.y
			_x = eval(node.coords[0])
			_w = eval(node.coords[1]) - _x
			_h = rect.h
		}	else if (dir === 'V') {
			_x = rect.x
			_y = eval(node.coords[0])
			_w = rect.w
			_h = eval(node.coords[1]) - _y
		}
		ctx.fillRect(
			mapCanvas(_x) + d,
			mapCanvas(_y) + d,
			mapCanvas(_w) - 2 * d,
			mapCanvas(_h) - 2 * d,
		)
		ctx.strokeRect(
			mapCanvas(_x) + d,
			mapCanvas(_y) + d,
			mapCanvas(_w) - 2 * d,
			mapCanvas(_h) - 2 * d,
		)
		if (node.children && node.children.length) {
			renderLayout(node.children, { x: _x, y: _y, w: _w, h: _h }, level + 1, params, canvas)
		} else if (node.showCoords === 'ratio') {
			// coords
			ctx.fillStyle = 'red'
			const delta = 5
			for (let m = 0; m < node.coordsSegment; m++) {
				for (let n = 0; n < node.coordsSegment; n++) {
					const coord = getRatioCoords(node, m, n, node.coordsSegment, params)
					ctx.fillRect(
						mapCanvas(coord.x) - delta,
						mapCanvas(coord.y) - delta,
						2 * delta,
						2 * delta,
					)
				}
			}
			ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'
		}
	}
}

export {
	parseLayout,
	renderLayout,
	parseValue,
	formatLayout,
	getRatioCoords,
}