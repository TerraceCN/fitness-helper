<script setup lang="ts"></script>

<template>
  <router-view />
</template>

<style>
/* 全局重置 */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #111827;
  color: #e5e7eb;
  -webkit-font-smoothing: antialiased;
}
</style>
