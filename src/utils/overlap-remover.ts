import { getWasmModule } from './wasm-loader';
import type { ILine, IQuadraticBezierCurve, ICubicBezierCurve } from '../fontManager';
import { PathType } from '../fontManager';

// 定义轮廓段的数据结构
interface IContourSegment {
  type: 'LINE' | 'QUADRATIC_BEZIER' | 'CUBIC_BEZIER';
  start: { x: number; y: number };
  end: { x: number; y: number };
  control?: { x: number; y: number };
  control1?: { x: number; y: number };
  control2?: { x: number; y: number };
}

// 将字体轮廓转换为WASM模块需要的格式
function convertContoursToWasmFormat(
  contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>
): IContourSegment[][] {
  return contours.map(contour => 
    contour.map(segment => {
      if ('control' in segment) {
        // IQuadraticBezierCurve
        return {
          type: 'QUADRATIC_BEZIER' as const,
          start: { x: segment.start.x, y: segment.start.y },
          control: { x: segment.control.x, y: segment.control.y },
          end: { x: segment.end.x, y: segment.end.y }
        };
      } else if ('control1' in segment && 'control2' in segment) {
        // ICubicBezierCurve
        return {
          type: 'CUBIC_BEZIER' as const,
          start: { x: segment.start.x, y: segment.start.y },
          control1: { x: segment.control1.x, y: segment.control1.y },
          control2: { x: segment.control2.x, y: segment.control2.y },
          end: { x: segment.end.x, y: segment.end.y }
        };
      } else {
        // ILine
        return {
          type: 'LINE' as const,
          start: { x: segment.start.x, y: segment.start.y },
          end: { x: segment.end.x, y: segment.end.y }
        };
      }
    })
  );
}

// 将WASM模块返回的格式转换回字体轮廓格式
function convertWasmResultToContours(result: any): Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> {
  if (!result.ok) {
    throw new Error(`WASM processing failed: ${result.error || 'Unknown error'}`);
  }

  return result.contours.map((contour: IContourSegment[]) =>
    contour.map(segment => {
      if (segment.type === 'LINE') {
        return {
          type: PathType.LINE,
          start: segment.start,
          end: segment.end
        } as ILine;
      } else if (segment.type === 'QUADRATIC_BEZIER') {
        return {
          type: PathType.QUADRATIC_BEZIER,
          start: segment.start,
          control: segment.control!,
          end: segment.end
        } as IQuadraticBezierCurve;
      } else if (segment.type === 'CUBIC_BEZIER') {
        return {
          type: PathType.CUBIC_BEZIER,
          start: segment.start,
          control1: segment.control1!,
          control2: segment.control2!,
          end: segment.end
        } as ICubicBezierCurve;
      } else {
        throw new Error(`Unsupported segment type: ${segment.type}`);
      }
    })
  );
}

// 主要的去除重叠函数
export async function removeOverlapWithWasm(
  contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>
): Promise<Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>> {
  try {
    // 获取WASM模块
    const wasmModule = await getWasmModule();
    
    // 转换轮廓数据格式
    const wasmFormat = convertContoursToWasmFormat(contours);
    
    // 调用WASM函数
    const resultJson = wasmModule.remove_overlap(JSON.stringify(wasmFormat));
    const result = JSON.parse(resultJson);
    
    // 转换结果格式
    return convertWasmResultToContours(result);
  } catch (error) {
    console.error('Error in removeOverlapWithWasm:', error);
    throw error;
  }
} 