import { defineComponent,PropType, computed, ref } from 'vue';
import { VisualEditorModelValue, VisualEditorConfig, VisualEditorComponent } from '@/packages/visual-editor.utils';
import {useModel} from '@/packages/utils/useModel'
import {VisualEditorBlock} from '@/packages/visual-editor-block';
import './visual-editor.scss';

export const VisualEditor = defineComponent({
    props: {
        modelValue: {type: Object as PropType<VisualEditorModelValue>, required: true},
        config: {type: Object as PropType<VisualEditorConfig>, require: true}

    },
    emits: {
        'update:modelValue': (val?: VisualEditorModelValue) => true,
    },
    setup(props, ctx) {
        
        const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val));
        console.log(dataModel, 'dataModel');
        const containerRef = ref({} as HTMLDivElement);

        const containerStyle = computed(() => ({
             width: `${dataModel.value.container.width}px`,
             height: `${dataModel.value.container.height}px`
        }))

        const meunDraggier = {
            current : {
                component: null as null | VisualEditorComponent,
            },
            dragstart: (e: DragEvent, component: VisualEditorComponent) => {
                containerRef.value.addEventListener('dragenter', meunDraggier.dragenter);
                containerRef.value.addEventListener('dragover', meunDraggier.dragover);
                containerRef.value.addEventListener('dragleave', meunDraggier.dragleave);
                containerRef.value.addEventListener('drop', meunDraggier.drop);
                meunDraggier.current.component = component;
            },
            dragenter: (e: DragEvent) => e.dataTransfer!.dropEffect = 'move',
            dragover : (e: DragEvent) => e.preventDefault(),
            dragleave: (e: DragEvent) => e.dataTransfer!.dropEffect = 'none',
            dropend: (e: DragEvent) => {
                containerRef.value.removeEventListener('dragenter', meunDraggier.dragenter);
                containerRef.value.removeEventListener('dragover', meunDraggier.dragover);
                containerRef.value.removeEventListener('dragleave', meunDraggier.dragleave);
                containerRef.value.removeEventListener('drop', meunDraggier.drop);
                meunDraggier.current.component = null;
            },
            drop: (e: DragEvent) => {
                // console.log('drop', meunDraggier.current.component);
                const blocks = dataModel.value.blocks || []
                blocks.push({
                    top: e.offsetY,
                    left: e.offsetX,
                })
                dataModel.value = {...dataModel.value, blocks}
            }, 
        }

        return () => (
            <div class="visual-editor">
                <div class="visual-editor-menu">
                    {props.config?.componentList.map(component => (
                        <div class="visual-editor-menu-item"
                        draggable 
                        onDragstart={(e) => meunDraggier.dragstart(e, component)}
                        onDragend={meunDraggier.dropend}>
                            <span class="visual-editor-menu-item-label">{component.label}</span>
                            {component.preview()}
                        </div>
                    ))}
                </div>
                <div class="visual-editor-head">
                    visual-editor-head
                </div>
                <div class="visual-editor-operator">
                    visual-editor-operator
                </div>
                <div class="visual-editor-body">
                    <div class="visual-editor-content">
                        <div class="visual-editor-container" style={containerStyle.value} ref={containerRef}>
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