/** Estilos compartidos entre los modales del dashboard (el CSS es por componente, así que se reutilizan como constante). */
export const MODAL_STYLES = `
    @keyframes fadeInUp {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 16px;
    }
    .modal-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      padding: 28px;
      width: 100%;
      max-width: 460px;
      max-height: 90vh;
      overflow-y: auto;
      animation: fadeInUp .25s ease both;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .modal-title { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .modal-close {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: #f3f4f6; cursor: pointer; color: #6b7280;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .modal-close:hover { background: #e5e7eb; }

    .form-group { margin-bottom: 14px; }
    .form-group label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:5px; }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 14px;
      color: #1a1a2e;
      background: white;
      outline: none;
      transition: border-color .15s;
      box-sizing: border-box;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(var(--primary-rgb),.1); }
    .form-group textarea { resize: vertical; min-height: 72px; }

    .modal-footer { display: flex; gap: 10px; margin-top: 20px; }
    .modal-footer .btn { flex: 1; }

    .cancel-target-info {
      background: #fef3c7;
      border: 1.5px solid #fde68a;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #92400e;
    }
    .cancel-target-info strong { display: block; font-size: 14px; color: #78350f; margin-bottom: 2px; }

    .modal-card { max-width: min(460px, calc(100vw - 16px)); }

    @media (max-width: 480px) {
      .modal-overlay { padding: 8px; align-items: flex-end; }
      .modal-card { border-radius: 20px 20px 0 0; max-height: 95vh; }
    }

    @media (max-width: 640px) {
      .form-group input,
      .form-group select,
      .form-group textarea { font-size: 16px; }
    }
`;

/** Badges de estado de cita (tarjeta y modal de detalle). */
export const BADGE_STYLES = `
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-green  { background: #d1fae5; color: #065f46; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-red    { background: #fee2e2; color: #991b1b; }
    .badge-blue   { background: #dbeafe; color: #1d4ed8; }
`;
