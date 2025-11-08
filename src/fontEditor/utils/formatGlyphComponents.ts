import * as R from 'ramda'
import { genUUID } from '../../utils/string'
import { executeScript } from '../stores/glyph'
import { executeCharacterScript } from '../stores/files'
import type { IGlyphComponent, ICustomGlyph } from '../stores/glyph'
import type { ICharacterFile, Component } from '../stores/files'

type OrderedItem = {
	type: string
	uuid: string
}

const deepClone = <T>(data: T): T => R.clone(data as any)

const applyOffsetToPoints = (points: Array<any>, ox: number, oy: number) => {
	if (!points) return points
	return points.map((point) => ({
		...point,
		x: point.x + ox,
		y: point.y + oy,
	}))
}

const getBoundingBox = (points: Array<any>) => {
	let minX = Infinity
	let minY = Infinity
	let maxX = -Infinity
	let maxY = -Infinity
	points.forEach((point) => {
		if (point.x < minX) minX = point.x
		if (point.x > maxX) maxX = point.x
		if (point.y < minY) minY = point.y
		if (point.y > maxY) maxY = point.y
	})
	return {
		x: isFinite(minX) ? minX : 0,
		y: isFinite(minY) ? minY : 0,
		w: isFinite(maxX) && isFinite(minX) ? maxX - minX : 0,
		h: isFinite(maxY) && isFinite(minY) ? maxY - minY : 0,
	}
}

const convertGeneratedComponent = (
	generatedComponent: any,
	glyphComponent: IGlyphComponent,
) => {
	const baseOx = glyphComponent.ox || 0
	const baseOy = glyphComponent.oy || 0
	const componentData = generatedComponent.getData()
	const typeMap: Record<string, string> = {
		'glyph-pen': 'pen',
		'glyph-polygon': 'polygon',
		'glyph-rectangle': 'rectangle',
		'glyph-ellipse': 'ellipse',
	}
	const componentType = typeMap[componentData.type] || 'pen'
	const transformedPoints = componentData.points
		? applyOffsetToPoints(componentData.points, baseOx, baseOy)
		: []
	let bounds = getBoundingBox(transformedPoints)
	if (!transformedPoints.length && componentType === 'rectangle') {
		bounds = {
			x: baseOx + (componentData.x || 0),
			y: baseOy + (componentData.y || 0),
			w: componentData.width || 0,
			h: componentData.height || 0,
		}
	}
	if (!transformedPoints.length && componentType === 'ellipse') {
		bounds = {
			x: baseOx + (componentData.centerX || 0) - (componentData.radiusX || 0),
			y: baseOy + (componentData.centerY || 0) - (componentData.radiusY || 0),
			w: (componentData.radiusX || 0) * 2,
			h: (componentData.radiusY || 0) * 2,
		}
	}
	const baseProps: any = {
		uuid: genUUID(),
		type: componentType,
		name: glyphComponent.name,
		lock: glyphComponent.lock,
		visible: glyphComponent.visible,
		usedInCharacter: glyphComponent.usedInCharacter,
		opacity: glyphComponent.opacity,
		fillColor: glyphComponent.fillColor,
		ox: 0,
		oy: 0,
		x: bounds.x,
		y: bounds.y,
		w: bounds.w,
		h: bounds.h,
		rotation: 0,
		flipX: false,
		flipY: false,
	}

	if (componentType === 'pen') {
		return {
			...baseProps,
			value: {
				points: transformedPoints,
				fillColor: glyphComponent.value.fillColor || '',
				strokeColor: '#000',
				closePath: true,
				editMode: false,
				preview: componentData.preview,
				contour: componentData.contour,
			},
		}
	}
	if (componentType === 'polygon') {
		return {
			...baseProps,
			value: {
				points: transformedPoints,
				fillColor: glyphComponent.value.fillColor || '',
				strokeColor: '#000',
				closePath: true,
				preview: componentData.preview,
				contour: componentData.contour,
			},
		}
	}
	if (componentType === 'rectangle') {
		return {
			...baseProps,
			value: {
				width: componentData.width,
				height: componentData.height,
				fillColor: glyphComponent.value.fillColor || '',
				strokeColor: '#000',
				preview: componentData.preview,
				contour: componentData.contour,
			},
		}
	}
	if (componentType === 'ellipse') {
		return {
			...baseProps,
			value: {
				radiusX: componentData.radiusX,
				radiusY: componentData.radiusY,
				fillColor: glyphComponent.value.fillColor || '',
				strokeColor: '#000',
				preview: componentData.preview,
				contour: componentData.contour,
			},
		}
	}
	return {
		...baseProps,
		value: componentData,
	}
}

const cloneNormalComponent = (
	component: Component,
	glyphComponent: IGlyphComponent,
) => {
	const clone: any = deepClone(component)
	clone.uuid = genUUID()
	const baseOx = glyphComponent.ox || 0
	const baseOy = glyphComponent.oy || 0
	if (typeof clone.x === 'number') clone.x += baseOx
	if (typeof clone.y === 'number') clone.y += baseOy
	if (typeof clone.ox === 'number') clone.ox += baseOx
	if (typeof clone.oy === 'number') clone.oy += baseOy
	return clone as Component
}

export const expandGlyphComponent = (
	glyphComponent: IGlyphComponent,
): { components: Component[]; orderedItems: OrderedItem[] } => {
	const glyph = glyphComponent.value as ICustomGlyph
	if (!glyph._o) {
		executeScript(glyph)
	}
	const glyphGeneratedComponents = glyph._o?._components || []
	const glyphNormalComponents = (glyph.orderedList || [])
		.map((item) => {
			if (item.type === 'component') {
				return glyph.components.find((c) => c.uuid === item.uuid)
			}
			return null
		})
		.filter((comp) => comp && comp.type !== 'glyph') as Component[]

	const convertedComponents = glyphGeneratedComponents.map((comp: any) =>
		convertGeneratedComponent(comp, glyphComponent),
	)
	const copiedComponents = glyphNormalComponents.map((comp) =>
		cloneNormalComponent(comp, glyphComponent),
	)
	const allComponents = [...convertedComponents, ...copiedComponents]
	const orderedItems = allComponents.map((comp) => ({
		type: 'component',
		uuid: comp.uuid,
	}))
	return {
		components: allComponents,
		orderedItems,
	}
}

const isCharacterFile = (container: ICharacterFile | ICustomGlyph): container is ICharacterFile => {
	return 'character' in container
}

export const formatContainerGlyphComponents = (
	container: ICharacterFile | ICustomGlyph,
): boolean => {
	const orderedList = container.orderedList || []
	const componentMap = new Map<string, Component>()
	const formattedComponents: Component[] = []
	const formattedOrder: OrderedItem[] = []
	const processed = new Set<string>()
	let changed = false

	container.components.forEach((comp: Component) => {
		componentMap.set(comp.uuid, comp)
	})

	orderedList.forEach((item) => {
		if (item.type !== 'component') {
			formattedOrder.push(item as OrderedItem)
			return
		}
		const component = componentMap.get(item.uuid)
		if (!component) {
			return
		}
		processed.add(component.uuid)
		if (component.type === 'glyph') {
			const { components, orderedItems } = expandGlyphComponent(component as IGlyphComponent)
			if (components.length) {
				changed = true
				components.forEach((converted, index) => {
					formattedComponents.push(converted)
					formattedOrder.push(orderedItems[index])
				})
			} else {
				changed = true
			}
		} else {
			const cloned = deepClone(component)
			formattedComponents.push(cloned as Component)
			formattedOrder.push({ type: 'component', uuid: cloned.uuid })
		}
	})

	container.components.forEach((component) => {
		if (processed.has(component.uuid)) {
			return
		}
		if (component.type === 'glyph') {
			const { components, orderedItems } = expandGlyphComponent(component as IGlyphComponent)
			if (components.length) {
				changed = true
				components.forEach((converted, index) => {
					formattedComponents.push(converted)
					formattedOrder.push(orderedItems[index])
				})
			} else {
				changed = true
			}
		} else {
			const cloned = deepClone(component)
			formattedComponents.push(cloned as Component)
			formattedOrder.push({ type: 'component', uuid: cloned.uuid })
		}
	})

	if (changed) {
		container.components = formattedComponents
		container.orderedList = formattedOrder
		if ('selectedComponentsUUIDs' in container && (container as any).selectedComponentsUUIDs) {
			(container as any).selectedComponentsUUIDs = []
		}
		if ('selectedComponentsTree' in container && (container as any).selectedComponentsTree) {
			(container as any).selectedComponentsTree = []
		}
		if (isCharacterFile(container)) {
			executeCharacterScript(container)
		} else {
			executeScript(container)
		}
	}

	return changed
}

export const formatCharacterGlyphComponents = (character: ICharacterFile): boolean => {
	return formatContainerGlyphComponents(character)
}

export const formatGlyphGlyphComponents = (glyph: ICustomGlyph): boolean => {
	return formatContainerGlyphComponents(glyph)
}

