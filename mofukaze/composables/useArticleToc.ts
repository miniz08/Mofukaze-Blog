import { nextTick, onBeforeUnmount, ref } from 'vue'

export type TocItem = {
  id: string
  level: number
  text: string
}

export const useArticleToc = () => {
  const toc = ref<TocItem[]>([])
  const activeHeadingId = ref('')
  let observer: IntersectionObserver | null = null

  const stopObserver = () => {
    if (!observer) return
    observer.disconnect()
    observer = null
  }

  const buildToc = async (root: HTMLElement | null | undefined) => {
    await nextTick()
    stopObserver()

    if (!root) {
      toc.value = []
      activeHeadingId.value = ''
      return
    }

    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h1, h2, h3'))
      .filter((heading) => heading.textContent?.trim())

    toc.value = headings.map((heading, index) => {
      const id = `section-${index + 1}`
      heading.id = id
      heading.classList.add('article-heading-anchor')

      return {
        id,
        level: Number(heading.tagName.slice(1)),
        text: heading.textContent?.trim() || `章节 ${index + 1}`,
      }
    })

    activeHeadingId.value = toc.value[0]?.id || ''

    if (!import.meta.client || headings.length === 0) return

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]?.target?.id) {
          activeHeadingId.value = visible[0].target.id
        }
      },
      {
        rootMargin: '-18% 0px -70% 0px',
        threshold: [0, 1],
      },
    )

    headings.forEach((heading) => observer?.observe(heading))
  }

  const scrollToHeading = (id: string) => {
    if (!import.meta.client) return
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  onBeforeUnmount(stopObserver)

  return {
    toc,
    activeHeadingId,
    buildToc,
    scrollToHeading,
    stopObserver,
  }
}
