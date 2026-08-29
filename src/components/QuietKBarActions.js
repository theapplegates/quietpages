export const actions = [
  {
    id: 'home',
    name: 'Go to Home',
    keywords: 'home main start landing',
    shortcut: 'mod+shift+h',
    perform: () => {
      window.location.href = '/';
    },
  },
  {
    id: 'search',
    name: 'Open Search',
    keywords: 'search find pagefind essay article',
    perform: () => {
      const el = document.querySelector(
        '#search, [data-search], input[type="search"], [data-pagefind]'
      );

      if (el && typeof el.focus === 'function') {
        el.focus();
      }
    },
  },

  // Add your real pages here later.
  // Example:
  // {
  //   id: 'about',
  //   name: 'Go to About',
  //   keywords: 'about us team',
  //   perform: () => {
  //     window.location.href = '/about';
  //   },
  // },
];
