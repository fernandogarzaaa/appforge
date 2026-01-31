/**
 * Multi-Language Support - Detect language and generate content in multiple languages
 * Supports automatic translation and localization
 */

/**
 * Supported languages with their codes and names
 */
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', direction: 'ltr' },
  es: { name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  fr: { name: 'French', nativeName: 'Français', direction: 'ltr' },
  de: { name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  it: { name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
  pt: { name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  ru: { name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
  ja: { name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  zh: { name: 'Chinese', nativeName: '中文', direction: 'ltr' },
  ko: { name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr' },
  sv: { name: 'Swedish', nativeName: 'Svenska', direction: 'ltr' },
  pl: { name: 'Polish', nativeName: 'Polski', direction: 'ltr' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr' },
  th: { name: 'Thai', nativeName: 'ไทย', direction: 'ltr' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr' },
  ms: { name: 'Malay', nativeName: 'Bahasa Melayu', direction: 'ltr' }
};

/**
 * Detect language from user prompt
 */
export function detectLanguage(text) {
  const lowerText = text.toLowerCase();
  
  // Language-specific keywords and patterns
  const languagePatterns = {
    es: ['español', 'spanish', 'en español', 'spanish language', 'hablar', 'gracias', 'por favor'],
    fr: ['français', 'french', 'en français', 'merci', 'bonjour', 's\'il vous plaît'],
    de: ['deutsch', 'german', 'auf deutsch', 'danke', 'bitte', 'guten tag'],
    pt: ['português', 'portuguese', 'em português', 'obrigado', 'por favor', 'olá'],
    it: ['italiano', 'italian', 'in italiano', 'grazie', 'per favore', 'ciao'],
    ru: ['русский', 'russian', 'по-русски', 'спасибо', 'пожалуйста', 'привет'],
    ja: ['日本語', 'japanese', 'in japanese', 'ありがとう', 'こんにちは'],
    zh: ['中文', 'chinese', 'in chinese', '谢谢', '你好'],
    ko: ['한국어', 'korean', 'in korean', '감사합니다', '안녕하세요'],
    ar: ['العربية', 'arabic', 'in arabic', 'شكرا', 'مرحبا'],
    hi: ['हिन्दी', 'hindi', 'in hindi', 'धन्यवाद', 'नमस्ते'],
    nl: ['nederlands', 'dutch', 'in dutch', 'dank je', 'hallo'],
    sv: ['svenska', 'swedish', 'på svenska', 'tack', 'hej'],
    pl: ['polski', 'polish', 'po polsku', 'dziękuję', 'cześć'],
    tr: ['türkçe', 'turkish', 'türkçe olarak', 'teşekkürler', 'merhaba'],
    vi: ['tiếng việt', 'vietnamese', 'bằng tiếng việt', 'cảm ơn', 'xin chào'],
    th: ['ไทย', 'thai', 'in thai', 'ขอบคุณ', 'สวัสดี'],
    id: ['indonesia', 'indonesian', 'dalam bahasa indonesia', 'terima kasih', 'halo'],
    ms: ['melayu', 'malay', 'dalam bahasa melayu', 'terima kasih', 'hello']
  };
  
  // Check for explicit language mentions
  for (const [langCode, patterns] of Object.entries(languagePatterns)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return {
          code: langCode,
          name: SUPPORTED_LANGUAGES[langCode].name,
          confidence: 0.9,
          detected: true
        };
      }
    }
  }
  
  // Check for non-Latin scripts
  if (/[\u0400-\u04FF]/.test(text)) return { code: 'ru', name: 'Russian', confidence: 0.95, detected: true };
  if (/[\u4E00-\u9FFF]/.test(text)) return { code: 'zh', name: 'Chinese', confidence: 0.95, detected: true };
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return { code: 'ja', name: 'Japanese', confidence: 0.95, detected: true };
  if (/[\uAC00-\uD7AF]/.test(text)) return { code: 'ko', name: 'Korean', confidence: 0.95, detected: true };
  if (/[\u0600-\u06FF]/.test(text)) return { code: 'ar', name: 'Arabic', confidence: 0.95, detected: true };
  if (/[\u0900-\u097F]/.test(text)) return { code: 'hi', name: 'Hindi', confidence: 0.95, detected: true };
  if (/[\u0E00-\u0E7F]/.test(text)) return { code: 'th', name: 'Thai', confidence: 0.95, detected: true };
  
  // Default to English
  return {
    code: 'en',
    name: 'English',
    confidence: 0.5,
    detected: false
  };
}

/**
 * Get localized common phrases
 */
export function getLocalizedPhrases(langCode) {
  const phrases = {
    en: {
      welcome: 'Welcome',
      about: 'About',
      contact: 'Contact',
      home: 'Home',
      menu: 'Menu',
      services: 'Services',
      products: 'Products',
      getStarted: 'Get Started',
      learnMore: 'Learn More',
      readMore: 'Read More',
      viewAll: 'View All',
      categories: 'Categories',
      search: 'Search',
      login: 'Login',
      signup: 'Sign Up',
      subscribe: 'Subscribe',
      gallery: 'Gallery',
      testimonials: 'Testimonials',
      faq: 'FAQ',
      pricing: 'Pricing',
      features: 'Features',
      blog: 'Blog',
      news: 'News',
      team: 'Team',
      careers: 'Careers',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service'
    },
    es: {
      welcome: 'Bienvenido',
      about: 'Acerca de',
      contact: 'Contacto',
      home: 'Inicio',
      menu: 'Menú',
      services: 'Servicios',
      products: 'Productos',
      getStarted: 'Comenzar',
      learnMore: 'Saber Más',
      readMore: 'Leer Más',
      viewAll: 'Ver Todo',
      categories: 'Categorías',
      search: 'Buscar',
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      subscribe: 'Suscribirse',
      gallery: 'Galería',
      testimonials: 'Testimonios',
      faq: 'Preguntas Frecuentes',
      pricing: 'Precios',
      features: 'Características',
      blog: 'Blog',
      news: 'Noticias',
      team: 'Equipo',
      careers: 'Carreras',
      privacy: 'Política de Privacidad',
      terms: 'Términos de Servicio'
    },
    fr: {
      welcome: 'Bienvenue',
      about: 'À Propos',
      contact: 'Contact',
      home: 'Accueil',
      menu: 'Menu',
      services: 'Services',
      products: 'Produits',
      getStarted: 'Commencer',
      learnMore: 'En Savoir Plus',
      readMore: 'Lire Plus',
      viewAll: 'Voir Tout',
      categories: 'Catégories',
      search: 'Rechercher',
      login: 'Connexion',
      signup: 'S\'inscrire',
      subscribe: 'S\'abonner',
      gallery: 'Galerie',
      testimonials: 'Témoignages',
      faq: 'FAQ',
      pricing: 'Tarifs',
      features: 'Fonctionnalités',
      blog: 'Blog',
      news: 'Actualités',
      team: 'Équipe',
      careers: 'Carrières',
      privacy: 'Politique de Confidentialité',
      terms: 'Conditions d\'Utilisation'
    },
    de: {
      welcome: 'Willkommen',
      about: 'Über Uns',
      contact: 'Kontakt',
      home: 'Startseite',
      menu: 'Menü',
      services: 'Dienstleistungen',
      products: 'Produkte',
      getStarted: 'Loslegen',
      learnMore: 'Mehr Erfahren',
      readMore: 'Weiterlesen',
      viewAll: 'Alle Anzeigen',
      categories: 'Kategorien',
      search: 'Suchen',
      login: 'Anmelden',
      signup: 'Registrieren',
      subscribe: 'Abonnieren',
      gallery: 'Galerie',
      testimonials: 'Referenzen',
      faq: 'FAQ',
      pricing: 'Preise',
      features: 'Funktionen',
      blog: 'Blog',
      news: 'Nachrichten',
      team: 'Team',
      careers: 'Karriere',
      privacy: 'Datenschutz',
      terms: 'Nutzungsbedingungen'
    },
    pt: {
      welcome: 'Bem-vindo',
      about: 'Sobre',
      contact: 'Contato',
      home: 'Início',
      menu: 'Menu',
      services: 'Serviços',
      products: 'Produtos',
      getStarted: 'Começar',
      learnMore: 'Saiba Mais',
      readMore: 'Leia Mais',
      viewAll: 'Ver Tudo',
      categories: 'Categorias',
      search: 'Pesquisar',
      login: 'Entrar',
      signup: 'Cadastrar',
      subscribe: 'Inscrever-se',
      gallery: 'Galeria',
      testimonials: 'Depoimentos',
      faq: 'FAQ',
      pricing: 'Preços',
      features: 'Recursos',
      blog: 'Blog',
      news: 'Notícias',
      team: 'Equipe',
      careers: 'Carreiras',
      privacy: 'Política de Privacidade',
      terms: 'Termos de Serviço'
    },
    ja: {
      welcome: 'ようこそ',
      about: '私たちについて',
      contact: 'お問い合わせ',
      home: 'ホーム',
      menu: 'メニュー',
      services: 'サービス',
      products: '製品',
      getStarted: '始める',
      learnMore: '詳しく見る',
      readMore: '続きを読む',
      viewAll: 'すべて見る',
      categories: 'カテゴリー',
      search: '検索',
      login: 'ログイン',
      signup: '登録',
      subscribe: '購読',
      gallery: 'ギャラリー',
      testimonials: 'お客様の声',
      faq: 'よくある質問',
      pricing: '料金',
      features: '機能',
      blog: 'ブログ',
      news: 'ニュース',
      team: 'チーム',
      careers: '採用情報',
      privacy: 'プライバシーポリシー',
      terms: '利用規約'
    },
    zh: {
      welcome: '欢迎',
      about: '关于',
      contact: '联系',
      home: '首页',
      menu: '菜单',
      services: '服务',
      products: '产品',
      getStarted: '开始',
      learnMore: '了解更多',
      readMore: '阅读更多',
      viewAll: '查看全部',
      categories: '分类',
      search: '搜索',
      login: '登录',
      signup: '注册',
      subscribe: '订阅',
      gallery: '画廊',
      testimonials: '客户评价',
      faq: '常见问题',
      pricing: '定价',
      features: '特点',
      blog: '博客',
      news: '新闻',
      team: '团队',
      careers: '职业',
      privacy: '隐私政策',
      terms: '服务条款'
    }
  };
  
  return phrases[langCode] || phrases.en;
}

/**
 * Get currency for language/region
 */
export function getCurrencyForLanguage(langCode) {
  const currencyMap = {
    en: { code: 'USD', symbol: '$', name: 'US Dollar' },
    es: { code: 'EUR', symbol: '€', name: 'Euro' },
    fr: { code: 'EUR', symbol: '€', name: 'Euro' },
    de: { code: 'EUR', symbol: '€', name: 'Euro' },
    it: { code: 'EUR', symbol: '€', name: 'Euro' },
    pt: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    ru: { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    ja: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    zh: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    ko: { code: 'KRW', symbol: '₩', name: 'Korean Won' },
    ar: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    hi: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    nl: { code: 'EUR', symbol: '€', name: 'Euro' },
    sv: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    pl: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    tr: { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    vi: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    th: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    id: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    ms: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' }
  };
  
  return currencyMap[langCode] || currencyMap.en;
}

/**
 * Get date format for language
 */
export function getDateFormatForLanguage(langCode) {
  const formatMap = {
    en: 'MM/DD/YYYY',
    es: 'DD/MM/YYYY',
    fr: 'DD/MM/YYYY',
    de: 'DD.MM.YYYY',
    it: 'DD/MM/YYYY',
    pt: 'DD/MM/YYYY',
    ru: 'DD.MM.YYYY',
    ja: 'YYYY/MM/DD',
    zh: 'YYYY/MM/DD',
    ko: 'YYYY/MM/DD',
    ar: 'DD/MM/YYYY',
    hi: 'DD/MM/YYYY',
    nl: 'DD-MM-YYYY',
    sv: 'YYYY-MM-DD',
    pl: 'DD.MM.YYYY',
    tr: 'DD.MM.YYYY',
    vi: 'DD/MM/YYYY',
    th: 'DD/MM/YYYY',
    id: 'DD/MM/YYYY',
    ms: 'DD/MM/YYYY'
  };
  
  return formatMap[langCode] || formatMap.en;
}

/**
 * Generate localized content for project
 */
export function generateLocalizedContent(projectData, languageInfo) {
  const langCode = languageInfo.code;
  const phrases = getLocalizedPhrases(langCode);
  const currency = getCurrencyForLanguage(langCode);
  const dateFormat = getDateFormatForLanguage(langCode);
  
  return {
    language: languageInfo,
    phrases,
    currency,
    dateFormat,
    direction: SUPPORTED_LANGUAGES[langCode].direction,
    metadata: {
      htmlLang: langCode,
      dir: SUPPORTED_LANGUAGES[langCode].direction,
      locale: `${langCode}_${langCode.toUpperCase()}`
    }
  };
}

/**
 * Get RTL (Right-to-Left) languages
 */
export function isRTLLanguage(langCode) {
  return SUPPORTED_LANGUAGES[langCode]?.direction === 'rtl';
}

/**
 * Format number according to language locale
 */
export function formatNumber(number, langCode) {
  const localeMap = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
    ru: 'ru-RU',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ko: 'ko-KR',
    ar: 'ar-SA',
    hi: 'hi-IN'
  };
  
  const locale = localeMap[langCode] || 'en-US';
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Format currency according to language
 */
export function formatCurrency(amount, langCode) {
  const currency = getCurrencyForLanguage(langCode);
  return `${currency.symbol}${formatNumber(amount, langCode)}`;
}
