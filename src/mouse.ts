import type { SummarySvgGroup } from './summary'
import type { Expander, CustomSvg } from './types/dom'
import type { MindElixirInstance } from './types/index'
import { isTopic } from './utils'
import dragMoveHelper from './utils/dragMoveHelper'

export default function (mind: MindElixirInstance) {
  mind.map.addEventListener('click', e => {
    if (e.button !== 0) return
    if (mind.helper1?.moved) {
      mind.helper1.clear()
      return
    }

    if (mind.helper2?.moved) {
      mind.helper2.clear()
      return
    }
    if (dragMoveHelper.moved) {
      dragMoveHelper.clear()
      return
    }
    const target = e.target as any

    mind.clearSelection()
    // e.preventDefault() // can cause <a /> tags don't work

    if (target.classList && target.classList.contains('info-box')) {
      // 在info-box中点击，不进行处理
      return;
    }

    if (target.tagName === 'ME-EPD') {
      mind.expandNode((target as Expander).previousSibling)
    } else if (isTopic(target)) {
      mind.selectNode(target, false, e)
    } else if (!mind.editable) {
      return
    } else if (target.tagName === 'text') {
      if (target.dataset.type === 'custom-link') {
        mind.selectArrow(target.parentElement as CustomSvg)
      } else {
        mind.selectSummary(target.parentElement as unknown as SummarySvgGroup)
      }
    } else if (target.className === 'circle') {
      // skip circle
    }
  })

  mind.map.addEventListener('dblclick', e => {
    e.preventDefault()
    if (!mind.editable) return
    const target = e.target as HTMLElement
    if (isTopic(target)) {
      mind.beginEdit(target)
    } else if (target.tagName === 'text') {
      if (target.dataset.type === 'custom-link') {
        mind.editArrowLabel(target.parentElement as unknown as CustomSvg)
      } else {
        mind.editSummary(target.parentElement as unknown as SummarySvgGroup)
      }
    }
  })

  /**
   * drag and move the map
   */
  mind.map.addEventListener('mousemove', e => {
    // click trigger mousemove in windows chrome
    if ((e.target as HTMLElement).contentEditable !== 'true') {
      dragMoveHelper.onMove(e, mind.container)
    }
  })
  mind.map.addEventListener('mousedown', e => {
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton) return
    if ((e.target as HTMLElement).contentEditable !== 'true') {
      dragMoveHelper.moved = false
      dragMoveHelper.mousedown = true
    }
  })
  mind.map.addEventListener('mouseleave', e => {
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton) return
    dragMoveHelper.clear()
  })
  mind.map.addEventListener('mouseup', e => {
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton) return
    dragMoveHelper.clear()
  })
  mind.map.addEventListener('contextmenu', e => {
    e.preventDefault()
  })
  // 添加鼠标放上去的悬浮框功能， 不行，不好用，总是监听整个 map，而不是单个节点，不知道什么原因，应该遍历所有节点，然后添加事件监听器
  // mind.map.addEventListener('mouseenter', e => {
  //   const target = e.target as HTMLElement;
  //   console.log('Target:', target, 'Tag Name:', target.tagName);
  //   if (isTopic(target)) {
  //     const hoverBox = document.createElement('div');
  //     hoverBox.classList.add('hover-box');
  //     hoverBox.innerHTML = '<span class="like-icon">👍</span>';

  //     hoverBox.style.position = 'absolute';
  //     hoverBox.style.top = `${e.pageY - 30}px`;
  //     hoverBox.style.left = `${e.pageX}px`;

  //     document.body.appendChild(hoverBox);

  //     hoverBox.querySelector('.like-icon').addEventListener('click', () => {
  //       console.log('点赞被点击');
  //       // 处理点赞逻辑，例如增加点赞数等
  //     });

  //     target.addEventListener('mouseleave', () => {
  //       hoverBox.remove();
  //     }, { once: true });
  //   }
  // });
  // 为每个节点添加事件监听器，也不行，没找到原因
  const addEventListenersToNodes = () => {
    Array.from(mind.nodes.children).forEach(node => {
      if (isTopic(node)) {
        node.addEventListener('mouseenter', onMouseEnter);
        node.addEventListener('mouseleave', onMouseLeave);
      }
    });
  };

  const onMouseEnter = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const hoverBox = document.createElement('div');
    hoverBox.classList.add('hover-box');
    hoverBox.innerHTML = '<span class="like-icon">👍</span>';
    hoverBox.style.position = 'absolute';
    hoverBox.style.top = `${target.offsetTop - 30}px`;
    hoverBox.style.left = `${target.offsetLeft}px`;

    document.body.appendChild(hoverBox);

    hoverBox.querySelector('.like-icon')?.addEventListener('click', () => {
      console.log('点赞被点击');
      // 处理点赞逻辑，例如增加点赞数等
    });

    target.dataset.hoverBoxId = hoverBox.id = `hover-box-${Date.now()}`;
  };

  const onMouseLeave = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const hoverBoxId = target.dataset.hoverBoxId;
    if (hoverBoxId) {
      const hoverBox = document.getElementById(hoverBoxId);
      hoverBox?.remove();
      delete target.dataset.hoverBoxId;
    }
  };

  // 初始化时为所有节点添加事件监听器
  addEventListenersToNodes();

  // 监控节点变化，动态添加事件监听器
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && isTopic(node)) {
            node.addEventListener('mouseenter', onMouseEnter);
            node.addEventListener('mouseleave', onMouseLeave);
          }
        });
      }
    });
  });

  observer.observe(mind.map, { childList: true, subtree: true });
}
