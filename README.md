# white-board-mini
小程序canvas画写板组件。

## 下载

使用npm:

```bash
$ npm install -S white-board-mini
```

## 演示
![img](https://github.com/942368681/white-board-mini/blob/master/assets/draw.gif)

## 使用

[小程序使用npm第三方组件请参阅官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)

```bash
// index.wxml

<board init-data="{{ boardData }}" class="board-comp" />
```

```bash
// boardData结构

boardData = {
    disabled: false,
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
        "content": [{"p":[4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096,4096],"x":[57,61,70,86,109,144,198,259,329,390,452,493,519,535,547,559,571,583,593,603,610,614,614,614,614,614,614,614],"y":[65,65,70,81,96,117,144,173,206,238,271,294,308,317,324,330,333,337,339,342,343,344,345,345,345,345,345,345],"canvasSettings":{"strokeStyle":"#E95E57","lineWidth":2,"lineCap":"round","inputType":"fountain-pen"}},{"p":[4096,4096,4096,4096,4096,4096,4096,4096,4096,4096],"x":[164,163,163,173,209,258,327,380,411,418],"y":[383,381,381,399,448,505,569,610,628,629],"canvasSettings":{"strokeStyle":"#E95E57","lineWidth":2,"lineCap":"round","inputType":"fountain-pen"}},{"p":[4096,4096,4096,4096,4096,4096,4096,4096,4096],"x":[332,327,314,289,259,232,212,205,205],"y":[393,398,430,490,551,604,640,653,653],"canvasSettings":{"strokeStyle":"#E95E57","lineWidth":2,"lineCap":"round","inputType":"fountain-pen"}},{"p":[4096,4096,4096,4096,4096,4096,4096,4096,4096],"x":[349,361,389,441,507,554,585,592,591],"y":[371,386,427,497,563,602,623,626,618],"canvasSettings":{"strokeStyle":"#E95E57","lineWidth":2,"lineCap":"round","inputType":"fountain-pen"}},{"p":[4096,4096,4096,4096,4096,4096,4096],"x":[494,486,464,428,386,356,338],"y":[442,448,482,528,575,613,637],"canvasSettings":{"strokeStyle":"#E95E57","lineWidth":2,"lineCap":"round","inputType":"fountain-pen"}},{"p":[4096,4096,4096,4096,4096,4096,4096,4096],"x":[494,494,489,460,391,299,211,154],"y":[87,87,88,106,146,200,252,287],"canvasSettings":{"strokeStyle":"#E95E57","lineWidth":2,"lineCap":"round","inputType":"fountain-pen"}}],
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


