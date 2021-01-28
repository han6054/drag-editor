import {defineComponent, PropType, computed} from 'vue';
import {VisualEditorBlockData} from '@/packages/visual-editor.utils'

export const VisualEditorBlock = defineComponent({
    props: {
        block: {type: Object as PropType<VisualEditorBlockData>, required: true}
    },
    setup(props) {

        const styles = computed(() => ({
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
            // zIndex: props.block.zIndex,
        }))
        return () => (
            <div class="visual-editor-block" style={styles.value}>
                block
            </div>
        )
    }
})  