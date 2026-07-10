// =====================================================
//  KA ESPORTS – Translations (i18n)
//  Spanish (es) and English (en)
// =====================================================

const I18n = (() => {
  const STORAGE_KEY = 'ka_lang';
  const browserLang = (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  let currentLang = localStorage.getItem(STORAGE_KEY) || browserLang;

  const translations = {
    es: {
      // Navigation
      nav_home: 'Home',
      nav_ka_esports: 'KA ESPORTS',
      nav_data_views: 'Data Views',
      nav_global_leaderboard: 'Global Leaderboard',
      nav_monthly_leaderboard: 'Monthly Leaderboard',
      nav_match_reports: 'Match Reports',
      nav_seasons_report: 'Seasons Report',
      nav_h2h_details: 'Player H2H',
      nav_faq: 'FAQ',
      nav_tools: 'Tools & Analytics',
      nav_player_profile: 'Player Profile',
      nav_player_comparison: 'Player Comparison',
      nav_simulator: 'Rating Simulator',
      nav_awards: 'Monthly Awards',
      nav_hall_of_fame: 'Hall of Fame',
      nav_discipline: 'Discipline & Rules',
      nav_rage_quit_rules: 'Rage Quit Rule',
      nav_rage_quit_stats: 'Rage Quit Stats',
      nav_penalties: 'Penalty History',
      nav_suspensions: 'Suspension List',
      nav_live: 'Live & Community',
      nav_streams: 'Live Streams',
      nav_tournaments: 'Tournaments',
      nav_community: 'Community',
      nav_discord: 'Discord',
      nav_twitch: 'Twitch',

      // Common
      choose_month: '-- Elegir un mes --',
      choose_player: '-- Elegir un jugador --',
      search_players: 'Buscar jugadores...',
      loading: 'Cargando...',
      error: 'Error',
      retry: 'Reintentar',
      no_data: 'Sin datos',
      select_month: 'Selecciona un mes para ver su leaderboard.',
      select_player: 'Selecciona un jugador para ver su perfil.',
      season: 'Temporada:',
      player: 'Jugador:',
      month: 'Mes:',

      // Page titles
      title_home: 'KA ESPORTS',
      desc_home: 'Tu acceso central a todos los datos competitivos de Mario Kart 64.',
      title_global_leaderboard: 'Leaderboard Global',
      desc_global_leaderboard: 'Ranking general basado en el sistema Glicko-2.',
      title_monthly_leaderboard: 'Leaderboard Mensual',
      desc_monthly_leaderboard: 'Selecciona una temporada para ver su leaderboard. La URL se actualiza automáticamente para compartir.',
      title_match_reports: 'Reportes de Partidas',
      desc_match_reports: 'Selecciona un mes para ver reportes detallados de partidas.',
      title_seasons_report: 'Reporte de Temporadas',
      desc_seasons_report: 'Resumen de todas las temporadas registradas.',
      title_h2h: 'H2H de Jugadores',
      desc_h2h: 'Selecciona un jugador para ver su historial contra otros.',
      title_faq: 'Preguntas Frecuentes',
      desc_faq: 'Todo lo que necesitas saber sobre el sistema de ranking Glicko-2 para Mario Kart 64.',
      title_player_profile: 'Perfil de Jugador',
      desc_player_profile: 'Selecciona un jugador para ver estadísticas detalladas y evolución de rating.',
      title_player_comparison: 'Comparación de Jugadores',
      desc_player_comparison: 'Compara hasta 4 jugadores activos. Evolución de rating alineada por fecha.',
      title_simulator: 'Simulador de Rating',
      desc_simulator: 'Predice cambios de rating para una partida de 4 jugadores.',
      title_awards: 'Premios Mensuales',
      desc_awards: 'Reconociendo las mejores actuaciones de cada temporada completada.',
      title_hall_of_fame: 'Salón de la Fama',
      desc_hall_of_fame: 'Réccords históricos y los más grandes de todos los tiempos.',
      title_rage_quit_rules: 'Regla de Rage Quit',
      desc_rage_quit_rules: 'Reglas oficiales sobre abandono injustificado de partidas.',
      title_rage_quit_stats: 'Estadísticas de Rage Quit',
      desc_rage_quit_stats: 'Cada penalización se registra con fecha y hora. El juego limpio es recompensado.',
      title_suspensions: 'Lista de Suspensiones',
      desc_suspensions: 'Jugadores actualmente suspendidos de competencias oficiales.',
      title_streams: 'Transmisiones y Contenido',
      desc_streams: 'Streamers de la comunidad. Badge verde = EN VIVO ahora.',
      title_tournaments: 'Torneos',
      desc_tournaments: 'Próximos torneos y resultados históricos.',
      title_community: 'Comunidad',
      desc_community: 'Únete a la conversación y mantente conectado.',
      title_penalties: 'Penales y Sanciones',
      desc_penalties: 'Registros de rage quit y suspensiones.',
      title_admin: 'Panel de Admin',
      desc_admin: 'Gestión de penales y suspensiones.',

      // Buttons
      btn_screenshot: 'Captura',
      btn_csv: 'CSV',
      btn_dark_mode: 'Modo oscuro',
      btn_light_mode: 'Modo claro',
      btn_simulate: 'Simular',
      btn_download: 'Descargar',

      // Table
      col_rank: 'Rank',
      col_player: 'Jugador',
      col_rating: 'Rating',
      col_rd: 'RD',
      col_matches: 'Partidas',
      col_wins: 'Victorias',
      col_country: 'País',

      // Awards
      award_mvp: 'MVP del Mes',
      award_improved: 'Más Mejorado',
      award_rising: 'Estrella Ascendente',
      award_iron: 'Muro de Hierro',

      // Hall of Fame
      hof_alltime: '🏆 Todos los Tiempos',
      hof_monthly: '📅 Mensual',
      hof_highest_rating: 'Rating Más Alto',
      hof_most_matches: 'Más Partidas',
      hof_most_wins: 'Más Victorias',
      hof_best_wr: 'Mejor % Victoria',

      // Misc
      coming_prox: 'Próximamente',
      coming_desc: 'Estamos preparando el calendario de torneos. ¡Vuelve pronto!',
      fair_play: 'La competencia justa, el respeto y el deportivismo son pilares fundamentales de nuestra comunidad.',

      // Landing page
      home_active_players: 'Jugadores Activos',
      home_matches_this_month: 'Partidas Totales',
      home_seasons: 'Temporadas',
      home_highest_rating: 'Rating Más Alto',
      home_card_leaderboard: 'Ranking general basado en el sistema Glicko-2. Compite por la cima.',
      home_card_monthly: 'Ranking por temporada. Compara tu rendimiento mes a mes.',
      home_card_profile: 'Estadísticas detalladas, evolución de rating y gráficas de rendimiento.',
      home_card_simulator: 'Predice cómo cambia tu rating antes de jugar una partida.',
      home_card_awards: 'Reconociendo las mejores actuaciones de cada temporada.',
      home_card_hall: 'Los más grandes de todos los tiempos y récords históricos.',
      home_card_streams: 'Sigue las partidas en vivo con los streamers de la comunidad.',
      home_card_reports: 'Detalles de cada partida: puntos, posiciones y cambios de rating.',
      home_card_faq: 'Todo lo que necesitas saber sobre el sistema de ranking.',
      home_join_discord: 'Únete a Discord',
      home_watch_twitch: 'Mira en Twitch',
      home_tournaments: 'Próximos Torneos',
    },

    en: {
      // Navigation
      nav_home: 'Home',
      nav_ka_esports: 'KA ESPORTS',
      nav_data_views: 'Data Views',
      nav_global_leaderboard: 'Global Leaderboard',
      nav_monthly_leaderboard: 'Monthly Leaderboard',
      nav_match_reports: 'Match Reports',
      nav_seasons_report: 'Seasons Report',
      nav_h2h_details: 'Player H2H',
      nav_faq: 'FAQ',
      nav_tools: 'Tools & Analytics',
      nav_player_profile: 'Player Profile',
      nav_player_comparison: 'Player Comparison',
      nav_simulator: 'Rating Simulator',
      nav_awards: 'Monthly Awards',
      nav_hall_of_fame: 'Hall of Fame',
      nav_discipline: 'Discipline & Rules',
      nav_rage_quit_rules: 'Rage Quit Rule',
      nav_rage_quit_stats: 'Rage Quit Stats',
      nav_penalties: 'Penalty History',
      nav_suspensions: 'Suspension List',
      nav_live: 'Live & Community',
      nav_streams: 'Live Streams',
      nav_tournaments: 'Tournaments',
      nav_community: 'Community',
      nav_discord: 'Discord',
      nav_twitch: 'Twitch',

      // Common
      choose_month: '-- Choose a month --',
      choose_player: '-- Choose a player --',
      search_players: 'Search players...',
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      no_data: 'No data',
      select_month: 'Select a month to view its leaderboard.',
      select_player: 'Select a player to view their profile.',
      season: 'Season:',
      player: 'Player:',
      month: 'Month:',

      // Page titles
      title_home: 'KA ESPORTS',
      desc_home: 'Your central access to all Mario Kart 64 competitive data.',
      title_global_leaderboard: 'Global Leaderboard',
      desc_global_leaderboard: 'Overall ranking based on the Glicko-2 system.',
      title_monthly_leaderboard: 'Monthly Leaderboard',
      desc_monthly_leaderboard: 'Select a season to view its leaderboard. The URL updates automatically for sharing.',
      title_match_reports: 'Match Reports',
      desc_match_reports: 'Select a month to view detailed match reports.',
      title_seasons_report: 'Seasons Report',
      desc_seasons_report: 'Summary of all recorded seasons.',
      title_h2h: 'Player H2H',
      desc_h2h: 'Select a player to view their match history against others.',
      title_faq: 'Frequently Asked Questions',
      desc_faq: 'Everything you need to know about the Glicko-2 ranking system for Mario Kart 64.',
      title_player_profile: 'Player Profile',
      desc_player_profile: 'Select a player to view detailed statistics and rating evolution.',
      title_player_comparison: 'Player Comparison',
      desc_player_comparison: 'Compare up to 4 active players. Rating evolution aligned by date.',
      title_simulator: 'Rating Simulator',
      desc_simulator: 'Predict rating changes for a 4-player match.',
      title_awards: 'Monthly Awards',
      desc_awards: 'Recognizing the best performances of each completed season.',
      title_hall_of_fame: 'Hall of Fame',
      desc_hall_of_fame: 'Historical records and all-time greats.',
      title_rage_quit_rules: 'Rage Quit Penalty Rule',
      desc_rage_quit_rules: 'Official rules regarding unjustified match abandonment.',
      title_rage_quit_stats: 'Rage Quit Statistics',
      desc_rage_quit_stats: 'Each penalty is recorded with date and time. Clean play is rewarded.',
      title_suspensions: 'Suspension List',
      desc_suspensions: 'Players currently suspended from official competitions.',
      title_streams: 'Live Streams & Content',
      desc_streams: 'Community streamers. Green badge = LIVE now.',
      title_tournaments: 'Tournaments',
      desc_tournaments: 'Upcoming tournaments and historical results.',
      title_community: 'Community',
      desc_community: 'Join the conversation and stay connected.',
      title_penalties: 'Penalties & Sanctions',
      desc_penalties: 'Rage quit and suspension records.',
      title_admin: 'Admin Panel',
      desc_admin: 'Penalty and suspension management.',

      // Buttons
      btn_screenshot: '📸 Screenshot',
      btn_csv: '📥 CSV',
      btn_dark_mode: '🌙 Dark mode',
      btn_light_mode: '☀️ Light mode',
      btn_simulate: 'Simulate',
      btn_download: 'Download',

      // Table
      col_rank: 'Rank',
      col_player: 'Player',
      col_rating: 'Rating',
      col_rd: 'RD',
      col_matches: 'Matches',
      col_wins: 'Wins',
      col_country: 'Country',

      // Awards
      award_mvp: 'MVP of the Month',
      award_improved: 'Most Improved',
      award_rising: 'Rising Star',
      award_iron: 'Iron Wall',

      // Hall of Fame
      hof_alltime: '🏆 All-Time',
      hof_monthly: '📅 Monthly',
      hof_highest_rating: 'Highest Rating Ever',
      hof_most_matches: 'Most Matches Played',
      hof_most_wins: 'Most Wins',
      hof_best_wr: 'Best Win Rate',

      // Misc
      coming_prox: 'Coming Soon',
      coming_desc: 'We are preparing the tournament calendar. Check back soon!',
      fair_play: 'Fair competition, respect, and sportsmanship are fundamental pillars of our community.',

      // Landing page
      home_active_players: 'Active Players',
      home_matches_this_month: 'Total Matches',
      home_seasons: 'Seasons',
      home_highest_rating: 'Highest Rating',
      home_card_leaderboard: 'Overall ranking based on the Glicko-2 system. Compete for the top.',
      home_card_monthly: 'Season-by-season ranking. Compare your performance month to month.',
      home_card_profile: 'Detailed stats, rating evolution, and performance charts.',
      home_card_simulator: 'Predict how your rating changes before playing a match.',
      home_card_awards: 'Recognizing the best performances of each completed season.',
      home_card_hall: 'All-time greats and historical records.',
      home_card_streams: 'Follow live matches with community streamers.',
      home_card_reports: 'Match details: points, positions, and rating changes.',
      home_card_faq: 'Everything you need to know about the ranking system.',
      home_join_discord: 'Join Discord',
      home_watch_twitch: 'Watch on Twitch',
      home_tournaments: 'Upcoming Tournaments',
    }
  };

  function t(key) {
    return translations[currentLang]?.[key] || translations['es']?.[key] || key;
  }

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    if (lang !== 'es' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
  }

  function toggle() {
    setLang(currentLang === 'es' ? 'en' : 'es');
  }

  function init() {
    document.documentElement.lang = currentLang;
  }

  function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = t(key);
      if (translated !== key) el.textContent = translated;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
    // Re-render components that use i18n
    if (typeof Navbar !== 'undefined' && Navbar.rerender) {
      Navbar.rerender();
    } else if (typeof PageHeader !== 'undefined' && PageHeader.rerender) {
      PageHeader.rerender();
    }
  }

  function init() {
    document.documentElement.lang = currentLang;
    document.addEventListener('lang:change', translatePage);
    // Translate headers on page load (before sidebar finishes loading)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', translatePage);
    } else {
      translatePage();
    }
  }

  init();

  return { t, getLang, setLang, toggle, init, translatePage };
})();