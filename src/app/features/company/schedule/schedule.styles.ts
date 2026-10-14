/** Estilos compartidos entre los componentes de horarios (encapsulación emulada: se incluyen en cada uno). */

export const SCHEDULE_SECTION_STYLES = `
    /* ── Card section ─────────────────────────────── */
    .sch-section {
      background: white;
      border-radius: 16px;
      padding: 22px 24px;
      box-shadow: 0 4px 24px rgba(var(--primary-rgb), 0.10);
    }
    .sch-section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 560px) {
      .sch-section { padding: 16px; }
    }
    @media (max-width: 480px) {
      .sch-section { border-radius: 12px; padding: 16px 14px; }
    }
`;

export const SCHEDULE_ERROR_STYLES = `
    .range-error {
      font-size: 12px; font-weight: 600; color: #b91c1c;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
      padding: 8px 10px; margin: 2px 0 8px;
    }
`;
