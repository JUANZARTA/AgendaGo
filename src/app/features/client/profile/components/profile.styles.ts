/** Estilos de la lista de ajustes compartidos entre las secciones del perfil. */
export const PROFILE_SETTINGS_STYLES = `
    /* ── Settings group ───────────────────────────────────── */
    .group-label {
      font-size: 11px; font-weight: 700;
      letter-spacing: .07em; text-transform: uppercase;
      color: #aaa; padding: 16px 16px 6px;
    }

    .settings-list {
      background: white;
      border-top: 1px solid rgba(0,0,0,.06);
      border-bottom: 1px solid rgba(0,0,0,.06);
    }

    /* ── Settings row ────────────────────────────────────── */
    .s-row {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(0,0,0,.05);
      cursor: pointer; transition: background .15s;
      background: none; border-left: none; border-right: none; border-top: none;
      width: 100%; font-family: inherit; font-size: 14px; text-align: left;
      color: inherit;
    }
    .s-row:last-child { border-bottom: none; }
    .s-row:hover:not(.open-row):not([disabled]) { background: rgba(0,0,0,.025); }
    .s-row.disabled { opacity: .45; cursor: not-allowed; }

    .row-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .row-text { flex: 1; min-width: 0; }
    .row-label { font-weight: 600; font-size: 14px; }
    .row-sub { font-size: 12px; color: #888; margin-top: 1px; }
`;

/** Cuerpo de acordeón y mensajes de estado compartidos por los formularios. */
export const PROFILE_ACCORDION_STYLES = `
    /* ── Accordion body ──────────────────────────────────── */
    .accordion-body {
      background: #f8f7ff;
      border-bottom: 1px solid rgba(0,0,0,.06);
      padding: 20px 16px;
      overflow: hidden;
    }

    .success-msg { color: #10b981; font-size: 13px; margin-top: 4px; margin-bottom: 12px; }
    .error-msg   { color: #ef4444; font-size: 13px; margin-top: 4px; margin-bottom: 12px; }
`;
