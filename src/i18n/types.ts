export type Language = "en" | "my" | "zo";

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "EN",
  my: "မြန်မာ",
  zo: "Zomi",
};

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  my: "မြန်မာဘာသာ",
  zo: "Zomi Pau",
};

export type TranslationSet = {
  // Nav
  nav_projects: string;
  nav_services: string;
  nav_studio: string;
  nav_contact: string;
  nav_blog: string;
  nav_design_studio: string;

  // Footer
  footer_navigate: string;
  footer_architecture: string;
  footer_rights: string;

  // Home
  home_view_projects: string;
  home_work_with_us: string;
  home_full_profile: string;
  home_work_together: string;
  home_credentials: string;
  home_recognition: string;
  home_client_voices: string;
  home_featured_work: string;
  home_view_all: string;
  home_what_we_do: string;
  home_learn_more: string;
  home_achievements: string;
  home_selected_work: string;
  home_disciplines: string;
  home_awards_recognition: string;
  home_honored_work: string;
  home_all_projects: string;
  home_begin_project: string;

  // Services
  services_enquire: string;
  services_our_process: string;
  services_start_conversation: string;
  services_ready_discuss: string;

  // About
  about_the_studio: string;
  about_principles: string;
  about_people: string;
  about_get_in_touch: string;

  // Contact
  contact_title: string;
  contact_lets_start: string;
  contact_conversation: string;
  contact_studio_label: string;
  contact_hours: string;
  contact_full_name: string;
  contact_email: string;
  contact_phone: string;
  contact_phone_optional: string;
  contact_project_type: string;
  contact_select_type: string;
  contact_tell_us: string;
  contact_submit: string;
  contact_sending: string;
  contact_thank_you: string;
  contact_in_touch: string;
  contact_send_another: string;

  // Portfolio
  portfolio_title: string;
  portfolio_all: string;
  portfolio_no_projects: string;
  portfolio_start_project: string;
  portfolio_selected_work: string;
  portfolio_our: string;
  portfolio_description: string;
  portfolio_projects_stat: string;
  portfolio_featured_stat: string;
  portfolio_categories_stat: string;
  portfolio_search: string;
  portfolio_featured_badge: string;
  portfolio_no_found_hint: string;
  portfolio_clear_filters: string;
  portfolio_showing: string;
  portfolio_of: string;
  portfolio_projects_label: string;
  portfolio_loading: string;
  portfolio_load_more: string;
  portfolio_inspired: string;
  portfolio_lets_create: string;
  portfolio_begin_conversation: string;

  // Blog

  // Projects (public)
  projects_our_work: string;
  projects_title: string;
  projects_description: string;
  projects_search: string;
  projects_no_found: string;
  projects_no_found_hint: string;
  projects_view: string;
  projects_have_in_mind: string;
  projects_bring_vision: string;
  projects_begin_conversation: string;

  // Project Detail (public)
  project_not_found: string;
  project_not_found_hint: string;
  project_back: string;
  project_start_date: string;
  project_target_date: string;
  project_gallery: string;
  project_files: string;
  project_no_files: string;
  project_interested: string;
  project_interested_hint: string;
  project_begin_conversation: string;

  // Common
  common_loading: string;
  common_read_more: string;

  // Floating Chat
  chat_whatsapp: string;
  chat_viber: string;
  // SEO
  seo_home_title: string;
  seo_home_description: string;
  seo_portfolio_title: string;
  seo_portfolio_description: string;
  seo_about_title: string;
  seo_about_description: string;
  seo_services_title: string;
  seo_services_description: string;
  seo_contact_title: string;
  seo_contact_description: string;
};
