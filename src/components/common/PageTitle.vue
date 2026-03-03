<template>
  <section class="page-title">
    <p class="kicker">UEE TRANSMISSION</p>
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.page-title {
  margin-bottom: 1.4rem;
}

.kicker {
  margin: 0 0 0.3rem;
  color: var(--accent-2);
  font-size: 0.74rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  letter-spacing: 0.04em;
}

p {
  margin-bottom: 0;
}
</style>
