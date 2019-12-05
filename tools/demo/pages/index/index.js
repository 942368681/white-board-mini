const boardData = require('../../mock/boardData');

Page({
    data: {
        boardData: {}
    },
    onLoad: function () {
        this.setData({
            boardData
        });
    }
})
