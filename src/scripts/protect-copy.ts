export function preventCopyFromProtectedContent(): void {
  document.addEventListener(
    'copy',
    (event) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectionRange = selection.getRangeAt(0);
      const includesProtectedContent = Array.from(
        document.querySelectorAll('.protected-content'),
      ).some((element) => selectionRange.intersectsNode(element));

      if (includesProtectedContent) event.preventDefault();
    },
    true,
  );
}
