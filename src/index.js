// import utils from "./utils";

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    initData: {
      type: Object,
      value: {}
    },
    containerScrollTop: {
      type: Number,
      value: 0
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    // 容器实例
    containerIns: null,
    // 防抖定时器
    timer: null,
    dpr: "",
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
    rubberRange: 0,
    // 画板禁用标识
    disabled: false
  },
  // 当前绘制Id
  pathId: null,
  // ready: function () {
  //     this.init();
  // },
  /**
   * 监听数据来源变化
   */
  observers: {
    initData: function(initData) {
      this.debounce(() => {
        this.data.multiBoardData.forEach(e => {
          this.data["context" + e.zIndex] = null;
        });
        this.setData(
          {
            domShow: {
              canvas1: false,
              canvas2: false,
              canvas3: false
            }
          },
          () => {
            this.init();
          }
        );
      }, 300)();
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 防抖函数
     * @param fn 事件触发的操作
     * @param delay 多少毫秒内连续触发事件，不会执行
     * @returns {Function}
     */
    debounce: function(fn, delay) {
      return () => {
        this.data.timer && clearTimeout(this.data.timer);
        this.data.timer = setTimeout(() => {
          fn();
        }, delay);
      };
    },
    /**
     * 校验初始化参数
     */
    checkInitParams: function(initData) {
      let bool;
      if (
        !initData ||
        !initData.canvasSettings ||
        !initData.zIndexInfo ||
        !initData.rubberRange
      ) {
        bool = false;
      } else {
        bool = true;
      }
      return bool;
    },
    /**
     * 初始化
     */
    init: function() {
      const initData = this.properties.initData;
      const valid = this.checkInitParams(initData);
      if (!valid) {
        return;
      }
      const { disabled, canvasSettings, zIndexInfo, rubberRange } = initData;
      this.disable(disabled);
      this.setBaseInfo({ rubberRange });
      this.setContainerIns();
      this.setDpr();
      this.setMaxIndex(zIndexInfo);
      this.setBoardData(zIndexInfo);
      this.initBoard(canvasSettings, zIndexInfo, 0);
    },
    /**
     * 设置基础设置信息
     * @param {rubberRange} params
     */
    setBaseInfo: function(params) {
      const { rubberRange } = params;
      this.data.rubberRange = rubberRange;
    },
    /**
     * 初始化白板
     * @param {*} zIndexInfo  此时是按层级由低到高( 1， 2， 3 ...)序列化好的zIndexInfo
     * @param {*} index 索引
     */
    initBoard: function(canvasSettings, zIndexInfo, index) {
      const attr = "domShow.canvas" + (index + 1);
      this.setData(
        {
          [attr]: true
        },
        () => {
          wx.createSelectorQuery()
            .in(this)
            .select(`#board-index-${index + 1}`)
            .fields({
              node: true,
              size: true
            })
            .exec(res => {
              const { dpr } = this.data;
              const { node, width, height } = res[0];
              const zIndex = zIndexInfo[index].zIndex;
              const baseContainerRect = zIndexInfo[index].containerRect;
              for (let i = 0; i < zIndexInfo[index].content.length; i++) {
                zIndexInfo[index].content[i].rectArea = this.getRectArea(
                  zIndexInfo[index].content[i]
                );
              }
              node.width = width * dpr;
              node.height = height * dpr;
              this.data["context" + zIndex] = node.getContext("2d");
              this.data["context" + zIndex].scale(dpr, dpr);
              zIndexInfo[index].containerRect = {
                width: Number(width.toFixed(0)),
                height: Number(height.toFixed(0))
              };
              this.dataEcho(
                canvasSettings,
                zIndexInfo[index],
                zIndex,
                false,
                baseContainerRect
              );
              if (index === zIndexInfo.length - 1) {
                // 当前最顶层(操作层)
                this.data.activeCanvasNode = node;
                node.requestAnimationFrame(this.drawing.bind(this));
              } else {
                this.initBoard(canvasSettings, zIndexInfo, index + 1);
              }
            });
        }
      );
    },
    getCoords: function(e) {
      let pos = e.touches[0];
      return {
        x: Number(pos.x.toFixed(0)),
        y: Number(pos.y.toFixed(0)),
        pressure: 1
      };
    },
    // 判断区域内部的轨迹
    checkInnerWriting: function(rect1) {
      const { multiBoardData, canvasSettings, zIndexMax } = this.data;
      const content = multiBoardData[multiBoardData.length - 1].content;
      const len = content.length;

      if (!len) return;

      for (let i = 0; i < len; i++) {
        const con = content[i];
        if (!con) continue;

        const xMin = con.rectArea[0];
        const xMax = con.rectArea[1];
        const yMin = con.rectArea[2];
        const yMax = con.rectArea[3];

        const rect2 = {
          startX: xMin,
          startY: yMin,
          width: xMax - xMin,
          height: yMax - yMin
        };
        const bool = this.isOverlap(rect1, rect2);

        if (bool) {
          if (this.shouldDelete(con, rect1)) {
            content.splice(i, 1);
            i = i - 1;
          }
        }
      }
      this.dataEcho(
        canvasSettings,
        multiBoardData[multiBoardData.length - 1],
        zIndexMax,
        true
      );
    },
    /**
     * 判断是否这个轨迹得某个点在矩形范围内
     * @param {canvasSettings, path, rectArea} oContent
     * @param {startX, startY, width, height} rect
     */
    shouldDelete: function(oContent, rect) {
      const { containerIns } = this.data;
      const rectArea = [
        rect.startX,
        rect.startX + rect.width,
        rect.startY,
        rect.startY + rect.height
      ];
      const xArr = oContent.x;
      const yArr = oContent.y;
      for (let i = 0, len = xArr.length; i < len; i++) {
        const coords = {
          x: xArr[i],
          y: yArr[i]
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
    isFitPath: function(coords, rectArea) {
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
    isOverlap: function(rect1, rect2) {
      const l1 = { x: rect1.startX, y: rect1.startY };
      const r1 = {
        x: rect1.startX + rect1.width,
        y: rect1.startY + rect1.height
      };
      const l2 = { x: rect2.startX, y: rect2.startY };
      const r2 = {
        x: rect2.startX + rect2.width,
        y: rect2.startY + rect2.height
      };

      if (l1.x > r2.x || l2.x > r1.x || l1.y > r2.y || l2.y > r1.y) {
        return false;
      } else {
        return true;
      }
    },
    rubberEnd: function({ startX, startY, width, height }) {
      this.checkInnerWriting({ startX, startY, width, height });
    },
    touchstart: function(e) {
      let { rubberActive, canvasSettings, disabled } = this.data;

      console.log("触发touchstart", "disabled: ", disabled);

      if (disabled) return;

      if (e.touches && e.touches.length > 1) {
        this.data.isDrawing = false;
        return;
      }

      if (rubberActive) return;

      this.data.coords = this.getCoords(e);
      this.pathId = Date.now();
      this.data.curve = {
        p: [],
        x: [],
        y: [],
        rectArea: [],
        canvasSettings
      };

      this.data.isDrawing = true;
    },
    touchMove: function(e) {
      let { rubberActive, disabled } = this.data;

      console.log("触发touchMove", "disabled: ", disabled);

      if (disabled) return;

      if (e.touches && e.touches.length > 1) {
        this.data.isDrawing = false;
        return;
      }

      if (rubberActive) return;

      this.data.coords = this.getCoords(e);
      this.pathId = Date.now();
      console.log("touchMove this.pathId: ", this.pathId);
    },
    touchEnd: function() {
      const { rubberActive, multiBoardData, curve, disabled } = this.data;

      console.log("触发touchEnd", "disabled: ", disabled);

      if (disabled) return;

      if (rubberActive) return;

      this.data.isDrawing = false;
      this.data.curve.rectArea = this.getRectArea(curve);
      // 确保canvasSettings存在
      if (curve.canvasSettings) {
        multiBoardData[multiBoardData.length - 1].content.push(curve);
      }
      this.data.curve = null;

      // console.log(JSON.stringify(multiBoardData));
      // console.log(JSON.stringify(multiBoardData[multiBoardData.length - 1]));
    },
    getRectArea: function(pathInfo) {
      const { rubberRange, containerIns } = this.data;
      const obj = {
        xMin: Math.min.apply(null, pathInfo.x),
        xMax: Math.max.apply(null, pathInfo.x),
        yMin: Math.min.apply(null, pathInfo.y),
        yMax: Math.max.apply(null, pathInfo.y)
      };
      return [
        obj.xMin - rubberRange <= 0 ? 0 : obj.xMin - rubberRange,
        obj.xMax + rubberRange >= containerIns.width
          ? containerIns.width
          : obj.xMax + rubberRange,
        obj.yMin - rubberRange <= 0 ? 0 : obj.yMin - rubberRange,
        obj.yMax + rubberRange >= containerIns.height
          ? containerIns.height
          : obj.yMax + rubberRange
      ];
    },
    drawing: function() {
      let { isDrawing, activeCanvasNode } = this.data;

      if (isDrawing) {
        if (this.pathId === this.lastPathId) {
          activeCanvasNode.requestAnimationFrame(this.drawing.bind(this));
          return;
        }

        let { coords, zIndexMax, prevPressure } = this.data;

        const ctx = this.data["context" + zIndexMax];

        const oP = Number((coords.pressure * 4096).toFixed(0));
        this.data.curve.x.push(coords.x);
        this.data.curve.y.push(coords.y);
        this.data.curve.p.push(oP);

        console.log("drawing...", ctx.strokeStyle, ctx.lineWidth);

        if (this.data.curve.x.length > 2) {
          const lastTwoPointsX = this.data.curve.x.slice(-2);
          const lastTwoPointsY = this.data.curve.y.slice(-2);
          const controlPoint = {
            x: lastTwoPointsX[0],
            y: lastTwoPointsY[0]
          };
          const endPoint = {
            x: (lastTwoPointsX[0] + lastTwoPointsX[1]) / 2,
            y: (lastTwoPointsY[0] + lastTwoPointsY[1]) / 2
          };

          if (!prevPressure || prevPressure !== oP) {
            this.data.prevPressure = oP;
            this.setPointSize(oP);
          }

          try {
            ctx.beginPath();
            ctx.moveTo(this.data.beginPoint.x, this.data.beginPoint.y);
            ctx.quadraticCurveTo(
              controlPoint.x,
              controlPoint.y,
              endPoint.x,
              endPoint.y
            );
            ctx.stroke();
            this.data.beginPoint = endPoint;
            this.lastPathId = this.pathId;
          } catch (error) {
            console.log("error: ", error);
          }
        } else {
          this.data.beginPoint = {
            x: this.data.curve.x[0],
            y: this.data.curve.y[0]
          };
        }
      }
      activeCanvasNode.requestAnimationFrame(this.drawing.bind(this));
    },
    // 设置容器实例
    setContainerIns: function() {
      wx.createSelectorQuery()
        .in(this)
        .select("#board-box")
        .boundingClientRect(rect => {
          this.setData({
            containerIns: rect
          });
        })
        .exec();
    },
    // 设置dpr
    setDpr: function() {
      this.data.dpr = wx.getSystemInfoSync().pixelRatio;
    },
    // 存数据
    setBoardData: function(zIndexInfo) {
      this.data.multiBoardData = zIndexInfo;
    },
    // 设置最高层级
    setMaxIndex: function(zIndexInfo) {
      this.data.zIndexMax = zIndexInfo.sort(
        (prev, next) => prev.zIndex - next.zIndex
      )[zIndexInfo.length - 1].zIndex;
    },
    // 设置
    setSettings: function(settings, zIndex) {
      this.data.canvasSettings = { ...this.data.canvasSettings, ...settings };

      let color, width, cap, join;
      const {
        canvasSettings: {
          inputType,
          strokeStyle,
          lineWidth,
          lineCap,
          lineJoin
        },
        zIndexMax
      } = this.data;
      const ctx = zIndex
        ? this.data["context" + zIndex]
        : this.data["context" + zIndexMax];

      if (inputType === "rubber") {
        this.setData({
          rubberActive: true
        });
      } else {
        this.setData({
          rubberActive: false
        });
        color = strokeStyle;
        width = lineWidth;
        cap = lineCap || "round";
        join = lineJoin || "round";
      }

      if (ctx) {
        ctx.lineCap = cap; //设置线条端点的样式
        ctx.lineJoin = join; //设置两线相交处的样式
        ctx.strokeStyle = color; //设置描边颜色
        ctx.lineWidth = width; //设置线条宽度
      }
    },
    setPointSize: function(pressure, zIndex) {
      const { zIndexMax } = this.data;
      const ctx = zIndex
        ? this.data["context" + zIndex]
        : this.data["context" + zIndexMax];
      ctx.lineWidth = this.data.canvasSettings.lineWidth * (pressure / 4096);
    },
    // 清除当前层画板内容
    clearAll: function(zIndex) {
      const { containerIns } = this.data;
      const ctx = this.data["context" + zIndex];
      ctx.clearRect(0, 0, containerIns.width, containerIns.height);
    },
    /**
     * 数据回显
     * @param {*} originalSettings 初始参数，用来还原初始设置
     * @param {*} info 轨迹数据
     * @param {*} zIndex 层级
     * @param {*} needClear 是否需要清除当前层级画板
     * @param {*} baseContainerRect 初始化基准宽高
     */
    dataEcho: function(
      originalSettings,
      info,
      zIndex,
      needClear,
      baseContainerRect
    ) {
      if (!baseContainerRect) {
        baseContainerRect = info.containerRect;
      }
      if (needClear) this.clearAll(zIndex);
      const { containerIns } = this.data;
      const content = info.content;
      const baseWidth = baseContainerRect.width;
      const baseHeight = baseContainerRect.height;
      let prevPressure = null;

      if (content.length) {
        const ctx = this.data["context" + zIndex];
        for (let j = 0; j < content.length; j++) {
          const oPathInfo = content[j];
          const xArr = oPathInfo.x;
          const yArr = oPathInfo.y;
          const pArr = oPathInfo.p;

          if (
            baseWidth !== info.containerRect.width ||
            baseHeight !== info.containerRect.height
          ) {
            for (let index = 0; index < xArr.length; index++) {
              xArr[index] = Number(
                ((xArr[index] / baseWidth) * containerIns.width).toFixed(0)
              );
            }
            for (let index = 0; index < yArr.length; index++) {
              yArr[index] = Number(
                ((yArr[index] / baseHeight) * containerIns.height).toFixed(0)
              );
            }
            content[j].rectArea = this.getRectArea(content[j]);
          }

          if (!oPathInfo || !pArr.length || !xArr.length || !yArr.length)
            continue;

          this.setSettings(oPathInfo.canvasSettings, zIndex);
          this.data.beginPoint = {
            x: xArr[0],
            y: yArr[0]
          };

          try {
            for (let k = 0; k < xArr.length; k++) {
              if (k > 1) {
                const lastTwoPointsX = xArr.slice(k - 1, k + 1);
                const lastTwoPointsY = yArr.slice(k - 1, k + 1);
                const controlPoint = {
                  x: lastTwoPointsX[0],
                  y: lastTwoPointsY[0]
                };
                const endPoint = {
                  x: (lastTwoPointsX[0] + lastTwoPointsX[1]) / 2,
                  y: (lastTwoPointsY[0] + lastTwoPointsY[1]) / 2
                };

                if (!prevPressure || prevPressure !== pArr[k]) {
                  prevPressure = pArr[k];
                  this.setPointSize(pArr[k], zIndex);
                }

                ctx.beginPath();
                ctx.moveTo(this.data.beginPoint.x, this.data.beginPoint.y);
                ctx.quadraticCurveTo(
                  controlPoint.x,
                  controlPoint.y,
                  endPoint.x,
                  endPoint.y
                );
                ctx.stroke();

                this.data.beginPoint = endPoint;
              }
            }
          } catch (error) {
            console.log("error: ", error);
          }
        }
      }

      this.setSettings(originalSettings, zIndex);
    },
    // 更改多媒体组件层级
    changeHandleComps: function(handleComps) {
      this.setData({
        handleComps
      });
    },
    // 返回白板数据
    getBoardData: function() {
      const data = JSON.parse(JSON.stringify(this.data.multiBoardData));
      data.forEach(item => {
        item.content.forEach(e => {
          delete e.rectArea;
        });
      });
      return data;
    },
    // 禁用/取消禁用
    disable: function(disabled) {
      this.setData({
        disabled: !!disabled
      });
    }
  }
});
