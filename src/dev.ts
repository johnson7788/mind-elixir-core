import type { MindElixirCtor } from './index'
import MindElixir from './index'
import example from './exampleData/1'
import example2 from './exampleData/2'
import example3 from './exampleData/3'
import type { Options, MindElixirData, MindElixirInstance } from './types/index'
import type { Operation } from './utils/pubsub'
import style from '../index.css?raw'
import katex from '../katex.css?raw'

interface Window {
  m: MindElixirInstance
  M: MindElixirCtor
  E: typeof MindElixir.E
  downloadPng: ReturnType<typeof download>
  downloadSvg: ReturnType<typeof download>
}

declare let window: Window

const E = MindElixir.E
const options: Options = {
  el: '#map',
  newTopicName: '子节点',
  direction: MindElixir.SIDE,
  // direction: MindElixir.RIGHT,
  locale: 'cn',
  draggable: true,
  editable: true,
  contextMenu: true,
  contextMenuOption: {
    focus: true,
    link: true,
    extend: [
      {
        name: 'Node edit',
        onclick: () => {
          alert('extend menu')
        },
      },
    ],
  },
  mobileMenu: true,
  toolBar: true,
  nodeMenu: true,
  keypress: true,
  allowUndo: true,
  before: {
    insertSibling(el, obj) {
      console.log('insertSibling', el, obj)
      return true
    },
    async addChild(el, obj) {
      console.log('addChild', el, obj)
      // await sleep()
      // 如果返回时false,那么就不运行原来的addChild函数了，直接使用这个代替，否则，继续运行原来的addChild函数
      return true
    },
  },
  apiInterface: {
    singleNode: false, //生成单个节点
    answerAPI: "http://localhost:5556/mind/answer",
    uploadAPI: "http://localhost:5556/mind/upload_file", //上传文件和图片
    headerToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcyMjY3NjI0NywianRpIjoiNjRiMTI5ZGItYTI2Ny00Njc5LTk2ZDQtNDIyOWU2NjE0MDVjIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6ImpvaG5zb24iLCJuYmYiOjE3MjI2NzYyNDcsImNzcmYiOiIyZjc0Njc4Ni04YWE3LTRjY2EtOTgzMi1iZTcxOWFlMTYwOGMiLCJleHAiOjE3MjMyODEwNDd9.FwOx566ogh-IRRNuilZdHbj1LwHeGuhccP32F4bI5Rw", //上传文件和图片时，请求头中的token字段
  }
}

const mind = new MindElixir(options)

// const data = MindElixir.new('new topic')
mind.init(example)

// 可以同时设置2个思维导图，但这里不设置2个思维导图了
// const m2 = new MindElixir({
//   el: '#map2',
// })
// m2.init(data)

function sleep() {
  return new Promise<void>(res => {
    setTimeout(() => res(), 1000)
  })
}
console.log('test E function', E('bd4313fbac40284b'))

mind.bus.addListener('operation', (operation: Operation) => {
  console.log(operation)
  // if ( operation.name === 'addChild' ) {
  //   //修改topic
  //   operation.obj.topic = 'Hello world'
  // }
  // return {
  //   name: action name,
  //   obj: target object
  // }

  // name: [insertSibling|addChild|removeNode|beginEdit|finishEdit]
  // obj: target

  // name: moveNodeIn
  // obj: {from:target1,to:target2}
})
mind.bus.addListener('selectNode', node => {
  console.log(node)
  // InsertNodeImage("http://127.0.0.1:5556/image/dog.jpg", node)
})

function InsertNodeImage(imageUrl: string, node:any) {
  const tpc = mind.findEle(node.id)
  // 获取当前选中的节点
  const selectNode = node
  
  if (!selectNode) {
      console.error("No node selected.");
      return;
  }

  // 插入图片到当前节点中
  const image = {
      url: imageUrl,
      height: 90,
      width: 90
  };
  selectNode.image = image;

  // 更新节点的属性
  mind.reshapeNode(tpc, selectNode);
}

mind.bus.addListener('expandNode', node => {
  console.log('expandNode: ', node)
})

const download = (type: 'svg' | 'png') => {
  return async () => {
    try {
      let blob = null
      if (type === 'png') blob = await mind.exportPng(false, style + katex)
      else blob = await mind.exportSvg(false, style + katex)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'filename.' + type
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
  }
}

window.downloadPng = download('png')
window.downloadSvg = download('svg')
window.m = mind
// window.m2 = mind2
window.M = MindElixir
window.E = MindElixir.E
