Component({
    /**
     * 组件的属性列表
     */
    properties: {
        
    },
    /**
     * 组件的初始数据
     */
    data: {
        // 绘图开关
        isDrawing: false,
        // 当前最顶层画布节点实例
        activeCanvasNode: null,
        // 当前最顶层画布上下文
        context: null,
        // 当前最顶层画布轨迹数据
        points: [],
        // 当前次绘图轨迹数据
        curve: null,
        // 当前笔触的坐标（二次贝塞尔曲线路径坐标）
        coords: {
            old: {
                x: 0,
                y: 0
            },
            current: {
                x: 0,
                y: 0
            },
            oldMid: {
                x: 0,
                y: 0
            }
        },
        settings: {
            // 输入类型 'pencil'-画笔；'rubber'-橡皮檫
            brushState: 'pencil',
            //当前画笔颜色
            tinctCurr: '#039be5',
            //画笔尺寸
            tinctSize: 2
        }
    },
    ready: function () {
        wx.createSelectorQuery().in(this).select('#board-index-1').fields({
            node: true,
            size: true
        }).exec(res => {
            const {
                node,
                width,
                height
            } = res[0];
            this.data.context = node.getContext('2d');
            this.data.activeCanvasNode = node;
            const dpr = wx.getSystemInfoSync().pixelRatio;
            node.width = width * dpr;
            node.height = height * dpr;
            this.data.context.scale(dpr, dpr);
            node.requestAnimationFrame(this.drawing.bind(this));
        });
    },
    /**
     * 组件的方法列表
     */
    methods: {
        cloneCurrentCoords: function (obj) {
            var _obj = JSON.stringify(obj);
            var objClone = JSON.parse(_obj);
            return objClone;
        },
        getCoords: function (e) {
            let pos = e.touches[0];
            return {
                x: pos.x,
                y: pos.y
            }
        },
        getMidInputCoords: function (coords) {
            const {
                coords: dataCoords
            } = this.data;
            return {
                x: dataCoords.old.x + coords.x >> 1,
                y: dataCoords.old.y + coords.y >> 1
            };
        },
        touchstart: function (e) {
            let color, lineWidth;
            let {
                context,
                settings,
                settings: {
                    brushState
                },
                settings: {
                    tinctCurr
                },
                settings: {
                    tinctSize
                }
            } = this.data;

            if (brushState === 'pencil') {
                color = tinctCurr;
                lineWidth = tinctSize;
            } else {
                color = "#ffffff";
                lineWidth = 20;
            }

            const coords = this.getCoords(e);
            this.data.coords.current = coords;
            this.data.coords.old = coords;
            this.data.coords.oldMid = this.getMidInputCoords(coords);

            context.lineCap = 'round'; //设置线条端点的样式
            context.lineJoin = 'round'; //设置两线相交处的样式
            context.strokeStyle = color; //设置描边颜色
            context.lineWidth = lineWidth; //设置线条宽度

            this.data.curve = {
                settings,
                point: []
            };

            this.data.isDrawing = true;
        },
        touchMove: function (e) {
            const coords = this.getCoords(e);
            this.data.coords.current = coords;
        },
        touchEnd: function () {
            this.data.isDrawing = false;
            this.data.points.push(this.data.curve);
            this.data.curve = null;
            console.log(this.data.points)
        },
        drawing: function () {
            let {
                isDrawing,
                activeCanvasNode,
            } = this.data;

            if (isDrawing) {
                let {
                    context,
                    coords
                } = this.data;

                const currentMid = this.getMidInputCoords(coords.current);

                context.moveTo(currentMid.x, currentMid.y);
                context.quadraticCurveTo(coords.old.x, coords.old.y, coords.oldMid.x, coords.oldMid.y);
                context.stroke();

                const currentCoords = this.cloneCurrentCoords(coords);

                this.data.curve.point.push({
                    currentMidX: currentMid.x,
                    currentMidY: currentMid.y,
                    oldX: currentCoords.old.x,
                    oldY: currentCoords.old.y,
                    oldMidX: currentCoords.oldMid.x,
                    oldMidY: currentCoords.oldMid.y
                });

                this.data.coords.old = coords.current;
                this.data.coords.oldMid = currentMid;
            }
            activeCanvasNode.requestAnimationFrame(this.drawing.bind(this));
        }
    }
})
