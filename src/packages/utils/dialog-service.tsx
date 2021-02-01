import {defer} from "@/packages/utils/defer";
import { defineComponent, PropType, reactive } from 'vue';
import {ElInput, ElDialog, ElButton} from 'element-plus'

enum DialogServiceEditType {
    textarea='textarea',
    input="input"
}

interface DialogServiceOption {
    editType: DialogServiceEditType,
    editReadonly?: boolean,
    editValue?: string | null,
    onConfrim: (val?: string| null) => void
}

const ServiceComponent = defineComponent({
    props: {
        option: {type: Object as PropType<DialogServiceOption>, require: true}
    },
    setup(props) {

        const state = reactive({
            option: props.option,
            showFlag: false,
        })

        return () => {
              // @ts-ignore
              <ElDialog v-model={state.showFlag} title={state.option.title} key={state.key}>
              {{
                  default: () => (<div>
                      {state.option?.editType === DialogServiceEditType.textarea ? (
                          <ElInput type="textarea" {...{rows: 10}} v-model={state.showFlag}/>
                      ) : (
                        <ElInput v-model={state.option?.editValue}/>
                      )}
                  </div>),
                  footer: () => (<div>
                      {/* <ElButton {...{onClick: handler.onCancel} as any}>取消</ElButton>
                      <ElButton {...{onClick: handler.onConfirm} as any}>确定</ElButton> */}
                  </div>)
              }}
          </ElDialog>
        }
    }
})

const DialogService = (option: DialogServiceOption) => {

}

export const $$dialog = Object.assign(DialogService, {
    input: (initValue?: string, option?: DialogServiceOption) => {
        const dfd = defer<string | null | undefined>()
        const opt: DialogServiceOption = option || {editType: DialogServiceEditType.input, onConfrim: dfd.resolve}
        DialogService(opt)
        return dfd.promise
    }
})
