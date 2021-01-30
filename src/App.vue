<template>
  <div class="app">
    <visual-editor v-model="jsonData" :config="visualConfig"/>
    <!-- <test-use-model v-model="val"/>
    {{val}} -->
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import { VisualEditor } from '@/packages/visual-editor'
// import { TestUseModel } from '@/packages/utils/useModel.tsx'
import { visualConfig } from '@/visual.config'

export default defineComponent({
  name: 'App',
  components: {
    VisualEditor,
    // TestUseModel,
  },
  data() {
    return {
      val: '',
      visualConfig,
      jsonData: {
          container : {
            width: 800,
            height: 500,
          },
          blocks: [
            {
              top: 100,
              left: 100,
              componentKey: 'button',
              focus: true,
            },
             {
              top: 200,
              left: 200,
              componentKey: 'input',
              focus: true,
            }
          ]
      }
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
