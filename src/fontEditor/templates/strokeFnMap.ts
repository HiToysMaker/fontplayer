import { applySkeletonTransformation } from "../../features/glyphSkeletonBind"
import { CustomGlyph } from "../programming/CustomGlyph"
import { bindSkeletonGlyph_heng, instanceBasicGlyph_heng, updateSkeletonListener_before_bind_heng, updateSkeletonListener_after_bind_heng } from "./横"
import { bindSkeletonGlyph_shu, instanceBasicGlyph_shu, updateSkeletonListener_before_bind_shu, updateSkeletonListener_after_bind_shu } from "./竖"
import { bindSkeletonGlyph_pie, instanceBasicGlyph_pie, updateSkeletonListener_before_bind_pie, updateSkeletonListener_after_bind_pie } from "./撇"
import { bindSkeletonGlyph_na, instanceBasicGlyph_na, updateSkeletonListener_before_bind_na, updateSkeletonListener_after_bind_na } from "./捺"
import { bindSkeletonGlyph_dian, instanceBasicGlyph_dian, updateSkeletonListener_before_bind_dian, updateSkeletonListener_after_bind_dian } from "./点"
import { bindSkeletonGlyph_tiao, instanceBasicGlyph_tiao, updateSkeletonListener_before_bind_tiao, updateSkeletonListener_after_bind_tiao } from "./挑"
import { bindSkeletonGlyph_heng_gou, instanceBasicGlyph_heng_gou, updateSkeletonListener_before_bind_heng_gou, updateSkeletonListener_after_bind_heng_gou } from "./横钩"
import { bindSkeletonGlyph_wan_gou, instanceBasicGlyph_wan_gou, updateSkeletonListener_before_bind_wan_gou, updateSkeletonListener_after_bind_wan_gou } from "./弯钩"
import { bindSkeletonGlyph_shu_gou, instanceBasicGlyph_shu_gou, updateSkeletonListener_before_bind_shu_gou, updateSkeletonListener_after_bind_shu_gou } from "./竖钩"
import { bindSkeletonGlyph_shu_zhe_zhe_gou, instanceBasicGlyph_shu_zhe_zhe_gou, updateSkeletonListener_before_bind_shu_zhe_zhe_gou, updateSkeletonListener_after_bind_shu_zhe_zhe_gou } from "./竖折折钩"
import { bindSkeletonGlyph_heng_pie, instanceBasicGlyph_heng_pie, updateSkeletonListener_before_bind_heng_pie, updateSkeletonListener_after_bind_heng_pie } from "./横撇"
import { bindSkeletonGlyph_heng_zhe, instanceBasicGlyph_heng_zhe, updateSkeletonListener_before_bind_heng_zhe, updateSkeletonListener_after_bind_heng_zhe } from "./横折"
import { bindSkeletonGlyph_shu_pie, instanceBasicGlyph_shu_pie, updateSkeletonListener_before_bind_shu_pie, updateSkeletonListener_after_bind_shu_pie } from "./竖撇"
import { bindSkeletonGlyph_heng_zhe_zhe_pie, instanceBasicGlyph_heng_zhe_zhe_pie, updateSkeletonListener_before_bind_heng_zhe_zhe_pie, updateSkeletonListener_after_bind_heng_zhe_zhe_pie } from "./横折折撇"
import { bindSkeletonGlyph_heng_zhe_gou, instanceBasicGlyph_heng_zhe_gou, updateSkeletonListener_before_bind_heng_zhe_gou, updateSkeletonListener_after_bind_heng_zhe_gou } from "./横折钩"
import { bindSkeletonGlyph_heng_zhe_wan_gou, instanceBasicGlyph_heng_zhe_wan_gou, updateSkeletonListener_before_bind_heng_zhe_wan_gou, updateSkeletonListener_after_bind_heng_zhe_wan_gou } from "./横折弯钩"
import { bindSkeletonGlyph_heng_wan_gou, instanceBasicGlyph_heng_wan_gou, updateSkeletonListener_before_bind_heng_wan_gou, updateSkeletonListener_after_bind_heng_wan_gou } from "./横弯钩"
import { bindSkeletonGlyph_heng_zhe_zhe_wan_gou, instanceBasicGlyph_heng_zhe_zhe_wan_gou, updateSkeletonListener_before_bind_heng_zhe_zhe_wan_gou, updateSkeletonListener_after_bind_heng_zhe_zhe_wan_gou } from "./横折折弯钩"
import { bindSkeletonGlyph_er_heng_zhe, instanceBasicGlyph_er_heng_zhe, updateSkeletonListener_before_bind_er_heng_zhe, updateSkeletonListener_after_bind_er_heng_zhe } from "./二横折"
import { bindSkeletonGlyph_heng_zhe_wan, instanceBasicGlyph_heng_zhe_wan, updateSkeletonListener_before_bind_heng_zhe_wan, updateSkeletonListener_after_bind_heng_zhe_wan } from "./横折弯"
import { bindSkeletonGlyph_heng_zhe2, instanceBasicGlyph_heng_zhe2, updateSkeletonListener_before_bind_heng_zhe2, updateSkeletonListener_after_bind_heng_zhe2 } from "./横折2"
import { bindSkeletonGlyph_heng_zhe_tiao, instanceBasicGlyph_heng_zhe_tiao, updateSkeletonListener_before_bind_heng_zhe_tiao, updateSkeletonListener_after_bind_heng_zhe_tiao } from "./横折挑"
import { bindSkeletonGlyph_shu_tiao, instanceBasicGlyph_shu_tiao, updateSkeletonListener_before_bind_shu_tiao, updateSkeletonListener_after_bind_shu_tiao } from "./竖挑"
import { bindSkeletonGlyph_shu_wan, instanceBasicGlyph_shu_wan, updateSkeletonListener_before_bind_shu_wan, updateSkeletonListener_after_bind_shu_wan } from "./竖弯"
import { bindSkeletonGlyph_shu_wan_gou, instanceBasicGlyph_shu_wan_gou, updateSkeletonListener_before_bind_shu_wan_gou, updateSkeletonListener_after_bind_shu_wan_gou } from "./竖弯钩"
import { bindSkeletonGlyph_shu_zhe, instanceBasicGlyph_shu_zhe, updateSkeletonListener_before_bind_shu_zhe, updateSkeletonListener_after_bind_shu_zhe } from "./竖折"
import { bindSkeletonGlyph_xie_gou, instanceBasicGlyph_xie_gou, updateSkeletonListener_before_bind_xie_gou, updateSkeletonListener_after_bind_xie_gou } from "./斜钩"
import { bindSkeletonGlyph_heng_pie_wan_gou, instanceBasicGlyph_heng_pie_wan_gou, updateSkeletonListener_before_bind_heng_pie_wan_gou, updateSkeletonListener_after_bind_heng_pie_wan_gou } from "./横撇弯钩"
import { bindSkeletonGlyph_pie_tiao, instanceBasicGlyph_pie_tiao, updateSkeletonListener_before_bind_pie_tiao, updateSkeletonListener_after_bind_pie_tiao } from "./撇挑"
import { bindSkeletonGlyph_pie_dian, instanceBasicGlyph_pie_dian, updateSkeletonListener_before_bind_pie_dian, updateSkeletonListener_after_bind_pie_dian } from "./撇点"
import { bindSkeletonGlyph_tiao_na, instanceBasicGlyph_tiao_na, updateSkeletonListener_before_bind_tiao_na, updateSkeletonListener_after_bind_tiao_na } from "./挑捺"
import { bindSkeletonGlyph_ping_na, instanceBasicGlyph_ping_na, updateSkeletonListener_before_bind_ping_na, updateSkeletonListener_after_bind_ping_na } from "./平捺"

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
  '点': {
    instanceBasicGlyph: instanceBasicGlyph_dian,
    bindSkeletonGlyph: bindSkeletonGlyph_dian,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_dian,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_dian,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '挑': {
    instanceBasicGlyph: instanceBasicGlyph_tiao,
    bindSkeletonGlyph: bindSkeletonGlyph_tiao,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_tiao,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_tiao,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横钩': {
    instanceBasicGlyph: instanceBasicGlyph_heng_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '弯钩': {
    instanceBasicGlyph: instanceBasicGlyph_wan_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_wan_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_wan_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_wan_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '竖钩': {
    instanceBasicGlyph: instanceBasicGlyph_shu_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_shu_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_shu_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_shu_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '竖折折钩': {
    instanceBasicGlyph: instanceBasicGlyph_shu_zhe_zhe_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_shu_zhe_zhe_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_shu_zhe_zhe_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_shu_zhe_zhe_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横撇': {
    instanceBasicGlyph: instanceBasicGlyph_heng_pie,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_pie,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_pie,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_pie,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横折': {
    instanceBasicGlyph: instanceBasicGlyph_heng_zhe,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_zhe,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_zhe,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_zhe,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '竖撇': {
    instanceBasicGlyph: instanceBasicGlyph_shu_pie,
    bindSkeletonGlyph: bindSkeletonGlyph_shu_pie,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_shu_pie,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_shu_pie,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横折折撇': {
    instanceBasicGlyph: instanceBasicGlyph_heng_zhe_zhe_pie,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_zhe_zhe_pie,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_zhe_zhe_pie,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_zhe_zhe_pie,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横折钩': {
    instanceBasicGlyph: instanceBasicGlyph_heng_zhe_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_zhe_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_zhe_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_zhe_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横折弯钩': {
    instanceBasicGlyph: instanceBasicGlyph_heng_zhe_wan_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_zhe_wan_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_zhe_wan_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_zhe_wan_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横弯钩': {
    instanceBasicGlyph: instanceBasicGlyph_heng_wan_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_wan_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_wan_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_wan_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横折折弯钩': {
    instanceBasicGlyph: instanceBasicGlyph_heng_zhe_zhe_wan_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_zhe_zhe_wan_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_zhe_zhe_wan_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_zhe_zhe_wan_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '二横折': {
    instanceBasicGlyph: instanceBasicGlyph_er_heng_zhe,
    bindSkeletonGlyph: bindSkeletonGlyph_er_heng_zhe,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_er_heng_zhe,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_er_heng_zhe,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横折弯': {
    instanceBasicGlyph: instanceBasicGlyph_heng_zhe_wan,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_zhe_wan,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_zhe_wan,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_zhe_wan,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横折2': {
    instanceBasicGlyph: instanceBasicGlyph_heng_zhe2,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_zhe2,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_zhe2,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_zhe2,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横折挑': {
    instanceBasicGlyph: instanceBasicGlyph_heng_zhe_tiao,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_zhe_tiao,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_zhe_tiao,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_zhe_tiao,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '竖挑': {
    instanceBasicGlyph: instanceBasicGlyph_shu_tiao,
    bindSkeletonGlyph: bindSkeletonGlyph_shu_tiao,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_shu_tiao,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_shu_tiao,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '竖弯': {
    instanceBasicGlyph: instanceBasicGlyph_shu_wan,
    bindSkeletonGlyph: bindSkeletonGlyph_shu_wan,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_shu_wan,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_shu_wan,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '竖弯钩': {
    instanceBasicGlyph: instanceBasicGlyph_shu_wan_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_shu_wan_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_shu_wan_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_shu_wan_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '竖折': {
    instanceBasicGlyph: instanceBasicGlyph_shu_zhe,
    bindSkeletonGlyph: bindSkeletonGlyph_shu_zhe,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_shu_zhe,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_shu_zhe,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '斜钩': {
    instanceBasicGlyph: instanceBasicGlyph_xie_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_xie_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_xie_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_xie_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '横撇弯钩': {
    instanceBasicGlyph: instanceBasicGlyph_heng_pie_wan_gou,
    bindSkeletonGlyph: bindSkeletonGlyph_heng_pie_wan_gou,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_heng_pie_wan_gou,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_heng_pie_wan_gou,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '撇挑': {
    instanceBasicGlyph: instanceBasicGlyph_pie_tiao,
    bindSkeletonGlyph: bindSkeletonGlyph_pie_tiao,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_pie_tiao,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_pie_tiao,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '撇点': {
    instanceBasicGlyph: instanceBasicGlyph_pie_dian,
    bindSkeletonGlyph: bindSkeletonGlyph_pie_dian,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_pie_dian,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_pie_dian,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '挑捺': {
    instanceBasicGlyph: instanceBasicGlyph_tiao_na,
    bindSkeletonGlyph: bindSkeletonGlyph_tiao_na,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_tiao_na,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_tiao_na,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
  '平捺': {
    instanceBasicGlyph: instanceBasicGlyph_ping_na,
    bindSkeletonGlyph: bindSkeletonGlyph_ping_na,
    updateSkeletonListenerBeforeBind: updateSkeletonListener_before_bind_ping_na,
    updateSkeletonListenerAfterBind: updateSkeletonListener_after_bind_ping_na,
    updateSkeletonTransformation: updateSkeletonTransformation,
  },
}

export { strokeFnMap, updateSkeletonTransformation }