<template>
  <div class="page-shell">
    <slot name="hero" />
    <div class="page-shell__content container">
      <slot name="header">
        <PageHeader v-if="pageTitle" :title="pageTitle" :tag="pageTag" :subtitle="pageSubtitle" />
      </slot>
      <slot />
    </div>
    <slot name="footer-section" />
  </div>
</template>

<script setup>
import PageHeader from './PageHeader.vue'

defineProps({
  pageTitle: String,
  pageTag: String,
  pageSubtitle: String,
})
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  position: relative;
}

.page-shell__content {
  padding-block: var(--space-8) var(--space-12);
  position: relative;
}
</style>
