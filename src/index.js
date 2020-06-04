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
        // 容器实例
        containerIns: null,
        dpr: '',
        // dom
        domShow: {
            canvas1: false,
            canvas2: false,
            canvas3: false
        },
        // 多媒体组件可操作（false层级:1, true层级最高）
        handleComps: false,
        // 当前是否为擦除功能
        rubberActive: false,
        // 绘图开关
        isDrawing: false,
        // 当前最顶层画布节点实例
        activeCanvasNode: null,
        // 多层数据（传入的 zIndexInfo）
        multiBoardData: [],
        // 当前次绘图轨迹数据
        curve: null,
        // 当前笔触的坐标
        coords: {},
        // 画板设置
        canvasSettings: null,
        // 最顶层层级，目前支持三层(1, 2, 3)
        zIndexMax: 1,
        // 上一个点的压感值
        prevPressure: null,
        // 起始点
        beginPoint: null,
        // 橡皮偏移量
        rubberRange: 0
    },
    ready: function () {
        const {
            zIndexInfo,
            rubberRange
        } = this.properties.initData;
        this.setBaseInfo({rubberRange});
        this.setContainerIns();
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
         * 设置基础设置信息
         * @param {rubberRange} params 
         */
        setBaseInfo: function (params) {
            const {
                rubberRange
            } = params;
            this.data.rubberRange = rubberRange;
        },
        /**
         * 初始化白板
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
                        canvasSettings,
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
                    zIndexInfo[index].containerRect = {
                        width,
                        height
                    };
                    this.dataEcho(canvasSettings, zIndexInfo[index], zIndex, false);
                    if (index === zIndexInfo.length - 1) { // 当前最顶层(操作层)
                        this.data.activeCanvasNode = node;
                        node.requestAnimationFrame(this.drawing.bind(this));
                    } else {
                        this.initBoard(zIndexInfo, (index + 1));
                    }
                });
            });
        },
        getCoords: function (e) {
            let pos = e.touches[0];
            return {
                x: pos.x,
                y: pos.y,
                pressure: 1
            }
        },
        // 判断区域内部的轨迹
        checkInnerWriting: function (rect1) {
            const {
                multiBoardData,
                canvasSettings,
                zIndexMax,
                containerIns
            } = this.data;
            const content = multiBoardData[multiBoardData.length - 1].content;
            const len = content.length;

            if (!len) return;

            for (let i = 0; i < len; i++) {
                const con = content[i];
                if (!con) break;

                const xMin = (con.rectArea[0] * containerIns.width).toFixed(0);
                const xMax = (con.rectArea[1] * containerIns.width).toFixed(0);
                const yMin = (con.rectArea[2] * containerIns.height).toFixed(0);
                const yMax = (con.rectArea[3] * containerIns.height).toFixed(0);

                const rect2 = {
                    startX: xMin,
                    startY: yMin,
                    width: xMax - xMin,
                    height: yMax - yMin
                }
                const bool = this.isOverlap(rect1, rect2);

                if (bool) {
                    if (this.shouldDelete(con, rect1)) {
                        content.splice(i, 1);
                        i = i - 1;
                    }
                }
            }
            this.dataEcho(canvasSettings, multiBoardData[multiBoardData.length - 1], zIndexMax, true);
        },
        /**
         * 判断是否这个轨迹得某个点在矩形范围内
         * @param {canvasSettings, path, rectArea} oContent 
         * @param {startX, startY, width, height} rect 
         */
        shouldDelete: function (oContent, rect) {
            const {
                containerIns
            } = this.data;
            const rectArea = [
                rect.startX,
                rect.startX + rect.width,
                rect.startY,
                rect.startY + rect.height
            ];
            const pathArr = oContent.path;
            for (let i = 0, len = pathArr.length; i < len; i++) {
                const oPoint = pathArr[i];
                const coords = {
                    x: oPoint.x * containerIns.width,
                    y: oPoint.y * containerIns.height
                };
                if (this.isFitPath(coords, rectArea)) {
                    return true;
                }
            }
            return false;
        },
        /**
         * 检测点在矩形区域内
         * @param {x, y} coords 
         * @param {xMin, xMax, yMin, yMax} rectArea 
         */
        isFitPath: function (coords, rectArea) {
            if (coords.x <= rectArea[0]) {
                return false;
            }
            if (coords.y >= rectArea[3]) {
                return false;
            }
            if (coords.x >= rectArea[1]) {
                return false;
            }
            if (coords.y <= rectArea[2]) {
                return false;
            }
    
            return true;
        },
        /**
         * 判断两个矩形是否有重叠
         * @param {startX, startY, width, height} rect1 
         * @param {startX, startY, width, height} rect2 
         */
        isOverlap: function (rect1, rect2) {
            const l1 = { x: rect1.startX, y: rect1.startY };
            const r1 = { x: rect1.startX + rect1.width, y: rect1.startY + rect1.height };
            const l2 = { x: rect2.startX, y: rect2.startY };
            const r2 = { x: rect2.startX + rect2.width, y: rect2.startY + rect2.height };

            if (
              l1.x > r2.x ||
              l2.x > r1.x ||
              l1.y > r2.y ||
              l2.y > r1.y
            ) {
                return false
            } else {
                return true;
            };
        },
        rubberEnd: function ({startX, startY, width, height}) {
            this.checkInnerWriting({startX, startY, width, height});
        },
        touchstart: function (e) {
            let {
                rubberActive,
                canvasSettings
            } = this.data;

            if (e.touches && e.touches.length > 1) {
                this.data.isDrawing = false;
                return;
            };

            if (rubberActive) return;

            this.data.coords = this.getCoords(e);
            this.data.curve = {
                canvasSettings,
                path: [],
                rectArea: []
            };

            this.data.isDrawing = true;
        },
        touchMove: function (e) {
            let {
                rubberActive
            } = this.data;

            if (e.touches && e.touches.length > 1) {
                this.data.isDrawing = false;
                return;
            };

            if (rubberActive) return;

            this.data.coords = this.getCoords(e);
        },
        touchEnd: function () {
            const {
                rubberActive,
                multiBoardData,
                curve,
                rubberRange
            } = this.data;

            if (rubberActive) return;

            this.data.isDrawing = false;
            this.data.curve.rectArea = this.getRectArea(curve.path, rubberRange);
            multiBoardData[multiBoardData.length - 1].content.push(curve);
            this.data.curve = null;
            console.log(JSON.stringify(multiBoardData));
            // console.log(JSON.stringify(multiBoardData[multiBoardData.length - 1]));
        },
        getRectArea: function (pathArr, rubberRange) {
            const {
                containerIns
            } = this.data;
            const disX = rubberRange / containerIns.width;
            const disY = rubberRange / containerIns.height;
            const init = {xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity};
            const obj = pathArr.reduce(function (prev, cur) {
                prev.xMin = Math.min.apply(null, [prev.xMin, cur.x]);
                prev.xMax = Math.max.apply(null, [prev.xMax, cur.x]);
                prev.yMin = Math.min.apply(null, [prev.yMin, cur.y]);
                prev.yMax = Math.max.apply(null, [prev.yMax, cur.y]);
                return prev;
            }, init);
            return [
                obj.xMin - disX <= 0 ? 0 : obj.xMin - disX,
                obj.xMax + disX >= containerIns.width ? containerIns.width : obj.xMax + disX,
                obj.yMin - disY <= 0 ? 0 : obj.yMin - disY,
                obj.yMax + disY >= containerIns.height ? containerIns.height : obj.yMax + disY
            ];
        },
        drawing: function () {
            let {
                isDrawing,
                activeCanvasNode,
            } = this.data;

            if (isDrawing) {
                let {
                    coords,
                    zIndexMax,
                    prevPressure,
                    containerIns
                } = this.data;

                const ctx = this.data['context' + zIndexMax];

                this.data.curve.path.push({
                    x: coords.x / containerIns.width,
                    y: coords.y / containerIns.height,
                    pressure: coords.pressure
                });

                if (this.data.curve.path.length > 3) {
                    const lastTwoPoints = this.data.curve.path.slice(-2);
                    const controlPoint = {
                        x: lastTwoPoints[0].x * containerIns.width,
                        y: lastTwoPoints[0].y * containerIns.height
                    }
                    const endPoint = {
                        x: (lastTwoPoints[0].x * containerIns.width + lastTwoPoints[1].x * containerIns.width) / 2,
                        y: (lastTwoPoints[0].y * containerIns.height + lastTwoPoints[1].y * containerIns.height) / 2
                    }

                    if (!prevPressure || prevPressure !== coords.pressure) {
                        this.data.prevPressure = coords.pressure;
                        this.setPointSize(coords.pressure);
                    }

                    ctx.beginPath();
                    ctx.moveTo(this.data.beginPoint.x, this.data.beginPoint.y);
                    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
                    ctx.stroke();

                    this.data.beginPoint = endPoint;
                } else {
                    this.data.beginPoint = {
                        x: this.data.curve.path[0].x * containerIns.width,
                        y: this.data.curve.path[0].y * containerIns.height
                    };
                }
            }
            activeCanvasNode.requestAnimationFrame(this.drawing.bind(this));
        },
        // 设置容器实例
        setContainerIns: function () {
            wx.createSelectorQuery().in(this).select('#board-box').boundingClientRect(rect => {
                this.setData({
                    containerIns: rect
                });
            }).exec();
        },
        // 设置dpr
        setDpr: function () {
            this.data.dpr = wx.getSystemInfoSync().pixelRatio;
        },
        // 存数据
        setBoardData: function (zIndexInfo) {
            this.data.multiBoardData = zIndexInfo;
        },
        // 设置最高层级
        setMaxIndex: function (zIndexInfo) {
            this.data.zIndexMax = zIndexInfo.sort((prev, next) => prev.zIndex - next.zIndex)[zIndexInfo.length - 1].zIndex;
        },
        // 设置
        setSettings: function (settings, zIndex) {
            this.data.canvasSettings = {...this.data.canvasSettings, ...settings};
            
            let color, width;
            const {
                canvasSettings: {
                    inputType, 
                    strokeStyle, 
                    lineWidth
                },
                zIndexMax
            } = this.data;
            const ctx = zIndex ? this.data['context' + zIndex] : this.data['context' + zIndexMax];

            if (inputType === 'rubber') {
                this.setData({
                    rubberActive: true
                });
            } else {
                this.setData({
                    rubberActive: false
                });
                color = strokeStyle;
                width = lineWidth;
            }
            ctx.lineCap = 'round'; //设置线条端点的样式
            ctx.lineJoin = 'round'; //设置两线相交处的样式
            ctx.strokeStyle = color; //设置描边颜色
            ctx.lineWidth = width; //设置线条宽度
        },
        setPointSize: function (pressure, zIndex) {
            const {
                zIndexMax
            } = this.data;
            const ctx = zIndex ? this.data['context' + zIndex] : this.data['context' + zIndexMax];
            ctx.lineWidth = this.data.canvasSettings.lineWidth * pressure;
        },
        // 清除当前层画板内容
        clearAll: function (zIndex) {
            const {
                containerIns
            } = this.data;
            const ctx = this.data['context' + zIndex];
            ctx.clearRect(0, 0, containerIns.width, containerIns.height);
        },
        /**
         * 数据回显
         * @param {*} originalSettings 初始参数，用来还原初始设置
         * @param {*} info 轨迹数据
         * @param {*} zIndex 层级
         * @param {*} needClear 是否需要清除当前层级画板
         */
        dataEcho: function (originalSettings, info, zIndex, needClear) {
            if (needClear) this.clearAll(zIndex);
            const {
                containerIns
            } = this.data;
            const content = info.content;
            let prevPressure = null;
            if (content.length) {
                const ctx = this.data['context' + zIndex];
                for (let j = 0; j < content.length; j++) {
                    const item = content[j];
                    const path = item.path;

                    if (!path.length) continue;
    
                    this.setSettings(item.canvasSettings, zIndex);
                    this.data.beginPoint = {
                        x: path[0].x * containerIns.width,
                        y: path[0].y * containerIns.height
                    };
    
                    for (let k = 0; k < path.length; k++) {
                        if ((k + 2) > path.length) break;
                        if (k > 1) {
                            const lastTwoPoints = path.slice(k, k + 2);
                            const controlPoint = {
                                x: lastTwoPoints[0].x * containerIns.width,
                                y: lastTwoPoints[0].y * containerIns.height
                            }
                            const endPoint = {
                                x: (lastTwoPoints[0].x * containerIns.width + lastTwoPoints[1].x * containerIns.width) / 2,
                                y: (lastTwoPoints[0].y * containerIns.height + lastTwoPoints[1].y * containerIns.height) / 2
                            }

                            if (!prevPressure || prevPressure !== path[k].pressure) {
                                prevPressure = path[k].pressure;
                                this.setPointSize(path[k].pressure, zIndex);
                            }

                            ctx.beginPath();
                            ctx.moveTo(this.data.beginPoint.x, this.data.beginPoint.y);
                            ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
                            ctx.stroke();

                            this.data.beginPoint = endPoint;
                        }
                    }
                }
            }

            this.setSettings(originalSettings, zIndex);
        },
        // 更改多媒体组件层级
        changeHandleComps: function (handleComps) {
            this.setData({
                handleComps
            });
        },
        // 返回白板数据
        getBoardData: function () {
            return this.data.multiBoardData;
        }
    }
})