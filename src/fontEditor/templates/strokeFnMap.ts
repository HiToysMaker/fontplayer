import { applySkeletonTransformation } from "../../features/glyphSkeletonBind"
import { CustomGlyph } from "../programming/CustomGlyph"
import { bindSkeletonGlyph_heng, instanceBasicGlyph_heng, updateSkeletonListener_before_bind_heng, updateSkeletonListener_after_bind_heng } from "./横"
import { bindSkeletonGlyph_shu, instanceBasicGlyph_shu, updateSkeletonListener_before_bind_shu, updateSkeletonListener_after_bind_shu } from "./竖"
import { bindSkeletonGlyph_pie, instanceBasicGlyph_pie, updateSkeletonListener_before_bind_pie, updateSkeletonListener_after_bind_pie } from "./撇"
import { bindSkeletonGlyph_na, instanceBasicGlyph_na, updateSkeletonListener_before_bind_na, updateSkeletonListener_after_bind_na } from "./捺"

const updateSkeletonTransformation = (glyph: CustomGlyph) => {
  const skeleton = glyph.getSkeleton()
  applySkeletonTransformation(glyph, skeleton)
}

const strokeFnMap = {
  '横': {
    instanceBasicGlyph: instanceBasicGlyph_heng,
    bindSkeletonGlyph: bindSkeletonGlyph_heng,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '竖': {
    instanceBasicGlyph: instanceBasicGlyph_shu,
    bindSkeletonGlyph: bindSkeletonGlyph_shu,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_shu,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_shu,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '撇': {
    instanceBasicGlyph: instanceBasicGlyph_pie,
    bindSkeletonGlyph: bindSkeletonGlyph_pie,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_pie,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_pie,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '捺': {
    instanceBasicGlyph: instanceBasicGlyph_na,
    bindSkeletonGlyph: bindSkeletonGlyph_na,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_na,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_na,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
}

export { strokeFnMap, updateSkeletonTransformation }