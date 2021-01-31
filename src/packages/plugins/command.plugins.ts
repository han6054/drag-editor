import {reactive,onUnmounted} from 'vue'
import {KeyboardCode} from "@/packages/plugins/keyboard-code";

export interface CommandCexecute {
    undo?: () => void,
    redo: () => void,
}

export interface Command {
    name: string,
    keyboard?: string | string[],
    execute: (...args: any[]) => CommandCexecute, 
    follwQueue?: boolean, // 是否放到任务队列
    init?: () => ((() => void) | undefined), // 命令初始化函数
    followQueue?: boolean,   // 命令执行完之后，是否需要将命令执行得到的undo，redo存入命令队列
    data?: any,    // 命令缓存所需要的数据
}

export interface CommandManager {
    queue: CommandCexecute[],
}

export function useCommander () {

    const state = reactive({
        current : -1,
        queue: [] as CommandCexecute[],
        commands: {} as Record<string, (...args: any[]) => void>,
        commandArray: [] as Command[],                              // 命令对象数组
        destroyList: [] as ((() => void) | undefined)[],            // 组件销毁的时候，需要调用的销毁逻辑数组
    })

    const registry = (command: Command) => {
        state.commandArray.push(command)
        state.commands[command.name] = (...args) => {
            const {undo, redo} = command.execute(...args)
            redo()
            /*如果命令执行之后，不需要进入命令队列，则直接结束*/
            if (command.followQueue === false) {
                return
            }
            /*否则，将命令队列中剩余的命令去除，保留current及其之前的命令*/
            let {queue, current} = state
            if (queue.length > 0) {
                queue = queue.slice(0, current + 1)
                state.queue = queue
            }
            /*设置命令队列中最后一个命令为当前执行的命令*/
            queue.push({undo, redo})
            /*索引+1，指向队列中的最后一个命令*/
            state.current = current + 1;
        }
    }

    const keyboardEvent = (() => {
        const onkeydown = (e: KeyboardEvent) => {
            if (document.activeElement !== document.body) {
                return;
            }
            const {keyCode, shiftKey, altKey, ctrlKey, metaKey} = e
            let keyString: string[] = []
            if (ctrlKey || metaKey) keyString.push('ctrl')
            if (shiftKey) keyString.push('shift')
            if (altKey) keyString.push('alt')
            keyString.push(KeyboardCode[keyCode])
            const keyNames = keyString.join('+')
            //console.log(keyNames)
            state.commandArray.forEach(({keyboard, name}) => {
                if (!keyboard) {
                    return
                }
                const keys = Array.isArray(keyboard) ? keyboard : [keyboard]
                if (keys.indexOf(keyNames) > -1) {
                    state.commands[name]()
                    e.stopPropagation()
                    e.preventDefault()
                }
            })
        }
        const init = () => {
            window.addEventListener('keydown', onkeydown)
            return () => window.removeEventListener('keydown', onkeydown)
        }
        return init
    })();

    /**
     * useCommander初始化函数，负责初始化键盘监听事件，调用命令的初始化逻辑
     */
    const init = () => {
        const onKeydown = (e: KeyboardEvent) => {
            // console.log('监听到键盘时间')
        }
        window.addEventListener('keydown', onKeydown)
        state.commandArray.forEach(command => !!command.init && state.destroyList.push(command.init()))
        state.destroyList.push(keyboardEvent())
        state.destroyList.push(() => window.removeEventListener('keydown', onKeydown))
    }

    registry({
        name: 'undo', // 撤回
        keyboard: 'ctrl+z',
        follwQueue: false,
        execute: () => {
          return {
            redo: () => {
                const { current } = state;
                if(current < 0) return
                const {undo} = state.queue[current];
                !!undo && undo()
                state.current --
            },
          }
        },
    })

    registry({
        name: 'redo', // 重做
        keyboard: ['ctrl+y', 'ctrl+shift+z '],
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

    onUnmounted(() => state.destroyList.forEach(fn => !!fn && fn()))

    return  {
        state, 
        registry,
        init,
    }
}