<template>
  <div class="page-header">
    <span v-if="tag" class="page-header__tag">{{ tag }}</span>
    <h1 class="page-header__title">{{ title }}</h1>
    <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    <div class="page-header__line" />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: String,
  tag: String,
})
</script>

<style scoped>
.page-header {
  margin-bottom: var(--space-8);
  position: relative;
}

.page-header__tag {
  display: block;
  font-family: var(--font-tech);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: var(--space-2);
  animation: hero-subtitle-enter 0.6s ease-out both;
}

.page-header__title {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-heading);
  line-height: 1.1;
  animation: hero-title-enter 0.8s ease-out both;
}

.page-header__subtitle {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: 400;
  color: var(--color-text-label);
  margin-top: var(--space-3);
  letter-spacing: 0.02em;
  animation: hero-subtitle-enter 0.6s ease-out 0.2s both;
}

.page-header__line {
  height: 1px;
  margin-top: var(--space-5);
  background: linear-gradient(90deg, var(--color-accent), var(--color-border), transparent);
  animation: indicator-expand 0.8s ease-out 0.4s both;
}

@media (max-width: 768px) {
  .page-header__title {
    font-size: var(--text-3xl);
  }
}
</style>
