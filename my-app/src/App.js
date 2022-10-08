import logo from './logo.svg';
import './App.css';
import * as XLSX from 'xlsx';

function App() {
  const onImportExcel = file => {
    // 获取上传的文件对象
    const { files } = file.target;
    // 通过FileReader对象读取文件
    const fileReader = new FileReader();
    fileReader.onload = event => {
      try {
        const { result } = event.target;
        // 以二进制流方式读取得到整份excel表格对象
        const workbook = XLSX.read(result, { type: 'binary' });
        let data = []; // 存储获取到的数据
        // 遍历每张工作表进行读取（这里默认只读取第一张表）
        for (const sheet in workbook.Sheets) {
          if (workbook.Sheets.hasOwnProperty(sheet)) {
            // 利用 sheet_to_json 方法将 excel 转成 json 数据
            data = data.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
            // break; // 如果只取第一张表，就取消注释这行
          }
        }
        drawImgs(data);
      } catch (e) {
        // 这里可以抛出文件类型错误不正确的相关提示
        console.log('文件类型不正确');
        return;
      }
    };
    // 以二进制方式打开文件
    fileReader.readAsBinaryString(files[0]);
  }
  // 根据列表生成图片
  const drawImgs = (data) => {
    console.log(data);
    // 绘画数据
    const params = [
      // 图片
      { type: "img", url: "https://img.alicdn.com/tfs/TB1GvVMj2BNTKJjy0FdXXcPpVXa-520-280.jpg", left: 0, top: 0, width: 500, height: 280, },
      // 文字
      { type: "text", text: "姓名", left: 40, right: 0, top: 80, width: 500, textAlign: 'center' },
    ]
    // 画布参数
    const option = { params, width: 500, height: 280, dpr: 1 };
    // 解析参数 
    async function parseParams(ctx, params) {
      let data = [];
      for (let item of params) {
        let { type, url } = item;
        let obj = { ...item };
        if (type == 'img') {
          // 图片是url地址，需要先下载图片
          obj.img = await downloadImage(obj);
          drawImage(ctx, obj);
        }
        if (type === 'text') drawText(ctx, obj)
      }
      return data;
    }
    // 下载图片
    async function downloadImage(item) {
      return new Promise((resolve, reject) => {
        if (!item.url) return;
        // 把图片数据resolve回去，这里是需要做同步处理的。  
        const img = new Image();
        img.onload = () => resolve(img)
        img.src = item.url;
      })
    }

    // 绘制文本数据
    function drawText(ctx, item) {
      ctx.save();
      let { text, width, height, left, top, color = "#fff", textAlign, font = '20px' } = item;
      // 设置文本颜色
      ctx.fillstyle = color;
      // 设置文本大小
      // ctx.font = font;
      ctx.font = 'normal 30px "楷体"';;
      // 设置水平对齐方式
      ctx.textAlign = textAlign || "center";
      // 设置垂直对齐方式
      ctx.textBaseline = "middle";
      ctx.fillText(text, left, top);
    }

    // 绘制图片
    function drawImage(ctx, item) {
      ctx.save()
      let { img, width, height, left, top, radius } = item;
      if (radius === true) {
        ctx.beginPath()
        ctx.arc(width / 2 + left, height / 2 + top, width / 2, 0, Math.PI * 2, false);
        ctx.clip();
      } else if (typeof radius === 'number') {
        // 处理圆角
        let a = { x: left + radius, y: top };
        let b = { x: left + width, y: top };
        let c = { x: left + width, y: top + height };
        let d = { x: left, y: top + height };
        let e = { x: left, y: top };
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.arcTo(b.x, b.y, c.x, c.y, radius);
        ctx.arcTo(c.x, c.y, d.x, d.y, radius);
        ctx.arcTo(d.x, d.y, e.x, e.y, radius);
        ctx.arcTo(e.x, e.y, a.x, a.y, radius);
        ctx.clip();
      }
      ctx.drawImage(img, left, top, width, height);
      ctx.restore()
    }
    // 初始化
    async function onInitCanvas(obj) {
      let ctx = null;
      let { dom, params, width = 500, height = 200, dpr = 1 } = obj;
      if (!ctx) {
        let canvas = document.querySelector(dom);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx = canvas.getContext("2d");
      }
      // 解析数据
      if (Array.isArray(params) && params.length) await parseParams(ctx, params);
    }

    for (let i = 0; i < 5; i++) {
      let canvas = document.createElement("canvas")
      canvas.id = 'canvas' + i;
      document.getElementById("body").appendChild(canvas)
      onInitCanvas({ dom: `#${canvas.id}`, ...option })
    }
  }

  return (
    <div className="App">
      <div id="body"></div>
      <input type='file' accept='.xlsx, .xls' onChange={onImportExcel} />
    </div>
  );
}

export function Test() {
  return (
    'test'
  )
}

export default App;
