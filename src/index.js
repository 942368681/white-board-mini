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
        // 擦除框样式
        rubberRect: {
            left: 0,
            top: 0,
            width: 100,
            height: 100
        }, 
        // 绘图开关
        isDrawing: false,
        // 当前最顶层画布节点实例
        activeCanvasNode: null,
        // 多层数据（传入的 zIndexInfo）
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
        canvasSettings: null,
        // 最顶层层级，目前支持三层(1, 2, 3)
        zIndexMax: 1
    },
    ready: function () {
        const {
            zIndexInfo
        } = this.properties.initData;
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
        cloneCurrentCoords: function (obj) {
            return JSON.parse(JSON.stringify(obj));
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
        // 判断区域内部的轨迹
        checkInnerWriting: function (rect1) {
            const {
                points,
                canvasSettings,
                zIndexMax
            } = this.data;
            const content = points[points.length - 1].content;
            const len = content.length;

            if (!len) return;

            for (let i = 0; i < len; i++) {
                const con = content[i];
                if (!con) break;

                const rect2 = {
                    startX: con.rectArea[0],
                    startY: con.rectArea[2],
                    width: con.rectArea[1] - con.rectArea[0],
                    height: con.rectArea[3] - con.rectArea[2]
                }
                const bool = this.isOverlap(rect1, rect2);

                if (bool) {
                    if (this.shouldDelete(con, rect1)) {
                        content.splice(i, 1);
                        i = i - 1;
                    }
                }
            }
            this.dataEcho(canvasSettings, points[points.length - 1], zIndexMax, true);
        },
        /**
         * 判断是否这个轨迹得某个点在矩形范围内
         * @param {canvasSettings, path, rectArea} oContent 
         * @param {startX, startY, width, height} rect 
         */
        shouldDelete: function (oContent, rect) {
            const rectArea = [
                rect.startX,
                rect.startX + rect.width,
                rect.startY,
                rect.startY + rect.height
            ];
            const pathArr = oContent.path;
            for (let i = 0, len = pathArr.length; i < len; i++) {
                const oPoint = pathArr[i];
                const coords1 = {
                    x: oPoint.currentMidX,
                    y: oPoint.currentMidY
                };
                const coords2 = {
                    x: oPoint.oldX,
                    y: oPoint.oldY
                };
                const coords3 = {
                    x: oPoint.oldMidX,
                    y: oPoint.oldMidY
                };
                if (this.isFitPath(coords1, rectArea) || this.isFitPath(coords2, rectArea) || this.isFitPath(coords3, rectArea)) {
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

            if (rubberActive) return;

            const coords = this.getCoords(e);
            this.data.coords.current = coords;
            this.data.coords.old = coords;
            this.data.coords.oldMid = this.getMidInputCoords(coords);

            this.data.curve = {
                canvasSettings,
                path: []
            };

            this.data.isDrawing = true;
        },
        touchMove: function (e) {
            let {
                rubberActive
            } = this.data;

            if (rubberActive) return;

            const coords = this.getCoords(e);
            this.data.coords.current = coords;
        },
        touchEnd: function () {
            const {
                rubberActive,
                points,
                curve,
                canvasSettings: {
                    rubberRange
                }
            } = this.data;

            if (rubberActive) return;

            this.data.isDrawing = false;
            this.data.curve.rectArea = this.getRectArea(curve.path, rubberRange);
            points[points.length - 1].content.push(curve);
            this.data.curve = null;
            // console.log(JSON.stringify(this.data.points));
            // console.log(JSON.stringify(points[points.length - 1].content));
        },
        getRectArea: function (pathArr, rubberRange) {
            const {
                containerIns
            } = this.data;
            const init = {xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity};
            const obj = pathArr.reduce(function (prev, cur) {
                prev.xMin = Math.min.apply(null, [prev.xMin, cur.currentMidX, cur.oldX, cur.oldMidX]);
                prev.xMax = Math.max.apply(null, [prev.xMax, cur.currentMidX, cur.oldX, cur.oldMidX]);
                prev.yMin = Math.min.apply(null, [prev.yMin, cur.currentMidY, cur.oldY, cur.oldMidY]);
                prev.yMax = Math.max.apply(null, [prev.yMax, cur.currentMidY, cur.oldY, cur.oldMidY]);
                return prev;
            }, init);
            return [
                obj.xMin - rubberRange <= 0 ? 0 : obj.xMin - rubberRange, 
                obj.xMax + rubberRange >= containerIns.width ? containerIns.width : obj.xMax + rubberRange, 
                obj.yMin - rubberRange <= 0 ? 0 : obj.yMin - rubberRange, 
                obj.yMax + rubberRange >= containerIns.height ? containerIns.height : obj.yMax + rubberRange
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
                    zIndexMax
                } = this.data;
                const ctx = this.data['context' + zIndexMax];

                const currentMid = this.getMidInputCoords(coords.current);

                ctx.beginPath();
                ctx.moveTo(currentMid.x, currentMid.y);
                ctx.quadraticCurveTo(coords.old.x, coords.old.y, coords.oldMid.x, coords.oldMid.y);
                ctx.stroke();

                const currentCoords = this.cloneCurrentCoords(coords);

                this.data.curve.path.push({
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
        // 设置容器实例
        setContainerIns: function () {
            wx.createSelectorQuery().in(this).select('#board-box').boundingClientRect(rect => {
                console.log(rect);
                this.data.containerIns = rect;
            }).exec();
        },
        // 设置dpr
        setDpr: function () {
            this.data.dpr = wx.getSystemInfoSync().pixelRatio;
        },
        // 存数据
        setBoardData: function (zIndexInfo) {
            this.data.points = zIndexInfo;
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
                    inputType
                },
                canvasSettings: {
                    strokeStyle
                },
                canvasSettings: {
                    lineWidth
                },
                canvasSettings: {
                    rubberRange
                },
                zIndexMax
            } = this.data;
            const ctx = zIndex ? this.data['context' + zIndex] : this.data['context' + zIndexMax];

            if (inputType === 'pencil') {
                this.setData({
                    rubberActive: false
                });
                color = strokeStyle;
                width = lineWidth;
            } else if (inputType === 'rubber') {
                // color = '#ffffff';
                // width = rubberRange;
                this.setData({
                    rubberActive: true
                });
            }
            ctx.lineCap = 'round'; //设置线条端点的样式
            ctx.lineJoin = 'round'; //设置两线相交处的样式
            ctx.strokeStyle = color; //设置描边颜色
            ctx.lineWidth = width; //设置线条宽度
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

            const len = info.content.length;
            if (len) {
                const ctx = this.data['context' + zIndex];
                for (let j = 0; j < len; j++) {
                    const item = info.content[j];
                    const path = item.path;
                    const l = path.length;

                    if (!l) continue;
    
                    this.setSettings(item.canvasSettings, zIndex);
    
                    ctx.beginPath();
                    for (let k = 0; k < l; k++) {
                        const currentMidX = path[k].currentMidX;
                        const currentMidY = path[k].currentMidY;
                        const oldX = path[k].oldX;
                        const oldY = path[k].oldY;
                        const oldMidX = path[k].oldMidX;
                        const oldMidY = path[k].oldMidY;
                        ctx.moveTo(currentMidX, currentMidY);
                        ctx.quadraticCurveTo(oldX, oldY, oldMidX, oldMidY);
                    }
                    ctx.stroke();
                }
            }

            this.setSettings(originalSettings, zIndex);
        },
        // 更改多媒体组件层级
        changeHandleComps: function (handleComps) {
            console.log(handleComps);
            this.setData({
                handleComps
            });
        }
    }
})