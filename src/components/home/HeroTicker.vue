<!--
  @file Hero 底部滚动 Ticker
  @description 展示舰队动态状态
-->
<template>
  <DataTicker
    :items="items"
    :duration="40"
    class="hero-ticker"
  />
</template>

<script setup>
import { DataTicker } from '../hud/index.js'

const items = [
  'FLEET ONLINE',
  'RECRUITING NOW',
  'SECTOR 7G CLEARED',
  'PATROL ROUTE ALPHA ACTIVE',
  '2 NEW PILOTS ENLISTED',
  'CARRIER NEXUS DOCKED'
]
</script>

<style scoped>
.hero-ticker {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 4;
}
</style>
