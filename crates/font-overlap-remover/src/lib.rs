use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::json;

use flo_curves::bezier::path::{SimpleBezierPath, path_add};
use flo_curves::Coordinate2D;
use flo_curves::geo::Coord2;

#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    {
        console_error_panic_hook::set_once();
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Segment {
    #[serde(rename = "LINE")]
    Line { start: Point, end: Point },

    #[serde(rename = "QUADRATIC_BEZIER")]
    Quadratic { start: Point, control: Point, end: Point },

    #[serde(rename = "CUBIC_BEZIER")]
    Cubic { start: Point, control1: Point, control2: Point, end: Point },
}

type Contour = Vec<Segment>;
type Contours = Vec<Contour>;

fn p_to_coord(p: Point) -> Coord2 { 
    Coord2(p.x, p.y) 
}

fn coord_to_p(c: &Coord2) -> Point { 
    Point { x: c.x(), y: c.y() } 
}

// 计算路径的环绕方向（正值为逆时针，负值为顺时针）
fn calculate_winding_number(contour: &Contour) -> f64 {
    if contour.len() < 3 {
        return 0.0;
    }
    
    let mut winding = 0.0;
    let mut prev_point = match contour.first().unwrap() {
        Segment::Line { start, .. } => *start,
        Segment::Quadratic { start, .. } => *start,
        Segment::Cubic { start, .. } => *start,
    };
    
    for seg in contour {
        let current_point = match seg {
            Segment::Line { end, .. } => *end,
            Segment::Quadratic { end, .. } => *end,
            Segment::Cubic { end, .. } => *end,
        };
        
        // 使用叉积计算有向面积
        winding += (current_point.x - prev_point.x) * (current_point.y + prev_point.y);
        prev_point = current_point;
    }
    
    // 闭合路径，连接最后一个点到第一个点
    let first_point = match contour.first().unwrap() {
        Segment::Line { start, .. } => *start,
        Segment::Quadratic { start, .. } => *start,
        Segment::Cubic { start, .. } => *start,
    };
    winding += (first_point.x - prev_point.x) * (first_point.y + prev_point.y);
    
    winding
}

// 反转轮廓方向
fn reverse_contour(contour: &Contour) -> Contour {
    let mut reversed = Vec::new();
    
    for seg in contour.iter().rev() {
        match seg {
            Segment::Line { start, end } => {
                reversed.push(Segment::Line { start: *end, end: *start });
            }
            Segment::Quadratic { start, control, end } => {
                reversed.push(Segment::Quadratic { start: *end, control: *control, end: *start });
            }
            Segment::Cubic { start, control1, control2, end } => {
                reversed.push(Segment::Cubic { start: *end, control1: *control2, control2: *control1, end: *start });
            }
        }
    }
    
    reversed
}

// 确保轮廓方向正确（外轮廓逆时针，内轮廓（孔洞）顺时针）
fn normalize_contour_direction(contour: &Contour) -> Contour {
    let winding = calculate_winding_number(contour);
    
    // 如果环绕数为正（逆时针），保持原方向
    // 如果环绕数为负（顺时针），反转方向
    if winding > 0.0 {
        contour.clone()
    } else {
        reverse_contour(contour)
    }
}

// 二次贝塞尔 -> 三次
fn quad_to_cubic(start: Point, control: Point, end: Point) -> (Point, Point) {
    let c1 = Point {
        x: start.x + (2.0 / 3.0) * (control.x - start.x),
        y: start.y + (2.0 / 3.0) * (control.y - start.y),
    };
    let c2 = Point {
        x: end.x + (2.0 / 3.0) * (control.x - end.x),
        y: end.y + (2.0 / 3.0) * (control.y - end.y),
    };
    (c1, c2)
}

// 线段 -> 三次（控制点用三等分点）
fn line_to_cubic(start: Point, end: Point) -> (Point, Point) { 
    let c1 = Point { x: start.x + (end.x - start.x) / 3.0, y: start.y + (end.y - start.y) / 3.0 };
    let c2 = Point { x: start.x + 2.0 * (end.x - start.x) / 3.0, y: start.y + 2.0 * (end.y - start.y) / 3.0 };
    (c1, c2)
}

// 将一个轮廓转成 SimpleBezierPath
fn contour_to_simple_path(contour: &Contour) -> Option<SimpleBezierPath> {
    if contour.is_empty() {
        return None;
    }

    // 起点：取第一段的 start
    let first_start = match contour.first().unwrap() {
        Segment::Line { start, .. } => *start,
        Segment::Quadratic { start, .. } => *start,
        Segment::Cubic { start, .. } => *start,
    };
    let mut triples: Vec<(Coord2, Coord2, Coord2)> = Vec::new();
    let mut current_start = first_start;
    let mut last_end: Point = first_start;

    for seg in contour {
        match seg {
            Segment::Line { start: _, end } => {
                let (c1, c2) = line_to_cubic(current_start, *end);
                triples.push((p_to_coord(c1), p_to_coord(c2), p_to_coord(*end)));
                current_start = *end;
                last_end = *end;
            }
            Segment::Quadratic { start: _, control, end } => {
                let (c1, c2) = quad_to_cubic(current_start, *control, *end);
                triples.push((p_to_coord(c1), p_to_coord(c2), p_to_coord(*end)));
                current_start = *end;
                last_end = *end;
            }
            Segment::Cubic { start: _, control1, control2, end } => {
                triples.push((p_to_coord(*control1), p_to_coord(*control2), p_to_coord(*end)));
                current_start = *end;
                last_end = *end;
            }
        }
    }

    // 若未闭合，则补一段直线回到起点
    if (last_end.x != first_start.x) || (last_end.y != first_start.y) {
        let (c1, c2) = line_to_cubic(last_end, first_start);
        triples.push((p_to_coord(c1), p_to_coord(c2), p_to_coord(first_start)));
    }

    Some((p_to_coord(first_start), triples))
}

// 将 SimpleBezierPath 转回三次贝塞尔轮廓
fn simple_path_to_contour(path: &SimpleBezierPath) -> Contour {
    let (start, triples) = path;
    let mut contour: Contour = Vec::new();
    let mut current = coord_to_p(start);

    for (c1, c2, end) in triples.iter() {
        contour.push(Segment::Cubic {
            start: current,
            control1: coord_to_p(c1),
            control2: coord_to_p(c2),
            end: coord_to_p(end),
        });
        current = coord_to_p(end);
    }

    contour
}

// 使用 flo_curves 的 path_add 进行布尔运算（Union）
fn union_paths(paths: &[SimpleBezierPath]) -> Vec<SimpleBezierPath> {
    if paths.is_empty() { 
        return vec![]; 
    }
    
    if paths.len() == 1 {
        return vec![paths[0].clone()];
    }

    let mut result = vec![paths[0].clone()];
    for path in &paths[1..] {
        let current_paths = vec![path.clone()];
                 let unioned = path_add(&result, &current_paths, 0.001);
        result = unioned;
    }

    result
}

// 计算 SimpleBezierPath 的有向面积，>0 代表逆时针
fn simple_path_signed_area(path: &SimpleBezierPath) -> f64 {
    let (start, triples) = path;
    let mut area = 0.0;
    let mut prev = start.clone();
    for (_, _, end) in triples.iter() {
        let p2 = end.clone();
        area += (prev.x() * p2.y()) - (p2.x() * prev.y());
        prev = p2;
    }
    // close
    area += (prev.x() * start.y()) - (start.x() * prev.y());
    area * 0.5
}

// 计算 bbox
fn simple_path_bbox(path: &SimpleBezierPath) -> (f64, f64, f64, f64) {
    let (start, triples) = path;
    let mut min_x = start.x();
    let mut max_x = start.x();
    let mut min_y = start.y();
    let mut max_y = start.y();

    for (c1, c2, end) in triples.iter() {
        for p in [c1, c2, end] {
            if p.x() < min_x { min_x = p.x(); }
            if p.x() > max_x { max_x = p.x(); }
            if p.y() < min_y { min_y = p.y(); }
            if p.y() > max_y { max_y = p.y(); }
        }
    }
    (min_x, min_y, max_x, max_y)
}

fn bbox_contains(outer: (f64,f64,f64,f64), inner: (f64,f64,f64,f64)) -> bool {
    outer.0 <= inner.0 && outer.1 <= inner.1 && outer.2 >= inner.2 && outer.3 >= inner.3
}

// 判断一个点是否在多边形内（射线法，基于控制点与终点的折线近似）
fn point_in_simple_path(path: &SimpleBezierPath, point: &Coord2) -> bool {
    let (start, triples) = path;
    let mut inside = false;
    let mut prev = start.clone();
    for (_, _, end) in triples.iter() {
        let p1x = prev.x();
        let p1y = prev.y();
        let p2x = end.x();
        let p2y = end.y();
        let (x, y) = (point.x(), point.y());
        let intersect = ((p1y > y) != (p2y > y)) && (x < (p2x - p1x) * (y - p1y) / ((p2y - p1y).max(1e-12)) + p1x);
        if intersect { inside = !inside; }
        prev = end.clone();
    }
    inside
}

// 将三次贝塞尔段采样为折线点
fn cubic_point(start: &Coord2, c1: &Coord2, c2: &Coord2, end: &Coord2, t: f64) -> Coord2 {
    let mt = 1.0 - t;
    let mt2 = mt * mt;
    let t2 = t * t;
    let b0 = mt2 * mt;
    let b1 = 3.0 * mt2 * t;
    let b2 = 3.0 * mt * t2;
    let b3 = t * t2;
    Coord2(
        b0 * start.x() + b1 * c1.x() + b2 * c2.x() + b3 * end.x(),
        b0 * start.y() + b1 * c1.y() + b2 * c2.y() + b3 * end.y(),
    )
}

fn flatten_simple_path(path: &SimpleBezierPath, samples_per_curve: usize) -> Vec<Coord2> {
    let (start, triples) = path;
    let mut pts: Vec<Coord2> = Vec::new();
    let mut curr = start.clone();
    pts.push(curr.clone());
    for (c1, c2, end) in triples.iter() {
        for i in 1..=samples_per_curve {
            let t = (i as f64) / (samples_per_curve as f64);
            let p = cubic_point(&curr, c1, c2, end, t);
            pts.push(p);
        }
        curr = end.clone();
    }
    pts
}

fn poly_signed_area(poly: &Vec<Coord2>) -> f64 {
    if poly.len() < 3 { return 0.0; }
    let mut area = 0.0;
    let mut prev = &poly[poly.len()-1];
    for p in poly.iter() {
        area += prev.x() * p.y() - p.x() * prev.y();
        prev = p;
    }
    area * 0.5
}

fn point_in_poly(poly: &Vec<Coord2>, point: &Coord2) -> bool {
    let mut inside = false;
    let mut j = poly.len() - 1;
    for i in 0..poly.len() {
        let pi = &poly[i];
        let pj = &poly[j];
        let intersect = ((pi.y() > point.y()) != (pj.y() > point.y())) &&
            (point.x() < (pj.x() - pi.x()) * (point.y() - pi.y()) / ((pj.y() - pi.y()).abs().max(1e-12)) + pi.x());
        if intersect { inside = !inside; }
        j = i;
    }
    inside
}

// 规范化合并结果：将洞识别出来并反向方向（基于曲线扁平化后更稳定的包含判定）
fn normalize_union_result(mut united: Vec<SimpleBezierPath>) -> Vec<SimpleBezierPath> {
    // 扁平化每条路径
    let samples_per_curve = 24usize;
    let mut flats: Vec<Vec<Coord2>> = united.iter().map(|p| flatten_simple_path(p, samples_per_curve)).collect();

    // 基于扁平化点计算面积（方向）
    let mut areas: Vec<f64> = flats.iter().map(|poly| poly_signed_area(poly)).collect();

    // 过滤极小面积伪轮廓
    let mut keep: Vec<bool> = areas.iter().map(|a| a.abs() > 1e-6).collect();
    let mut new_united: Vec<SimpleBezierPath> = Vec::new();
    let mut new_flats: Vec<Vec<Coord2>> = Vec::new();
    let mut new_areas: Vec<f64> = Vec::new();
    for i in 0..united.len() {
        if keep[i] {
            new_united.push(united[i].clone());
            new_flats.push(flats[i].clone());
            new_areas.push(areas[i]);
        }
    }
    united = new_united;
    flats = new_flats;
    areas = new_areas;

    // 反向一个 SimpleBezierPath（需要倒序 triples、交换控制点、更新起点）
    fn reverse_simple_path(path: &SimpleBezierPath) -> SimpleBezierPath {
        let (start, triples) = path;
        if triples.is_empty() {
            return (start.clone(), vec![]);
        }
        // 预先计算每段的起点（forward）
        let mut forward_starts: Vec<Coord2> = Vec::with_capacity(triples.len());
        let mut curr = start.clone();
        for (_c1, _c2, end) in triples.iter() {
            forward_starts.push(curr.clone());
            curr = end.clone();
        }
        // 反向后起点为原最后的终点
        let new_start = triples.last().unwrap().2.clone();
        let mut rev: Vec<(Coord2, Coord2, Coord2)> = Vec::with_capacity(triples.len());
        // 按逆序生成段：控制点交换，终点=原段的起点
        for (i, (c1, c2, _end)) in triples.iter().enumerate().rev() {
            let new_c1 = c2.clone();
            let new_c2 = c1.clone();
            let new_end = forward_starts[i].clone();
            rev.push((new_c1, new_c2, new_end));
        }
        (new_start, rev)
    }

    // 首先把所有路径方向统一为外环方向（面积>0）
    for idx in 0..united.len() {
        if areas[idx] < 0.0 {
            united[idx] = reverse_simple_path(&united[idx]);
            // 同步扁平化与面积
            let flat = flatten_simple_path(&united[idx], samples_per_curve);
            flats[idx] = flat;
            areas[idx] = poly_signed_area(&flats[idx]);
        }
    }

    // 通过包含关系分层：奇数层为洞
    let mut level: Vec<i32> = vec![0; united.len()];
    // 使用面积加权质心作为测试点
    let test_points: Vec<Coord2> = flats.iter().map(|poly| {
        if poly.len() < 3 { return Coord2(0.0, 0.0); }
        let mut cx = 0.0f64; let mut cy = 0.0f64; let mut a = 0.0f64;
        let mut j = poly.len() - 1;
        for i in 0..poly.len() {
            let pi = &poly[i];
            let pj = &poly[j];
            let cross = pj.x()*pi.y() - pi.x()*pj.y();
            a += cross;
            cx += (pj.x()+pi.x())*cross;
            cy += (pj.y()+pi.y())*cross;
            j = i;
        }
        if a.abs() < 1e-12 { return poly[0].clone(); }
        a *= 0.5;
        Coord2(cx/(6.0*a), cy/(6.0*a))
    }).collect();

    for i in 0..united.len() {
        for j in 0..united.len() {
            if i == j { continue; }
            if areas[j] <= areas[i] { continue; }
            if point_in_poly(&flats[j], &test_points[i]) {
                level[i] += 1;
            }
        }
    }

    for idx in 0..united.len() {
        if level[idx] % 2 == 1 {
            united[idx] = reverse_simple_path(&united[idx]);
        }
    }

    united
}

#[wasm_bindgen]
pub fn remove_overlap(contours_json: &str) -> String {
    let contours: Contours = match serde_json::from_str(contours_json) {
        Ok(c) => c,
        Err(err) => {
            return json!({ "ok": false, "error": format!("invalid json: {err}") }).to_string();
        }
    };

    // 添加调试信息
    let input_count = contours.len();
    let mut debug_info = Vec::new();

    let mut paths: Vec<SimpleBezierPath> = Vec::new();
    for (i, contour) in contours.iter().enumerate() {
        // 不修改输入轮廓方向，直接交给布尔运算
        let original_winding = calculate_winding_number(contour);
        debug_info.push(format!("Contour {}: original_winding={:.2}", i, original_winding));

        if let Some(path) = contour_to_simple_path(contour) {
            paths.push(path);
        } else {
            debug_info.push(format!("Contour {}: failed to convert to path", i));
        }
    }

    if paths.is_empty() {
        let empty: Contours = Vec::new();
        return json!({ 
            "ok": true, 
            "contours": empty,
            "debug": {
                "input_count": input_count,
                "paths_count": 0,
                "info": debug_info
            }
        }).to_string();
    }

    let united = union_paths(&paths);
    let normalized_united = normalize_union_result(united);

    let mut out_contours: Contours = Vec::new();
    for path in &normalized_united {
        let c = simple_path_to_contour(path);
        if !c.is_empty() {
            out_contours.push(c);
        }
    }

    json!({ 
        "ok": true, 
        "contours": out_contours,
        "debug": {
            "input_count": input_count,
            "paths_count": paths.len(),
            "united_count": normalized_united.len(),
            "output_count": out_contours.len(),
            "info": debug_info
        }
    }).to_string()
}