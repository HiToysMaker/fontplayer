<script setup lang="ts">
import { onMounted } from 'vue'
import { name_data as data } from '../../../stores/settings'
import {
  Delete,
} from '@element-plus/icons-vue'

// NameIDs for the name table.
const nameTableNames = [
	'copyright',              // 0
	'fontFamily',             // 1
	'fontSubfamily',          // 2
	'uniqueID',               // 3
	'fullName',               // 4
	'version',                // 5
	'postScriptName',         // 6
	'trademark',              // 7
	'manufacturer',           // 8
	'designer',               // 9
	'description',            // 10
	'manufacturerURL',        // 11
	'designerURL',            // 12
	'license',                // 13
	'licenseURL',             // 14
	'reserved',               // 15
	'preferredFamily',        // 16
	'preferredSubfamily',     // 17
	'compatibleFullName',     // 18
	'sampleText',             // 19
	'postScriptFindFontName', // 20
	'wwsFamily',              // 21
	'wwsSubfamily'            // 22
]

const nameIDOptions = nameTableNames.map((value, index) => {
  return {
    label: value,
    value: index,
  }
})

const platformIDOptions = [
  {
    label: 'Unicode',
    value: 0,
    disabled: true,
  },
  {
    label: 'Macintosh',
    value: 1,
    disabled: true,
  },
  {
    label: 'Windows',
    value: 3,
    disabled: false,
  }
]

const winEncodingIDOptions = [
  {
    label: 'Unicode BMP',
    value: 1,
  }
]

const macEncodingIDOptions = []

const winLangIDOptions = [
  {
    label: 'zh',
    value: 0x804,
  },
  {
    label: 'zh-HK',
    value: 0x0C04,
  },
  {
    label: 'zh-MO',
    value: 0x1404,
  },
  {
    label: 'zh-SG',
    value: 0x1004,
  },
  {
    label: 'zh-TW',
    value: 0x0404,
  },
  {
    label: 'en',
    value: 0x0409,
  }
]

const macLangIDOptions = []

const addItem = () => {
  data.value.push({
    nameID: 1,
    nameLabel: 'fontFamily',
    platformID: 3,
    encodingID: 1,
    langID: 0x804,
    value: '',
    default: false,
  })
}

const removeItem = (index) => {
  if (!data.value[index].default) {
    data.value.splice(index, 1)
  }
}
</script>

<template>
  <el-scrollbar height="460px">
    <div class="table-item" v-for="(item, index) in data">
      <div class="item-row-1">
        <el-select
          v-model="item.nameID"
          class="name-id-select"
        >
          <el-option
            v-for="item in nameIDOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="item.langID"
          class="lang-id-select"
        >
          <el-option
            v-for="item in winLangIDOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="item.platformID"
          class="lang-id-select"
        >
          <el-option
            v-for="item in platformIDOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
            :disabled="item.disabled"
          />
        </el-select>
        <el-select
          v-model="item.encodingID"
          class="lang-id-select"
        >
          <el-option
            v-for="item in winEncodingIDOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button @pointerdown="() => removeItem(index)" v-show="!item.default" type="danger" :icon="Delete" :style="{
          backgroundColor: 'rgb(196, 86.4, 86.4)',
          color: 'var(--light-0)',
          border: '1px solid var(--light-5)',
        }"></el-button>
      </div>
      <div class="item-row-2">
        <el-input v-model="item.value"></el-input>
        <el-tooltip
          class="tips"
          effect="dark"
          content="name表定义了不同语言环境下，与字体相关的字符串信息。"
          placement="bottom"
        >
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
    </div>
    <div class="add-item-btn">
      <el-button @pointerdown="addItem">添加</el-button>
    </div>
  </el-scrollbar>
</template>

<style scoped>
  .add-item-btn {
    .el-button {
      width: 100%;
    }
  }
  :deep(.el-select .el-input) {
    width: 142px;
  }
  .table-item {
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
    .item-row-1 {
      flex: 0 0 32px;
      display: flex;
      flex-direction: row;
      text-align: center;
      color: var(--light-0);
      line-height: 32px;
      gap: 10px;
      margin-bottom: 10px;
      .el-select {
        flex: 0 0 142px;
      }
    }
    .item-row-2 {
      flex: 0 0 32px;
      display: flex;
      flex-direction: row;
      flex: 0 0 32px;
      .el-input {
        flex: auto;
      }
      .el-icon {
        flex: 0 0 32px;
        margin-left: 20px;
      }
    }
  }
  .el-icon {
    margin-left: 20px;
    margin-right: 20px;
    height: 32px;
    font-size: 18px;
  }
  .tips {
    width: 200px;
    color: #a51f1f;
    line-height: 32px;
  }
</style>