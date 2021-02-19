import { defineComponent,PropType, computed, ref } from 'vue';
import { VisualEditorModelValue, VisualEditorConfig, VisualEditorComponent, createNewBlocks, VisualEditorBlockData } from '@/packages/visual-editor.utils';
import {useModel} from '@/packages/utils/useModel'
import {VisualEditorBlock} from '@/packages/visual-editor-block';
import './visual-editor.scss';
import { useVisualCommand } from './utils/visual-command';
import {createEvent} from "@/packages/plugins/event";
import { $$dialog } from './utils/dialog-service';
import {ElMessageBox} from 'element-plus';

export const VisualEditor = defineComponent({
    props: {
        modelValue: {type: Object as PropType<VisualEditorModelValue>, required: true},
        config: {type: Object as PropType<VisualEditorConfig>, required: true},

    },
    emits: {
        'update:modelValue': (val?: VisualEditorModelValue) => true,
    },
    setup(props, ctx) {
         /*
        * 双向绑定 组件中元素数据
        */
        const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val));
        //console.log(dataModel, 'dataModel');
        const containerRef = ref({} as HTMLDivElement);

        const containerStyle = computed(() => ({
             width: `${dataModel.value.container.width}px`,
             height: `${dataModel.value.container.height}px`
        }))
        /*
        * 计算选中未选中block数据
        */
       const focusData = computed(() => {
           let focus: VisualEditorBlockData[] = []
           let unfocus: VisualEditorBlockData[] = [];
           (dataModel.value.blocks || []).forEach(item => (item.focus ? focus : unfocus).push(item))
           return {
               focus,
               unfocus
           }
       })

       const dragstart = createEvent()
       const dragend = createEvent()

        const methods = {
            clearFocus:(block?: VisualEditorBlockData) => {
                let blocks = (dataModel.value.blocks || [])
                if(blocks.length === 0) return
                if(!!block) {
                    blocks = blocks.filter(item => item !== block)
                }
    
                blocks.forEach(item => item.focus = false)
            },
            updateBlocks: (blocks: VisualEditorBlockData[]) => {
                dataModel.value = {...dataModel.value, blocks,}
            },
        }
        /*
        * 从菜单拖拽到画布相关动作
        */
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
                    dragstart.emit()
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
                    blocks.push(createNewBlocks({
                        component: component!,
                        top: e.offsetY,
                        left: e.offsetX,
                    }))
                    methods.updateBlocks(blocks);
                    dragend.emit()
                }
            }
            return blockHandler
        })(); 

         /*
        *  画布中选中元素方法
        */
        const focusHandler = (() => {
            return {
                container :{
                    onMousedown: (e: MouseEvent) => {
                        if(e.target !== e.currentTarget) return
                        e.preventDefault()
                        methods.clearFocus()
                    }
                },
                block: {
                    onMousedown: (e: MouseEvent, block: VisualEditorBlockData) => {
                        e.stopPropagation()
                        e.preventDefault()
                        if(e.shiftKey) {
                            if(focusData.value.focus.length <= 1) {
                                block.focus = true
                            } else {
                                block.focus = !block.focus
                            }
                        } else {
                            if(!block.focus) {
                                block.focus = true
                                methods.clearFocus(block)
                            }
                        }
                        blockDraggier.mousedown(e)
                    }
                }
            }
        })();
         /*
        *  画布中拖拽相关动作
        */
        const blockDraggier = (() => {
            let dragState = {
                startX: 0,
                startY: 0,
                startPos: [] as { top: number, left: number}[],
                dragging: false
            }

            const mousedown  = (e: MouseEvent) => {
                dragState = {
                    startX: e.clientX,
                    startY: e.clientY,
                    startPos: focusData.value.focus.map(({top, left})=> ({top, left})),
                    dragging: false
                }
                document.addEventListener('mousemove', mousemove)
                document.addEventListener('mouseup', mouseup)
            }

            const mousemove = (e: MouseEvent) => {
                const durX = e.clientX - dragState.startX
                const durY = e.clientY - dragState.startY
                if (!dragState.dragging) {
                    dragState.dragging = true
                    dragstart.emit()
                }
                focusData.value.focus.forEach((block, index) => {
                    block.top = dragState.startPos[index].top + durY,
                    block.left = dragState.startPos[index].left + durX
                })
            }
            const mouseup = (e: MouseEvent) => {
                document.removeEventListener('mousemove', mousemove)
                document.removeEventListener('mouseup', mouseup)
                if (dragState.dragging) {
                    dragend.emit()
                }
            }
            return {
                mousedown
            }
        })();

        const commander = useVisualCommand({
            focusData,
            updateBlocks: methods.updateBlocks,
            dataModel,
            dragstart,
            dragend,
        });

        const buttons = [
            {label: '撤销', icon: 'icon-back', handler: commander.undo, tip: 'ctrl+z'},
            {label: '重做', icon: 'icon-forward', handler: commander.redo, tip: 'ctrl+y, ctrl+shift+z'},
            {label: '导入', icon: 'icon-import', handler: async () => {
                const text = await $$dialog.textarea('', '请输入JSON字符串')
                try {
                    const data = JSON.parse(text || '');
                    dataModel.value = data;
                } catch(e) {
                    console.log(e)
                    ElMessageBox.alert('解析字符出错')
                }
            }},
            {label: '导出', icon: 'icon-export', handler: () => $$dialog.textarea(JSON.stringify(dataModel.value), '导出JSON字符串')},
            {label: '删除', icon: 'icon-delete', handler: () => commander.delete(), tip: 'ctrl+d, backspace, delete'},
            {label: '清空', icon: 'icon-reset', handler: () => commander.clear()},
        ]

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
                    {buttons.map((btn, index) => {
                            const content = (<div key={index} class="visual-editor-head-button" onClick={btn.handler}>
                                <i class={`iconfont ${btn.icon}`}/>
                                <span>{btn.label}</span>
                            </div>)
                            return !btn.tip ? content : <el-tooltip effect="dark" content={btn.tip} placement="bottom">
                                {content}
                            </el-tooltip>
                        }
                    )}
                </div>
                <div class="visual-editor-operator">
                    visual-editor-operator
                </div>
                <div class="visual-editor-body">
                    <div class="visual-editor-content">
                        <div class="visual-editor-container" style={containerStyle.value} ref={containerRef} {...focusHandler.container}>
                            {
                                !!dataModel.value && !!dataModel.value.blocks && (
                                    dataModel.value.blocks.map((block, index) => (
                                        <VisualEditorBlock 
                                        config={props.config} 
                                        block={block} 
                                        key={index}
                                        {...{
                                            onMousedown: (e: MouseEvent)=> focusHandler.block.onMousedown(e, block )
                                        }}/>
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