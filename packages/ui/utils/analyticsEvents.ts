/**
 * Analytics Event Constants
 * Centralized event names for tracking across the application
 */

export const ANALYTICS_EVENTS = {
  // App Management
  APP_VIEWED: "app",
  APP_SAVE_SUCCESS: "app_save_success",
  APP_SAVE_ERROR: "app_save_error",
  APP_DELETE_SUCCESS: "app_delete_success",
  APP_STATUS: "app_status",
  QUOTA_INFO: "quota-info",
  LINK_CLICK: "link_click",
  IS_ATTACHING: "is-attaching",
  CHERRY_DEV_CLICK: "cherry_dev_click",
  VOICE_CONVERSATION: "voice_conversation",
  BLUE_SKY_CLICK: "blue_sky_click",
  VOICE_INPUT: "voice-input",
  BUY_ME_A_COFFEE_CLICK: "buy_me_a_coffee_click",
  WM_APP_LINK_CLICK: "wm_app_link_click",
  WM_BYOK_SUBMIT: "wm_byok_submit",
  WM_BYOK_CLICK: "wm_byok_click",
  WM_BYOK_SUBMIT_SUCCESS: "wm_byok_submit_success",
  WM_BYOK_SUBMIT_ERROR: "wm_byok_submit_error",
  WM_TRIBE_LINK_CLICK: "wm_tribe_link_click",
  FILE_INPUT: "file-input",
  GAME_TOGGLE: "game-toggle",
  HIT_HOURLY_LIMIT: "hit-hourly-limit",
  FILE_UPLOAD: "file-upload",
  APP_LINK_CLICK: "app_link_click",
  SUGGESTIONS_GENERATED: "suggestions_generated",
  COLLABORATION: "collaboration",
  WANNATHIS: "wannathis",
  MESSAGE_COLLABORATION: "message_collaboration",
  WATERMELON: "watermelon",
  LIKE: "like",
  VIDEO_CLICKED: "video_clicked",
  THREAD_LIKES: "thread_likes",
  GRAPE_MODAL_CLOSE: "grape_modal_close",
  GRAPE_APP_SELECT: "grape_app_select",
  GRAPE_PEAR_FEEDBACK: "grape_pear_feedback",
  GRAPE_ICON_CLICK: "grape_icon_click",
  GRAPE_MODAL_OPEN: "grape_modal_open",
  LANGUAGE_SWITCHER: "language_switcher",
  MENU_TOGGLE: "menu-toggle",
  HOME_CLICK: "home-click",
  NEW_CHAT_CLICK: "new-chat-click",
  PRIVATE_CHAT_CLICK: "private-chat-click",
  THREAD_CLICK_MENU: "thread-click-menu",
  LOAD_MORE_THREADS_MENU: "load-more-threads-menu",
  STORE_VIEW: "store_view",
  BOOKMARK: "bookmark",
  STORE_APP_SELECTED: "store_app_selected",
  SPATIAL_NAVIGATION: "spatial_navigation",
  MAXIMIZE_DURATION: "maximize_duration",
  MINIMIZE_DURATION: "minimize_duration",
  MAXIMIZE: "maximize",
  MINIMIZE: "minimize",
  APP_BACK: "app_back",
  CHARACTER_TAG_CREATED: "character_tag_created",
  HIPPO_CLICK: "hippo_click",

  // Chat & Messaging
  CHAT_SEND: "chat",
  CHAT_STOP: "chat_stop",
  CHAT_REGENERATE: "chat_regenerate",
  CHAT_EDIT: "chat_edit",
  CHAT_DELETE: "chat_delete",
  TICKER_CLICK: "ticker_click",
  TICKER_PAUSE: "ticker_pause",
  TICKER_RESUME: "ticker_resume",
  TICKER_MOTTO_CLICK: "ticker_motto_pause",
  TICKER_MOTTO_PAUSE: "ticker_motto_pause",
  TICKER_MOTTO_RESUME: "ticker_motto_resume",

  // Threads
  THREAD_CREATE: "thread",
  THREAD_VIEW: "thread_view",
  THREAD_DELETE: "thread_delete",
  THREAD_SHARE: "thread_share",
  TIMER_START: "timer_start",

  // Memory
  MEMORY_SAVE: "memory",
  MEMORY_DELETE: "memory_delete",
  MEMORY_TOGGLE: "memory_toggle",

  // Feedback (Pear)
  FEEDBACK_SUBMIT: "feedback",
  FEEDBACK_LIKE: "feedback_like",
  FEEDBACK_DISLIKE: "feedback_dislike",
  AGENT_SELECTED: "agent-selected",
  SUBSCRIBE_FROM_CHAT_CLICK: "subscribe-from-chat-click",

  TASK_ADD: "task_add",
  // Subscription
  SUBSCRIBE_CHECKOUT: "subscribe_checkout",
  SUBSCRIBE_VERIFY_PAYMENT: "subscribe_verify_payment",
  SUBSCRIBE_PAYMENT_VERIFIED: "subscribe_payment_verified",
  SUBSCRIBE_PAYMENT_VERIFICATION_FAILED:
    "subscribe_payment_verification_failed",
  SUBSCRIPTION_CHANGE: "subscription",
  SUBSCRIBE_TIER_VIEW: "subscribe_tier_view",
  APP: "app",
  AD_VISIT: "ad_visit",
  TIMER_PRESET: "timer_preset",
  BURN: "burn",
  TIMER_CANCEL: "timer_cancel",
  TIMER_PAUSE: "timer_pause",
  TIMER_RESUME: "timer_resume",
  GH_REPO_CLICK: "gh_repo_click",
  PEAR: "pear",
  THEME_CHANGE: "theme_change",
  COLOR_SCHEME_CHANGE: "color_scheme_change",

  // Authentication
  LOGIN: "login",
  LOGOUT: "logout",
  SIGNUP: "signup",
  PLAY_BIRD_SOUND: "play_bird_sound",
  GOOGLE_SIGNIN: "google_signin",
  APPLE_SIGNIN: "apple_signin",
  GITHUB_SIGNIN: "github_signin",

  // Store & Discovery
  STORE_INSTALL: "store_install",
  GRAPE_OPEN: "grape_open",
  GRAPE_CLOSE: "grape_close",
  GRAPE_APP_VIEW: "grape_app_view",

  // Settings
  LANGUAGE_CHANGE: "language_change",
  PERFORMANCE: "performance",
  PRIVACY_TOGGLE: "privacy_toggle",

  // Navigation
  TERMS_VIEW: "terms_view",
  PRIVACY_VIEW: "privacy_view",
  ABOUT_VIEW: "about_view",
  WHY_VIEW: "why_view",
  THREAD_MESSAGE_AGENT: "thread-message-agent",
  DEBATE_AGENT_SELECTED: "debate_agent_selected",
  AGENT_MODAL: "agent-modal",
  DEBATE_AGENT_MODAL: "debate-agent-modal",
} as const

// Type for event names
export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

// Events that should be sent to API for AI context (not just Plausible)
// These are high-value user actions that help AI understand user behavior
export const MEANINGFUL_EVENTS: AnalyticsEventName[] = [
  // App lifecycle - AI needs to know what apps user is working on
  ANALYTICS_EVENTS.APP,
  ANALYTICS_EVENTS.LINK_CLICK,
  ANALYTICS_EVENTS.GH_REPO_CLICK,
  ANALYTICS_EVENTS.WM_TRIBE_LINK_CLICK,
  ANALYTICS_EVENTS.TICKER_PAUSE,
  ANALYTICS_EVENTS.TICKER_RESUME,
  ANALYTICS_EVENTS.WM_APP_LINK_CLICK,
  ANALYTICS_EVENTS.WM_BYOK_CLICK,
  ANALYTICS_EVENTS.WM_BYOK_SUBMIT,
  ANALYTICS_EVENTS.WM_BYOK_SUBMIT_SUCCESS,
  ANALYTICS_EVENTS.TICKER_MOTTO_CLICK,
  ANALYTICS_EVENTS.TICKER_MOTTO_PAUSE,
  ANALYTICS_EVENTS.TICKER_MOTTO_RESUME,
  ANALYTICS_EVENTS.WM_BYOK_SUBMIT_ERROR,
  ANALYTICS_EVENTS.APP_SAVE_SUCCESS,
  ANALYTICS_EVENTS.VIDEO_CLICKED,
  ANALYTICS_EVENTS.THREAD_LIKES,
  ANALYTICS_EVENTS.HIPPO_CLICK,
  ANALYTICS_EVENTS.APP_SAVE_ERROR,
  ANALYTICS_EVENTS.APP_DELETE_SUCCESS,
  ANALYTICS_EVENTS.CHERRY_DEV_CLICK,
  ANALYTICS_EVENTS.APP_STATUS,
  ANALYTICS_EVENTS.SPATIAL_NAVIGATION,
  ANALYTICS_EVENTS.TASK_ADD,
  ANALYTICS_EVENTS.BUY_ME_A_COFFEE_CLICK,
  ANALYTICS_EVENTS.SUBSCRIBE_FROM_CHAT_CLICK,
  ANALYTICS_EVENTS.SUBSCRIBE_TIER_VIEW,
  ANALYTICS_EVENTS.BOOKMARK,
  ANALYTICS_EVENTS.LIKE,
  ANALYTICS_EVENTS.TIMER_PRESET,
  ANALYTICS_EVENTS.TIMER_START,
  ANALYTICS_EVENTS.TIMER_CANCEL,
  ANALYTICS_EVENTS.TIMER_PAUSE,
  ANALYTICS_EVENTS.TIMER_RESUME,
  ANALYTICS_EVENTS.PLAY_BIRD_SOUND,
  ANALYTICS_EVENTS.SUGGESTIONS_GENERATED,
  ANALYTICS_EVENTS.MESSAGE_COLLABORATION,
  ANALYTICS_EVENTS.APP_LINK_CLICK,
  ANALYTICS_EVENTS.WATERMELON,
  ANALYTICS_EVENTS.BLUE_SKY_CLICK,
  // Chat & messaging - Core user interactions
  ANALYTICS_EVENTS.CHAT_SEND,
  ANALYTICS_EVENTS.AGENT_SELECTED,
  ANALYTICS_EVENTS.DEBATE_AGENT_SELECTED,
  ANALYTICS_EVENTS.VOICE_CONVERSATION,
  ANALYTICS_EVENTS.WM_APP_LINK_CLICK,
  ANALYTICS_EVENTS.TICKER_CLICK,

  // Threads - Important for context continuity
  ANALYTICS_EVENTS.THREAD_CREATE,
  ANALYTICS_EVENTS.THREAD_VIEW,
  ANALYTICS_EVENTS.THREAD_DELETE,
  ANALYTICS_EVENTS.CHARACTER_TAG_CREATED,
  ANALYTICS_EVENTS.COLLABORATION,

  // Memory - Critical for personalization
  ANALYTICS_EVENTS.MEMORY_SAVE,
  ANALYTICS_EVENTS.MEMORY_DELETE,
  ANALYTICS_EVENTS.BURN, // User wants to forget

  // Feedback (Pear) - Quality signals
  ANALYTICS_EVENTS.FEEDBACK_SUBMIT,
  ANALYTICS_EVENTS.PEAR, // Pear mode activated
  ANALYTICS_EVENTS.GRAPE_PEAR_FEEDBACK,

  // Subscription - Monetization signals
  ANALYTICS_EVENTS.SUBSCRIBE_CHECKOUT,
  ANALYTICS_EVENTS.SUBSCRIBE_PAYMENT_VERIFIED,
  ANALYTICS_EVENTS.SUBSCRIPTION_CHANGE,

  // Authentication - User lifecycle
  ANALYTICS_EVENTS.LOGIN,
  ANALYTICS_EVENTS.LOGOUT,
  ANALYTICS_EVENTS.WANNATHIS,
  ANALYTICS_EVENTS.SIGNUP,
  ANALYTICS_EVENTS.GOOGLE_SIGNIN,
  ANALYTICS_EVENTS.APPLE_SIGNIN,
  ANALYTICS_EVENTS.GITHUB_SIGNIN,

  ANALYTICS_EVENTS.APP_BACK,
  ANALYTICS_EVENTS.MAXIMIZE_DURATION,
  ANALYTICS_EVENTS.MINIMIZE_DURATION,
  ANALYTICS_EVENTS.MAXIMIZE,
  ANALYTICS_EVENTS.MINIMIZE,

  // Store & Discovery - Feature adoption
  ANALYTICS_EVENTS.STORE_VIEW,
  ANALYTICS_EVENTS.STORE_APP_SELECTED,
  ANALYTICS_EVENTS.STORE_INSTALL,
  ANALYTICS_EVENTS.GRAPE_APP_SELECT,

  // Settings - Preference changes
  ANALYTICS_EVENTS.LANGUAGE_SWITCHER,
  ANALYTICS_EVENTS.THEME_CHANGE,

  // Ads - Attribution
  ANALYTICS_EVENTS.AD_VISIT,

  // Limits - User friction points
  ANALYTICS_EVENTS.HIT_HOURLY_LIMIT,
]

// All events for Plausible goal tracking (auto-sync to Plausible)
// This list is used to automatically configure Plausible goals
export const ALL_TRACKABLE_EVENTS = Object.values(ANALYTICS_EVENTS)
