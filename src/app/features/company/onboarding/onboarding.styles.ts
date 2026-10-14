// Estilos compartidos entre los pasos del onboarding (cada paso los incluye por separado por la encapsulación de Angular).
export const OB_SHARED_STYLES = `
    .ob-step-label {
      font-size: 11px; font-weight: 700; color: var(--purple);
      letter-spacing: .08em; text-transform: uppercase; margin-bottom: 4px;
    }
    .ob-title { font-size: 1.45rem; font-weight: 800; color: #1a1a2e; margin: 0 0 4px; line-height: 1.25; }
    .ob-subtitle { font-size: 13px; color: #888; margin: 0 0 24px; }
    /* Form */
    .ob-form-group { margin-bottom: 16px; }
    .ob-form-group label { display: block; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 6px; }
    .ob-form-group input, .ob-form-group textarea, .ob-form-group select {
      width: 100%; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 11px 14px;
      font-size: 14px; color: #1a1a2e; background: white; outline: none;
      transition: border-color .15s, box-shadow .15s; box-sizing: border-box; font-family: inherit;
    }
    .ob-form-group input:focus, .ob-form-group textarea:focus, .ob-form-group select:focus {
      border-color: var(--purple);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb),.1);
    }
    .ob-form-group textarea { resize: vertical; min-height: 72px; line-height: 1.5; }
    .ob-form-group select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; cursor: pointer; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    /* Schedule question (step 3) */
    .choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
    .choice-card {
      border: 2px solid #e5e7eb; border-radius: 16px; padding: 20px 16px; cursor: pointer;
      background: white; text-align: center; transition: all .18s; font-family: inherit;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .choice-card:hover { border-color: var(--purple); background: #f9f5ff; transform: translateY(-2px); }
    .choice-card.primary-choice { background: var(--gradient); border-color: transparent; color: white; }
    .choice-card.primary-choice:hover { opacity: .9; transform: translateY(-2px); }
    .choice-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .choice-title { font-weight: 800; font-size: 14px; }
    .choice-desc  { font-size: 11px; opacity: .7; line-height: 1.4; }
    /* Toggle switch */
    .toggle-wrap { display: flex; align-items: center; flex-shrink: 0; cursor: pointer; }
    .toggle-track {
      width: 34px; height: 20px; border-radius: 10px; background: #e5e7eb;
      position: relative; transition: background .2s; flex-shrink: 0;
    }
    .toggle-track.on { background: var(--purple); }
    .toggle-thumb {
      width: 14px; height: 14px; border-radius: 50%; background: white;
      position: absolute; top: 3px; left: 3px;
      transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
    }
    .toggle-track.on .toggle-thumb { transform: translateX(14px); }
    /* Buttons */
    .ob-btn-primary {
      width: 100%; padding: 14px; border-radius: 12px; border: none;
      background: var(--gradient); color: white; font-size: 15px; font-weight: 700;
      cursor: pointer; letter-spacing: .01em;
      transition: opacity .18s, transform .18s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-family: inherit;
    }
    .ob-btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
    .ob-btn-primary:active { transform: translateY(0); }
    .ob-btn-primary:disabled { opacity: .5; cursor: not-allowed; }

    .ob-btn-back {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; color: #888; font-size: 13px; font-weight: 600;
      cursor: pointer; padding: 0; margin-bottom: 18px; font-family: inherit;
    }
    .ob-btn-back:hover { color: var(--purple); }

    .error-box {
      background: #fee2e2; color: #991b1b; border-radius: 10px; padding: 10px 14px;
      font-size: 13px; font-weight: 600; margin-bottom: 16px;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .anim { animation: fadeInUp .3s ease both; }

    .hint { font-size: 12px; color: #aaa; margin-top: 4px; }
  @media (max-width: 500px) {
    .grid-2 { grid-template-columns: 1fr; }
    .choice-grid { grid-template-columns: 1fr; }
    .ob-title { font-size: 1.2rem; }
  }
`;
