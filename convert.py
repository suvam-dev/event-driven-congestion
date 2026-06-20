import re
import os

with open('legacy/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

def html_to_jsx(html_str):
    # Convert class= to className=
    jsx = html_str.replace('class=', 'className=')
    # Convert for= to htmlFor=
    jsx = jsx.replace('for=', 'htmlFor=')
    # Convert self closing tags
    jsx = re.sub(r'<(input|img|br|hr)([^>]*?)(?<!/)>', r'<\1\2 />', jsx)
    
    # Convert inline styles
    def style_repl(match):
        style_content = match.group(1)
        styles = []
        for prop in style_content.split(';'):
            if not prop.strip(): continue
            k, v = prop.split(':', 1)
            k = k.strip()
            # to camelCase
            k = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
            styles.append(f'{k}: "{v.strip()}"')
        return 'style={{ ' + ', '.join(styles) + ' }}'
    jsx = re.sub(r'style="([^"]*)"', style_repl, jsx)
    
    # Convert SVG properties
    props_to_convert = ['stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-miterlimit']
    for p in props_to_convert:
        camel = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), p)
        jsx = jsx.replace(p, camel)
        
    # remove comments to avoid issues
    jsx = re.sub(r'<!--.*?-->', '', jsx, flags=re.DOTALL)
    
    # Fix self closing for inputs that might already be closed but matched weirdly
    # Actually just leave it, React might throw some errors, we'll fix them via ESLint/TS compiler.
    
    return jsx

sections = re.findall(r'<section className="view.*?id="view-(.*?)".*?>(.*?)</section>', html_to_jsx(html), re.DOTALL)

for view_id, content in sections:
    comp_name = ''.join(word.capitalize() for word in view_id.split('-')) + 'View'
    file_content = f"""'use client';

import React from 'react';

export default function {comp_name}() {{
  return (
    <div className="view-container" id="view-{view_id}">
      {content.strip()}
    </div>
  );
}}
"""
    with open(f'src/components/{comp_name}.tsx', 'w', encoding='utf-8') as f:
        f.write(file_content)
        
print('Components generated.')
