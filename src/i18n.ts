type LangPack = {
  answerChild: string
  addChild: string
  addParent: string
  addSibling: string
  removeNode: string
  focus: string
  cancelFocus: string
  moveUp: string
  moveDown: string
  link: string
  clickTips: string
  summary: string
}
const cn = {
  answerChild: '回答并插入子节点',
  addChild: '插入子节点',
  addParent: '插入父节点',
  addSibling: '插入同级节点',
  removeNode: '删除节点',
  focus: '专注',
  cancelFocus: '取消专注',
  moveUp: '上移',
  moveDown: '下移',
  link: '连接',
  clickTips: '请点击目标节点',
  summary: '摘要',
}
const i18n: Record<string, LangPack> = {
  cn,
  zh_CN: cn,
  zh_TW: {
    answerChild: '回答并插入子節點',
    addChild: '插入子節點',
    addParent: '插入父節點',
    addSibling: '插入同級節點',
    removeNode: '刪除節點',
    focus: '專注',
    cancelFocus: '取消專注',
    moveUp: '上移',
    moveDown: '下移',
    link: '連接',
    clickTips: '請點擊目標節點',
    summary: '摘要',
  },
  en: {
    answerChild: 'Answer and Add child',
    addChild: 'Add child',
    addParent: 'Add parent',
    addSibling: 'Add sibling',
    removeNode: 'Remove node',
    focus: 'Focus Mode',
    cancelFocus: 'Cancel Focus Mode',
    moveUp: 'Move up',
    moveDown: 'Move down',
    link: 'Link',
    clickTips: 'Please click the target node',
    summary: 'Summary',
  },
  ru: {
    answerChild: 'Добавить дочерний элемент',
    addChild: 'Добавить дочерний элемент',
    addParent: 'Добавить родительский элемент',
    addSibling: 'Добавить на этом уровне',
    removeNode: 'Удалить узел',
    focus: 'Режим фокусировки',
    cancelFocus: 'Отменить режим фокусировки',
    moveUp: 'Поднять выше',
    moveDown: 'Опустить ниже',
    link: 'Ссылка',
    clickTips: 'Пожалуйста, нажмите на целевой узел',
    summary: 'Описание',
  },
  ja: {
    answerChild: '子ノードを追加する',
    addChild: '子ノードを追加する',
    addParent: '親ノードを追加します',
    addSibling: '兄弟ノードを追加する',
    removeNode: 'ノードを削除',
    focus: '集中',
    cancelFocus: '集中解除',
    moveUp: '上へ移動',
    moveDown: '下へ移動',
    link: 'コネクト',
    clickTips: 'ターゲットノードをクリックしてください',
    summary: '概要',
  },
  pt: {
    answerChild: 'Adicionar item filho',
    addChild: 'Adicionar item filho',
    addParent: 'Adicionar item pai',
    addSibling: 'Adicionar item irmao',
    removeNode: 'Remover item',
    focus: 'Modo Foco',
    cancelFocus: 'Cancelar Modo Foco',
    moveUp: 'Mover para cima',
    moveDown: 'Mover para baixo',
    link: 'Link',
    clickTips: 'Favor clicar no item alvo',
    summary: 'Resumo',
  },
  it: {
    answerChild: 'Aggiungi figlio',
    addChild: 'Aggiungi figlio',
    addParent: 'Aggiungi genitore',
    addSibling: 'Aggiungi fratello',
    removeNode: 'Rimuovi nodo',
    focus: 'Modalità Focus',
    cancelFocus: 'Annulla Modalità Focus',
    moveUp: 'Sposta su',
    moveDown: 'Sposta giù',
    link: 'Collega',
    clickTips: 'Si prega di fare clic sul nodo di destinazione',
    summary: 'Unisci nodi',
  },
  es: {
    answerChild: 'Agregar hijo',
    addChild: 'Agregar hijo',
    addParent: 'Agregar padre',
    addSibling: 'Agregar hermano',
    removeNode: 'Eliminar nodo',
    focus: 'Modo Enfoque',
    cancelFocus: 'Cancelar Modo Enfoque',
    moveUp: 'Mover hacia arriba',
    moveDown: 'Mover hacia abajo',
    link: 'Enlace',
    clickTips: 'Por favor haga clic en el nodo de destino',
    summary: 'Resumen',
  },
}

export default i18n
