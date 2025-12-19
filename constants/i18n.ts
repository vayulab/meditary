/**
 * Meditary Internationalization
 * Supports: English (en) and Portuguese Brazil (pt)
 */

export type Language = "en" | "pt";

export const translations = {
  en: {
    // App
    appName: "Meditary",
    
    // Tabs
    tabHome: "Home",
    tabNewEntry: "New Entry",
    tabHistory: "History",
    tabProgress: "Progress",
    tabSettings: "Settings",
    
    // Home Screen
    homeTitle: "Today",
    homeGreeting: "Good morning",
    homeGreetingAfternoon: "Good afternoon",
    homeGreetingEvening: "Good evening",
    homeNoEntry: "No meditation logged today",
    homeEntryLogged: "Meditation logged",
    homeLogMeditation: "Log Today's Meditation",
    homeStreak: "Day streak",
    homeThisMonth: "This month",
    homeRecentEntries: "Recent Entries",
    homeNoRecentEntries: "No entries yet. Start your meditation journey!",
    
    // New Entry Screen
    newEntryTitle: "New Entry",
    newEntryDate: "Date & Time",
    newEntryQuestions: "Questions",
    newEntryNotes: "Additional Notes",
    newEntryNotesPlaceholder: "Any other thoughts or observations...",
    newEntrySave: "Save Entry",
    newEntrySaved: "Entry saved successfully!",
    
    // History Screen
    historyTitle: "History",
    historyCalendar: "Calendar",
    historyList: "List",
    historyNoEntries: "No entries for this month",
    historyViewAll: "View All",
    
    // Entry Detail Screen
    entryDetailTitle: "Entry Details",
    entryDetailEdit: "Edit",
    entryDetailDelete: "Delete",
    entryDetailDeleteConfirm: "Are you sure you want to delete this entry?",
    entryDetailDeleted: "Entry deleted",
    
    // Settings Screen
    settingsTitle: "Settings",
    settingsLanguage: "Language",
    settingsLanguageEn: "English",
    settingsLanguagePt: "Português",
    settingsQuestions: "Customize Questions",
    settingsQuestionsDesc: "Add, edit, or reorder questions",
    settingsExport: "Export Data",
    settingsExportDesc: "Download your meditation data",
    settingsAbout: "About",
    settingsVersion: "Version",
    settingsDeviceId: "Device ID",
    settingsDeviceIdDesc: "Used for usage analytics",
    
    // Customize Questions Screen
    customizeTitle: "Customize Questions",
    customizeAdd: "Add Question",
    customizeReset: "Reset to Default",
    customizeResetConfirm: "This will restore all default questions. Continue?",
    customizeEmpty: "No questions. Add one to get started.",
    customizeDragHint: "Drag to reorder",
    
    // Question Editor
    questionEditorTitle: "Edit Question",
    questionEditorNew: "New Question",
    questionEditorText: "Question Text",
    questionEditorType: "Answer Type",
    questionEditorTypeRating: "Rating (1-5)",
    questionEditorTypeText: "Text",
    questionEditorTypeSelect: "Options",
    questionEditorSave: "Save",
    questionEditorDelete: "Delete Question",
    
    // Common
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    done: "Done",
    back: "Back",
    yes: "Yes",
    no: "No",
    ok: "OK",
    
    // Rating Labels
    ratingPoor: "Poor",
    ratingFair: "Fair",
    ratingGood: "Good",
    ratingVeryGood: "Very Good",
    ratingExcellent: "Excellent",
    
    // Default Questions
    questions: {
      concentration: "How was my concentration?",
      physicalPain: "Any physical pain?",
      eyes: "How were my eyes?",
      sensation: "What sensation emerged?",
      thoughts: "Many thoughts during?",
      sleepy: "Did I feel sleepy?",
      heard: "What did I hear?",
      pranayama: "What did I notice in pranayama?",
      kechariMudra: "How was the kechari mudra?",
      yoniMudra: "How was the yoni mudra?",
    },
  },
  pt: {
    // App
    appName: "Meditary",
    
    // Tabs
    tabHome: "Início",
    tabNewEntry: "Novo Registro",
    tabHistory: "Histórico",
    tabProgress: "Progresso",
    tabSettings: "Ajustes",
    
    // Home Screen
    homeTitle: "Hoje",
    homeGreeting: "Bom dia",
    homeGreetingAfternoon: "Boa tarde",
    homeGreetingEvening: "Boa noite",
    homeNoEntry: "Nenhuma meditação registrada hoje",
    homeEntryLogged: "Meditação registrada",
    homeLogMeditation: "Registrar Meditação de Hoje",
    homeStreak: "Dias seguidos",
    homeThisMonth: "Este mês",
    homeRecentEntries: "Registros Recentes",
    homeNoRecentEntries: "Nenhum registro ainda. Comece sua jornada de meditação!",
    
    // New Entry Screen
    newEntryTitle: "Novo Registro",
    newEntryDate: "Data e Hora",
    newEntryQuestions: "Perguntas",
    newEntryNotes: "Notas Adicionais",
    newEntryNotesPlaceholder: "Outros pensamentos ou observações...",
    newEntrySave: "Salvar Registro",
    newEntrySaved: "Registro salvo com sucesso!",
    
    // History Screen
    historyTitle: "Histórico",
    historyCalendar: "Calendário",
    historyList: "Lista",
    historyNoEntries: "Nenhum registro neste mês",
    historyViewAll: "Ver Todos",
    
    // Entry Detail Screen
    entryDetailTitle: "Detalhes do Registro",
    entryDetailEdit: "Editar",
    entryDetailDelete: "Excluir",
    entryDetailDeleteConfirm: "Tem certeza que deseja excluir este registro?",
    entryDetailDeleted: "Registro excluído",
    
    // Settings Screen
    settingsTitle: "Ajustes",
    settingsLanguage: "Idioma",
    settingsLanguageEn: "English",
    settingsLanguagePt: "Português",
    settingsQuestions: "Personalizar Perguntas",
    settingsQuestionsDesc: "Adicionar, editar ou reordenar perguntas",
    settingsExport: "Exportar Dados",
    settingsExportDesc: "Baixar seus dados de meditação",
    settingsAbout: "Sobre",
    settingsVersion: "Versão",
    settingsDeviceId: "ID do Dispositivo",
    settingsDeviceIdDesc: "Usado para análise de uso",
    
    // Customize Questions Screen
    customizeTitle: "Personalizar Perguntas",
    customizeAdd: "Adicionar Pergunta",
    customizeReset: "Restaurar Padrão",
    customizeResetConfirm: "Isso restaurará todas as perguntas padrão. Continuar?",
    customizeEmpty: "Nenhuma pergunta. Adicione uma para começar.",
    customizeDragHint: "Arraste para reordenar",
    
    // Question Editor
    questionEditorTitle: "Editar Pergunta",
    questionEditorNew: "Nova Pergunta",
    questionEditorText: "Texto da Pergunta",
    questionEditorType: "Tipo de Resposta",
    questionEditorTypeRating: "Avaliação (1-5)",
    questionEditorTypeText: "Texto",
    questionEditorTypeSelect: "Opções",
    questionEditorSave: "Salvar",
    questionEditorDelete: "Excluir Pergunta",
    
    // Common
    cancel: "Cancelar",
    save: "Salvar",
    delete: "Excluir",
    edit: "Editar",
    done: "Concluído",
    back: "Voltar",
    yes: "Sim",
    no: "Não",
    ok: "OK",
    
    // Rating Labels
    ratingPoor: "Ruim",
    ratingFair: "Regular",
    ratingGood: "Bom",
    ratingVeryGood: "Muito Bom",
    ratingExcellent: "Excelente",
    
    // Default Questions
    questions: {
      concentration: "Minha concentração estava?",
      physicalPain: "Alguma dor física?",
      eyes: "Olhos estavam?",
      sensation: "Qual foi sensação que emergiu?",
      thoughts: "Muitos pensamentos durante?",
      sleepy: "Deu sono?",
      heard: "O que escutei?",
      pranayama: "O que percebi no pranayama?",
      kechariMudra: "Como foi o kechari mudra?",
      yoniMudra: "Como foi o yoni mudra?",
    },
  },
};

export type TranslationKey = keyof typeof translations.en;

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split(".");
  let value: any = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  
  return typeof value === "string" ? value : key;
}
