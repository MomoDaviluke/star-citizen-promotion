<!--
  @file FilmGrain 胶片颗粒覆盖层
  @description 为页面添加极淡噪点纹理与轻微色散，营造电影胶片质感
  @module components/cosmic/FilmGrain
-->
<template>
  <div class="film-grain" aria-hidden="true">
    <div class="film-grain__noise"></div>
    <div class="film-grain__chromatic"></div>
  </div>
</template>

<style scoped>
.film-grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: var(--z-overlay, 100);
  overflow: hidden;
}

.film-grain__noise {
  position: absolute;
  inset: -100%;
  width: 300%;
  height: 300%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  animation: grain-shift 0.5s steps(4) infinite;
}

.film-grain__chromatic {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 40%, rgba(74, 158, 255, 0.015) 100%);
  mix-blend-mode: screen;
}

@keyframes grain-shift {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-2%, 2%); }
  50% { transform: translate(2%, -1%); }
  75% { transform: translate(-1%, -2%); }
  100% { transform: translate(0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .film-grain__noise {
    animation: none;
  }
}
</style>
