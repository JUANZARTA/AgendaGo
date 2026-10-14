// CSS compartido entre componentes de reseñas (cada componente lo incluye en su propio `styles`
// por la encapsulación emulada).

export const STAR_BTN_CSS = `
  .star-btn {
    background: none; border: none; cursor: pointer;
    padding: 2px; line-height: 0;
    transition: transform .1s;
  }
  .star-btn:hover { transform: scale(1.15); }
`;

export const REVIEW_TEXTAREA_CSS = `
  .review-textarea {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid #e5e0ff; border-radius: 12px;
    font-size: 14px; font-family: inherit;
    resize: vertical; min-height: 80px;
    box-sizing: border-box; outline: none;
    color: inherit; background: white;
    transition: border-color .18s;
  }
  .review-textarea:focus { border-color: var(--purple); }
`;

export const MODAL_CSS = `
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 300; padding: 16px;
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
  }
  .modal-card {
    background: white; border-radius: 20px; padding: 28px;
    width: 100%; max-width: 380px;
    box-shadow: 0 20px 60px rgba(0,0,0,.25);
  }
`;
