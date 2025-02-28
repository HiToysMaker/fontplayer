import { ref } from "vue";
import { selectedFile } from "./files";
import { hasChineseChar } from "@/fontManager/utils";
import { convertToPinyin } from "tiny-pinyin";

const head_data = ref({
  majorVersion: 0x0001,
  minorVersion: 0x0000,
  fontRevision: 0x00010000,
  flags: [
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ],
  created: {
    timestamp: Math.floor(Date.now() / 1000) + 2082844800,
    value: Date.now(),
  },
  modified: {
    timestamp: Math.floor(Date.now() / 1000) + 2082844800,
    value: Date.now()
  },
  macStyle: [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ],
  lowestRecPPEM: 7,
  fontDirectionHint: 2,
})

const hhea_data = ref({
  majorVersion: 0x0001,
  minorVersion: 0x0000,
  lineGap: 0,
  caretSlopeRise: 1,
  caretSlopeRun: 0,
  caretOffset: 0,
})

const getEnName = (name: string) => {
  let enName = name
  if (hasChineseChar(name)) {
		enName = convertToPinyin(name)
	}
  return enName
}

const name_data = ref([])

const os2_data = ref({
  version: 0x0005,
  usWeightClass: 400,
  usWidthClass: 5,
  fsType: 0,
  ySubscriptXSize: 650,
  ySubscriptYSize: 699,
  ySubscriptXOffset: 0,
  ySubscriptYOffset: 140,
  ySuperscriptXSize: 650,
  ySuperscriptYSize: 699,
  ySuperscriptXOffset: 0,
  ySuperscriptYOffset: 479,
  yStrikeoutSize: 49,
  yStrikeoutPosition: 258,
  sFamilyClass: 0,
  panose: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  achVendID: 'UKWN',
  fsSelection: [
    false,
    false,
    false,
    false,
    false,
    false,
    true,
    false,
    false,
    false,
  ],
  // usDefaultChar: hasChar(font, ' ') ? 32 : 0,
  // usBreakChar: hasChar(font, ' ') ? 32 : 0,
  usMaxContext: 0,
  usLowerOpticalPointSize: 8,
  usUpperOpticalPointSize: 72,
})

const post_data = ref({
  version: 0x00030000,
  italicAngle: 0,
  underlinePosition: 0,
  underlineThickness: 0,
  isFixedPitch: 1,
  minMemType42: 0,
  maxMemType42: 0,
  minMemType1: 0,
  maxMemType1: 0,
})

const metrics_data = ref({
  advanceWidth: 1000,
  lsb: 0,
  rsb: 0,
  xMin: 0,
  yMin: 0,
  xMax: 1000,
  yMax: 1000,
})

export {
  head_data,
  hhea_data,
  name_data,
  os2_data,
  post_data,
  metrics_data,
  getEnName,
}