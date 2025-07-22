// public/ts/utils/dom.ts
var $ = (selector) => {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    return null;
  }
  if (elements.length === 1) {
    return elements[0];
  }
  return elements;
};
export {
  $
};
