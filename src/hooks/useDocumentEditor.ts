import { useReducer, useCallback } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import type { Root, List, ListItem, Paragraph, Text } from 'mdast'

/**
 * Editor state backed by Markdown AST - single source of truth
 */
export interface EditorState {
  ast: Root
  markdown: string
}

/**
 * Actions for modifying the document AST
 */
export type EditorAction =
  | { type: 'INIT'; markdown: string }
  | { type: 'UPDATE_NODE'; path: number[]; value: string }
  | { type: 'ADD_BULLET'; sectionIndex: number; position?: number; text?: string }
  | { type: 'REMOVE_BULLET'; sectionIndex: number; bulletIndex: number }
  | { type: 'MOVE_BULLET'; sectionIndex: number; fromIndex: number; toIndex: number }

/**
 * Parse markdown string to AST
 */
function parseMarkdown(markdown: string): Root {
  return unified().use(remarkParse).parse(markdown) as Root
}

/**
 * Stringify AST back to markdown
 */
function stringifyAst(ast: Root): string {
  return unified().use(remarkStringify, {
    bullet: '*',
    listItemIndent: 'one',
    emphasis: '*',
    strong: '*',
  }).stringify(ast)
}

/**
 * Safely get a node at the given path in the AST
 */
function getNodeAtPath(ast: Root, path: number[]): any {
  let node: any = ast
  for (const index of path) {
    if (!node.children || !node.children[index]) {
      return null
    }
    node = node.children[index]
  }
  return node
}

/**
 * Update text value at a specific path in the AST
 */
function updateNodeValue(ast: Root, path: number[], value: string): Root {
  const cloned = JSON.parse(JSON.stringify(ast)) as Root
  const parentPath = path.slice(0, -1)
  const targetIndex = path[path.length - 1]
  
  const parent: any = parentPath.length === 0 ? cloned : getNodeAtPath(cloned, parentPath)
  if (!parent || !parent.children) return cloned
  
  const target = parent.children[targetIndex]
  if (!target) return cloned
  
  // Update based on node type
  if (target.type === 'text') {
    target.value = value
  } else if (target.type === 'paragraph') {
    target.children = [{ type: 'text', value } as Text]
  } else if (target.type === 'heading' || target.type === 'strong') {
    target.children = [{ type: 'text', value } as Text]
  }
  
  return cloned
}

/**
 * Find the list node in a section (creates one if missing)
 */
function ensureListInSection(section: any): List {
  let list = section.children?.find((child: any) => child.type === 'list') as List | undefined
  
  if (!list) {
    list = {
      type: 'list',
      ordered: false,
      spread: false,
      children: [],
    } as List
    section.children = [...(section.children || []), list]
  }
  
  return list
}

/**
 * Add a bullet point to a section
 */
function addBulletToSection(ast: Root, sectionIndex: number, position?: number, text = ''): Root {
  const cloned = JSON.parse(JSON.stringify(ast)) as Root
  const section = cloned.children[sectionIndex] as any
  if (!section || !section.children) return cloned
  
  const list = ensureListInSection(section)
  const pos = position ?? list.children.length
  
  const newItem: ListItem = {
    type: 'listItem',
    spread: false,
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', value: text } as Text],
      } as Paragraph,
    ],
  }
  
  list.children = [
    ...list.children.slice(0, pos),
    newItem,
    ...list.children.slice(pos),
  ]
  
  return cloned
}

/**
 * Remove a bullet point from a section
 */
function removeBulletFromSection(ast: Root, sectionIndex: number, bulletIndex: number): Root {
  const cloned = JSON.parse(JSON.stringify(ast)) as Root
  const section = cloned.children[sectionIndex] as any
  if (!section || !section.children) return cloned
  
  const list = section.children.find((child: any) => child.type === 'list') as List | undefined
  if (!list) return cloned
  
  list.children = list.children.filter((_: any, i: number) => i !== bulletIndex)
  
  return cloned
}

/**
 * Move a bullet point within a section
 */
function moveBulletInSection(ast: Root, sectionIndex: number, fromIndex: number, toIndex: number): Root {
  const cloned = JSON.parse(JSON.stringify(ast)) as Root
  const section = cloned.children[sectionIndex] as any
  if (!section || !section.children) return cloned
  
  const list = section.children.find((child: any) => child.type === 'list') as List | undefined
  if (!list || fromIndex < 0 || fromIndex >= list.children.length) return cloned
  
  const items = [...list.children]
  const [movedItem] = items.splice(fromIndex, 1)
  const safeToIndex = Math.max(0, Math.min(toIndex, items.length))
  items.splice(safeToIndex, 0, movedItem)
  
  list.children = items
  
  return cloned
}

/**
 * Reducer to manage document state via AST transformations
 */
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  let newAst: Root
  
  switch (action.type) {
    case 'INIT':
      newAst = parseMarkdown(action.markdown)
      return {
        ast: newAst,
        markdown: stringifyAst(newAst),
      }
      
    case 'UPDATE_NODE':
      newAst = updateNodeValue(state.ast, action.path, action.value)
      return {
        ast: newAst,
        markdown: stringifyAst(newAst),
      }
      
    case 'ADD_BULLET':
      newAst = addBulletToSection(state.ast, action.sectionIndex, action.position, action.text)
      return {
        ast: newAst,
        markdown: stringifyAst(newAst),
      }
      
    case 'REMOVE_BULLET':
      newAst = removeBulletFromSection(state.ast, action.sectionIndex, action.bulletIndex)
      return {
        ast: newAst,
        markdown: stringifyAst(newAst),
      }
      
    case 'MOVE_BULLET':
      newAst = moveBulletInSection(state.ast, action.sectionIndex, action.fromIndex, action.toIndex)
      return {
        ast: newAst,
        markdown: stringifyAst(newAst),
      }
      
    default:
      return state
  }
}

/**
 * Custom hook encapsulating document editing logic with AST-backed state
 * Separates business logic from view layer
 */
export function useDocumentEditor(initialMarkdown: string) {
  const initialState: EditorState = {
    ast: parseMarkdown(initialMarkdown),
    markdown: initialMarkdown,
  }
  
  const [state, dispatch] = useReducer(editorReducer, initialState)
  
  const init = useCallback((markdown: string) => {
    dispatch({ type: 'INIT', markdown })
  }, [])
  
  const updateNode = useCallback((path: number[], value: string) => {
    dispatch({ type: 'UPDATE_NODE', path, value })
  }, [])
  
  const addBullet = useCallback((sectionIndex: number, position?: number, text?: string) => {
    dispatch({ type: 'ADD_BULLET', sectionIndex, position, text })
  }, [])
  
  const removeBullet = useCallback((sectionIndex: number, bulletIndex: number) => {
    dispatch({ type: 'REMOVE_BULLET', sectionIndex, bulletIndex })
  }, [])
  
  const moveBullet = useCallback((sectionIndex: number, fromIndex: number, toIndex: number) => {
    dispatch({ type: 'MOVE_BULLET', sectionIndex, fromIndex, toIndex })
  }, [])
  
  return {
    state,
    init,
    updateNode,
    addBullet,
    removeBullet,
    moveBullet,
  }
}
