import { LEFT } from '../const'
import type { Topic, Wrapper, Parent, Children, Expander } from '../types/dom'
import type { MindElixirInstance, NodeObj } from '../types/index'
import { encodeHTML } from '../utils/index'
import { layoutChildren } from './layout'

// DOM manipulation
const $d = document
export const findEle = (id: string, instance?: MindElixirInstance) => {
  const scope = instance ? instance.mindElixirBox : $d
  const ele = scope.querySelector<Topic>(`[data-nodeid=me${id}]`)
  if (!ele) throw new Error(`FindEle: Node ${id} not found, maybe it's collapsed.`)
  return ele
}

export const shapeTpc = function (tpc: Topic, nodeObj: NodeObj) {
  tpc.innerHTML = ''

  if (nodeObj.style) {
    tpc.style.color = nodeObj.style.color || ''
    tpc.style.background = nodeObj.style.background || ''
    tpc.style.fontSize = nodeObj.style.fontSize + 'px'
    tpc.style.fontWeight = nodeObj.style.fontWeight || 'normal'
  }

  if (nodeObj.dangerouslySetInnerHTML) {
    tpc.innerHTML = nodeObj.dangerouslySetInnerHTML
    return
  }

  if (nodeObj.image) {
    const img = nodeObj.image
    if (img.url && img.width && img.height) {
      const imgContainer = $d.createElement('img')
      imgContainer.src = img.url
      imgContainer.style.width = img.width + 'px'
      imgContainer.style.height = img.height + 'px'
      tpc.appendChild(imgContainer)
      tpc.image = imgContainer
    } else {
      console.warn('image url/width/height are required')
    }
  } else if (tpc.image) {
    tpc.image = undefined
  }

  {
    const textContainer = $d.createElement('span')
    textContainer.className = 'text'
    textContainer.textContent = nodeObj.topic
    tpc.appendChild(textContainer)
    tpc.text = textContainer
  }

  if (nodeObj.hyperLink) {
    const linkContainer = $d.createElement('a')
    linkContainer.className = 'hyper-link'
    linkContainer.target = '_blank'
    linkContainer.innerText = '🔗'
    linkContainer.href = nodeObj.hyperLink
    tpc.appendChild(linkContainer)
    tpc.linkContainer = linkContainer
  } else if (tpc.linkContainer) {
    tpc.linkContainer = undefined
  }

  if (nodeObj.mind) {
    const mindContainer = $d.createElement('a')
    mindContainer.className = 'hyper-link'
    mindContainer.target = '_blank'
    mindContainer.innerText = '𝕞'
    mindContainer.href = nodeObj.mind.url
    tpc.appendChild(mindContainer)
    tpc.mindContainer = mindContainer
  } else if (tpc.mindContainer) {
    tpc.mindContainer = undefined
  }

  if (nodeObj.file) {
    const fileContainer = $d.createElement('a')
    fileContainer.className = 'file-link'
    fileContainer.target = '_blank'
    fileContainer.innerText = nodeObj.file.name
    fileContainer.href = nodeObj.file.url
    tpc.appendChild(fileContainer)
    tpc.fileContainer = fileContainer
  } else if (tpc.fileContainer) {
    tpc.fileContainer = undefined
  }

  if (nodeObj.icons && nodeObj.icons.length) {
    const iconsContainer = $d.createElement('span')
    iconsContainer.className = 'icons'
    iconsContainer.innerHTML = nodeObj.icons.map(icon => `<span>${encodeHTML(icon)}</span>`).join('')
    tpc.appendChild(iconsContainer)
    tpc.icons = iconsContainer
  } else if (tpc.icons) {
    tpc.icons = undefined
  }

  if (nodeObj.tags && nodeObj.tags.length) {
    const tagsContainer = $d.createElement('div')
    tagsContainer.className = 'tags'
    tagsContainer.innerHTML = nodeObj.tags.map(tag => `<span>${encodeHTML(tag)}</span>`).join('')
    tpc.appendChild(tagsContainer)
    tpc.tags = tagsContainer
  } else if (tpc.tags) {
    tpc.tags = undefined
  }
}

// everything start from `Wrapper`
export const createWrapper = function (this: MindElixirInstance, nodeObj: NodeObj, omitChildren?: boolean) {
  const grp = $d.createElement('me-wrapper') as Wrapper
  const { p, tpc } = this.createParent(nodeObj)
  grp.appendChild(p)
  if (!omitChildren && nodeObj.children && nodeObj.children.length > 0) {
    const expander = createExpander(nodeObj.expanded)
    p.appendChild(expander)
    // tpc.expander = expander
    if (nodeObj.expanded !== false) {
      const children = layoutChildren(this, nodeObj.children)
      grp.appendChild(children)
    }
  }
  return { grp, top: p, tpc }
}

export const createParent = function (this: MindElixirInstance, nodeObj: NodeObj) {
  const p = $d.createElement('me-parent') as Parent
  const tpc = this.createTopic(nodeObj)
  shapeTpc(tpc, nodeObj)
  p.appendChild(tpc)
  return { p, tpc }
}

export const createChildren = function (this: MindElixirInstance, wrappers: Wrapper[]) {
  const children = $d.createElement('me-children') as Children
  children.append(...wrappers)
  return children
}

export const createTopic = function (this: MindElixirInstance, nodeObj: NodeObj) {
  const topic = $d.createElement('me-tpc') as Topic
  topic.nodeObj = nodeObj
  topic.dataset.nodeid = 'me' + nodeObj.id
  topic.draggable = this.draggable
  return topic
}

export function selectText(div: HTMLElement) {
  const range = $d.createRange()
  range.selectNodeContents(div)
  const getSelection = window.getSelection()
  if (getSelection) {
    getSelection.removeAllRanges()
    getSelection.addRange(range)
  }
}

export const editTopic = function (this: MindElixirInstance, el: Topic) {
  console.time('editTopic')
  if (!el) return
  const div = $d.createElement('div')
  const origin = el.text.textContent as string
  el.appendChild(div)
  div.id = 'input-box'
  div.textContent = origin
  div.contentEditable = 'true'
  div.spellcheck = false
  div.style.cssText = `min-width:${el.offsetWidth - 8}px;`
  if (this.direction === LEFT) div.style.right = '0'
  div.focus()

  selectText(div)

  this.bus.fire('operation', {
    name: 'beginEdit',
    obj: el.nodeObj,
  })

  div.addEventListener('keydown', e => {
    e.stopPropagation()
    const key = e.key

    if (key === 'Enter' || key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      div?.blur()
      this.map.focus()
    }
  })
  div.addEventListener('blur', () => {
    if (!div) return
    const node = el.nodeObj
    const topic = div.textContent?.trim() || ''
    console.log(topic)
    if (topic === '') node.topic = origin
    else node.topic = topic
    div.remove()
    if (topic === origin) return
    el.text.textContent = node.topic
    this.linkDiv()
    this.bus.fire('operation', {
      name: 'finishEdit',
      obj: node,
      origin,
    })
  })
  //这里给双击进行编辑的节点添加paste事件，进行图片的粘贴
  div.addEventListener('paste', e => {
    const selectNode = el.nodeObj
    const items = e.clipboardData?.items;
    if (items) {
      for (let item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            //更改下文件的名称，因为粘贴时，图片的名称都是相同的，所以需要更改下名称, 使用node_id作为前缀
            uploadImage(this, selectNode, file);
          }
        }
      }
    }
  })
  console.timeEnd('editTopic')
}

function uploadImage(mind: MindElixirInstance, node: NodeObj, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('node_id', node.id);
  fetch(mind.apiInterface.uploadAPI, {
    method: 'POST',
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      console.log('Upload图片结果:', data)
      if (data.code === 0) {
        const imagePath = data.data.filePath; // 假设后台返回的 JSON 中有 imageUrl 字段
        const url = new URL(mind.apiInterface.uploadAPI); //这个URL和前端URL不一样，所以需要单独显示
        const prefix = `${url.protocol}//${url.host}`;
        const imageUrl = `${prefix}/${imagePath}`;
        InsertNodeImage(mind,node,imageUrl);
      } else {
        console.error('上传图片失败:', data.msg);
      }
    })
    .catch(error => {
      console.error('Error uploading image:', error);
    });
}

function InsertNodeImage(mind: MindElixirInstance, node: NodeObj, imageUrl: string) {
  // 获取当前选中的节点, 这个选中的节点总是为空
  const tpc = mind.findEle(node.id)
  // 插入图片到当前节点中
  const image = {
    url: imageUrl,
    height: 90,
    width: 90
  };
  node.image = image;
  // 更新节点的属性
  mind.reshapeNode(tpc, node);
}

export const createExpander = function (expanded: boolean | undefined): Expander {
  const expander = $d.createElement('me-epd') as Expander
  // if expanded is undefined, treat as expanded
  expander.expanded = expanded !== false
  expander.className = expanded !== false ? 'minus' : ''
  return expander
}
