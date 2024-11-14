const default_unitsPerEm = 1000

const globalConstants = {
	thick: 40,
	gap_0: 20,
	gap_1: 40,
	gap_2: 60,
}

const mapGlobalConstants = (global_constants, unitsPerEm) => {
	const map = {}
  Object.keys(global_constants).map((key) => {
		map[key] = global_constants[key] * unitsPerEm / default_unitsPerEm
	})
	return map
}

export {
	mapGlobalConstants,
	globalConstants,
}