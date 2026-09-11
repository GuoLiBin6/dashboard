/**
 * 从 vue-grid-layout 2.x helpers/utils 抽出的纯 JS（去掉 Flow），避免直接 import
 * node_modules/vue-grid-layout/src/helpers/utils.js 导致 esbuild 无法解析 `export type`。
 * 仅包含 Dashboard 编辑页 PatchedGridLayout.dragEvent 所需的 getLayoutItem / moveElement / compact。
 */

function collides (l1, l2) {
  if (l1 === l2) return false
  if (l1.x + l1.w <= l2.x) return false
  if (l1.x >= l2.x + l2.w) return false
  if (l1.y + l1.h <= l2.y) return false
  if (l1.y >= l2.y + l2.h) return false
  return true
}

function getFirstCollision (layout, layoutItem) {
  for (let i = 0, len = layout.length; i < len; i++) {
    if (collides(layout[i], layoutItem)) return layout[i]
  }
}

export function getAllCollisions (layout, layoutItem) {
  return layout.filter((l) => collides(l, layoutItem))
}

function getStatics (layout) {
  return layout.filter((l) => l.static)
}

export function getLayoutItem (layout, id) {
  for (let i = 0, len = layout.length; i < len; i++) {
    if (layout[i].i === id) return layout[i]
  }
}

export function sortLayoutItemsByRowCol (layout) {
  return [].concat(layout).sort(function (a, b) {
    if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
      return 1
    }
    return -1
  })
}

function compactItem (compareWith, l, verticalCompact) {
  if (verticalCompact) {
    while (l.y > 0 && !getFirstCollision(compareWith, l)) {
      l.y--
    }
  }
  let collidesWith
  while ((collidesWith = getFirstCollision(compareWith, l))) {
    l.y = collidesWith.y + collidesWith.h
  }
  return l
}

export function compact (layout, verticalCompact) {
  const compareWith = getStatics(layout)
  const sorted = sortLayoutItemsByRowCol(layout)
  const out = Array(layout.length)

  for (let i = 0, len = sorted.length; i < len; i++) {
    let l = sorted[i]

    if (!l.static) {
      l = compactItem(compareWith, l, verticalCompact)
      compareWith.push(l)
    }

    out[layout.indexOf(l)] = l
    l.moved = false
  }

  return out
}

function moveElementAwayFromCollision (layout, collidesWith, itemToMove, isUserAction) {
  const preventCollision = false
  if (isUserAction) {
    const fakeItem = {
      x: itemToMove.x,
      y: itemToMove.y,
      w: itemToMove.w,
      h: itemToMove.h,
      i: '-1',
    }
    fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0)
    if (!getFirstCollision(layout, fakeItem)) {
      return moveElement(layout, itemToMove, undefined, fakeItem.y, preventCollision)
    }
  }
  return moveElement(layout, itemToMove, undefined, itemToMove.y + 1, preventCollision)
}

export function moveElement (layout, l, x, y, isUserAction, preventCollision) {
  if (l.static) return layout

  const oldX = l.x
  const oldY = l.y

  const movingUp = y && l.y > y
  if (typeof x === 'number') l.x = x
  if (typeof y === 'number') l.y = y
  l.moved = true

  let sorted = sortLayoutItemsByRowCol(layout)
  if (movingUp) sorted = sorted.reverse()
  const collisions = getAllCollisions(sorted, l)

  if (preventCollision && collisions.length) {
    l.x = oldX
    l.y = oldY
    l.moved = false
    return layout
  }

  for (let i = 0, len = collisions.length; i < len; i++) {
    const collision = collisions[i]
    if (collision.moved) continue
    if (l.y > collision.y && l.y - collision.y > collision.h / 4) continue

    if (collision.static) {
      layout = moveElementAwayFromCollision(layout, collision, l, isUserAction)
    } else {
      layout = moveElementAwayFromCollision(layout, l, collision, isUserAction)
    }
  }

  return layout
}
