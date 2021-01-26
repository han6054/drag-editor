export interface VisualEditorBlockData {
    componentKey: string,                           // 映射 VisualEditorConfig 中 componentMap 的 component对象
    top: number,                                    // 组件的top定位
    left: number,                                   // 组件的left定位
    adjustPosition: boolean,                        // 是否需要调整位置
    focus: boolean,                                 // 当前是否为选中状态
    zIndex: number,                                 // z-index值
    width: number,                                  // 组件宽度
    height: number,                                 // 组件高度
    hasResize: boolean,                             // 是否调整过宽度或者高度
    props: Record<string, any>,                     // 组件的设计属性
    model: Record<string, string>,                  // 绑定的字段
    slotName?: string,                              // 组件唯一标识
}

export interface VisualEditorModelValue {
    container: {
        width: number,
        height: number,
    },
    blocks?: VisualEditorBlockData[],
}

export interface VisualEditorComponent {
    name: string,
    preview: () => JSX.Element,
    render: () => JSX.Element,
}

export function createVisualEditorConfig() {
 
    const componentList: VisualEditorComponent[] = []
    const componentMap: Record<string, VisualEditorComponent> = {}

    return {
        registry: (name: string, component: Omit<VisualEditorComponent, 'name'>) => {
            let comp = {...component, name}
            componentList.push(comp)
            componentMap[name] = comp
        } 
    }
}

export type VisualEditorConfig = ReturnType<typeof createVisualEditorConfig>

const Config = createVisualEditorConfig()
Config.registry('input', {
    preview: () => '输入框',
    render: () => ''
})