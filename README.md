# white-board-mini
小程序canvas画写板组件。

## 下载

使用npm:

```bash
$ npm install -S white-board-mini
```

## 使用

[小程序使用npm第三方组件请参阅官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)

```bash
// index.wxml

<board init-data="{{ boardData }}" class="board-comp" />
```

```bash
// boardData结构

boardData = {
    canvasSettings: {
        inputType: 'fountain-pen',
        lineWidth: 2,
        strokeStyle: '#039be5'
    },
    zIndexInfo: [{
        "update": true,
        "inputType": "fountain-pen",
        "color": "#9100FF",
        "page": 1,
        "size": 6,
        "zIndex": 1,
        "content": [],
        "other": {
            "img": [],
            "audio": [],
            "video": [],
            "N2": []
        }
    }, {
        "update": true,
        "inputType": "fountain-pen",
        "color": "#9100FF",
        "page": 1,
        "size": 6,
        "zIndex": 2,
        "content": [],
        "other": {
            "img": [],
            "audio": [],
            "video": [],
            "N2": []
        }
    }, {
        "update": true,
        "inputType": "fountain-pen",
        "color": "#9100FF",
        "page": 1,
        "size": 6,
        "zIndex": 3,
        "content": [{"canvasSettings":{"inputType":"fountain-pen","lineWidth":6,"strokeStyle":"#000000"},"path":[{"x":0.2010756746555954,"y":0.5423387096774194,"pressure":1},{"x":0.2161728628043027,"y":0.5705645161290323,"pressure":1},{"x":0.24334780147197585,"y":0.6129032258064516,"pressure":1},{"x":0.270522740139649,"y":0.6471774193548387,"pressure":1},{"x":0.3127948669560294,"y":0.6814516129032258,"pressure":1},{"x":0.3701641819211172,"y":0.6895161290322581,"pressure":1},{"x":0.4698056237025854,"y":0.6592741935483871,"pressure":1},{"x":0.6086997546706926,"y":0.5907258064516129,"pressure":1},{"x":0.7445744480090584,"y":0.5,"pressure":1},{"x":0.8230798263823363,"y":0.42338709677419356,"pressure":1},{"x":0.8562936403094924,"y":0.3689516129032258,"pressure":1}],"rectArea":[0.1406869220607662,0.9166823929043216,0.3286290322580645,0.7298387096774194]}],
        "other": {
            "img": [],
            "audio": [],
            "video": [],
            "N2": []
        },
        "containerRect": {
            "width": 635,
            "height": 760
        }
    }],
    rubberRange: 20
};
```

## API

#### 设置
```bash
const compInstance = this.selectComponent('.board-comp');

const newSettings = {
    inputType: 'rubber',
    lineWidth: 6,
    strokeStyle: '#000000'
};

instance.setSettings({
    ...newSettings
});
```

#### 保存
```bash
const compInstance = this.selectComponent('.board-comp');

const data = compInstance.getBoardData();
console.log(data);
```

#### 禁用/取消禁用
```bash
const compInstance = this.selectComponent('.board-comp');

// boolean: true - 禁用  false - 启用
instance.disable(boolean);
```


