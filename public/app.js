document.querySelectorAll('[data-open-chat]').forEach((button) => {
  button.addEventListener('click', () => {
    if (window.chatWidget && typeof window.chatWidget.open === 'function') {
      window.chatWidget.open();
    } else {
      window.open(window.ChatWidgetConfig.chatUrl, '_blank', 'noopener,noreferrer');
    }
  });
});
