import { ICharacterFile, getCharacterRatioLayout } from '../stores/files'
import { ICustomGlyph } from '../stores/glyph'
import { getRatioCoords } from '../../features/layout'

class Character {
	private _character: ICharacterFile
  
	constructor (character) {
		this._character = character
		character._o = this
	}

	public getComponent (name) {
		for (let i = 0; i < this._character.components.length; i++) {
			if (this._character.components[i].name === name) {
				return this._character.components[i]
			}
		}
		return null
	}

	public getGlyph (name) {
		for (let i = 0; i < this._character.components.length; i++) {
			if (this._character.components[i].name === name) {
				return (this._character.components[i].value as ICustomGlyph)._o
			}
		}
		return null
	}

	public getLayoutByID (id: string) {
		if (this._character.info && this._character.info.layoutTree) {
			const tree = this._character.info.layoutTree
			return getNodeByID(id, tree)
		}
		return null
	}

	public getCoords (layout, col, row, n) {
		const rect = layout.rect
		const { x, y, w, h } = rect
		const _x = x + w / n * col
		const _y = y + h / n * row
		return {
			x: _x,
			y: _y,
		}
	}

	public getRatioCoords (layout, col, row, n) {
		const { dx, dy, size, centerSquareSize } = (this._character as ICharacterFile).info.gridSettings
		const x1 = Math.round((size - centerSquareSize) / 2) + dx
		const x2 = Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dx
		const y1 = Math.round((size - centerSquareSize) / 2) + dy
		const y2 = Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dy
		return getRatioCoords(layout, col, row, n, {
			x1, x2, y1, y2, l: size,
		})
	}

	public getRatioLayout (value) {
		return getCharacterRatioLayout(this._character, value)
	}
}

const getNodeByID = (id: string, tree: any) => {
	for (let i = 0; i < tree.length; i++) {
		const node = tree[i]
		if (node.id === id) {
			return node
		} else if (node.children) {
			const _node = getNodeByID(id, node.children)
			if (_node) {
				return _node
			}
		}
	}
	return null
}

export {
	Character,
}