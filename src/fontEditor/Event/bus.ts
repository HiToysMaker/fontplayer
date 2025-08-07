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
  renderGlyphPreviewCanvasByUUIDOnEditing: string;
  renderStrokeGlyphPreviewCanvas: boolean;
  renderStrokeGlyphPreviewCanvasByUUID: string;
  renderStrokeGlyphPreviewCanvasByUUIDOnEditing: string;
  renderRadicalGlyphPreviewCanvas: boolean;
  renderRadicalGlyphPreviewCanvasByUUID: string;
  renderRadicalGlyphPreviewCanvasByUUIDOnEditing: string;
  renderCompGlyphPreviewCanvas: boolean;
  renderCompGlyphPreviewCanvasByUUID: string;
  renderCompGlyphPreviewCanvasByUUIDOnEditing: string;
  renderGlyphSelection: boolean;
  renderGlyphSelectionByUUID: string;
  renderGlyphSelectionByUUIDOnEditing: string;
  renderStrokeGlyphSelection: boolean;
  renderStrokeGlyphSelectionByUUID: string;
  renderStrokeGlyphSelectionByUUIDOnEditing: string;
  renderRadicalGlyphSelection: boolean;
  renderRadicalGlyphSelectionByUUID: string;
  renderRadicalGlyphSelectionByUUIDOnEditing: string;
  renderCompGlyphSelection: boolean;
  renderCompGlyphSelectionByUUID: string;
  renderCompGlyphSelectionByUUIDOnEditing: string;
  renderGlyph: boolean;
  renderCharacter: boolean;
  updateGlyphView: boolean;
  updateCharacterView: boolean;
  updateGlyphInfoPreviewCanvasByUUID: string;
  updateCharacterInfoPreviewCanvasByUUID: string;
  renderCharacter_forceUpdate: boolean;
  renderGlyph_forceUpdate: boolean;
  refreshPlaygroundGridController: boolean;
  renderPreviewCanvasByUUIDOnEditing: string;
}

const emitter = mitt<Events>()

export {
  emitter
}