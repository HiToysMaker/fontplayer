import { EllipseComponent } from './EllipseComponent'
import { PenComponent } from './PenComponent'
import { PolygonComponent } from './PolygonComponent'
import { RectangleComponent } from './RectangleComponent'
import { Skeleton } from './Skeleton'
import { Joint } from './Joint'
import { Character } from './Character'
import { fitCurve } from '../../features/fitCurve'

const FP = {
	EllipseComponent,
	PenComponent,
	PolygonComponent,
	RectangleComponent,
	Skeleton,
	Joint,
	Character,
	fitCurve,
}

const suggestion_items = [
	{
		item: 'FP',
		type: 'Variable',
	},
	{
		item: 'EllipseComponent',
		type: 'Class',
	},
	{
		item: 'PenComponent',
		type: 'Class',
	},
	{
		item: 'PolygonComponent',
		type: 'Class',
	},
	{
		item: 'RectangleComponent',
		type: 'Class',
	},
	{
		item: 'Skeleton',
		type: 'Class',
	},
	{
		item: 'Joint',
		type: 'Class',
	},
	{
		item: 'Character',
		type: 'Class',
	},
	{
		item: 'beginPath',
		type: 'method',
	},
	{
		item: 'closePath',
		type: 'method',
	},
	{
		item: 'bezierTo',
		type: 'method',
	},
	{
		item: 'quadraticBezierTo',
		type: 'method',
	},
	{
		item: 'cubicBezierTo',
		type: 'method',
	},
	{
		item: 'lineTo',
		type: 'method',
	},
	{
		item: 'genComponent',
		type: 'method',
	},
	{
		item: 'getJoints',
		type: 'method',
	},
	{
		item: 'getComponent',
		type: 'method',
	},
]

export {
	FP,
	suggestion_items,
}