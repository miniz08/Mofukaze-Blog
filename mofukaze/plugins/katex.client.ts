import { renderLatexInElement } from '~/utils/latex'

export default defineNuxtPlugin((nuxtApp) => {
  let observer: MutationObserver | null = null
  let renderFrame = 0

  const scheduleRender = () => {
    if (renderFrame) return

    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = 0
      renderLatexInElement(document.body)
    })
  }

  nuxtApp.hook('app:mounted', () => {
    scheduleRender()

    observer = new MutationObserver((mutations) => {
      const hasLatexNode = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) => {
          if (!(node instanceof HTMLElement)) return false

          return (
            node.matches('[data-type="latex"][data-latex]') ||
            !!node.querySelector('[data-type="latex"][data-latex]')
          )
        }),
      )

      if (hasLatexNode) scheduleRender()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })

  nuxtApp.hook('page:finish', scheduleRender)

  nuxtApp.hook('app:beforeMount', () => {
    observer?.disconnect()
    observer = null
  })
})
