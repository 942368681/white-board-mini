const Utils = {
    timer: null,
    /**
     * 防抖函数
     * @param fn 事件触发的操作
     * @param delay 多少毫秒内连续触发事件，不会执行
     * @returns {Function}
     */
    debounce: (fn, delay) => {
        return () => {
            Utils.timer && clearTimeout(Utils.timer);
            Utils.timer = setTimeout(() => {
                fn();
            }, delay);
        }
    }
};

module.exports = Utils;