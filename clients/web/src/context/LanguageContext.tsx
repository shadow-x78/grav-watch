"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ar" | "en";

interface LanguageContextType {
  language: Language;
  direction: "rtl" | "ltr";
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    "app.title": "GravWatch",
    "app.subtitle": "لوحة مراقبة كوتا وحصص حسابات Google Antigravity المجمعة",
    "nav.overview": "نظرة عامة والكوتا المجمعة",
    "nav.accounts": "إدارة وتسجيل الحسابات",
    "nav.simulator": "محاكي الطلبات المباشر",
    "nav.integration": "دليل أوامر agy والبروكسي",
    "live.streaming": "بث لحظي مباشر",
    "live.connected": "متصل بـ FastAPI Hub",
    "live.paused": "البث متوقف",
    "btn.add_account": "إضافة حساب جديد",
    "btn.pair_google": "ربط حساب Google (OAuth)",
    "btn.refresh_all": "تحديث الكوتا الآن",
    "btn.reset_sample": "استعادة البيانات التجريبية",

    "time.1h": "آخر ساعة",
    "time.24h": "آخر 24 ساعة",
    "time.7d": "آخر 7 أيام",
    "time.30d": "آخر 30 يوم",
    "time.all": "كل الأوقات",

    "kpi.pooled_quota": "إجمالي الكوتا المتبقية في الـ Pool",
    "kpi.pooled_desc": "السعة المتاحة لجميع الحسابات مجتمعة",
    "kpi.burn_rate": "معدل الحرق اللحظي",
    "kpi.burn_desc": "توكنز مستهلكة / دقيقة",
    "kpi.active_containers": "الحاويات النشطة",
    "kpi.containers_desc": "حاويات معزولة بنظام Docker",
    "kpi.requests_today": "إجمالي الطلبات اليوم",
    "kpi.requests_desc": "معدل النجاح 98.4%",

    "models.matrix_title": "مصفوفة استهلاك كوتا النماذج (Antigravity 5-Model Engine)",
    "models.matrix_subtitle": "تتبع مجمع لحظي لحدود الـ RPM والـ TPM لكل نموذج",
    "models.gemini_flash": "Gemini 2.0 Flash",
    "models.gemini_pro": "Gemini 2.0 Pro",
    "models.claude_sonnet": "Claude 3.7 Sonnet",
    "models.claude_opus": "Claude 3.5 Opus",
    "models.gpt_oss": "GPT OSS / DeepSeek",
    "models.remaining": "متبقي",
    "models.used": "مستهلك",
    "models.limit": "الحد الأقصى",
    "models.reset_in": "إعادة التعيين خلال",

    "chart.timeline_title": "مخطط الاستهلاك الزمني المجمع",
    "chart.timeline_desc": "تتبع استهلاك التوكنز والطلبات عبر الحسابات والنماذج",
    "chart.donut_title": "توزيع حصة الكوتا في الـ Pool",
    "chart.donut_desc": "مساهمة كل حساب من إجمالي السعة المتاحة",
    "chart.activity_title": "سجل الأحداث والطلبات اللحظية (Live Telemetry Ticker)",
    "chart.activity_desc": "عمليات تنفيذ أوامر agy عبر الحاويات في الوقت الفعلي",

    "accounts.title": "الحسابات وحاويات Docker المعزولة",
    "accounts.subtitle": "إدارة وتتبع جلسات Google OAuth المستقلة ومراقبة استهلاك كل حساب",
    "accounts.search_placeholder": "البحث بالاسم، البريد، الحاوية، أو الوسم...",
    "accounts.filter_all": "جميع الحالات",
    "accounts.filter_active": "نشط (Active)",
    "accounts.filter_warning": "اقترب من الحد (Warning)",
    "accounts.filter_depleted": "مستنفد (Depleted)",
    "accounts.filter_paused": "متوقف (Paused)",
    "accounts.col_account": "الحساب والبريد",
    "accounts.col_container": "حاوية Docker والذاكرة",
    "accounts.col_status": "الحالة",
    "accounts.col_remaining": "الكوتا المتبقية",
    "accounts.col_models": "حالة النماذج الـ 5",
    "accounts.col_reset": "دورة التجديد",
    "accounts.col_actions": "الإجراءات",

    "modal.google_title": "ربط حساب Google OAuth جديد (محاكاة setup-auth.sh)",
    "modal.google_desc": "سيتم إنشاء حاوية Docker معزولة (debian-slim) وتخزين الـ Token بشكل مستقل",
    "modal.manual_title": "إضافة حساب يدوي / Session Token",
    "modal.manual_desc": "تكوين حاوية مخصصة مع إدخال مفتاح الـ API أو الجلسة يدوياً",
    "modal.edit_title": "تعديل إعدادات الحساب والحاوية",
    "modal.delete_title": "تأكيد إزالة الحساب",
    "modal.delete_desc": "هل أنت متأكد من رغبتك في حذف الحساب وإيقاف حاوية Docker المخصصة له؟",

    "sim.title": "محاكي توجيه طلبات Antigravity CLI",
    "sim.desc": "اختبر إرسال طلب وهمي وشاهد كيف يوجهه GravWatch للحاوية الأنسب مع تحديث الكوتا اللحظي",
    "sim.prompt_label": "الأمر التجريبي أو البرومبت",
    "sim.select_model": "اختر النموذج المطلوب",
    "sim.strategy": "استراتيجية التوزيع (Load Balancing)",
    "sim.strat_least": "الحساب الأقل استهلاكاً (Least Used - مستحسن)",
    "sim.strat_round": "التناوب الدائري (Round Robin)",
    "sim.send_btn": "تنفيذ الطلب واستهلاك الكوتا",
    "sim.executing": "جاري التوجيه والتنفيذ...",

    "common.active": "نشط",
    "common.warning": "تحذير",
    "common.depleted": "مستنفد",
    "common.paused": "متوقف",
    "common.cancel": "إلغاء",
    "common.save": "حفظ التغييرات",
    "common.delete": "حذف الحساب",
    "common.confirm": "تأكيد",
    "common.tokens": "توكنز",
    "common.requests": "طلبات",
  },
  en: {
    "app.title": "GravWatch",
    "app.subtitle": "Multi-Account Google Antigravity Telemetry & Quota Aggregation Hub",
    "nav.overview": "Overview & Quota Pool",
    "nav.accounts": "Accounts & Containers",
    "nav.simulator": "Live Prompt Simulator",
    "nav.integration": "agy CLI & Proxy Guide",
    "live.streaming": "Live Telemetry",
    "live.connected": "FastAPI Hub Connected",
    "live.paused": "Stream Paused",
    "btn.add_account": "Add Account",
    "btn.pair_google": "Pair Google OAuth",
    "btn.refresh_all": "Scrape & Refresh Now",
    "btn.reset_sample": "Reset Sample Data",

    "time.1h": "Last 1h",
    "time.24h": "Last 24h",
    "time.7d": "Last 7d",
    "time.30d": "Last 30d",
    "time.all": "All Time",

    "kpi.pooled_quota": "Pooled Quota Remaining",
    "kpi.pooled_desc": "Combined capacity across all accounts",
    "kpi.burn_rate": "Current Burn Rate",
    "kpi.burn_desc": "Tokens consumed / minute",
    "kpi.active_containers": "Active Containers",
    "kpi.containers_desc": "Isolated Docker sandbox nodes",
    "kpi.requests_today": "Total Requests Today",
    "kpi.requests_desc": "98.4% success rate",

    "models.matrix_title": "Antigravity 5-Model Quota Matrix",
    "models.matrix_subtitle": "Real-time aggregated RPM & TPM limits across models",
    "models.gemini_flash": "Gemini 2.0 Flash",
    "models.gemini_pro": "Gemini 2.0 Pro",
    "models.claude_sonnet": "Claude 3.7 Sonnet",
    "models.claude_opus": "Claude 3.5 Opus",
    "models.gpt_oss": "GPT OSS / DeepSeek",
    "models.remaining": "Remaining",
    "models.used": "Used",
    "models.limit": "Limit",
    "models.reset_in": "Resets in",

    "chart.timeline_title": "Pooled Usage Timeline",
    "chart.timeline_desc": "Token consumption and request volume over time",
    "chart.donut_title": "Quota Pool Distribution",
    "chart.donut_desc": "Capacity contribution per account",
    "chart.activity_title": "Live Telemetry Ticker",
    "chart.activity_desc": "Real-time agy command executions across containers",

    "accounts.title": "Accounts & Isolated Containers",
    "accounts.subtitle": "Manage isolated Docker sessions and monitor per-account quota health",
    "accounts.search_placeholder": "Search by alias, email, container, tag...",
    "accounts.filter_all": "All Statuses",
    "accounts.filter_active": "Active",
    "accounts.filter_warning": "Warning",
    "accounts.filter_depleted": "Depleted",
    "accounts.filter_paused": "Paused",
    "accounts.col_account": "Account & Email",
    "accounts.col_container": "Docker Node & Memory",
    "accounts.col_status": "Status",
    "accounts.col_remaining": "Remaining Quota",
    "accounts.col_models": "5-Model Health",
    "accounts.col_reset": "Reset Cycle",
    "accounts.col_actions": "Actions",

    "modal.google_title": "Pair New Google OAuth Account (setup-auth.sh)",
    "modal.google_desc": "Creates an isolated Docker container node and secures token storage",
    "modal.manual_title": "Add Manual Account / Session Key",
    "modal.manual_desc": "Configure a custom container with explicit tokens and limits",
    "modal.edit_title": "Edit Account & Container Settings",
    "modal.delete_title": "Confirm Account Removal",
    "modal.delete_desc": "Are you sure you want to remove this account and tear down its Docker container?",

    "sim.title": "Antigravity CLI Prompt Router Simulator",
    "sim.desc": "Send a mock command to see how GravWatch balances the load and drains quota in real time",
    "sim.prompt_label": "Mock Command or Prompt",
    "sim.select_model": "Target Model",
    "sim.strategy": "Load Balancing Strategy",
    "sim.strat_least": "Least Used Capacity (Recommended)",
    "sim.strat_round": "Round Robin",
    "sim.send_btn": "Execute & Drain Quota",
    "sim.executing": "Routing & Executing...",

    "common.active": "Active",
    "common.warning": "Warning",
    "common.depleted": "Depleted",
    "common.paused": "Paused",
    "common.cancel": "Cancel",
    "common.save": "Save Changes",
    "common.delete": "Delete Account",
    "common.confirm": "Confirm",
    "common.tokens": "Tokens",
    "common.requests": "Requests",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("gravwatch_lang") as Language;
    if (saved === "ar" || saved === "en") {
      setLanguageState(saved);
    } else {
      setLanguageState("en");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("gravwatch_lang", lang);
    if (typeof document !== "undefined") {
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
    }
  }, [direction, language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
