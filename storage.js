export const init = () => {
    const { screenX, screenY } = window; // 获取浏览器相对屏幕坐标
    const wins = getAll();
    const keys = wins.map(item => item.key);
    const key = keys.length == 0 ? 1 : keys.at(-1) + 1; // 自增最大的key序号，定义自己窗口storage key
    wins.push({ key, screenX, screenY });
    localStorage.setItem('demo', JSON.stringify(wins));
    return key;
}

export const getAll = () => {
    const value = localStorage.getItem('demo') || JSON.stringify([]);
    const wins = JSON.parse(value).sort((a, b) => a.key - b.key);
    return wins;
}
export const get = (key) => {
    const wins = getAll();
    return wins.find(item => item.key == key);
}
export const set = (key, value) => {
    let wins = getAll();
    wins = wins.map(item => {
        if (item.key == key) {
            return value;
        }
        return item;
    })
    localStorage.setItem('demo', JSON.stringify(wins));
    return wins;
}

export const remove = (key) => {
    let wins = getAll();
    wins = wins.filter(item => item.key != key);
    localStorage.setItem('demo', JSON.stringify(wins));
}

export const clear = () => {
    localStorage.clear();
}