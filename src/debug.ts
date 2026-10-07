export const debugHeights = () => {
  setTimeout(() => {
    const header = document.querySelector('header');
    const h = header ? header.getBoundingClientRect().height : -1;
    document.title = `H:${h}`;
  }, 2000);
}
