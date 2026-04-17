import type { locale } from "@chrryai/donut/locales"
import type { getSiteConfig } from "@chrryai/donut/utils/siteConfig"

interface MetadataResult {
  title?: string
  description?: string
  keywords?: string[]
  openGraph?: {
    title?: string
    description?: string
    url?: string
    siteName?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
    }>
    locale?: string
    type?: string
  }
  twitter?: {
    title?: string
    description?: string
    card?: string
    site?: string
    creator?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
    }>
  }
  robots?: {
    index?: boolean
    follow?: boolean
  }
  alternates?: {
    canonical?: string
    languages?: Record<string, string>
  }
}

/**
 * Translations for static routes
 */
const aboutTranslations = {
  en: {
    title: "About Vex | AI Super App",
    description:
      "Learn about Vex AI Super App, our mission, and upcoming features",
  },
  de: {
    title: "Über Vex | KI-Assistent",
    description:
      "Erfahren Sie mehr über den Vex KI-Assistenten, unsere Mission und kommende Funktionen",
  },
  fr: {
    title: "À propos de Vex | AI Super App",
    description:
      "Découvrez l'assistant IA Vex, notre mission et les fonctionnalités à venir",
  },
  ja: {
    title: "Vexについて | AI Super App",
    description: "Vex AI Super Appの概要、ミッション、今後の機能について",
  },
  ko: {
    title: "Vex 소개 | AI Super App",
    description: "Vex AI Super App, 우리의 미션, 향후 기능에 대해 알아보세요",
  },
  pt: {
    title: "Sobre o Vex | AI Super App",
    description:
      "Saiba mais sobre o AI Super App Vex, nossa missão e recursos futuros",
  },
  es: {
    title: "Acerca de Vex | AI Super App",
    description:
      "Conozca más sobre el AI Super App Vex, nuestra misión y próximas funcionalidades",
  },
  zh: {
    title: "关于Vex | AI Super App",
    description: "了解Vex AI Super App、我们的使命和即将推出的功能",
  },
  nl: {
    title: "Over Vex | AI-assistent",
    description:
      "Lees meer over de Vex AI-assistent, onze missie en aankomende functies",
  },
  tr: {
    title: "Vex Hakkında | AI Super App",
    description:
      "Vex AI Super Appı, misyonumuz ve gelecek özellikler hakkında bilgi edinin",
  },
  sv: {
    title: "Om Vex | AI-assistent",
    description:
      "Lär dig mer om Vex AI-assistent, vårt uppdrag och kommande funktioner",
  },
  fa: {
    title: "درباره Vex | AI Super App",
    description:
      "درباره AI Super App Vex، ماموریت ما و ویژگی‌های آینده بیشتر بدانید",
  },
}

const whyTranslations = {
  en: {
    title: "Why Vex | AI Super App",
    description:
      "Discover why Vex AI Super App is the best choice for your AI chat needs",
  },
  de: {
    title: "Warum Vex | KI-Assistent",
    description:
      "Entdecken Sie, warum der Vex KI-Assistent die beste Wahl für Ihre KI-Chat-Anforderungen ist",
  },
  fr: {
    title: "Pourquoi Vex | AI Super App",
    description:
      "Découvrez pourquoi l'assistant IA Vex est le meilleur choix pour vos besoins de chat IA",
  },
  ja: {
    title: "Vexが選ばれる理由 | AI Super App",
    description:
      "Vex AI Super AppがAIチャットのニーズに最適な選択肢である理由を発見してください",
  },
  ko: {
    title: "Vex를 선택해야 하는 이유 | AI Super App",
    description:
      "Vex AI Super App가 AI 채팅 요구 사항에 가장 적합한 선택인 이유를 알아보세요",
  },
  pt: {
    title: "Por que Vex | AI Super App",
    description:
      "Descubra por que o AI Super App Vex é a melhor escolha para suas necessidades de chat com IA",
  },
  es: {
    title: "¿Por qué Vex? | AI Super App",
    description:
      "Descubra por qué el AI Super App Vex es la mejor opción para sus necesidades de chat con IA",
  },
  zh: {
    title: "为什么选择Vex | AI Super App",
    description: "探索为什么Vex AI Super App是您AI聊天需求的最佳选择",
  },
  nl: {
    title: "Waarom Vex | AI-assistent",
    description:
      "Ontdek waarom Vex AI-assistent de beste keuze is voor uw AI-chatbehoeften",
  },
  tr: {
    title: "Neden Vex | AI Super App",
    description:
      "Vex AI Super Appı'nın AI sohbet ihtiyaçlarınız için neden en iyi seçim olduğunu keşfedin",
  },
  sv: {
    title: "Varför Vex | AI-assistent",
    description:
      "Upptäck varför Vex AI-assistent är det bästa valet för dina AI-chattbehov",
  },
  fa: {
    title: "چرا Vex | AI Super App",
    description:
      "کشف کنید چرا AI Super App Vex بهترین انتخاب برای نیازهای چت هوش مصنوعی شماست",
  },
}

const privacyTranslations = {
  en: {
    title: "Privacy Policy | Vex",
    description: "Privacy Policy for Vex AI Super App",
  },
  de: {
    title: "Datenschutzrichtlinie | Vex",
    description: "Datenschutzrichtlinie für den Vex KI-Assistenten",
  },
  fr: {
    title: "Politique de Confidentialité | Vex",
    description: "Politique de confidentialité pour l'assistant IA Vex",
  },
  ja: {
    title: "プライバシーポリシー | Vex",
    description: "Vex AI Super Appのプライバシーポリシー",
  },
  ko: {
    title: "개인정보 처리방침 | Vex",
    description: "Vex AI Super App의 개인정보 처리방침",
  },
  pt: {
    title: "Política de Privacidade | Vex",
    description: "Política de Privacidade para o AI Super App Vex",
  },
  es: {
    title: "Política de Privacidad | Vex",
    description: "Política de privacidad del AI Super App Vex",
  },
  zh: {
    title: "隐私政策 | Vex",
    description: "Vex AI Super App的隐私政策",
  },
  nl: {
    title: "Privacybeleid | Vex",
    description: "Privacybeleid voor de Vex AI-assistent",
  },
  tr: {
    title: "Gizlilik Politikası | Vex",
    description: "Vex AI Super Appı için Gizlilik Politikası",
  },
  sv: {
    title: "Integritetspolicy | Vex",
    description: "Integritetspolicy för Vex AI-assistent",
  },
  fa: {
    title: "سیاست حریم خصوصی | Vex",
    description: "سیاست حریم خصوصی برای AI Super App Vex",
  },
}

const termsTranslations = {
  en: {
    title: "Terms of Use | Vex",
    description: "Terms of Use for Vex AI Super App",
  },
  de: {
    title: "Nutzungsbedingungen | Vex",
    description: "Nutzungsbedingungen für den Vex KI-Assistenten",
  },
  fr: {
    title: "Conditions d'Utilisation | Vex",
    description: "Conditions d'utilisation de l'assistant IA Vex",
  },
  ja: {
    title: "利用規約 | Vex",
    description: "Vex AI Super Appの利用規約",
  },
  ko: {
    title: "이용 약관 | Vex",
    description: "Vex AI Super App 이용 약관",
  },
  pt: {
    title: "Termos de Uso | Vex",
    description: "Termos de uso do AI Super App Vex",
  },
  es: {
    title: "Términos de Uso | Vex",
    description: "Términos de uso del AI Super App Vex",
  },
  zh: {
    title: "服务条款 | Vex",
    description: "Vex AI Super App的服务条款",
  },
  nl: {
    title: "Servicevoorwaarden | Vex",
    description: "Servicevoorwaarden voor de Vex AI-assistent",
  },
  tr: {
    title: "Hizmet Şartları | Vex",
    description: "Vex AI Super Appı için Hizmet Şartları",
  },
  sv: {
    title: "Användarvillkor | Vex",
    description: "Användarvillkor för Vex AI-assistent",
  },
  fa: {
    title: "شرایط استفاده | Vex",
    description: "شرایط استفاده از AI Super App Vex",
  },
}

const calendarTranslations = {
  en: {
    title: "Calendar | Vex",
    description: "Manage your schedule with Vex AI Super App",
  },
  de: {
    title: "Kalender | Vex",
    description: "Verwalten Sie Ihren Zeitplan mit dem Vex KI-Assistenten",
  },
  fr: {
    title: "Calendrier | Vex",
    description: "Gérez votre emploi du temps avec l'assistant IA Vex",
  },
  ja: {
    title: "カレンダー | Vex",
    description: "Vex AI Super Appでスケジュールを管理",
  },
  ko: {
    title: "캘린더 | Vex",
    description: "Vex AI Super App로 일정 관리",
  },
  pt: {
    title: "Calendário | Vex",
    description: "Gerencie sua agenda com o AI Super App Vex",
  },
  es: {
    title: "Calendario | Vex",
    description: "Administre su agenda con el AI Super App Vex",
  },
  zh: {
    title: "日历 | Vex",
    description: "使用Vex AI Super App管理您的日程",
  },
  nl: {
    title: "Agenda | Vex",
    description: "Beheer uw agenda met de Vex AI-assistent",
  },
  tr: {
    title: "Takvim | Vex",
    description: "Vex AI Super Appı ile programınızı yönetin",
  },
  sv: {
    title: "Kalender | Vex",
    description: "Hantera ditt schema med Vex AI-assistent",
  },
  fa: {
    title: "تقویم | Vex",
    description: "برنامه خود را با AI Super App Vex مدیریت کنید",
  },
}

const affiliateTranslations = {
  en: {
    title: "Affiliate Program | Vex",
    description: "Join the Vex affiliate program and earn commissions",
  },
  de: {
    title: "Partnerprogramm | Vex",
    description:
      "Treten Sie dem Vex-Partnerprogramm bei und verdienen Sie Provisionen",
  },
  fr: {
    title: "Programme d'Affiliation | Vex",
    description:
      "Rejoignez le programme d'affiliation Vex et gagnez des commissions",
  },
  ja: {
    title: "アフィリエイトプログラム | Vex",
    description: "Vexアフィリエイトプログラムに参加してコミッションを獲得",
  },
  ko: {
    title: "제휴 프로그램 | Vex",
    description: "Vex 제휴 프로그램에 가입하고 수수료를 받으세요",
  },
  pt: {
    title: "Programa de Afiliados | Vex",
    description: "Participe do programa de afiliados Vex e ganhe comissões",
  },
  es: {
    title: "Programa de Afiliados | Vex",
    description: "Únase al programa de afiliados de Vex y gane comisiones",
  },
  zh: {
    title: "联盟计划 | Vex",
    description: "加入Vex联盟计划并赚取佣金",
  },
  nl: {
    title: "Partnerprogramma | Vex",
    description: "Word lid van het Vex-partnerprogramma en verdien commissies",
  },
  tr: {
    title: "Ortaklık Programı | Vex",
    description: "Vex ortaklık programına katılın ve komisyon kazanın",
  },
  sv: {
    title: "Partnerprogram | Vex",
    description: "Gå med i Vex partnerprogram och tjäna provision",
  },
  fa: {
    title: "برنامه همکاری | Vex",
    description: "به برنامه همکاری Vex بپیوندید و کمیسیون کسب کنید",
  },
}

const usersTranslations = {
  en: {
    title: "Users | Vex",
    description: "Explore Vex AI Super App users and community",
  },
  de: {
    title: "Benutzer | Vex",
    description: "Entdecken Sie Vex KI-Assistenten-Benutzer und Community",
  },
  fr: {
    title: "Utilisateurs | Vex",
    description:
      "Explorez les utilisateurs et la communauté de l'assistant IA Vex",
  },
  ja: {
    title: "ユーザー | Vex",
    description: "Vex AI Super Appのユーザーとコミュニティを探索",
  },
  ko: {
    title: "사용자 | Vex",
    description: "Vex AI Super App 사용자 및 커뮤니티 탐색",
  },
  pt: {
    title: "Usuários | Vex",
    description: "Explore usuários e comunidade do AI Super App Vex",
  },
  es: {
    title: "Usuarios | Vex",
    description: "Explore usuarios y comunidad del AI Super App Vex",
  },
  zh: {
    title: "用户 | Vex",
    description: "探索Vex AI Super App用户和社区",
  },
  nl: {
    title: "Gebruikers | Vex",
    description: "Verken Vex AI-assistent gebruikers en community",
  },
  tr: {
    title: "Kullanıcılar | Vex",
    description: "Vex AI Super Appı kullanıcılarını ve topluluğunu keşfedin",
  },
  sv: {
    title: "Användare | Vex",
    description: "Utforska Vex AI-assistentens användare och gemenskap",
  },
  fa: {
    title: "کاربران | Vex",
    description: "کاربران و جامعه AI Super App Vex را کاوش کنید",
  },
}

/**
 * Generate metadata for About page
 */
export function generateAboutMetadata(
  locale: locale,
  siteConfig: ReturnType<typeof getSiteConfig>,
): MetadataResult {
  const t =
    aboutTranslations[locale as keyof typeof aboutTranslations] ||
    aboutTranslations.en
  return {
    title: t.title,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteConfig.url}/about`,
      siteName: siteConfig.name || "Chrry",
    },
    twitter: {
      card: "summary",
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `${siteConfig.url}/about`,
    },
  }
}

/**
 * Generate metadata for Why page
 */
export function generateWhyMetadata(
  locale: locale,
  siteConfig: ReturnType<typeof getSiteConfig>,
): MetadataResult {
  const t =
    whyTranslations[locale as keyof typeof whyTranslations] ||
    whyTranslations.en
  return {
    title: t.title,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteConfig.url}/why`,
      siteName: siteConfig.name || "Chrry",
    },
    twitter: {
      card: "summary",
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `${siteConfig.url}/why`,
    },
  }
}

/**
 * Generate metadata for Privacy page
 */
export function generatePrivacyMetadata(
  locale: locale,
  siteConfig: ReturnType<typeof getSiteConfig>,
): MetadataResult {
  const t =
    privacyTranslations[locale as keyof typeof privacyTranslations] ||
    privacyTranslations.en
  return {
    title: t.title,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteConfig.url}/privacy`,
      siteName: siteConfig.name || "Chrry",
    },
    twitter: {
      card: "summary",
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `${siteConfig.url}/privacy`,
    },
  }
}

/**
 * Generate metadata for Terms page
 */
export function generateTermsMetadata(
  locale: locale,
  siteConfig: ReturnType<typeof getSiteConfig>,
): MetadataResult {
  const t =
    termsTranslations[locale as keyof typeof termsTranslations] ||
    termsTranslations.en
  return {
    title: t.title,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteConfig.url}/terms`,
      siteName: siteConfig.name || "Chrry",
    },
    twitter: {
      card: "summary",
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `${siteConfig.url}/terms`,
    },
  }
}

/**
 * Generate metadata for Calendar page
 */
export function generateCalendarMetadata(
  locale: locale,
  siteConfig: ReturnType<typeof getSiteConfig>,
): MetadataResult {
  const t =
    calendarTranslations[locale as keyof typeof calendarTranslations] ||
    calendarTranslations.en
  return {
    title: t.title,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteConfig.url}/calendar`,
      siteName: siteConfig.name || "Chrry",
    },
    twitter: {
      card: "summary",
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `${siteConfig.url}/calendar`,
    },
  }
}

/**
 * Generate metadata for Affiliate page
 */
export function generateAffiliateMetadata(
  locale: locale,
  siteConfig: ReturnType<typeof getSiteConfig>,
): MetadataResult {
  const t =
    affiliateTranslations[locale as keyof typeof affiliateTranslations] ||
    affiliateTranslations.en
  return {
    title: t.title,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteConfig.url}/affiliate`,
      siteName: siteConfig.name || "Chrry",
    },
    twitter: {
      card: "summary",
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `${siteConfig.url}/affiliate`,
    },
  }
}

/**
 * Generate metadata for Users page
 */
export function generateUsersMetadata(
  locale: locale,
  siteConfig: ReturnType<typeof getSiteConfig>,
): MetadataResult {
  const t =
    usersTranslations[locale as keyof typeof usersTranslations] ||
    usersTranslations.en
  return {
    title: t.title,
    description: t.description,
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteConfig.url}/u`,
      siteName: siteConfig.name || "Chrry",
    },
    twitter: {
      card: "summary",
      title: t.title,
      description: t.description,
    },
    alternates: {
      canonical: `${siteConfig.url}/u`,
    },
  }
}
