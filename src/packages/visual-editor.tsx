import { defineComponent,PropType, computed, ref } from 'vue';
import { VisualEditorModelValue, VisualEditorConfig, VisualEditorComponent } from '@/packages/visual-editor.utils';
import {useModel} from '@/packages/utils/useModel'
import {VisualEditorBlock} from '@/packages/visual-editor-block';
import './visual-editor.scss';

export const VisualEditor = defineComponent({
    props: {
        modelValue: {type: Object as PropType<VisualEditorModelValue>, required: true},
        config: {type: Object as PropType<VisualEditorConfig>, required: true},

    },
    emits: {
        'update:modelValue': (val?: VisualEditorModelValue) => true,
    },
    setup(props, ctx) {
        
        const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val));
        //console.log(dataModel, 'dataModel');
        const containerRef = ref({} as HTMLDivElement);

        const containerStyle = computed(() => ({
             width: `${dataModel.value.container.width}px`,
             height: `${dataModel.value.container.height}px`
        }))

        const meunDraggier = (() => {

            let component = null as null | VisualEditorComponent;

            const blockHandler = {
                /**
                 * 处理菜单组件开始动作
                 */
                dragstart: (e: DragEvent, current: VisualEditorComponent) => {
                    containerRef.value.addEventListener('dragenter', containerHandler.dragenter);
                    containerRef.value.addEventListener('dragover', containerHandler.dragover);
                    containerRef.value.addEventListener('dragleave', containerHandler.dragleave);
                    containerRef.value.addEventListener('drop', containerHandler.drop);
                    component = current;
                },
                 /**
                 * 处理菜单组件结束动作
                 */
                dragend: (e: DragEvent) => {
                    containerRef.value.removeEventListener('dragenter', containerHandler.dragenter);
                    containerRef.value.removeEventListener('dragover', containerHandler.dragover);
                    containerRef.value.removeEventListener('dragleave', containerHandler.dragleave);
                    containerRef.value.removeEventListener('drop', containerHandler.drop);
                    component = null;
                },
            }

            const containerHandler = {
                /**
                 * 菜单组件进入容器的时候设置课放置状态
                 */
                dragenter: (e: DragEvent) => e.dataTransfer!.dropEffect = 'move',
                /**
                 * 鼠标在容器中连续移动的时候，禁用默认事件
                 */
                dragover : (e: DragEvent) => e.preventDefault(),
                /**
                 * 在移动过程中如果离开了容器，设置为不可放置状态
                 */
                dragleave: (e: DragEvent) => e.dataTransfer!.dropEffect = 'none',
                /**
                 * 添加一条组件数据
                 */
                drop: (e: DragEvent) => {
                const blocks = dataModel.value.blocks || []
                    blocks.push({
                        top: e.offsetY,
                        left: e.offsetX,
                        componentKey: component!.key
                    })
                }
            }
            return blockHandler
        })(); 

        return () => (
            <div class="visual-editor">
                <div class="visual-editor-menu">
                    {props.config?.componentList.map(component => (
                        <div class="visual-editor-menu-item"
                        draggable 
                        onDragstart={(e) => meunDraggier.dragstart(e, component)}
                        onDragend={meunDraggier.dragend}>
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
                                        <VisualEditorBlock config={props.config} block={block} key={index}/>
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