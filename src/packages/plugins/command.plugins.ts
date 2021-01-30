import {reactive} from 'vue'

export interface CommandCexecute {
    undo?: () => void,
    redo: () => void,
}

export interface Command {
    name: string,
    keybroad?: string | string[],
    execute: (...args: any[]) => CommandCexecute, 
    follwQueue?: boolean, // 是否放到任务队列
}

export interface CommandManager {
    queue: CommandCexecute[],
}

export function useCommander () {

    const state = reactive({
        current : -1,
        queue: [] as CommandCexecute[],
        commands: {} as Record<string, (...args: any[]) => void>
    })

    const registry = (command: Command) => {
        state.commands[command.name] = (...args) => {
            const {undo, redo} = command.execute(...args)
            if(command.follwQueue !== false) {
                state.queue.push({undo, redo})
                state.current += 1
            }
            redo()
        }
    }

    registry({
        name: 'undo', // 撤回
        keybroad: 'ctrl+z',
        follwQueue: false,
        execute: () => {
          return {
            redo: () => {
                const { current } = state;
                if(current < 0) return
                const {undo} = state.queue[current];
                !!undo && undo()
                state.current = -1
            },
          }
        },
    })

    registry({
        name: 'redo', // 重做
        keybroad: ['ctrl+y', 'ctrl+shift+z '],
        follwQueue: false,
        execute: () => {
          return {
            redo: () => {
               const queueItem = state.queue[state.current + 1]
               if(!!queueItem) {
                   queueItem.redo()
                   state.current ++
               }
            },
          }
        },
    })

    return  {
        state, 
        registry,
    }
}