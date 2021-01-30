import {defineComponent, PropType, computed, onMounted, ref} from 'vue';
import {VisualEditorBlockData, VisualEditorConfig} from '@/packages/visual-editor.utils'

export const VisualEditorBlock = defineComponent({
    props: {
        block: {type: Object as PropType<VisualEditorBlockData>, required: true},
        config: {type: Object as PropType<VisualEditorConfig>, required: true},
    },
    setup(props) {

        const el = ref({} as HTMLDivElement)

        const classes = computed(() => [
            'visual-editor-block', 
            {
                'visual-editor-block-focus': props.block.focus
            }
        ])

        const styles = computed(() => ({
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
            // zIndex: props.block.zIndex,
        }))

        onMounted(() => {
            /**
             * 添加组件的时候调整位置居中
             */
            const {block} = props;
            if(block.adjustPosition) {
                const {offsetHeight, offsetWidth} = el.value
                block.top = block.top - offsetHeight / 2
                block.left = block.left - offsetWidth / 2
                block.adjustPosition = false
            }
        })
    
        return () => {
            const component = props.config.componentMap[props.block.componentKey];
            const Render = component.render();
            return (
                <div class={classes.value} style={styles.value} ref={el}>
                {Render}
                </div>
            )
        }
    }
})  