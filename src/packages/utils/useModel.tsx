import {ref, watch, defineComponent } from 'vue';

export function useModel<T>(getter: () => T, emitter: (val: T) => void) {
    const state = ref(getter()) as { value: T }

    /**
     * @param {Function} 数据源也可以是返回值的getter函数，也可以是ref
     * @param {Function} 回调函数，回调是仅在侦听源发生更改时调用。
     */
    watch(getter, val => { 
        if (val !== state.value) {
            state.value = val
        }
    })

    return {
        get value() { return state.value},
        set value(val: T) {
            if (state.value !== val) {
                state.value = val
                emitter(val)
            }
        },
    }
}

export const TestUseModel = defineComponent({
    props: {
        modelValue: {type: String},
    },
    emit: {
        'update:modelValue': (val: string) => true, 
    },
    setup(props, ctx) {
        const model = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val))
        return () => (
            <div>
                自定义的输入框
                <input type="text" v-model={model.value}/>
            </div>
        )
    }
})
