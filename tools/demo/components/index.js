Component({
    /**
     * 组件的属性列表
     */
    properties: {
        initData: {
            type: Object,
            value: {}
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        dpr: '',
        // dom
        domShow: {
            canvas1: false,
            canvas2: false,
            canvas3: false
        },
        // 绘图开关
        isDrawing: false,
        // 当前最顶层画布节点实例
        activeCanvasNode: null,
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
        // 画板设置
        settings: null,
        // 最顶层层级，目前支持三层(1, 2, 3)
        zIndexMax: 1
    },
    ready: function () {
        const {
            zIndexInfo
        } = this.properties.initData;
        this.setDpr();
        this.setMaxIndex(zIndexInfo);
        this.setBoardData(zIndexInfo);
        this.initBoard(zIndexInfo, 0);
    },
    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 
         * @param {*} zIndexInfo  此时是按层级由低到高( 1， 2， 3 ...)序列化好的zIndexInfo
         * @param {*} index 索引
         */
        initBoard: function (zIndexInfo, index) {
            const attr = 'domShow.canvas' + (index + 1);
            this.setData({
                [attr]: true
            }, () => {
                wx.createSelectorQuery().in(this).select('#board-index-' + (index + 1)).fields({
                    node: true,
                    size: true
                }).exec(res => {
                    const {
                        dpr
                    } = this.data;
                    const {
                        settings,
                    } = this.properties.initData;
                    const {
                        node,
                        width,
                        height
                    } = res[0];
                    const zIndex = zIndexInfo[index].zIndex;
    
                    node.width = width * dpr;
                    node.height = height * dpr;
                    this.data['context' + zIndex] = node.getContext('2d');
                    this.data['context' + zIndex].scale(dpr, dpr);
    
                    this.dataEcho(settings, zIndexInfo[index], zIndex);
                    if (index === zIndexInfo.length - 1) { // 当前最顶层(操作层)
                        this.data.activeCanvasNode = node;
                        node.requestAnimationFrame(this.drawing.bind(this));
                    } else {
                        this.initBoard(zIndexInfo, (index + 1));
                    }
                });
            });
        },
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
            let {
                settings,
            } = this.data;

            const coords = this.getCoords(e);
            this.data.coords.current = coords;
            this.data.coords.old = coords;
            this.data.coords.oldMid = this.getMidInputCoords(coords);

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
            const {
                points
            } = this.data;
            this.data.isDrawing = false;
            points[points.length - 1].content.push(this.data.curve);
            this.data.curve = null;
            // console.log(JSON.stringify(this.data.points));
            // console.log(JSON.stringify(points[points.length - 1].content));
        },
        drawing: function () {
            let {
                isDrawing,
                activeCanvasNode,
            } = this.data;

            if (isDrawing) {
                let {
                    coords,
                    zIndexMax
                } = this.data;
                const ctx = this.data['context' + zIndexMax];

                const currentMid = this.getMidInputCoords(coords.current);

                ctx.beginPath();
                ctx.moveTo(currentMid.x, currentMid.y);
                ctx.quadraticCurveTo(coords.old.x, coords.old.y, coords.oldMid.x, coords.oldMid.y);
                ctx.stroke();

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
        },
        // 设置dpr
        setDpr: function () {
            this.data.dpr = wx.getSystemInfoSync().pixelRatio;
        },
        // 设置当前层数据
        setBoardData: function (zIndexInfo) {
            this.data.points = zIndexInfo;
        },
        // 设置最高层级
        setMaxIndex: function (zIndexInfo) {
            this.data.zIndexMax = zIndexInfo.sort((prev, next) => prev.zIndex - next.zIndex)[zIndexInfo.length - 1].zIndex;
        },
        // 设置
        setSettings: function (settings, zIndex) {
            this.data.settings = settings;
            
            let color, lineWidth;
            const {
                settings: {
                    brushState
                },
                settings: {
                    tinctCurr
                },
                settings: {
                    tinctSize
                },
                settings: {
                    rubberRange
                }
            } = this.data;
            const ctx = this.data['context' + zIndex];

            if (brushState === 'pencil') {
                color = tinctCurr;
                lineWidth = tinctSize;
            } else {
                color = "#ffffff";
                lineWidth = rubberRange;
            }
            ctx.lineCap = 'round'; //设置线条端点的样式
            ctx.lineJoin = 'round'; //设置两线相交处的样式
            ctx.strokeStyle = color; //设置描边颜色
            ctx.lineWidth = lineWidth; //设置线条宽度
        },
        // 数据回显
        dataEcho: function (originalSettings, info, zIndex) {

            const len = info.content.length;
            if (len) {
                const ctx = this.data['context' + zIndex];
                for (let j = 0; j < len; j++) {
                    const item = info.content[j];
                    const point = item.point;
                    const l = point.length;

                    if (!l) continue;
    
                    this.setSettings(item.settings, zIndex);
    
                    ctx.beginPath();
                    for (let k = 0; k < l; k++) {
                        const currentMidX = point[k].currentMidX;
                        const currentMidY = point[k].currentMidY;
                        const oldX = point[k].oldX;
                        const oldY = point[k].oldY;
                        const oldMidX = point[k].oldMidX;
                        const oldMidY = point[k].oldMidY;
                        ctx.moveTo(currentMidX, currentMidY);
                        ctx.quadraticCurveTo(oldX, oldY, oldMidX, oldMidY);
                    }
                    ctx.stroke();
                }
            }

            this.setSettings(originalSettings, zIndex);
        }
    }
})