import { IConstant } from '../stores/glyph'

class ConstantsMap {
	private constants: Array<IConstant>
  
	constructor (constants: Array<IConstant>) {
		this.constants = constants
	}

	public update (constants: Array<IConstant>) {
		this.constants = constants
	}

	public get (name: string) {
		for (let i = 0; i < this.constants.length; i++) {
			if (this.constants[i].name === name) {
				return this.constants[i].value
			}
		}
	}

	public getByUUID (uuid: string) {
		for (let i = 0; i < this.constants.length; i++) {
			if (this.constants[i].uuid === uuid) {
				return this.constants[i].value
			}
		}
	}
}

export {
	ConstantsMap,
}