import { applySkeletonTransformation } from "../../features/glyphSkeletonBind"
import { CustomGlyph } from "../programming/CustomGlyph"
import { bindSkeletonGlyph_heng, instanceBasicGlyph_heng, updateSkeletonListener_before_bind_heng, updateSkeletonListener_after_bind_heng } from "./横"

const updateSkeletonTransformation = (glyph: CustomGlyph) => {
  const skeleton = glyph.getSkeleton()
  console.log('updateSkeletonTransformation 2', skeleton)
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
}

export { strokeFnMap, updateSkeletonTransformation }