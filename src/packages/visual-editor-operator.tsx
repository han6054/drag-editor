import { defineComponent, PropType, reactive } from 'vue';
import { VisualEditorBlockData, VisualEditorConfig } from './visual-editor.utils';
import { ElForm, ElFormItem, ElInputNumber, ElInput, ElColorPicker, ElSelect, ElOption } from 'element-plus';
import {VisualEditorProps, VisualEditorPropsType} from "./visual-editor-props";


export const VisualOperatorEditor = defineComponent({
    props: {
        block: {type:  Object as PropType<VisualEditorBlockData | null>},
        config: {type: Object as PropType<VisualEditorConfig>, require: true}
    },
    setup(props) {

        const state = reactive({
            editData: {} as any,
        })

        const renderEditor = (propName: string, propConfig: VisualEditorProps) => {
            return {
                [VisualEditorPropsType.input]: () => (<ElInput v-model={state.editData.props[propName]}/>),
                [VisualEditorPropsType.color]: () => (<ElColorPicker v-model={state.editData.props[propName]}/>),
                [VisualEditorPropsType.select]: () => (<ElSelect v-model={state.editData.props[propName]}>
                    {(() => {
                        return propConfig.options!.map(opt => (
                            <ElOption label={opt.label} value={opt.val}/>
                        ))
                    })()}
                </ElSelect>)
            }
        }

        return () => {

            let Content: JSX.Element | null = null;

            if(!props.block) {
                Content = <>
                    <ElFormItem label="容器宽度">
                        <ElInputNumber/>
                    </ElFormItem>
                    <ElFormItem label="容器高度">
                        <ElInputNumber/>
                    </ElFormItem>
                </>
            } else {
                const {componentKey} = props.block
                const component = props.config?.componentMap[componentKey]
                if(!!component && !!component.props) {
                    Object.entries(component.props).forEach(([propName, propConfig]) => {
                        return <ElFormItem label={propConfig.label} key={propName}>
                            {renderEditor(propName, propConfig)}
                        </ElFormItem>
                    })
                }
                Content = <>
                </>
            }

            return (
                <div class="visual-editor-operator">
                    <ElForm>
                        {/* {Content} */}
                    </ElForm>
                </div>
            )
        }
    }
})