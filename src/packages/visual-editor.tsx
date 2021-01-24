import {defineComponent} from 'vue';

export const VisualEditor = defineComponent({
    props: {},
    setup() {
        return () => (
            <div class="visual-editor">
                可视化编辑器
            </div>
        )
    }
})