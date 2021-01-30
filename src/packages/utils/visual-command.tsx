import { useCommander } from '../plugins/command.plugins';
import {VisualEditorBlockData, VisualEditorModelValue} from '@/packages/visual-editor.utils';
import deepcopy from "deepcopy";


export function useVisualCommand (
    {
        focusData,
        updateBlocks,
        dataModel,
    }: {
        focusData: {value: {focus: VisualEditorBlockData[], unfocus: VisualEditorBlockData[]}},
        updateBlocks: (blocks: VisualEditorBlockData[]) => void,
        dataModel: { value: VisualEditorModelValue },
    }) {
    const commander = useCommander()

    commander.registry({
        name: 'delete',
        keybroad: ['backspace', 'delete', 'ctrl+d'],
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

    return {
        undo: () => commander.state.commands.undo(),
        redo: () => commander.state.commands.redo(),
        delete: () => commander.state.commands.delete(),
    }
}