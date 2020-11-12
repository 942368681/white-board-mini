const boardData = require('../../mock/boardData');
const boardData2 = require('../../mock/boardData2');

Page({
    data: {
        disableBoard: false,
        scrollTop: 0,
        viewRect: {
            width: '80%',
            height: '900rpx'
            // width: '66%',
            // height: '1200rpx'
        },
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
            strokeStyle: colorList[currColorIndex],
            lineCap: 'round'
        };
        const initData = {
            disabled: false,
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
            // const compInstance = this.selectComponent('.board-comp');
            const compInstance1 = this.selectComponent('.board-comp-1');
            const compInstance2 = this.selectComponent('.board-comp-2');
            this.setUpBoard(compInstance1, {
                inputType
            });
            this.setUpBoard(compInstance2, {
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
            // const compInstance = this.selectComponent('.board-comp');
            const compInstance1 = this.selectComponent('.board-comp-1');
            const compInstance2 = this.selectComponent('.board-comp-2');
            this.setUpBoard(compInstance1, {
                strokeStyle: colorList[index]
            });
            this.setUpBoard(compInstance2, {
                strokeStyle: colorList[index]
            });
        });
    },
    lineWidthChange: function (ev) {
        const value = ev.detail.value;
        this.setData({
            lineWidth: value
        }, () => {
            // const compInstance = this.selectComponent('.board-comp');
            const compInstance1 = this.selectComponent('.board-comp-1');
            const compInstance2 = this.selectComponent('.board-comp-2');
            this.setUpBoard(compInstance1, {
                lineWidth: value
            });
            this.setUpBoard(compInstance2, {
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
        // const compInstance = this.selectComponent('.board-comp');
        const compInstance1 = this.selectComponent('.board-comp-1');
        const compInstance2 = this.selectComponent('.board-comp-2');
        const data1 = compInstance1.getBoardData();
        const data2 = compInstance2.getBoardData();
        console.log(data1, data2);
    },
    // 重置数据
    reload: function () {
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
            strokeStyle: colorList[currColorIndex],
            lineCap: 'round'
        };
        const initData = {
            disabled: false,
            canvasSettings: settings,
            zIndexInfo: boardData,
            rubberRange
        };
        
        this.setData({
            boardData: initData
        });
    },
    // 改变高度
    change: function () {
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
            strokeStyle: colorList[currColorIndex],
            lineCap: 'round'
        };
        const initData = {
            disabled: false,
            canvasSettings: settings,
            zIndexInfo: boardData,
            rubberRange
        };
        this.setData({
            boardData: initData,
            viewRect: {
                width: '66%',
                height: '1200rpx'
            }
        });
    },
    viewScroll: function(event) {
        this.setData({
            scrollTop: event.detail.scrollTop
        });
    },
    disableBoardChange: function (ev) {
        this.setData({
            disableBoard: ev.detail.value
        });
        const compInstance1 = this.selectComponent('.board-comp-1');
        const compInstance2 = this.selectComponent('.board-comp-2');
        compInstance1.disable(ev.detail.value);
        compInstance2.disable(ev.detail.value);
    },
})