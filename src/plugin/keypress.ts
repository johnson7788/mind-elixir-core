import type { Topic } from '../types/dom'
import type { NodeObj } from '../types/index'
import type { MindElixirInstance } from '../types/index'

const selectRootLeft = (mei: MindElixirInstance) => {
  const tpcs = mei.map.querySelectorAll('.lhs>me-wrapper>me-parent>me-tpc')
  mei.selectNode(tpcs[Math.ceil(tpcs.length / 2) - 1] as Topic)
}
const selectRootRight = (mei: MindElixirInstance) => {
  const tpcs = mei.map.querySelectorAll('.rhs>me-wrapper>me-parent>me-tpc')
  mei.selectNode(tpcs[Math.ceil(tpcs.length / 2) - 1] as Topic)
}
const selectRoot = (mei: MindElixirInstance) => {
  mei.selectNode(mei.map.querySelector('me-root>me-tpc') as Topic)
}
const selectParent = function (mei: MindElixirInstance, currentNode: Topic) {
  const parent = currentNode.parentElement.parentElement.parentElement.previousSibling
  if (parent) {
    const target = parent.firstChild
    mei.selectNode(target)
  }
}
const selectFirstChild = function (mei: MindElixirInstance, currentNode: Topic) {
  const children = currentNode.parentElement.nextSibling
  if (children && children.firstChild) {
    const target = children.firstChild.firstChild.firstChild
    mei.selectNode(target)
  }
}
const handleLeftRight = function (mei: MindElixirInstance, direction: 'lhs' | 'rhs') {
  const current = mei.currentNode || mei.currentNodes?.[0]
  if (!current) return
  const nodeObj = current.nodeObj
  const main = current.offsetParent.offsetParent.parentElement
  if (nodeObj.root) {
    direction === 'lhs' ? selectRootLeft(mei) : selectRootRight(mei)
  } else if (main.className === direction) {
    selectFirstChild(mei, current)
  } else {
    if (nodeObj.parent?.root) {
      selectRoot(mei)
    } else {
      selectParent(mei, current)
    }
  }
}
const handlePrevNext = function (mei: MindElixirInstance, direction: 'previous' | 'next') {
  const current = mei.currentNode || mei.currentNodes?.[0]
  if (!current) return
  const nodeObj = current.nodeObj
  if (nodeObj.root) return
  const s = (direction + 'Sibling') as 'previousSibling' | 'nextSibling'
  const sibling = current.parentElement.parentElement[s]
  if (sibling) {
    mei.selectNode(sibling.firstChild.firstChild)
  }
}

function data2MarkdownText(nodes:NodeObj[]) {
  //多个节点导出成markdown格式
  if (!nodes) {
    console.error('data2MarkdownText: node is undefined')
    return ''
  }
  //遍历节点
  let markdown_data = ''
  nodes.forEach(node => {
    markdown_data = markdown_data + generateMarkdown(node) + '\n\n'
  })
  return markdown_data; // 返回 markdown 数据
}

function generateMarkdown(node:NodeObj, level = 1) {
  let md = `${'#'.repeat(level)} ${node.topic}\n\n`;

  if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
          md += generateMarkdown(child, level + 1);
      });
  }
  return md;
}

export default function (mind: MindElixirInstance) {
  const handleRemove = () => {
    if (mind.currentArrow) mind.removeArrow()
    else if (mind.currentSummary) mind.removeSummary(mind.currentSummary.summaryObj.id)
    else if (mind.currentNode) {
      mind.removeNode()
    } else if (mind.currentNodes) {
      mind.removeNodes(mind.currentNodes)
    }
  }
  const key2func: Record<string, (e: KeyboardEvent) => void> = {
    13: e => {
      // enter
      if (e.shiftKey) {
        mind.insertSibling('before')
      } else if (e.ctrlKey) {
        mind.insertParent()
      } else {
        mind.insertSibling('after')
      }
    },
    65: () => {
      // a，回答xx
      mind.answerChild()
    },
    68: () => {
      // d, 下载文件
      mind.downloadImage("png")
    },
    77: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        // ctrl m, 复制markdown格式
        let markdown = ''
        if (mind.currentNode) {
          //选中单个节点的时候
          markdown = data2MarkdownText([mind.currentNode.nodeObj])
        }
        else if (mind.currentNodes){
          //选中多个节点的时候
          markdown = data2MarkdownText(mind.currentNodes.map(node => node.nodeObj))
        }
        // console.log(markdown) //拷贝内容到剪切板
        navigator.clipboard.writeText(markdown).then(() => {
          // Show a notification to the user
          alert('Text copied to clipboard!');
        });
      } else {
        // m, 切换multinode模式
        //点击时就开始切换状态
        mind.apiInterface.singleNode = !mind.apiInterface.singleNode; // 切换状态
        const ele = document.querySelector('#multinode') as HTMLElement | null;
        if (ele) {
          const svg = ele.querySelector('use') as SVGUseElement | null; // 选择嵌套的 <use> 元素
          if (svg) {
            if (mind.apiInterface.singleNode) {
              svg.style.fill = ''; // 恢复默认颜色，AI生成单个节点
            } else {
              svg.style.fill = 'red'; // 设置为红色, AI生成多个节点
            }
          }
        }
      }
    },
    85: () => {
      // u，插入文件
      mind.upload()
    },
    9: () => {
      // tab
      mind.addChild()
    },
    112: () => {
      // f1
      mind.toCenter()
    },
    113: () => {
      // f2
      mind.beginEdit()
    },
    38: e => {
      // up
      if (e.altKey) {
        mind.moveUpNode()
      } else if (e.metaKey || e.ctrlKey) {
        return mind.initSide()
      } else {
        handlePrevNext(mind, 'previous')
      }
    },
    40: e => {
      // down
      if (e.altKey) {
        mind.moveDownNode()
      } else {
        handlePrevNext(mind, 'next')
      }
    },
    37: e => {
      // left
      if (e.metaKey || e.ctrlKey) {
        return mind.initLeft()
      }
      handleLeftRight(mind, 'lhs')
    },
    39: e => {
      // right
      if (e.metaKey || e.ctrlKey) {
        return mind.initRight()
      }
      handleLeftRight(mind, 'rhs')
    },
    33() {
      // pageUp
      mind.moveUpNode()
    },
    34() {
      // pageDown
      mind.moveDownNode()
    },
    67: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        // ctrl c
        console.log('ctrl c Or Command c pressed')
        if (mind.currentNode) mind.waitCopy = [mind.currentNode]
        else if (mind.currentNodes) mind.waitCopy = mind.currentNodes
      }
    },
    86: async (e: KeyboardEvent) => {
      // ctrl v, 有2部分，一部分是如果用户复制了节点，则粘贴节点，否则粘贴剪切版中的内容，mind.waitCopy代表用户复制了节点
      // Paste clipboard text as child node
      if (!mind.currentNode) return //不管哪种情况，用户没有选择任何节点的时候，都不进行任何操作
      if (e.metaKey || e.ctrlKey) {
        if (mind.waitCopy) {
          // 首先，如果用户复制了节点，则粘贴节点，尊从默认的操作
          if (mind.waitCopy.length === 1) {
            mind.copyNode(mind.waitCopy[0], mind.currentNode)
          } else {
            mind.copyNodes(mind.waitCopy, mind.currentNode)
          }
          mind.waitCopy = null // 粘贴后清空
        } else {
          // 如果用户不是原始的复制，那么检查剪切板中是否有内容，如果有，那么新建节点
          const clipboardData = await navigator.clipboard.readText() //用户剪切板中的内容
          if (clipboardData) {
            //mind.apiInterface.singleNode ,查看是否是单节点模式，还是多节点模式，如果是多节点模式，那么每行都生成1个节点
            if (mind.apiInterface.singleNode) {
              const newNode = { topic: clipboardData, id: mind.generateUUID() } as NodeObj
              mind.addChild(mind.currentNode, newNode)
              mind.bus.fire('operation', { name: 'addChild', obj: newNode })
            } else {
              // 多节点模式，每行生成一个节点, 首先对clipboardData进行处理，去掉空行
              const lines = clipboardData.split('\n').filter(line => line.trim() !== '')
              //遍历每一行，然后新建节点
              for (let line of lines) {
                //对line的头尾进行trim操作，去掉空格
                const newNode = { topic: line.trim(), id: mind.generateUUID() } as NodeObj
                mind.addChild(mind.currentNode, newNode)
                mind.bus.fire('operation', { name: 'addChild', obj: newNode })
              }
            }
          }
        }
      }
    },
    // ctrl +
    187: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (mind.scaleVal > 1.6) return
        mind.scale((mind.scaleVal += 0.2))
      }
    },
    // ctrl -
    189: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (mind.scaleVal < 0.6) return
        mind.scale((mind.scaleVal -= 0.2))
      }
    },
    // ctrl 0
    48: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        mind.scale(1)
      }
    },
    // del,backspace
    8: handleRemove,
    46: handleRemove,
  }
  mind.map.onkeydown = e => {
    // 排除 Command + Option + I (打开开发者工具)
    if (e.metaKey && e.altKey && e.keyCode === 73) {
      return; // 允许默认行为
    }
    e.preventDefault()
    if (!mind.editable) return
    // console.log(e, e.target)
    if (e.target !== e.currentTarget) {
      // input
      return
    }
    const keyHandler = key2func[e.keyCode]
    keyHandler && keyHandler(e)
  }
}
