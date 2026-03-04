import { useLanguageStore } from "@/features/auth/language";
import type { AppLanguage } from "@/types/auth";

const MESSAGES = {
  EN: {
    kpiPlatform: "KPI Platform",
    sidebar: "Sidebar",
    accountSettings: "Account Settings",
    users: "Users",
    myDepartment: "My Department",
    departments: "Departments",
    buildings: "Buildings",
    categories: "Categories",
    kpi: "KPI",
    offerings: "Offerings",
    applications: "Applications",
    logout: "Logout",
    dashboard: "Dashboard",
    home: "Home",
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    employee: "Employee",
    user: "User",
    inRegistration: "In registration",
    active: "Active",
    block: "Block",
    currentLanguageClickToSwitch: "Current language {lang}. Click to switch language.",
  },
  UZ: {
    kpiPlatform: "KPI Platformasi",
    sidebar: "Yon panel",
    accountSettings: "Hisob sozlamalari",
    users: "Foydalanuvchilar",
    myDepartment: "Mening bo'limim",
    departments: "Bo'limlar",
    buildings: "Binolar",
    categories: "Kategoriyalar",
    kpi: "KPI",
    offerings: "Xizmatlar",
    applications: "Arizalar",
    logout: "Chiqish",
    dashboard: "Boshqaruv paneli",
    home: "Bosh sahifa",
    owner: "Ega",
    admin: "Administrator",
    manager: "Menejer",
    employee: "Xodim",
    user: "Foydalanuvchi",
    inRegistration: "Ro'yxatdan o'tishda",
    active: "Faol",
    block: "Bloklangan",
    currentLanguageClickToSwitch: "Joriy til {lang}. Tilni almashtirish uchun bosing.",
  },
  RU: {
    kpiPlatform: "Платформа KPI",
    sidebar: "Боковое меню",
    accountSettings: "Настройки аккаунта",
    users: "Пользователи",
    myDepartment: "Мой отдел",
    departments: "Отделы",
    buildings: "Здания",
    categories: "Категории",
    kpi: "KPI",
    offerings: "Услуги",
    applications: "Заявки",
    logout: "Выйти",
    dashboard: "Панель",
    home: "Главная",
    owner: "Владелец",
    admin: "Администратор",
    manager: "Менеджер",
    employee: "Сотрудник",
    user: "Пользователь",
    inRegistration: "В регистрации",
    active: "Активный",
    block: "Заблокирован",
    currentLanguageClickToSwitch: "Текущий язык {lang}. Нажмите, чтобы сменить язык.",
  },
} as const;

export type MessageKey = keyof (typeof MESSAGES)["EN"];

export function tByLang(key: MessageKey, language: AppLanguage): string {
  return MESSAGES[language][key] ?? MESSAGES.EN[key];
}

export function useI18n() {
  const language = useLanguageStore((state) => state.language);

  const t = (key: MessageKey, vars?: Record<string, string | number>) => {
    let value = tByLang(key, language);
    if (vars) {
      Object.entries(vars).forEach(([name, replacement]) => {
        value = value.split(`{${name}}`).join(String(replacement));
      });
    }
    return value;
  };

  return { language, t };
}
