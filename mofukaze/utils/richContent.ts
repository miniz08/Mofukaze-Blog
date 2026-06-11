export const stripRichHtml = (value: string) => {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const decorateCodeBlocks = (html: string) => {
  return String(html || '').replace(
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
}
