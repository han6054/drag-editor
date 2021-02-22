import { defineComponent, PropType } from "vue";

interface DropDownServiceOption {
    reference:  MouseEvent | HTMLElement,
    content: () =>  JSX.Element,
}

const ServiceComponent = defineComponent({
    props: {option: {type: Object as PropType<DropDownServiceOption>, required: true}}
})

const $$dropdown = (() =>  {
    let ins: any
    return (option: DropDownServiceOption) => {
        if(!ins) {
             
        }
    }
})();