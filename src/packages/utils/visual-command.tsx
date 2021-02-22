import { useCommander } from '../plugins/command.plugins';
import {VisualEditorBlockData, VisualEditorModelValue} from '@/packages/visual-editor.utils';
import deepcopy from "deepcopy";


export function useVisualCommand (
    {
        focusData,
        updateBlocks,
        dataModel,
        dragstart,
        dragend,
    }: {
        focusData: {value: {focus: VisualEditorBlockData[], unfocus: VisualEditorBlockData[]}},
        updateBlocks: (blocks: VisualEditorBlockData[]) => void,
        dataModel: { value: VisualEditorModelValue },
        dragstart: { on: (cb: () => void) => void, off: (cb: () => void) => void },
        dragend: { on: (cb: () => void) => void, off: (cb: () => void) => void },
    }) {
    const commander = useCommander()

    commander.registry({
        name: 'delete',
        keyboard: ['backspace', 'delete', 'ctrl+d'],
        execute: () => {
            console.log('执行删除命令')
            let data = {
                before: dataModel.value.blocks || [],
                after: focusData.value.unfocus,
            }
            return {
                undo: () => {
                    console.log('撤回删除命令')
                    updateBlocks(deepcopy(data.before))
                },
                redo: () => {
                    console.log('重做删除命令')
                    updateBlocks(deepcopy(data.after))
                }
            }
        }
    })

    commander.registry({
        name: 'drag',
        init() {
            this.data = {before: null as null | VisualEditorBlockData[],}
            const handler = {
                dragstart: () => this.data.before = deepcopy(dataModel.value.blocks || []),
                dragend: () => commander.state.commands.drag()
            }
            dragstart.on(handler.dragstart)
            dragend.on(handler.dragend)
            return () => {
                dragstart.off(handler.dragstart)
                dragend.off(handler.dragend)
            }
        },
        execute() {
            let before = this.data.before
            let after = deepcopy(dataModel.value.blocks || [])
            return {
                redo: () => {
                    updateBlocks(deepcopy(after))
                },
                undo: () => {
                    updateBlocks(deepcopy(before))
                },
            }
        }
    })

    commander.registry({
        name: 'clear',
        execute: () => {
            let data = {
                before: deepcopy(dataModel.value.blocks|| []),
                after: deepcopy([]),
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after))
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before))
                },
            }
        }
    })

    commander.registry({
        name: 'placeTop',
        keyboard: 'ctrl+up',
        execute: () => {
            let data = {
                before: deepcopy(dataModel.value.blocks|| []),
                after: deepcopy((() => {
                    const {focus, unfocus} = focusData.value
                    const maxZIndex = unfocus.reduce((prev, item) => item.zIndex > prev ? item.zIndex : prev, 0) + 1
                    console.log(maxZIndex)
                    focus.forEach(block => block.zIndex = maxZIndex)
                    return deepcopy(dataModel.value.blocks || [])
                })()),
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after))
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before))
                },
            }
        }
    })

    commander.registry({
        name: 'placeBottom',
        keyboard: 'ctrl+down',
        execute: () => {
            let data = {
                before: deepcopy(dataModel.value.blocks || []),
                after: deepcopy((() => {
                    const {focus, unfocus} = focusData.value
                    let minZIndex = unfocus.reduce((prev, item) => item.zIndex > prev ? item.zIndex : prev, 0) - 1
                    console.log(minZIndex)
                    if (minZIndex < 0) {
                        const dur = Math.abs(minZIndex)
                        unfocus.forEach(block => block.zIndex += dur)
                        minZIndex = 0
                    }
                    focus.forEach(block => block.zIndex = minZIndex)
                    return deepcopy(dataModel.value.blocks || [])
                })()),
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after))
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before))
                },
            }
        }
    })

    commander.registry({
        name: 'updateBlock',
        execute: (newBlock: VisualEditorBlockData, oldBlock: VisualEditorBlockData) => {
            let blocks = deepcopy(dataModel.value.blocks || [])
            let data = {
                before: blocks,
                after: (() => {
                    blocks = [...blocks]
                    const index = dataModel.value.blocks!.indexOf(oldBlock)
                    if (index > -1) {
                        blocks.splice(index, 1, newBlock)
                    }
                    return deepcopy(blocks)
                })(),
            }
            return {
                redo: () => {
                    updateBlocks(deepcopy(data.after))
                },
                undo: () => {
                    updateBlocks(deepcopy(data.before))
                },
            }
        },
    })


    commander.init();

    return {
        undo: () => commander.state.commands.undo(),
        redo: () => commander.state.commands.redo(),
        delete: () => commander.state.commands.delete(),
        clear: () => commander.state.commands.clear(),
        placeTop: () => commander.state.commands.placeTop(),
        placeBottom: () => commander.state.commands.placeBottom(),
        updateBlock: (newBlock: VisualEditorBlockData, oldBlock: VisualEditorBlockData) => commander.state.commands.updateBlock(newBlock, oldBlock),
    }
}