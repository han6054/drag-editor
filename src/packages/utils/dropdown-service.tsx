import { defineComponent, PropType, reactive, computed, getCurrentInstance, createApp, onMounted, onBeforeUnmount,ref } from "vue";
import './dropdown-service.scss'

interface DropDownServiceOption {
    reference:  MouseEvent | HTMLElement,
    content: () =>  JSX.Element,
}

const ServiceComponent = defineComponent({
    props: {option: {type: Object as PropType<DropDownServiceOption>, required: true}},
    setup(props) {
        const ctx = getCurrentInstance()!
        const el = ref({} as HTMLDivElement)

        const state = reactive({
            option: props.option,
            showFlag: false,
            top: 0,
            left: 0,
        })

        const service = (option: DropDownServiceOption) => {
            state.option = option
            state.showFlag = true

            if('addEventListener' in option.reference) {
                const {top, left, height} = option.reference.getBoundingClientRect()!
                state.top = top + height
                state.left = left
            } else {
                const {clientX, clientY} = option.reference
                state.left = clientX
                state.top = clientY 
            }

        }

        const classes = computed(() => [
            'dropdown-service',
            {
                'dropdown-service-show': state.showFlag
            }
        ])

        const styles = computed(() => ({
            top: `${state.top}px`,
            left: `${state.left}px`
        }))

        Object.assign(ctx.proxy, {service})

        const onMousedownDocument = (e: MouseEvent) => {
            if (!(el.value).contains(e.target as HTMLElement)) {
                state.showFlag = false
            }
        }

        onMounted(() => window.addEventListener('mousedown', onMousedownDocument, true))
        onBeforeUnmount(() => window.removeEventListener('mousedown', onMousedownDocument, true))

        return () => (
            <div class={classes.value} style={styles.value} ref={el}>
                {state.option.content()}
            </div>
        )
    }
})

export const DropDownOption = defineComponent({
    props: {
        label: {type: String},
        icon: {type: String}
    },
    setup(props) {

        return () => (
            <div class="dropdown-option">
                <i class={`iconfont ${props.icon}`}/>
                <span>{props.label}</span>
            </div>
        )
    }
})

export const $$dropdown = (() =>  {
    let ins: any
    return (option: DropDownServiceOption) => {
        if(!ins) {
            const el = document.createElement('div')
            document.body.appendChild(el)
            const app = createApp(ServiceComponent, {option})
            ins = app.mount(el)
        }
        ins.service(option)
    }
})();