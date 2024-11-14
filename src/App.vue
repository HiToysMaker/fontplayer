<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import { initRenderer } from './fontEditor/renderer'
  window.electronAPI && initRenderer()
</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
