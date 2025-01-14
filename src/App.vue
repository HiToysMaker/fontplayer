<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import { initTauri } from './fontEditor/renderer'
  import paper from 'paper'
  initTauri()
  let canvas = document.createElement('canvas')
  paper.setup(canvas)
</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
