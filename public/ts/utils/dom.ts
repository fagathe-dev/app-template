const $ = (selector: string): HTMLElement | NodeListOf<Element> | null => {
  const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;

  if (elements.length === 0) {
    return null;
  }

  if (elements.length === 1) {
    return elements[0] as HTMLElement;
  }

  return elements;
};

export { $ };