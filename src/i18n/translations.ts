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

type TranslationSet = {
  // Nav
  nav_projects: string;
  nav_services: string;
  nav_studio: string;
  nav_contact: string;

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

  // Common
  common_loading: string;
  common_read_more: string;

  // Floating Chat
  chat_whatsapp: string;
  chat_viber: string;
};

const en: TranslationSet = {
  nav_projects: "Projects",
  nav_services: "Services",
  nav_studio: "Studio",
  nav_contact: "Contact",

  footer_navigate: "Navigate",
  footer_architecture: "Architecture",
  footer_rights: "All rights reserved.",

  home_view_projects: "View Projects",
  home_work_with_us: "Work With Us",
  home_full_profile: "Full Profile",
  home_work_together: "Work Together →",
  home_credentials: "Credentials",
  home_recognition: "Recognition",
  home_client_voices: "Client Voices",
  home_featured_work: "Featured Work",
  home_view_all: "View All →",
  home_what_we_do: "What We Do",
  home_learn_more: "Learn More",
  home_achievements: "Achievements",

  services_enquire: "Enquire",
  services_our_process: "Our Process",
  services_start_conversation: "Start a Conversation",
  services_ready_discuss: "Ready to discuss your project?",

  about_the_studio: "The Studio",
  about_principles: "Principles",
  about_people: "People",
  about_get_in_touch: "Get in Touch",

  contact_title: "Contact",
  contact_lets_start: "Let's start a",
  contact_conversation: "conversation.",
  contact_studio_label: "Studio",
  contact_hours: "Hours",
  contact_full_name: "Full Name *",
  contact_email: "Email *",
  contact_phone: "Phone",
  contact_phone_optional: "(optional)",
  contact_project_type: "Project Type",
  contact_select_type: "Select a type…",
  contact_tell_us: "Tell us about your project *",
  contact_submit: "Submit Enquiry",
  contact_sending: "Sending…",
  contact_thank_you: "Thank you for reaching out.",
  contact_in_touch: "We'll be in touch within two working days.",
  contact_send_another: "Send Another Enquiry",

  portfolio_title: "Portfolio",
  portfolio_all: "All",
  portfolio_no_projects: "No projects found.",
  portfolio_start_project: "Start a Project",

  common_loading: "Loading...",
  common_read_more: "Read More",

  chat_whatsapp: "WhatsApp",
  chat_viber: "Viber",
};

const my: TranslationSet = {
  nav_projects: "ပရောဂျက်များ",
  nav_services: "ဝန်ဆောင်မှုများ",
  nav_studio: "စတူဒီယို",
  nav_contact: "ဆက်သွယ်ရန်",

  footer_navigate: "လမ်းညွှန်",
  footer_architecture: "ဗိသုကာ",
  footer_rights: "မူပိုင်ခွင့် အားလုံးကို ထိန်းသိမ်းထားသည်။",

  home_view_projects: "ပရောဂျက်များ ကြည့်ရန်",
  home_work_with_us: "ကျွန်ုပ်တို့နှင့် အလုပ်လုပ်ရန်",
  home_full_profile: "ပရိုဖိုင် အပြည့်အစုံ",
  home_work_together: "အတူတကွ လုပ်ဆောင်ကြစို့ →",
  home_credentials: "အရည်အချင်းများ",
  home_recognition: "အသိအမှတ်ပြုမှု",
  home_client_voices: "ဖောက်သည်များ၏ အသံ",
  home_featured_work: "ထူးခြားသော လုပ်ငန်းများ",
  home_view_all: "အားလုံး ကြည့်ရန် →",
  home_what_we_do: "ကျွန်ုပ်တို့ လုပ်ဆောင်ချက်များ",
  home_learn_more: "ပိုမိုလေ့လာရန်",
  home_achievements: "အောင်မြင်မှုများ",

  services_enquire: "စုံစမ်းရန်",
  services_our_process: "ကျွန်ုပ်တို့၏ လုပ်ငန်းစဉ်",
  services_start_conversation: "စကားပြောကြစို့",
  services_ready_discuss: "သင့်ပရောဂျက်ကို ဆွေးနွေးရန် အဆင်သင့်ဖြစ်ပါပြီလား?",

  about_the_studio: "စတူဒီယို",
  about_principles: "မူဝါဒများ",
  about_people: "လူပုဂ္ဂိုလ်များ",
  about_get_in_touch: "ဆက်သွယ်ရန်",

  contact_title: "ဆက်သွယ်ရန်",
  contact_lets_start: "စကားပြော",
  contact_conversation: "ကြစို့။",
  contact_studio_label: "စတူဒီယို",
  contact_hours: "အချိန်",
  contact_full_name: "အမည် *",
  contact_email: "အီးမေးလ် *",
  contact_phone: "ဖုန်း",
  contact_phone_optional: "(ရွေးချယ်နိုင်)",
  contact_project_type: "ပရောဂျက် အမျိုးအစား",
  contact_select_type: "အမျိုးအစား ရွေးပါ…",
  contact_tell_us: "သင့်ပရောဂျက်အကြောင်း ပြောပြပါ *",
  contact_submit: "တင်ပြရန်",
  contact_sending: "ပို့နေပါသည်…",
  contact_thank_you: "ဆက်သွယ်ပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်။",
  contact_in_touch: "နှစ်ရက်အတွင်း ပြန်လည်ဆက်သွယ်ပါမည်။",
  contact_send_another: "နောက်ထပ် စုံစမ်းမှုတစ်ခု ပို့ရန်",

  portfolio_title: "ပရောဂျက်များ",
  portfolio_all: "အားလုံး",
  portfolio_no_projects: "ပရောဂျက်များ မတွေ့ပါ။",
  portfolio_start_project: "ပရောဂျက်စ တင်ရန်",

  common_loading: "ဖွင့်နေသည်...",
  common_read_more: "ဆက်ဖတ်ရန်",

  chat_whatsapp: "WhatsApp",
  chat_viber: "Viber",
};

const zo: TranslationSet = {
  nav_projects: "Nasepna teng",
  nav_services: "Nasep bawlte",
  nav_studio: "Studio",
  nav_contact: "Kizel ding",

  footer_navigate: "Kaltong",
  footer_architecture: "Inn sak",
  footer_rights: "Thukham theihna khempeuh ki vawt hi.",

  home_view_projects: "Nasepna teng en",
  home_work_with_us: "Kan tawh na sem ding",
  home_full_profile: "Profile khempeuh",
  home_work_together: "Atawm sem ding →",
  home_credentials: "Thei khiatna",
  home_recognition: "Theihna tawh ki lem",
  home_client_voices: "A lei mite aw",
  home_featured_work: "Nasep hoih teng",
  home_view_all: "Khempeuh en →",
  home_what_we_do: "Kan nasep teng",
  home_learn_more: "A tamzaw thei ding",
  home_achievements: "Topa tung pan",

  services_enquire: "Dong ding",
  services_our_process: "Kan nasem dan",
  services_start_conversation: "Thu ki gen ding",
  services_ready_discuss: "Na project thu ki gen ding in na ki cing hiam?",

  about_the_studio: "Studio",
  about_principles: "Thu nem teng",
  about_people: "Mi teng",
  about_get_in_touch: "Kizel ding",

  contact_title: "Kizel ding",
  contact_lets_start: "Thu ki gen",
  contact_conversation: "ding.",
  contact_studio_label: "Studio",
  contact_hours: "Ni leh hun",
  contact_full_name: "Min khempeuh *",
  contact_email: "Email *",
  contact_phone: "Phone",
  contact_phone_optional: "(a hih leh)",
  contact_project_type: "Project namneina",
  contact_select_type: "Namneina tel…",
  contact_tell_us: "Na project thu gen in *",
  contact_submit: "Thawn ding",
  contact_sending: "Thawn lai…",
  contact_thank_you: "Thu na gen na hang lungdam.",
  contact_in_touch: "Ni nih sung ah na kiang ah kan hong ki zel ding hi.",
  contact_send_another: "Thu dang gen kik ding",

  portfolio_title: "Nasepna teng",
  portfolio_all: "Khempeuh",
  portfolio_no_projects: "Nasepna mu lo.",
  portfolio_start_project: "Nasep kipan ding",

  common_loading: "Hong kit lai…",
  common_read_more: "A tamzaw sim ding",

  chat_whatsapp: "WhatsApp",
  chat_viber: "Viber",
};

export const translations: Record<Language, TranslationSet> = { en, my, zo };
