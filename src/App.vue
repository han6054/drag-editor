<template>
  <div class="app">
    <visual-editor/>
    <!-- <test-use-model v-model="val"/>
    {{val}} -->
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import { VisualEditor } from '@/packages/visual-editor'
import { TestUseModel } from '@/packages/utils/useModel.tsx'
export default defineComponent({
  name: 'App',
  components: {
    VisualEditor,
    // TestUseModel,
  },
  data() {
    return {
      val: ''
    }
  }
})
</script>

<style>
   html, body {
        margin: 0;
        padding: 0;
    }
</style>
