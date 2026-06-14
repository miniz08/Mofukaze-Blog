export const stripRichHtml = (value: string) => {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const DIMENSION_TOKEN = /^-?\d+(?:\.\d+)?(?:px|em|rem|%|vw|vh)$|^auto$|^0$/i

const isDimensionValue = (value: string) => {
  return value
    .trim()
    .split(/\s+/)
    .every((token) => DIMENSION_TOKEN.test(token))
}

const isOneOf = (allowed: string[]) => (value: string) => {
  return allowed.includes(value.trim().toLowerCase())
}

const STYLE_ALLOWLIST: Record<string, (value: string) => boolean> = {
  width: isDimensionValue,
  height: isDimensionValue,
  'max-width': isDimensionValue,
  'min-width': isDimensionValue,
  margin: isDimensionValue,
  'margin-top': isDimensionValue,
  'margin-right': isDimensionValue,
  'margin-bottom': isDimensionValue,
  'margin-left': isDimensionValue,
  display: isOneOf(['block', 'inline-block', 'inline', 'flex', 'none']),
  float: isOneOf(['left', 'right', 'none']),
}

const UNSAFE_STYLE_VALUE = /[<>{}\\()`@]|\/\*|\*\//;

const sanitizeInlineStyle = (value: string) => {
  const declarations: string[] = []
  const seen = new Set<string>()

  String(value || '')
    .split(';')
    .forEach((rawDeclaration) => {
      const colonIndex = rawDeclaration.indexOf(':')
      if (colonIndex === -1) return

      const property = rawDeclaration.slice(0, colonIndex).trim().toLowerCase()
      const declarationValue = rawDeclaration.slice(colonIndex + 1).trim()
      const validate = STYLE_ALLOWLIST[property]

      if (!property || !declarationValue || seen.has(property)) return
      if (!validate || UNSAFE_STYLE_VALUE.test(declarationValue) || /!important/i.test(declarationValue)) return
      if (!validate(declarationValue)) return

      declarations.push(`${property}: ${declarationValue};`)
      seen.add(property)
    })

  return declarations.join(' ')
}

const getHtmlAttr = (attrs: string, name: string) => {
  const match = attrs.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
  return match ? match[2] ?? match[3] ?? '' : ''
}

const setHtmlAttr = (attrs: string, name: string, value: string) => {
  const escapedValue = value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  const attrPattern = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i')

  if (attrPattern.test(attrs)) {
    return attrs.replace(attrPattern, ` ${name}="${escapedValue}"`)
  }

  return `${attrs} ${name}="${escapedValue}"`
}

const decorateResizableImages = (html: string) => {
  return html.replace(/<img\b([^>]*?)>/gi, (match, rawAttrs = '') => {
    const containerStyle = getHtmlAttr(rawAttrs, 'containerstyle') || getHtmlAttr(rawAttrs, 'containerStyle')
    if (!containerStyle) return match

    const existingStyle = getHtmlAttr(rawAttrs, 'style')
    const safeStyle = sanitizeInlineStyle(`${existingStyle}; ${containerStyle}`)
    if (!safeStyle) return match

    const selfClosing = /\/\s*$/.test(rawAttrs)
    const attrs = rawAttrs.replace(/\/\s*$/, '').trimEnd()

    return `<img${setHtmlAttr(attrs, 'style', safeStyle)}${selfClosing ? ' /' : ''}>`
  })
}

export const decorateCodeBlocks = (html: string) => {
  const content = String(html || '').replace(
    /<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi,
    (match, preAttrs = '', codeAttrs = '', code = '') => {
      if (/data-line-numbers/i.test(preAttrs) || /class=["'][^"']*code-line/i.test(code)) {
        return match
      }

      const lines = String(code).replace(/\r\n/g, '\n').split('\n')
      const wrappedLines = lines
        .map((line, index) => `<span class="code-line" data-line="${index + 1}">${line || ' '}</span>`)
        .join('')

      return `<pre${preAttrs} data-line-numbers="true"><code${codeAttrs}>${wrappedLines}</code></pre>`
    },
  )

  return decorateResizableImages(content)
}
