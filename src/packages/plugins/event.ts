type SimplyListener = () => void

export function createEvent() {
    let listeners: SimplyListener[] = []
    return {
        on: (cb: SimplyListener) => {
            listeners.push(cb)
            //console.log(listeners, 'listeners===>>');
        },
        off: (cb: SimplyListener) => {
            const index = listeners.indexOf(cb)
            if (index > -1) listeners.splice(index, 1)
        },
        emit: () => {
            listeners.forEach(item => item())
        },
    }
}