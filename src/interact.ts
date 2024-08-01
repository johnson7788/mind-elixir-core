import { rmSubline } from './nodeOperation'
import type { Topic } from './types/dom'
import type { MindElixirData, MindElixirInstance, NodeObj } from './types/index'
import { findEle } from './utils/dom'
import { fillParent } from './utils/index'

function collectData(instance: MindElixirInstance) {
  return {
    nodeData: instance.isFocusMode ? instance.nodeDataBackup : instance.nodeData,
    arrows: instance.arrows,
    summaries: instance.summaries,
    direction: instance.direction,
    theme: instance.theme,
  }
}

export const selectNode = function (this: MindElixirInstance, targetElement: Topic, isNewNode?: boolean, e?: MouseEvent): void {
  if (!targetElement) return
  console.time('selectNode')
  this.clearSelection()
  if (typeof targetElement === 'string') {
    const el = findEle(targetElement)
    if (!el) return
    return this.selectNode(el)
  }
  targetElement.className = 'selected'
  targetElement.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  this.currentNode = targetElement

  const nodeObj = targetElement.nodeObj
  // 如果节点有file或hyperLink属性，则显示信息框, 这里不用了，使用node-menu插件代替了
  // if (nodeObj.file || nodeObj.hyperLink || nodeObj.image) {
  //   let infoBox = targetElement.querySelector('.info-box')
  //   if (infoBox) {
  //     // 如果 infoBox 存在，则删除它
  //     infoBox.remove()
  //   } else {
  //     // 如果 infoBox 不存在，则创建它
  //     infoBox = document.createElement('div')
  //     infoBox.className = 'info-box'
  //     targetElement.appendChild(infoBox)

  //     infoBox.innerHTML = '' // 清空信息框的内容
  //     if (nodeObj.file) {
  //       const fileLink = document.createElement('a')
  //       fileLink.href = nodeObj.file.url
  //       fileLink.innerText = `File: ${nodeObj.file.name}`
  //       fileLink.target = '_blank'
  //       infoBox.appendChild(fileLink)
  //     }
  //     if (nodeObj.image) {
  //       const imageLink = document.createElement('a')
  //       imageLink.href = nodeObj.image.url
  //       // 使用URL对象
  //       const urlObject = new URL(nodeObj.image.url);
  //       // 使用pathname获取路径部分，然后使用split("/")分割成数组，最后取数组的最后一个元素
  //       const fileName = urlObject.pathname.split("/").pop();
  //       imageLink.innerText = `Image: ${fileName}`
  //       imageLink.target = '_blank'
  //       infoBox.appendChild(imageLink)
  //     }

  //     if (nodeObj.hyperLink) {
  //       const hyperLink = document.createElement('a')
  //       hyperLink.href = nodeObj.hyperLink
  //       hyperLink.innerText = '🔗'
  //       hyperLink.target = '_blank'
  //       infoBox.appendChild(hyperLink)
  //     }
  //     // 添加删除小图标
  //     const deleteIcon = document.createElement('span');
  //     deleteIcon.className = 'delete-icon';
  //     deleteIcon.innerText = '❌'; // 可以替换为实际的图标或图片
  //     infoBox.appendChild(deleteIcon);
  //     deleteIcon.style.position = 'absolute';
  //     deleteIcon.style.top = '5px';
  //     deleteIcon.style.right = '5px';
  //     deleteIcon.style.cursor = 'pointer';
  //     deleteIcon.addEventListener('click', (event: Event) => {
  //       event.stopPropagation();
  //       if (nodeObj.file) {
  //         delete nodeObj.file;
  //         this.reshapeNode(targetElement,nodeObj) //重新渲染下界面
  //       } else if (nodeObj.image) {
  //         delete nodeObj.image;
  //         this.reshapeNode(targetElement,nodeObj) //重新渲染下界面
  //       } else if (nodeObj.hyperLink) {
  //         delete nodeObj.hyperLink;
  //         this.reshapeNode(targetElement,nodeObj) //重新渲染下界面
  //       }
  //       infoBox!.remove();  //如果存在infoBox，则删除它
  //       console.log('Delete icon clicked'); // 确认事件是否触发
  //     });

  //     // 阻止 infoBox 上除链接外的事件传播
  //     infoBox.addEventListener('click', (event: Event) => {
  //       if (!(event.target instanceof HTMLAnchorElement)) {
  //         // event.stopPropagation()
  //       }
  //       console.log('infoBox clicked'); // 确认事件是否触发
  //     })

  //     // 添加双击事件处理
  //     infoBox.addEventListener('dblclick', (event: Event) => {
  //       event.preventDefault()
  //       // 打开编辑对话框或其他编辑方式
  //       // this.editNodeAttributes(nodeObj)
  //       console.log('infoBox dbclicked'); // 确认事件是否触发
  //     })
  //   }
  // }

  if (nodeObj.aiAnswer) {
    // 如果发现节点是ai的节点，即拥有aiAnswer的属性,那么在节点右侧添加迷你图标
    let iconBox = targetElement.querySelector('.ai-icon')
    if (iconBox) {
      // 如果 iconBox 存在，则删除它
      iconBox.remove()
    } else {
      // 如果 iconBox 不存在，则创建它
      iconBox = document.createElement('div')
      iconBox.className = 'ai-icon'
      targetElement.appendChild(iconBox)

      // 添加 Retry 图标
      const retryIcon = document.createElement('span')
      retryIcon.className = 'icon-retry'
      retryIcon.innerText = '🔄' // 重试图标，可以替换为实际的图标或图片
      iconBox.appendChild(retryIcon)
      retryIcon.addEventListener('click', () => {
        console.log('Retry icon clicked')
        // 在这里添加重试操作的逻辑, 获取父节点，然后在父节点上调用answerChild
        const parent = targetElement.parentElement.parentElement.parentElement.previousSibling
        if (parent) {
          const parentTopic = parent.firstChild
          if (parentTopic) {
            // 使用父节点的 nodeObj 调用 answerChild 方法
            this.removeNode(targetElement) //移除当前节点，然后在重新回答
            this.answerChild(parentTopic, undefined, true);
          }
        }
      })

      // 添加 Like 图标
      const likeIcon = document.createElement('span')
      likeIcon.className = 'icon-like'
      likeIcon.innerText = '👍' // 喜欢图标，可以替换为实际的图标或图片
      iconBox.appendChild(likeIcon)
      likeIcon.addEventListener('click', () => {
        console.log('Like icon clicked')
        // 在这里添加喜欢操作的逻辑, 这里根据节点的ID，通知服务器，哪个被喜欢了
      })
    }
  }

  if (isNewNode) {
    this.bus.fire('selectNewNode', targetElement.nodeObj)
  } else {
    // the variable e indicates that the action is triggered by a click
    this.bus.fire('selectNode', targetElement.nodeObj, e)
  }
  console.timeEnd('selectNode')
}

export const unselectNode = function (this: MindElixirInstance) {
  if (this.currentNode) {
    this.currentNode.className = ''
  }
  this.currentNode = null
  this.bus.fire('unselectNode')
}

export const selectNodes = function (this: MindElixirInstance, tpc: Topic[]): void {
  console.time('selectNodes')
  this.clearSelection()
  for (const el of tpc) {
    el.className = 'selected'
  }
  this.currentNodes = tpc
  this.bus.fire(
    'selectNodes',
    tpc.map(el => el.nodeObj)
  )
  console.timeEnd('selectNodes')
}

export const unselectNodes = function (this: MindElixirInstance) {
  if (this.currentNodes) {
    for (const el of this.currentNodes) {
      el.classList.remove('selected')
    }
  }
  this.currentNodes = null
  this.bus.fire('unselectNodes')
}

export const clearSelection = function (this: MindElixirInstance) {
  this.unselectNode()
  this.unselectNodes()
  this.unselectSummary()
  this.unselectArrow()
}

/**
 * @function
 * @instance
 * @name getDataString
 * @description Get all node data as string.
 * @memberof MapInteraction
 * @return {string}
 */
export const getDataString = function (this: MindElixirInstance) {
  const data = collectData(this)
  return JSON.stringify(data, (k, v) => {
    if (k === 'parent' && typeof v !== 'string') return undefined
    return v
  })
}
/**
 * @function
 * @instance
 * @name getData
 * @description Get all node data as object.
 * @memberof MapInteraction
 * @return {Object}
 */
export const getData = function (this: MindElixirInstance) {
  return JSON.parse(this.getDataString()) as MindElixirData
}

/**
 * @function
 * @instance
 * @name getDataMd
 * @description Get all node data as markdown.
 * @memberof MapInteraction
 * @return {String}
 */
export const getDataMd = function (this: MindElixirInstance) {
  const data = collectData(this).nodeData
  let mdString = '# ' + data.topic + '\n\n'
  function writeMd(children: NodeObj[], deep: number) {
    for (let i = 0; i < children.length; i++) {
      if (deep <= 6) {
        mdString += ''.padStart(deep, '#') + ' ' + children[i].topic + '\n\n'
      } else {
        mdString += ''.padStart(deep - 7, '\t') + '- ' + children[i].topic + '\n'
      }
      if (children[i].children) {
        writeMd(children[i].children || [], deep + 1)
      }
    }
  }
  writeMd(data.children || [], 2)
  return mdString
}

/**
 * @function
 * @instance
 * @name enableEdit
 * @memberof MapInteraction
 */
export const enableEdit = function (this: MindElixirInstance) {
  this.editable = true
}

/**
 * @function
 * @instance
 * @name disableEdit
 * @memberof MapInteraction
 */
export const disableEdit = function (this: MindElixirInstance) {
  this.editable = false
}

/**
 * @function
 * @instance
 * @name scale
 * @description Change the scale of the mind map.
 * @memberof MapInteraction
 * @param {number}
 */
export const scale = function (this: MindElixirInstance, scaleVal: number) {
  // TODO: recalculate the position of the map
  // plan A: use transform-origin
  // plan B: use transform: translate
  // https://github.com/markmap/markmap/blob/e3071bc34da850ed7283b7d5b1a79b6c9b631a0e/packages/markmap-view/src/view.tsx#L640
  this.scaleVal = scaleVal
  this.map.style.transform = 'scale(' + scaleVal + ')'
}
/**
 * @function
 * @instance
 * @name toCenter
 * @description Reset position of the map to center.
 * @memberof MapInteraction
 */
export const toCenter = function (this: MindElixirInstance) {
  this.container.scrollTo(10000 - this.container.offsetWidth / 2, 10000 - this.container.offsetHeight / 2)
}

/**
 * @function
 * @instance
 * @name install
 * @description Install plugin.
 * @memberof MapInteraction
 */
export const install = function (this: MindElixirInstance, plugin: (instance: MindElixirInstance) => void) {
  plugin(this)
}
/**
 * @function
 * @instance
 * @name focusNode
 * @description Enter focus mode, set the target element as root.
 * @memberof MapInteraction
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 */
export const focusNode = function (this: MindElixirInstance, el: Topic) {
  if (el.nodeObj.root) return
  if (this.tempDirection === null) {
    this.tempDirection = this.direction
  }
  if (!this.isFocusMode) {
    this.nodeDataBackup = this.nodeData // help reset focus mode
    this.isFocusMode = true
  }
  this.nodeData = el.nodeObj
  this.nodeData.root = true
  this.initRight()
  this.toCenter()
}
/**
 * @function
 * @instance
 * @name cancelFocus
 * @description Exit focus mode.
 * @memberof MapInteraction
 */
export const cancelFocus = function (this: MindElixirInstance) {
  this.isFocusMode = false
  if (this.tempDirection !== null) {
    delete this.nodeData.root
    this.nodeData = this.nodeDataBackup
    this.direction = this.tempDirection
    this.tempDirection = null
    this.refresh()
    this.toCenter()
  }
}
/**
 * @function
 * @instance
 * @name initLeft
 * @description Child nodes will distribute on the left side of the root node.
 * @memberof MapInteraction
 */
export const initLeft = function (this: MindElixirInstance) {
  this.direction = 0
  this.refresh()
}
/**
 * @function
 * @instance
 * @name initRight
 * @description Child nodes will distribute on the right side of the root node.
 * @memberof MapInteraction
 */
export const initRight = function (this: MindElixirInstance) {
  this.direction = 1
  this.refresh()
}
/**
 * @function
 * @instance
 * @name initSide
 * @description Child nodes will distribute on both left and right side of the root node.
 * @memberof MapInteraction
 */
export const initSide = function (this: MindElixirInstance) {
  this.direction = 2
  this.refresh()
}

/**
 * @function
 * @instance
 * @name setLocale
 * @memberof MapInteraction
 */
export const setLocale = function (this: MindElixirInstance, locale: string) {
  this.locale = locale
  this.refresh()
}

export const expandNode = function (this: MindElixirInstance, el: Topic, isExpand?: boolean) {
  const node = el.nodeObj
  if (typeof isExpand === 'boolean') {
    node.expanded = isExpand
  } else if (node.expanded !== false) {
    node.expanded = false
  } else {
    node.expanded = true
  }
  const parent = el.parentNode
  const expander = parent.children[1]!
  expander.expanded = node.expanded
  expander.className = node.expanded ? 'minus' : ''

  rmSubline(el)
  if (node.expanded) {
    const children = this.createChildren(
      node.children!.map(child => {
        const wrapper = this.createWrapper(child)
        return wrapper.grp
      })
    )
    parent.parentNode.appendChild(children)
  } else {
    const children = parent.parentNode.children[1]
    children.remove()
  }
  // TODO 在此函数构造 html 结构，而非调用 layout
  // this.layout()
  // linkDiv 已实现只更新特定主节点
  this.linkDiv()
  this.bus.fire('expandNode', node)
}

/**
 * @function
 * @instance
 * @name refresh
 * @description Refresh mind map, you can use it after modified `this.nodeData`
 * @memberof MapInteraction
 * @param {TargetElement} data mind elixir data
 */
export const refresh = function (this: MindElixirInstance, data?: MindElixirData) {
  if (data) {
    data = JSON.parse(JSON.stringify(data)) as MindElixirData // it shouldn't contanimate the original data
    this.nodeData = data.nodeData
    this.arrows = data.arrows || []
    this.summaries = data.summaries || []
  }
  fillParent(this.nodeData)
  // create dom element for every node
  this.layout()
  // generate links between nodes
  this.linkDiv()
}
