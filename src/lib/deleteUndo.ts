import type { Bookmark } from '../types';

/**
 * 一次删除的完整现场。
 *
 * 只记"被删的这棵子树 + 它原来挂在哪"，而不是整份书签快照——
 * 这样撤销时只把这一棵放回去，不会顺手把用户在这几秒里做的其他改动一起回滚。
 */
export interface DeletedNode {
  node: Bookmark;
  /** 父文件夹 id；null 表示挂在桌面根上。 */
  parentId: string | null;
  /** 在父容器里的原始下标，用于放回原位。 */
  index: number;
  /** 删除前是否钉在 Dock 上。 */
  inDock: boolean;
}

/** 深度优先找节点及其父容器与下标。 */
export function locateNode(
  items: Bookmark[],
  id: string,
  parentId: string | null = null
): { node: Bookmark; parentId: string | null; index: number } | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.id === id) return { node: item, parentId, index: i };
    if (item.children) {
      const found = locateNode(item.children, id, item.id);
      if (found) return found;
    }
  }
  return null;
}

export function captureDelete(bookmarks: Bookmark[], dockItems: string[], id: string): DeletedNode | null {
  const located = locateNode(bookmarks, id);
  if (!located) return null;
  return {
    node: located.node,
    parentId: located.parentId,
    index: located.index,
    inDock: dockItems.includes(id),
  };
}

/**
 * 把删除的节点放回原处。
 *
 * 父文件夹可能在这几秒里也被删掉了——那就退回桌面根，至少不丢数据。
 * 其余情况按原始下标插回，保持用户看到的顺序。
 */
export function restoreDeleted(
  bookmarks: Bookmark[],
  dockItems: string[],
  deleted: DeletedNode
): { bookmarks: Bookmark[]; dockItems: string[] } {
  const insertInto = (items: Bookmark[]): Bookmark[] => {
    const next = [...items];
    const at = Math.max(0, Math.min(deleted.index, next.length));
    next.splice(at, 0, deleted.node);
    return next;
  };

  const parentExists =
    deleted.parentId !== null && locateNode(bookmarks, deleted.parentId) !== null;

  let nextBookmarks: Bookmark[];
  if (deleted.parentId !== null && parentExists) {
    const addToParent = (items: Bookmark[]): Bookmark[] =>
      items.map((item): Bookmark => {
        if (item.id === deleted.parentId && item.type === 'folder') {
          return { ...item, children: insertInto(item.children ?? []) };
        }
        if (item.children) {
          return { ...item, children: addToParent(item.children) };
        }
        return item;
      });
    nextBookmarks = addToParent(bookmarks);
  } else {
    nextBookmarks = insertInto(bookmarks);
  }

  const nextDock = deleted.inDock && !dockItems.includes(deleted.node.id)
    ? [...dockItems, deleted.node.id]
    : dockItems;

  return { bookmarks: nextBookmarks, dockItems: nextDock };
}
