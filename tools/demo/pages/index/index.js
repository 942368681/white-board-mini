const boardData = require('../../mock/boardData');

Page({
    data: {
        boardData: {},
        // 输入类型 fountain-pen： 钢笔， rubber： 橡皮
        inputType: 'fountain-pen',
        // 颜色列表
        colorList: [
            '#000000', '#362c23', '#715e4f', '#643d5c', '#677e3a', '#953c38', '#314d59', '#a7b47f', '#c58d8e', '#658e9f', '#229daf', '#7d790e', '#ebd669', '#2a1706', '#623919', '#ba8559', '#a33a65', '#fcac7b', '#fbe8c5', '#414141', '#828282', '#aaaaaa', '#dbdbdb', '#f7f7f7', '#ffcc59', '#cbcc57', '#e2513c', '#69b4d3', '#c72267', '#8dae21', '#1a386a', '#1f76bb', '#2fb7f5', '#a070bc', '#fb9e3f', '#ffd778'
        ],
        // 当前颜色
        currColorIndex: 0,
        // 当前粗细
        lineWidth: 6,
        // 橡皮范围
        rubberRange: 20,
        // 多媒体可操控开关
        switchChecked: false
    },
    switchChange: function (ev) {
        const compInstance = this.selectComponent('.board-comp');
        if (ev.detail.value) {
            compInstance.changeHandleComps(true);
        } else {
            compInstance.changeHandleComps(false);
        }
    },
    onLoad: function () {
        const {
            inputType,
            colorList,
            currColorIndex,
            lineWidth,
            rubberRange
        } = this.data;

        const settings = {
            inputType,
            lineWidth,
            strokeStyle: colorList[currColorIndex]
        };
        const initData = {
            canvasSettings: settings,
            zIndexInfo: boardData,
            rubberRange
        };
        
        this.setData({
            boardData: initData
        });
    },
    changeInpsType: function (ev) {
        const inputType = ev.target.dataset.type;
        const {
            inputType: prevInpsType
        } = this.data;

        if (!inputType || inputType === prevInpsType) return;

        this.setData({
            inputType
        }, () => {
            const compInstance = this.selectComponent('.board-comp');
            this.setUpBoard(compInstance, {
                inputType
            });
        });
    },
    colorChange: function (ev) {
        const index = ev.currentTarget.dataset.index;
        const {
            currColorIndex,
            colorList
        } = this.data;

        if (currColorIndex === index) return;

        this.setData({
            currColorIndex: index
        }, () => {
            const compInstance = this.selectComponent('.board-comp');
            this.setUpBoard(compInstance, {
                strokeStyle: colorList[index]
            });
        });
    },
    lineWidthChange: function (ev) {
        const value = ev.detail.value;
        this.setData({
            lineWidth: value
        }, () => {
            const compInstance = this.selectComponent('.board-comp');
            this.setUpBoard(compInstance, {
                lineWidth: value
            });
        });
    },
    // 白板设置（输入类型，颜色，粗细...）
    setUpBoard: function (instance, settings) {
        instance.setSettings({
            ...settings
        });
    },
    // 获取白板数据
    getData: function () {
        const compInstance = this.selectComponent('.board-comp');
        const data = compInstance.getBoardData();
        console.log(data);
    },
})