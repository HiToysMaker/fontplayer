import { IParameter, constantsMap, ParameterType } from '../stores/glyph'

class ParametersMap {
	public parameters: Array<IParameter>
  
	constructor (parameters: Array<IParameter>) {
		this.parameters = parameters
	}

	public get (name: string) {
		for (let i = 0; i < this.parameters.length; i++) {
			if (this.parameters[i].name === name) {
				return this.getValue(this.parameters[i])
			}
		}
	}

	public set (name: string, value: number) {
		for (let i = 0; i < this.parameters.length; i++) {
			const param = this.parameters[i]
			if (param.name === name) {
				if (value < param.min) {
					param.value = param.min
				} else if (value > param.max) {
					param.value = param.max
				} else {
					param.value = value
				}
				if (param.type === ParameterType.Constant) {
					param.type = ParameterType.Number
				}
			}
		}
	}

	public getByUUID (uuid: string) {
		for (let i = 0; i < this.parameters.length; i++) {
			if (this.parameters[i].uuid === uuid) {
				return this.getValue(this.parameters[i])
			}
		}
	}

	public getValue (parameter: IParameter) {
		if (parameter.type === ParameterType.Number || parameter.type === ParameterType.RingController) return parameter.value
		else if (parameter.type === ParameterType.Constant) {
			return constantsMap.getByUUID(parameter.value as string)
		}
	}
}

export {
	ParametersMap,
}