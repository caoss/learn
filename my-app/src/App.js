import logo from './logo.svg';
import './App.css';
import * as XLSX from 'xlsx';
import JSZip from "jszip";
import { saveAs } from 'file-saver'
function App() {

  // 解析EXCEL
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
    async function parseParams(ctx, params, index) {
      for (let item of params) {
        let { type, url } = item;
        let obj = { ...item };
        if (type == 'img') {
          // 图片是url地址，需要先下载图片
          obj.img = await downloadImage(obj);
          drawImage(ctx, obj);
        }
        if (type === 'text') {
          // console.log( 'data[index]',index );
          obj.text = data[index]['姓名']
          drawText(ctx, obj)
        }
      }
    }
    // 下载图片
    async function downloadImage(item) {
      return new Promise((resolve, reject) => {
        if (!item.url) return;
        // 把图片数据resolve回去，这里是需要做同步处理的。  
        const img = new Image();
        img.setAttribute("crossOrigin", 'Anonymous')
        img.src = item.url;
        img.onload = () => resolve(img)
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
      if (Array.isArray(params) && params.length) await parseParams(ctx, params, obj.index);
    }

    for (let i = 0; i < data.length; i++) {
      let canvas = document.createElement("canvas")
      let pic = document.createElement("img")
      canvas.id = 'canvas' + i;
      pic.id = 'img' + i;
      document.getElementById("canvasList").appendChild(canvas)
      document.getElementById("picList").appendChild(pic)
      onInitCanvas({ dom: `#${canvas.id}`, ...option, index: i })
    }
  }


  const dowloadZipIMGs = (picList) => {
    //先获取所有子节点，也就是img标签
    // var box = document.getElementById('picList').childNodes;
    var box = document.getElementById(picList).children;
    console.log("box", box);
    var imgList = []
    for (var i = 0; i < box.length; i++) {
      imgList.push(box[i].src)
    }
    downloadZipImage(imgList, '', 'abcTest')
    /**
         * 下载压缩图片
         * @param {any[]} imgArr  图片合集
         * @param {string} imgKey  如果不是单纯的图片路径 需要传入路径的key
         */
    function downloadZipImage(imgArr, imgKey = '', downloadName = 'img') {
      if (!imgArr || !imgArr.length) {
        return;
      }
      const zip = new JSZip();
      // 创建images文件夹
      const imgFolder = zip.folder('images');
      let index = 0; //  判断加载了几张图片的标识
      for (let i = 0; i < imgArr.length; i++) {
        const itemImg = imgKey ? imgArr[i][imgKey] : imgArr[i];
        console.log(itemImg, 'itemImg===')
        /**
         * 如果是Base64就不需要再做异步处理了
         */
        const Base64Img = getBase64(itemImg);
        if (Base64Img['then']) {
          Base64Img['then'](function (base64) {
            setBase64Img(zip, imgFolder, base64, imgArr, index, downloadName);
            index++;
          }, function (err) {
            console.log(err); //打印异常信息
          });
        } else {
          setBase64Img(zip, imgFolder, Base64Img, imgArr, index, downloadName);
          index++;
        }
      }
    }

    /**
     * 将图片转换成base64 并返回路径
     * @param img
     * @param {number} width 调用时传入具体像素值，控制大小 ,不传则默认图像大小
     * @param {number} height
     * @returns {string}
     */
    function getBase64Image(img, width = 0, height = 0) {
      const canvas = document.createElement('canvas');
      canvas.width = width ? width : img.width;
      canvas.height = height ? height : img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL();
      return dataURL;
    }

    /**
     * 检查是不是Base64
     * @param img
     * @returns {boolean}
     */
    function IsBase64(img) {
      // jpg jpeg png gif
      const _img = img.toLowerCase();
      if (_img.endsWith('jpg') || _img.endsWith('jpeg') || _img.endsWith('png') || _img.endsWith('gif'))
        return false;
      return true;
    }

    /**
     * 加载图片 加载成功后经图片返回
     * @param img
     * @returns {Promise<any>}
     */
    function getBase64(img) {
      let url = '';
      if (IsBase64(img)) {
        // 有一些数据 后台没有返回前缀
        const _base64 = 'data:image/png;base64,';
        if (img.startsWith(_base64)) {
          url = img;
        } else {
          url = _base64 + img;
        }
        return url;
      } else {
        url = img;
        const image = new Image();
        image.crossOrigin = '*';
        image.src = url;
        return new Promise(function (resolve, reject) {
          image.onload = function () {
            resolve(getBase64Image(image)); //将base64传给done上传处理
          }
        });
      }
    }
    /**
     * 压缩图片
     */
    function setBase64Img(zip, imgFolder, base64, imgArr, index, downloadName) {
      base64 = base64.split('base64,')[1];
      imgFolder.file(downloadName + '_' + index + '.png', base64, {
        base64: true
      });
      if (index === imgArr.length - 1) {
        zip.generateAsync({
          type: 'blob'
        }).then((blob) => {
          saveAs(blob, downloadName + '.zip');
        });
      }
    }
  }

  // 提交
  const submitCanvas = () => {
    var arr = document.querySelectorAll('canvas');
    var pics = document.querySelectorAll('img')
    for (let i = 0; i < arr.length; i++) {
      pics[i].src = arr[i].toDataURL('image/png');
    }
    dowloadZipIMGs('picList');
  }


  return (
    <div className="App">
      <div id="canvasList"></div>
      <input type='file' accept='.xlsx, .xls' onChange={onImportExcel} />
      <button onClick={submitCanvas}>提交</button>
      <div id="picList" style={{display:"none"}}></div>
    </div>
  );
}

export function Test() {
  const zip = new JSZip();
  return (
    'test'
  )
}

export default App;
