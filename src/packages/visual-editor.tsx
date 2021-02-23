import { defineComponent,PropType, computed, ref, reactive, readonly } from 'vue';
import { VisualEditorModelValue, VisualEditorConfig, VisualEditorComponent, createNewBlocks, VisualEditorBlockData } from '@/packages/visual-editor.utils';
import {useModel} from '@/packages/utils/useModel'
import {VisualEditorBlock} from '@/packages/visual-editor-block';
import {VisualOperatorEditor} from '@/packages/visual-editor-operator';
import './visual-editor.scss';
import { useVisualCommand } from './utils/visual-command';
import {createEvent} from "@/packages/plugins/event";
import { $$dialog } from './utils/dialog-service';
import {ElMessageBox} from 'element-plus';
import {VisualEditorMarkLines } from './visual-editor.utils'
import {$$dropdown, DropDownOption} from './utils/dropdown-service'


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

       const state = reactive({
           selectBlock: null as null | VisualEditorBlockData, // 当前选中的组件

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
            showBlockData: (block?: VisualEditorBlockData) => {
                $$dialog.textarea(JSON.stringify(block), '节点数据')
            },
            importBlockData: async(block: VisualEditorBlockData) => {
                const text = await $$dialog.textarea('', '请输入节点JSON字符串')
                try {
                    const data = JSON.parse(text || '');
                    commander.updateBlock(data, block)
                } catch(e) {
                    console.log(e)
                    ElMessageBox.alert('解析字符出错')
                }
            }
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
                        // e.stopPropagation()
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
                       // console.log(block)
                        state.selectBlock = block
                        blockDraggier.mousedown(e)
                    }
                }
            }
        })();
         /*
        *  画布中拖拽相关动作
        */
        const blockDraggier = (() => {

            const mark = reactive({
                x: null as null | number,
                y: null as null | number,
            })

            let dragState = {
                startX: 0,
                startY: 0,
                startPos: [] as { top: number, left: number}[],
                dragging: false,
                startLeft: 0,
                startTop: 0,
                marksLines: {} as VisualEditorMarkLines,
            }

            const mousedown  = (e: MouseEvent) => {
                dragState = {
                    startX: e.clientX,
                    startY: e.clientY,
                    startLeft: state.selectBlock!.left,
                    startTop: state.selectBlock!.top,
                    startPos: focusData.value.focus.map(({top, left})=> ({top, left})),
                    dragging: false,
                    marksLines:(() => {
                        const {focus, unfocus} = focusData.value
                        //console.log(state.selectBlock)
                        const {top, left, width, height} = state.selectBlock!
                        let lines: VisualEditorMarkLines = {x: [], y:[] };
                        /**
                         * @param top {number} 选中的block需要设置的top值
                         * @param showTop {number} 辅助线top值
                         */
                        unfocus.forEach(block => {
                            const {top: t, left: l, width: w, height: h} = block
                            lines.y.push({ top: t, showTop: t}) // 顶对顶 
                            lines.y.push({ top: t + h, showTop: t + h}) // 顶对底
                            lines.y.push({ top: t + h / 2 - height / 2, showTop: t + h / 2}) // 对齐中线
                            lines.y.push({ top: t - height, showTop: t }) // 底对顶
                            lines.y.push({ top: t + h - height, showTop: t + h }) // 底对底

                            lines.x.push({ left: l, showLeft: l}) // 顶对顶 
                            lines.x.push({ left: l + w, showLeft: l + w}) // 顶对底
                            lines.x.push({ left: l + w / 2 - width / 2, showLeft: l + w / 2}) // 对齐中线
                            lines.x.push({ left: l - width, showLeft: t }) // 底对顶
                            lines.x.push({ left: l + w - width, showLeft: l + w }) // 底对底
                        })

                        return lines
                    })(),
                }
                document.addEventListener('mousemove', mousemove)
                document.addEventListener('mouseup', mouseup)
            }

            const mousemove = (e: MouseEvent) => {
                if (!dragState.dragging) {
                    dragState.dragging = true
                    dragstart.emit()
                }

                let {clientX: moveX, clientY: moveY} = e
                const {startX, startY} = dragState
                if(e.shiftKey) {
                    if(Math.abs(moveX - startX) > Math.abs(moveY - startY)) {
                        moveX = startX
                    } else {
                        moveY = startY
                    }
                }
                //console.log(moveY, state.selectBlock!.top, state.selectBlock)
                const currentTop = dragState.startTop + moveY - startY
                const currentLeft = dragState.startLeft + moveX - startX

                for(let i=0; i< dragState.marksLines.y.length; i++) {
                   const {top, showTop} = dragState.marksLines.y[i]
                   if(Math.abs(top - currentTop) < 5) {
                        moveY = top + startY - dragState.startTop,
                        mark.y = showTop
                        break
                   }
                }

                for(let i=0; i< dragState.marksLines.x.length; i++) {
                    const {left, showLeft} = dragState.marksLines.x[i]
                    if(Math.abs(left - currentLeft) < 5) {
                         moveX = left + startX - dragState.startLeft,
                         mark.x = showLeft
                         break
                    }
                 }

                const durX = moveX - startX
                const durY = moveY - startY

                focusData.value.focus.forEach((block, index) => {
                    block.top = dragState.startPos[index].top + durY,
                    block.left = dragState.startPos[index].left + durX
                })
            }
            const mouseup = (e: MouseEvent) => {
                document.removeEventListener('mousemove', mousemove)
                document.removeEventListener('mouseup', mouseup)
                mark.x = null
                mark.y = null
                if (dragState.dragging) {
                    dragend.emit()
                }
            }
            return {
                mousedown,
                mark
            }
        })();

        /*其他的一些事件*/
        const handler = {
            onContextmenuBlock: (e: MouseEvent, block: VisualEditorBlockData) => {
                e.preventDefault()
                e.stopPropagation()
                
                $$dropdown({
                    reference: e,
                    content: () => <>
                        <DropDownOption label="置顶节点" icon="icon-place-top" {...{onClick: commander.placeTop}}/>
                        <DropDownOption label="置底节点" icon="icon-place-bottom" {...{onClick: commander.placeBottom}}/>
                        <DropDownOption label="删除节点" icon="icon-delete" {...{onClick: commander.delete}}/>
                        <DropDownOption label="查看数据"
                                        icon="icon-browse" {...{onClick: () => methods.showBlockData(block)}}/>
                        <DropDownOption label="导入节点"
                                        icon="icon-import" {...{onClick: () => methods.importBlockData(block)}}/>
                    </>
                })
            }
        }

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
            {label: '置顶', icon: 'icon-place-top', handler: () => commander.placeTop(), tip: 'ctrl+up'},
            {label: '置底', icon: 'icon-place-bottom', handler: () => commander.placeBottom(), tip: 'ctrl+down'},
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
               <VisualOperatorEditor block={state.selectBlock} config={props.config}/>
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
                                            onMousedown: (e: MouseEvent)=> focusHandler.block.onMousedown(e, block),
                                            onContextmenu: (e: MouseEvent) => handler.onContextmenuBlock(e, block)
                                        }}/>
                                    ))
                                )
                            }
                            {
                                blockDraggier.mark.y && <div class="visual-editor-mark-line-y" style={{top: `${blockDraggier.mark.y}px`}}></div>
                            }
                            {
                                blockDraggier.mark.x &&  <div class="visual-editor-mark-line-x" style={{left: `${blockDraggier.mark.x}px`}}></div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
})