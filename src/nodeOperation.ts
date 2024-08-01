import './nodeOperation.less'
import { fillParent, refreshIds, unionTopics, generateUUID } from './utils/index'
import { findEle, createExpander, shapeTpc } from './utils/dom'
import { deepClone } from './utils/index'
import type { Topic } from './types/dom'
import type { MindElixirInstance, NodeObj } from './types/index'
import { insertNodeObj, insertParentNodeObj, moveUpObj, moveDownObj, removeNodeObj, moveNodeObj } from './utils/objectManipulation'
import { addChildDom, removeNodeDom } from './utils/domManipulation'

const typeMap: Record<string, InsertPosition> = {
  before: 'beforebegin',
  after: 'afterend',
}

export const rmSubline = function (tpc: Topic) {
  const mainNode = tpc.parentElement.parentElement
  const lc = mainNode.lastElementChild
  if (lc?.tagName === 'svg') lc?.remove() // clear svg group of main node
}
//reshapeNode： tpc是原节点， patchData是修改后的节点
export const reshapeNode = function (this: MindElixirInstance, tpc: Topic, patchData: NodeObj) {
  const nodeObj = tpc.nodeObj
  const origin = deepClone(nodeObj)
  // merge styles
  if (origin.style && patchData.style) {
    patchData.style = Object.assign(origin.style, patchData.style)
  }
  const newObj = Object.assign(nodeObj, patchData)
  shapeTpc(tpc, newObj)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'reshapeNode',
    obj: newObj,
    origin,
  })
}

const addChildFunc = function (mei: MindElixirInstance, tpc: Topic, node?: NodeObj) {
  //支持node是多个节点的嵌套类型
  if (!tpc) return null
  const nodeObj = tpc.nodeObj
  if (nodeObj.expanded === false) {
    mei.expandNode(tpc, true)
    // dom had resetted
    tpc = findEle(nodeObj.id) as Topic
  }
  const newNodeObj = node || mei.generateNewObj()
  if (nodeObj.children) nodeObj.children.push(newNodeObj)
  else nodeObj.children = [newNodeObj]
  fillParent(mei.nodeData)

  const { grp, top: newTop } = mei.createWrapper(newNodeObj)
  addChildDom(mei, tpc, grp)
  return { newTop, newNodeObj }
}

export const insertSibling = function (this: MindElixirInstance, type: 'before' | 'after', el?: Topic, node?: NodeObj) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    this.addChild()
    return
  } else if (nodeObj.parent?.root === true && nodeObj.parent?.children?.length === 1) {
    // add at least one node to another side
    this.addChild(findEle(nodeObj.parent!.id), node)
    return
  }
  const newNodeObj = node || this.generateNewObj()
  insertNodeObj(newNodeObj, type, nodeObj)
  fillParent(this.nodeData)
  const t = nodeEle.parentElement
  console.time('insertSibling_DOM')

  const { grp, top } = this.createWrapper(newNodeObj)

  t.parentElement.insertAdjacentElement(typeMap[type], grp)

  this.linkDiv(grp.offsetParent)

  if (!node) {
    this.editTopic(top.firstChild)
  }
  this.selectNode(top.firstChild, true)
  console.timeEnd('insertSibling_DOM')
  this.bus.fire('operation', {
    name: 'insertSibling',
    type,
    obj: newNodeObj,
  })
}

export const insertParent = function (this: MindElixirInstance, el?: Topic, node?: NodeObj) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  rmSubline(nodeEle)
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    return
  }
  const newNodeObj = node || this.generateNewObj()
  insertParentNodeObj(nodeObj, newNodeObj)
  fillParent(this.nodeData)

  const grp0 = nodeEle.parentElement.parentElement
  console.time('insertParent_DOM')
  const { grp, top } = this.createWrapper(newNodeObj, true)
  top.appendChild(createExpander(true))
  grp0.insertAdjacentElement('afterend', grp)

  const c = this.createChildren([grp0])
  top.insertAdjacentElement('afterend', c)

  this.linkDiv()

  if (!node) {
    this.editTopic(top.firstChild)
  }
  this.selectNode(top.firstChild, true)
  console.timeEnd('insertParent_DOM')
  this.bus.fire('operation', {
    name: 'insertParent',
    obj: newNodeObj,
  })
}

export const answerChild = async function (this: MindElixirInstance, el?: Topic, node?: NodeObj, isRetry?: boolean) {
  //对该节点进行问答，生成新的节点。el:是要回答问题的节点，node:表示新生成的节点的模版,暂时不用。如果已经存在node，说明是用户点击了retry重新生成的按钮
  //是否是用户点击了retry按钮，如果存在已有节点，说明用户点击了retry按钮
  console.time('answerChild')
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  // 创建一个 loading 状态的图标
  const loadingElement = document.createElement('div');
  loadingElement.innerHTML = 'Loading...'; // 可以换成你的加载图标
  loadingElement.style.position = 'fixed';
  loadingElement.style.top = '50%';
  loadingElement.style.left = '50%';
  loadingElement.style.transform = 'translate(-50%, -50%)';
  loadingElement.style.backgroundColor = '#fff';
  loadingElement.style.padding = '10px';
  loadingElement.style.borderRadius = '5px';
  loadingElement.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';
  document.body.appendChild(loadingElement); // 添加到 DOM 中显示加载状态
  if (this.apiInterface?.answerAPI) {
    //获取模型返回结果,this.apiInterface.answerAPI 是1个api 的url地址,使用fetch请求获取数据, Post 请求, 请求的参数是nodeEle.nodeObj
    try {
      let token = '';
      if (this.apiInterface.headerToken) {
        token = localStorage.getItem(this.apiInterface.headerToken) || '';
      }
      const response = await fetch(this.apiInterface.answerAPI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          node_id: nodeEle.nodeObj.id,
          nodes: this.getData(),
          language: this.locale,
          singleNode: this.apiInterface.singleNode,
          isRetry: isRetry,
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // 根据获取的数据进行相应的处理
      console.log('API response:', data)
      if (data.code === 0) {
        const nodesArray: NodeObj[] = data.data //告诉编译器返回的数据类型，防止警告
        if (nodesArray.length === 0) {
          //如果返回的节点个数为1个，大概率是单节点模式，如果是多个，应该是多节点模式
          alert(`No data returned from the API, ${data.msg}`)
        } else if (nodesArray.length === 1) {
          //返回节点数量为1个，创建1个新的节点即可
          node = nodesArray[0]
          node['aiAnswer'] = true
          const res = addChildFunc(this, nodeEle, node)
          if (!res) return
          const { newTop, newNodeObj } = res
          this.bus.fire('operation', {
            name: 'answerChild',
            obj: newNodeObj,
          })
          console.timeEnd('answerChild')
          if (!node) {
            this.editTopic(newTop.firstChild)
          }
          this.selectNode(newTop.firstChild, true) //true表示，这是1个新的节点
        } else {
          //返回节点数量大于1个，创建多个新的节点, 有一个bug，这里嵌套的node的回答没有添加aiAnswer属性
          nodesArray.forEach((nodeData) => {
            nodeData['aiAnswer'] = true;
            const res = addChildFunc(this, nodeEle, nodeData);
            if (!res) return;
            const { newTop, newNodeObj } = res;
            this.bus.fire('operation', {
              name: 'answerChild',
              obj: newNodeObj,
            });
            if (!node) {
              this.editTopic(newTop.firstChild)
            }
            // this.selectNode(newTop.firstChild, true) //true表示，这是1个新的节点, 多个节点，就不选中了
          });
          console.timeEnd('answerChild');
        }
      } else {
        alert(`Failed to fetch data from the API, ${data.msg}`)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      alert(`Failed to fetch data from the API, ${this.apiInterface.answerAPI}`)
    }
  } else {
    alert('options里面的apiInterface中的answerAPI is not defined')
  }
  // 移除 loading 状态图标
  document.body.removeChild(loadingElement);
}

const getBaseUrl = (url: string): string => {
  const { protocol, hostname, port } = new URL(url);
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/`;
};

export const upload = async function (this: MindElixirInstance, el?: Topic, node?: NodeObj) {
  // 上传文件到节点，并且节点附加文件属性
  console.time('upload');
  const nodeEle = el || this.currentNode;
  if (!nodeEle) {
    console.error('No node selected');
    return;
  }

  if (!this.apiInterface?.uploadAPI) {
    alert('The uploadAPI is not defined in the apiInterface');
    return;
  }

  // 创建一个文件选择对话框
  const input = document.createElement('input');
  input.type = 'file';
  // input.accept = 'image/*'; // 接受任何文件，就不设置了
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) {
      alert('No file selected');
      return;
    }

    // 创建 FormData 对象
    const formData = new FormData();
    formData.append('file', file);

    let token = '';
    if (this.apiInterface.headerToken) {
      token = localStorage.getItem(this.apiInterface.headerToken) || '';
    }
    // 强制将 this.apiInterface.uploadAPI 断言为 string 类型
    const uploadAPI: string = this.apiInterface.uploadAPI;
    try {
      // 上传文件到服务器
      const response = await fetch(uploadAPI, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Include other headers if necessary
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      if (data.code === 0) {
        let patchData = node || nodeEle.nodeObj
        if (data.data.is_image) {
          // 用户上传的是图片，那么就显示图片
          const imgPath = data.data.filePath;
          // const baseUrl = getBaseUrl(uploadAPI); //对于服务器上的图片，不需要baseurl前缀
          const imgUrl = `/${imgPath}`;
          let patchData = node || nodeEle.nodeObj
          patchData.image = {
            url: imgUrl,
            name: data.data.filename,
            height: 90,
            width: 90
          }
        } else {
          // 普通的文件
          const filePath = data.data.filePath;
          const filename = data.data.filename;
          // const baseUrl = getBaseUrl(uploadAPI); //对于服务器上的图片，不需要baseurl前缀
          const fileUrl = `/${filePath}`;
          patchData.file = {
            url: fileUrl,
            name: filename,
          }
        }
        const res = this.reshapeNode(nodeEle, patchData);
        this.bus.fire('operation', {
          name: 'upload',
          obj: patchData,
        });

        console.timeEnd('upload');
      } else {
        alert(`Failed to fetch data from the API, ${data.msg}`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Failed to fetch data from the API, ${this.apiInterface.uploadAPI}`);
    }
  };

  // 触发文件选择对话框
  input.click();
};

export const deleteFile = async function (this: MindElixirInstance, filename: string) {
  console.time('deleteFile');
  
  if (!this.apiInterface?.uploadAPI) {
    alert('The uploadAPI is not defined in the apiInterface');
    return;
  }

  try {
    // 强制将 this.apiInterface.uploadAPI 断言为 string 类型
    const deleteAPI: string = this.apiInterface.uploadAPI;

    // 创建请求体
    const body = JSON.stringify({ filename });

    // 发送 DELETE 请求
    const response = await fetch(deleteAPI, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response:', data);

    if (data.code === 0) {
      console.log(`File ${filename} deleted successfully.`);
      // 删除成功后，进行相应处理，比如更新节点数据或UI
    } else {
      alert(`Failed to delete file from the API, ${data.msg}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    alert(`Failed to delete file from the API, ${this.apiInterface.uploadAPI}`);
  }

  console.timeEnd('deleteFile');
};


export const addChild = function (this: MindElixirInstance, el?: Topic, node?: NodeObj) {
  console.time('addChild')
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const res = addChildFunc(this, nodeEle, node)
  if (!res) return
  const { newTop, newNodeObj } = res
  this.bus.fire('operation', {
    name: 'addChild',
    obj: newNodeObj,
  })
  console.timeEnd('addChild')
  if (!node) {
    this.editTopic(newTop.firstChild)
  }
  this.selectNode(newTop.firstChild, true)
}

export const copyNode = function (this: MindElixirInstance, node: Topic, to: Topic) {
  console.time('copyNode')
  const deepCloneObj = deepClone(node.nodeObj)
  refreshIds(deepCloneObj)
  const res = addChildFunc(this, to, deepCloneObj)
  if (!res) return
  const { newNodeObj } = res
  console.timeEnd('copyNode')
  this.selectNode(findEle(newNodeObj.id))
  this.bus.fire('operation', {
    name: 'copyNode',
    obj: newNodeObj,
  })
}

export const copyNodes = function (this: MindElixirInstance, tpcs: Topic[], to: Topic) {
  tpcs = unionTopics(tpcs)
  const objs = []
  for (let i = 0; i < tpcs.length; i++) {
    const node = tpcs[i]
    const deepCloneObj = deepClone(node.nodeObj)
    refreshIds(deepCloneObj)
    const res = addChildFunc(this, to, deepCloneObj)
    if (!res) return
    const { newNodeObj } = res
    objs.push(newNodeObj)
  }
  this.selectNodes(objs.map(obj => findEle(obj.id)))
  this.bus.fire('operation', {
    name: 'copyNodes',
    objs,
  })
}

export const moveUpNode = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const obj = nodeEle.nodeObj
  moveUpObj(obj)
  const grp = nodeEle.parentNode.parentNode
  grp.parentNode.insertBefore(grp, grp.previousSibling)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveUpNode',
    obj,
  })
}

export const moveDownNode = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const obj = nodeEle.nodeObj
  moveDownObj(obj)
  const grp = nodeEle.parentNode.parentNode
  if (grp.nextSibling) {
    grp.nextSibling.insertAdjacentElement('afterend', grp)
  } else {
    grp.parentNode.prepend(grp)
  }
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveDownNode',
    obj,
  })
}

export const removeNode = function (this: MindElixirInstance, el?: Topic) {
  const tpc = el || this.currentNode
  if (!tpc) return
  const nodeObj = tpc.nodeObj
  if (nodeObj.root === true) {
    throw new Error('Can not remove root node')
  }
  const siblings = nodeObj.parent!.children!
  const i = siblings.findIndex(node => node === nodeObj)
  const siblingLength = removeNodeObj(nodeObj)
  removeNodeDom(tpc, siblingLength)

  // automatically select sibling or parent
  if (siblings.length !== 0) {
    const sibling = siblings[i] || siblings[i - 1]
    this.selectNode(findEle(sibling.id))
  } else {
    this.selectNode(findEle(nodeObj.parent!.id))
  }

  this.linkDiv()
  this.bus.fire('operation', {
    name: 'removeNode',
    obj: nodeObj,
    originIndex: i,
    originParentId: nodeObj?.parent?.id,
  })
}

export const removeNodes = function (this: MindElixirInstance, tpcs: Topic[]) {
  tpcs = unionTopics(tpcs)
  for (const tpc of tpcs) {
    const nodeObj = tpc.nodeObj
    if (nodeObj.root === true) {
      continue
    }
    const siblingLength = removeNodeObj(nodeObj)
    removeNodeDom(tpc, siblingLength)
  }
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'removeNodes',
    objs: tpcs.map(tpc => tpc.nodeObj),
  })
}

export const moveNodeIn = function (this: MindElixirInstance, from: Topic[], to: Topic) {
  from = unionTopics(from)
  const toObj = to.nodeObj
  if (toObj.expanded === false) {
    // TODO
    this.expandNode(to, true)
    to = findEle(toObj.id) as Topic
  }
  // if (!checkMoveValid(obj, toObj)) {
  //   console.warn('Invalid move')
  //   return
  // }
  console.time('moveNodeIn')
  for (const f of from) {
    const obj = f.nodeObj
    moveNodeObj('in', obj, toObj)
    fillParent(this.nodeData) // update parent property
    const fromTop = f.parentElement
    addChildDom(this, to, fromTop.parentElement)
  }
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNodeIn',
    objs: from.map(f => f.nodeObj),
    toObj,
  })
  console.timeEnd('moveNodeIn')
}

const moveNode = (from: Topic[], type: 'before' | 'after', to: Topic, mei: MindElixirInstance) => {
  from = unionTopics(from)
  if (type === 'after') {
    from = from.reverse()
  }
  const toObj = to.nodeObj
  for (const f of from) {
    const obj = f.nodeObj
    moveNodeObj(type, obj, toObj)
    fillParent(mei.nodeData)
    rmSubline(f)
    const fromGrp = f.parentElement.parentNode
    const toGrp = to.parentElement.parentNode
    toGrp.insertAdjacentElement(typeMap[type], fromGrp)
  }
  mei.linkDiv()
  mei.bus.fire('operation', {
    name: type === 'before' ? 'moveNodeBefore' : 'moveNodeAfter',
    objs: from.map(f => f.nodeObj),
    toObj,
  })
}

export const moveNodeBefore = function (this: MindElixirInstance, from: Topic[], to: Topic) {
  moveNode(from, 'before', to, this)
}

export const moveNodeAfter = function (this: MindElixirInstance, from: Topic[], to: Topic) {
  moveNode(from, 'after', to, this)
}

export const beginEdit = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  if (nodeEle.nodeObj.dangerouslySetInnerHTML) return
  // 设置 currentNode 为选中的节点
  this.currentNode = nodeEle
  this.editTopic(nodeEle)
}

export const setNodeTopic = function (this: MindElixirInstance, el: Topic, topic: string) {
  el.text.textContent = topic
  el.nodeObj.topic = topic
  this.linkDiv()
}
