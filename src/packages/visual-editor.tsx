import { defineComponent,PropType, computed } from 'vue';
import { VisualEditorModelValue, VisualEditorConfig } from '@/packages/visual-editor.utils';
import {useModel} from '@/packages/utils/useModel'
import {VisualEditorBlock} from '@/packages/visual-editor-block';
import './visual-editor.scss';

export const VisualEditor = defineComponent({
    props: {
        modelValue: {type: Object as PropType<VisualEditorModelValue>, required: true},
        config: {type: Object as PropType<VisualEditorConfig>, require: true}

    },
    emit: {
        'update:modelValue': (val?: VisualEditorModelValue) => true,
    },
    setup(props, ctx) {
        
        const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val));
        console.log(dataModel);

        const containerStyle = computed(() => ({
             width: `${dataModel.value.container.width}px`,
             height: `${dataModel.value.container.height}px`
        }))

        return () => (
            <div class="visual-editor">
                <div class="visual-editor-menu">
                    visual-editor-menu
                </div>
                <div class="visual-editor-head">
                    visual-editor-head
                </div>
                <div class="visual-editor-operator">
                    visual-editor-operator
                </div>
                <div class="visual-editor-body">
                    <div class="visual-editor-content">
                        <div class="visual-editor-container" style={containerStyle.value}>
                            {
                                !!dataModel.value && !!dataModel.value.blocks && (
                                    dataModel.value.blocks.map((block, index) => (
                                        <VisualEditorBlock block={block} key={index}/>
                                    ))
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
})