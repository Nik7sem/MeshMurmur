export function smoothScroll(element: HTMLElement | null) {
  setTimeout(() => {
    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: "smooth",
      })
    }
  }, 100)
}