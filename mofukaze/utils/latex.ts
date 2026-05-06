import katex from 'katex'

const katexOptions = {
  throwOnError: false,
  strict: 'ignore',
} as const

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const escapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return escapes[char]
  })
}

function fallbackLatex(latex: string) {
  return `$${escapeHtml(latex)}$`
}

export function renderLatexToHtml(latex: string) {
  try {
    return katex.renderToString(latex, katexOptions)
  } catch {
    return fallbackLatex(latex)
  }
}

export function renderLatexElement(element: HTMLElement, latex: string) {
  const source = latex.trim()

  if (!source) {
    element.textContent = ''
    delete element.dataset.latexRendered
    return
  }

  if (element.dataset.latexRendered === source) return

  element.dataset.latex = source
  element.setAttribute('aria-label', source)
  try {
    katex.render(source, element, katexOptions)
  } catch {
    element.textContent = `$${source}$`
  }
  element.dataset.latexRendered = source
}

export function renderLatexInElement(root: ParentNode | null) {
  if (!root) return

  root
    .querySelectorAll<HTMLElement>('[data-type="latex"][data-latex]')
    .forEach((element) => {
      renderLatexElement(element, element.dataset.latex || '')
    })
}
