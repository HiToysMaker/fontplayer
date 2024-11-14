import mitt from 'mitt'

// 定义使用到的事件
// events definition
type Events = {
  toggleLocalBrushEdit: boolean;
  resetEditFontPic: boolean;
  seperateText: boolean;
  addSectionText: string;
  renderPreviewCanvas: boolean;
  renderPreviewCanvasByUUID: string;
  renderGlyphPreviewCanvas: boolean;
  renderGlyphPreviewCanvasByUUID: string;
  renderStrokeGlyphPreviewCanvas: boolean;
  renderStrokeGlyphPreviewCanvasByUUID: string;
  renderRadicalGlyphPreviewCanvas: boolean;
  renderRadicalGlyphPreviewCanvasByUUID: string;
  renderCompGlyphPreviewCanvas: boolean;
  renderCompGlyphPreviewCanvasByUUID: string;
  renderGlyphSelection: boolean;
  renderGlyphSelectionByUUID: string;
  renderStrokeGlyphSelection: boolean;
  renderStrokeGlyphSelectionByUUID: string;
  renderRadicalGlyphSelection: boolean;
  renderRadicalGlyphSelectionByUUID: string;
  renderCompGlyphSelection: boolean;
  renderCompGlyphSelectionByUUID: string;
  renderGlyph: boolean;
  renderCharacter: boolean;
  updateGlyphView: boolean;
  updateGlyphInfoPreviewCanvasByUUID: string;
  updateCharacterInfoPreviewCanvasByUUID: string;
}

const emitter = mitt<Events>()

export {
  emitter
}