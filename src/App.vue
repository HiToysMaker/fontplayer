<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import { initRenderer } from './fontEditor/renderer'
  import paper from 'paper'
  window.electronAPI && initRenderer()
  let canvas = document.createElement('canvas')
  paper.setup(canvas)
</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
