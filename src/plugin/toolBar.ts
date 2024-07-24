import type { MindElixirInstance } from '../types/index'
import './toolBar.less'

const createButton = (id: string, name: string, title: string) => {
  const button = document.createElement('span')
  button.id = id
  button.innerHTML = `<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-${name}"></use>
  </svg>`
  button.title = title; // 添加 title 属性
  return button
}

function createToolBarRBContainer(mind: MindElixirInstance) {
  const toolBarRBContainer = document.createElement('div')
  const fc = createButton('fullscreen', 'full', '全屏显示') // 添加提示
  const gc = createButton('toCenter', 'living', '居中显示')
  const zo = createButton('zoomout', 'move', '缩小')
  const zi = createButton('zoomin', 'add', '放大')
  const percentage = document.createElement('span')
  percentage.innerText = '100%'
  toolBarRBContainer.appendChild(fc)
  toolBarRBContainer.appendChild(gc)
  toolBarRBContainer.appendChild(zo)
  toolBarRBContainer.appendChild(zi)
  // toolBarRBContainer.appendChild(percentage)
  toolBarRBContainer.className = 'mind-elixir-toolbar rb'
  fc.onclick = () => {
    mind.container.requestFullscreen()
  }
  gc.onclick = () => {
    mind.toCenter()
  }
  zo.onclick = () => {
    if (mind.scaleVal < 0.6) return
    mind.scale((mind.scaleVal -= 0.2))
  }
  zi.onclick = () => {
    if (mind.scaleVal > 1.6) return
    mind.scale((mind.scaleVal += 0.2))
  }
  return toolBarRBContainer
}

function createToolBarLTContainer(mind: MindElixirInstance) {
  const toolBarLTContainer = document.createElement('div')
  const l = createButton('tbltl', 'left', '左对齐')
  const r = createButton('tbltr', 'right', '右对齐')
  const s = createButton('tblts', 'side', '两侧对齐')
  const multinode = createButton('multinode', 'menu', '多节点生成')

  toolBarLTContainer.appendChild(l)
  toolBarLTContainer.appendChild(r)
  toolBarLTContainer.appendChild(s)
  toolBarLTContainer.appendChild(multinode)
  toolBarLTContainer.className = 'mind-elixir-toolbar lt'
  l.onclick = () => {
    mind.initLeft()
  }
  r.onclick = () => {
    mind.initRight()
  }
  s.onclick = () => {
    mind.initSide()
  }
  multinode.onclick = () => {
    const svg = multinode.firstElementChild as SVGElement; // 将类型转换为 SVGElement
    if (svg) {
      if (mind.apiInterface.singleNode) {
        svg.style.fill = ''; // 恢复默认颜色
      } else {
        svg.style.fill = 'blue'; // 设置为蓝色, 多节点回答模式
      }
      mind.apiInterface.singleNode = !mind.apiInterface.singleNode; // 切换状态
    }
  };
  return toolBarLTContainer
}

export default function (mind: MindElixirInstance) {
  mind.container.append(createToolBarRBContainer(mind))
  mind.container.append(createToolBarLTContainer(mind))
}
