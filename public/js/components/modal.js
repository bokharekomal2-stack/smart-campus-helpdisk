// Smart Campus Helpdesk - Reusable Modal Utility

let activeModal = null;

export function openModal({ title, bodyHtml, footerHtml = '', onClose = null }) {
  closeModal();

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" aria-label="Close modal">&times;</button>
      </div>
      <div class="modal-body">
        ${bodyHtml}
      </div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>
  `;

  // Close triggers
  const closeBtn = backdrop.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeModal();
    }
  });

  const keyHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  window.addEventListener('keydown', keyHandler);

  modalRoot.appendChild(backdrop);

  activeModal = {
    backdrop,
    keyHandler,
    onClose
  };

  return backdrop;
}

export function closeModal() {
  if (!activeModal) return;

  window.removeEventListener('keydown', activeModal.keyHandler);

  if (activeModal.backdrop && activeModal.backdrop.parentNode) {
    activeModal.backdrop.parentNode.removeChild(activeModal.backdrop);
  }

  if (typeof activeModal.onClose === 'function') {
    activeModal.onClose();
  }

  activeModal = null;
}
