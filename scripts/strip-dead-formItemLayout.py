#!/usr/bin/env python3
"""
Remove dead formItemLayout / formLayout span bindings overridden by ocLayoutForm.
Does NOT touch trailing commas / unrelated formatting.
KEEP: oc-layout-form-off, layout vertical/inline, offset objects.
"""
from __future__ import annotations

import os
import re

SKIP_DIRS = {'node_modules', 'dist', '.git', 'scripts'}
ROOTS = ['dashboard', 'dashboard-ee']
NAMES = ('formItemLayout', 'formLayout')


def extract_brace_block(text: str, open_idx: int):
  if open_idx >= len(text) or text[open_idx] != '{':
    return None
  depth = 0
  i = open_idx
  while i < len(text):
    if text[i] == '{':
      depth += 1
    elif text[i] == '}':
      depth -= 1
      if depth == 0:
        return text[open_idx : i + 1], i + 1
    i += 1
  return None


def top_level_keys(obj: str) -> set[str]:
  keys = set()
  for m in re.finditer(r'([a-zA-Z_][\w]*)\s*:', obj):
    pos = m.start()
    depth = obj[:pos].count('{') - obj[:pos].count('}')
    if depth == 1:
      keys.add(m.group(1))
  return keys


def is_removable_layout_obj(obj: str) -> bool:
  if 'offset' in obj:
    return False
  if re.search(r'\b(style|flex|width|minWidth|maxWidth)\b', obj):
    return False
  keys = top_level_keys(obj)
  if not keys or (keys - {'labelCol', 'wrapperCol'}):
    return False
  # allow nested span / responsive breakpoint keys only
  for m in re.finditer(r'([a-zA-Z_][\w]*)\s*:', obj):
    pos = m.start()
    depth = obj[:pos].count('{') - obj[:pos].count('}')
    key = m.group(1)
    if depth >= 2 and key not in {'span', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'labelCol', 'wrapperCol'}:
      return False
  return True


def should_skip_file(text: str) -> bool:
  if 'oc-layout-form-off' in text:
    return True
  if re.search(
    r'''(?:layout\s*=\s*["'](?:vertical|inline)["'])|(?::layout\s*=\s*["'](?:vertical|inline)["'])''',
    text,
  ):
    return True
  return False


def remove_bindings(text: str, name: str) -> str:
  patterns = [
    re.compile(rf'''\s*v-bind=(["']){name}\1'''),
    re.compile(rf'''\s*:formItemLayout=(["']){name}\1'''),
    re.compile(rf'''\s*:form-item-layout=(["']){name}\1'''),
    re.compile(rf'''\s*:formLayout=(["']){name}\1'''),
    re.compile(rf'''\s*:form-layout=(["']){name}\1'''),
    re.compile(rf'''\s*:labelCol=(["']){name}\.labelCol\1'''),
    re.compile(rf'''\s*:label-col=(["']){name}\.labelCol\1'''),
    re.compile(rf'''\s*:wrapperCol=(["']){name}\.wrapperCol\1'''),
    re.compile(rf'''\s*:wrapper-col=(["']){name}\.wrapperCol\1'''),
    re.compile(rf'''\s*v-bind=(["'])slotProps\.{name}\1'''),
  ]
  out = text
  for pat in patterns:
    out = pat.sub('', out)

  def repl_inline(m):
    obj = m.group('obj')
    if 'offset' in obj:
      return m.group(0)
    compact = re.sub(r'\s+', ' ', obj).strip()
    if re.fullmatch(r'\{\s*span\s*:\s*\d+\s*,?\s*\}', compact):
      return ''
    return m.group(0)

  # only strip pure span inline cols (no offset)
  pat_inline = re.compile(
    r'''\s*:(?:label-col|labelCol|wrapper-col|wrapperCol)=(?P<q>["'])(?P<obj>\{(?:[^{}]|\{[^{}]*\})*\})(?P=q)''',
    re.S,
  )
  out = pat_inline.sub(repl_inline, out)
  return out


def remove_prop_defs(text: str, name: str) -> str:
  out = []
  i = 0
  pat = re.compile(rf'{name}\s*:\s*')
  while True:
    m = pat.search(text[i:])
    if not m:
      out.append(text[i:])
      break
    abs_start = i + m.start()
    out.append(text[i:abs_start])
    after = i + m.end()
    peek = text[after:].lstrip()
    # keep prop type definitions for now (second pass removes unused)
    if peek.startswith('{') and re.match(r'\{\s*(type|required|default)\s*:', peek):
      out.append(text[abs_start:after])
      i = after
      continue
    m_alias = re.match(r'(this\.[A-Za-z_][\w.]*)\s*,?', text[after:])
    if m_alias and not peek.startswith('{'):
      j = after + m_alias.end()
      while j < len(text) and text[j] in ' \t':
        j += 1
      if j < len(text) and text[j] == ',':
        j += 1
      if j < len(text) and text[j] == '\n':
        j += 1
      i = j
      continue
    ws = re.match(r'\s*', text[after:])
    brace_at = after + (ws.end() if ws else 0)
    if brace_at >= len(text) or text[brace_at] != '{':
      out.append(text[abs_start:after])
      i = after
      continue
    block = extract_brace_block(text, brace_at)
    if not block:
      out.append(text[abs_start:after])
      i = after
      continue
    obj, end = block
    if is_removable_layout_obj(obj):
      j = end
      while j < len(text) and text[j] in ' \t':
        j += 1
      if j < len(text) and text[j] == ',':
        j += 1
      if j < len(text) and text[j] == '\n':
        j += 1
      i = j
      continue
    out.append(text[abs_start:end])
    i = end
  return ''.join(out)


def remove_unused_symbol(text: str, name: str) -> str:
  """If name no longer actively used, drop prop defs / imports / data shorthand / computed / export."""
  if re.search(
    rf'v-bind=(["\']){name}\1|:form-layout=(["\']){name}\2|:formLayout=(["\']){name}\3|'
    rf'this\.{name}|slotProps\.{name}|params\.{name}|export const {name}',
    text,
  ):
    return text

  # computed name () { return { labelCol... } }
  m = re.search(rf'{name}\s*\(\s*\)\s*\{{', text)
  if m:
    brace = text.find('{', m.end() - 1)
    block = extract_brace_block(text, brace)
    if block:
      obj, end = block
      if 'labelCol' in obj or 'wrapperCol' in obj:
        j = end
        while j < len(text) and text[j] in ' \t':
          j += 1
        if j < len(text) and text[j] == ',':
          j += 1
        if j < len(text) and text[j] == '\n':
          j += 1
        text = text[: m.start()] + text[j:]

  # prop / data object formItemLayout: { type / default / labelCol }
  text = remove_prop_defs(text, name)  # will skip non-layout? already removed layouts; remove prop types if unused
  # force-remove remaining `name: { type...}` / `name: { default: null }`
  out = []
  i = 0
  pat = re.compile(rf'{name}\s*:\s*')
  while True:
    m = pat.search(text[i:])
    if not m:
      out.append(text[i:])
      break
    abs_start = i + m.start()
    after = i + m.end()
    out.append(text[i:abs_start])
    peek = text[after:].lstrip()
    if peek.startswith('{'):
      ws = len(text[after:]) - len(peek)
      brace_at = after + ws
      block = extract_brace_block(text, brace_at)
      if block:
        obj, end = block
        if re.search(r'\b(type|required|default)\s*:', obj) or is_removable_layout_obj(obj):
          j = end
          while j < len(text) and text[j] in ' \t':
            j += 1
          if j < len(text) and text[j] == ',':
            j += 1
          if j < len(text) and text[j] == '\n':
            j += 1
          i = j
          continue
    out.append(text[abs_start:after])
    i = after
  text = ''.join(out)

  # imports / data shorthand lines
  lines = []
  for line in text.splitlines(keepends=True):
    if 'import' in line and '{' in line and name in line:
      line2 = re.sub(rf',\s*{name}\b', '', line)
      line2 = re.sub(rf'\b{name}\s*,\s*', '', line2)
      if re.search(r'import\s*\{\s*\}\s*from', line2):
        continue
      line = line2
    if re.match(rf'\s*{name}\s*,?\s*$', line):
      continue
    if 'inject' in line and name in line:
      line2 = re.sub(rf'''['"]{name}['"]\s*,\s*''', '', line)
      line2 = re.sub(rf''',\s*['"]{name}['"]''', '', line2)
      if re.match(r'\s*inject:\s*\[\s*\],?\s*$', line2):
        continue
      line = line2
    lines.append(line)
  text = ''.join(lines)

  # export const name = { ... }
  m = re.search(rf'export const {name}\s*=\s*\{{', text)
  if m:
    block = extract_brace_block(text, m.end() - 1)
    if block:
      obj, end = block
      if is_removable_layout_obj(obj):
        j = end
        while j < len(text) and text[j] in ' \t\n;':
          j += 1
        rest = text[: m.start()] + text[j:]
        if not re.search(rf'\b{name}\b', rest):
          text = rest

  text = re.sub(rf'\.\.\.this\.{name}\s*,\s*', '', text)
  return text


def process_file(path: str) -> bool:
  try:
    text = open(path, encoding='utf-8').read()
  except Exception:
    return False
  if not any(n in text for n in NAMES) and not re.search(
    r':(?:label-col|labelCol|wrapper-col|wrapperCol)=["\']\{', text
  ):
    return False
  if should_skip_file(text):
    return False
  orig = text
  for name in NAMES:
    text = remove_bindings(text, name)
    text = remove_prop_defs(text, name)
  for name in NAMES:
    text = remove_unused_symbol(text, name)
  # local CreateServerForm const only used for layout
  m = re.search(r'const CreateServerForm\s*=\s*\{', text)
  if m:
    block = extract_brace_block(text, m.end() - 1)
    if block:
      obj, end = block
      if top_level_keys(obj) <= {'labelCol', 'wrapperCol'} and 'offset' not in obj:
        j = end
        while j < len(text) and text[j] in ' \t;':
          j += 1
        if j < len(text) and text[j] == '\n':
          j += 1
        rest = text[: m.start()] + text[j:]
        if not re.search(r'\bCreateServerForm\b', rest):
          text = rest
  if text == orig:
    return False
  open(path, 'w', encoding='utf-8').write(text)
  return True


def main():
  base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
  os.chdir(base)
  changed = 0
  for root in ROOTS:
    root_path = os.path.join(base, root)
    if not os.path.isdir(root_path):
      continue
    for dirpath, dirnames, filenames in os.walk(root_path):
      dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
      for fn in filenames:
        if not fn.endswith(('.vue', '.js', '.jsx')):
          continue
        if process_file(os.path.join(dirpath, fn)):
          changed += 1
  print(f'changed: {changed}')


if __name__ == '__main__':
  main()
