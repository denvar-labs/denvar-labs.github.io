// =====================================================
//  KA ESPORTS – Global Config
//  Fuente única de verdad para la URL del Apps Script Web App.
//  Si el deployment cambia, SOLO se edita AQUÍ — ningún otro
//  archivo debe tener esta URL hardcodeada.
// =====================================================
const KA_API_BASE = 'https://script.google.com/macros/s/AKfycbyMYv9MCqIj4EV_p0W25WcYZnCsBXYTQyugxCVjqFgA8YYFIy66VCOWRFjWgp5l2AiO/exec';

// Timeout por defecto para llamadas fetch (ms). Evita que la UI
// se quede "Loading…" para siempre si Apps Script no responde.
const KA_FETCH_TIMEOUT_MS = 15000;
