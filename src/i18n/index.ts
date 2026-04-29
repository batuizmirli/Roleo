import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { tryParseJson } from '../services/json';

export type AppLangCode = 'tr' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt';

type Primitive = string | number;
type Params = Record<string, Primitive>;
type Dict = Record<string, string>;

const supported = new Set<AppLangCode>(['tr', 'en', 'es', 'fr', 'de', 'it', 'pt']);

export const normalizeAppLang = (code?: string | null): AppLangCode => {
  if (!code) return 'tr';
  const short = code.slice(0, 2).toLowerCase() as AppLangCode;
  return supported.has(short) ? short : 'en';
};

const dictionaries: Record<AppLangCode, Dict> = {
  tr: {
    'tabs.discover': 'Keşfet',
    'tabs.learn': 'Öğren',
    'tabs.practice': 'Pratik',
    'tabs.profile': 'Profil',
    'common.back': 'Geri',
    'common.continue': 'Devam Et',
    'common.start': 'Başla',
    'common.retry': 'Tekrar Dene',
    'common.skipHome': 'Ana Sayfaya Geç →',
    'common.notReadyProfile': 'Profil bulunamadı.',
    'home.eyebrow': 'SAHNE AKIŞI',
    'home.hero': '{language} pratiğin seni\nbekliyor.',
    'home.sceneEyebrow': 'BUGÜNÜN SAHNESİ',
    'home.enterScene': 'Sahneye Gir',
    'home.defaultTitle': 'Sahne hazırlanıyor…',
    'home.defaultMeta': 'Gerçek hayat konuşmasını prova et',
    'home.defaultGoal': '6 turu tamamla ve akışı koru',
    'home.turnGoal': '{turns} tur, {awkward}\'den az garip yanıt',
    'home.played': '{count}× oynandı',
    'home.suggestionPlayed': "Pratik'te başka bir sahne prova et.",
    'home.suggestionFresh': "Öğren'de ısın, sonra sahneye gir.",
    'home.streak': '{count} gün ritim',
    'home.level': 'Sev. {level}',
    'learn.eyebrow': 'ÖĞREN',
    'learn.title': 'Seni sahneye\nhazırlayalım.',
    'learn.subtitle': 'Gerçek hayatta söylemeden önce kısa prova destekleri.',
    'learn.sectionPrep': 'Sahneye Hazırlık',
    'learn.rhythmPlayed': 'Bugünkü sahne akışına bağlandı',
    'learn.rhythmAuto': 'Sahne akışında otomatik gelir',
    'learn.vocab': 'Kelime',
    'learn.vocabCaption': 'Bugünkü sahne için kısa kelime kartları',
    'learn.pronunciation': 'Telaffuz',
    'learn.pronunciationCaption': 'Söylemeden önce sesini hazırla',
    'learn.listening': 'Dinleme',
    'learn.listeningCaption': 'Kelimeleri dinle ve tekrar et',
    'learn.patterns': 'Sahne Kalıpları',
    'learn.patternsSub': 'Kalıplar, işe yarayan ifadeler ve kurtarıcı cümleler',
    'learn.phrases': 'Sahne İfadeleri',
    'learn.phrasesSub': 'Gerçek anda işine yarayacak cümleler',
    'learn.instant': 'Kısa Prova',
    'learn.instantSub': 'Küçük bir konuşma anını dene',
    'learn.stories': 'Kısa Bağlamlar',
    'learn.storiesSub': 'Sahneye girmeden ifade tekrar et',
    'practice.eyebrow': 'PRATİK',
    'practice.title': 'Sahne\nprovaları',
    'practice.subtitle': 'Gerçek hayat konuşmalarını prova et. Bugünkü sahne ana rota.',
    'practice.main': 'ANA PROVA',
    'practice.dailyRun': 'GÜNLÜK SAHNE AKIŞI',
    'practice.modes': 'PROVA DESTEKLERİ',
    'practice.sceneMode': 'Sahne Modu',
    'practice.sceneModeSub': 'Gerçek anları serbest prova et',
    'practice.sceneList': 'Sahne Listesi',
    'practice.sceneListSub': 'Kaldığın sahneye veya listeye dön',
    'practice.goalTitle': 'Hedefinle bugünkü sahneyi prova et',
    'practice.goalSub': 'Kısa ısınma sonrası aynı konuşma akışına gir.',
    'practice.miniGames': 'KISA ISINMALAR',
    'practice.flashSub': 'Kelimeyi hızlı yakala',
    'practice.trueFakeSub': 'Doğal mı yanlış mı seç',
    'practice.otherScenes': 'Diğer sahneleri gör →',
    'run.eyebrow': 'BUGÜNKÜ SAHNE AKIŞI',
    'run.title.before': 'Önce',
    'run.title.accent': 'ısın',
    'run.title.after': 'sonra sahneye gir.',
    'run.subtitle': 'Bugünkü görev tek akış: kelime refleksi, doğal ton kontrolü, ardından gerçek konuşma provası.',
    'run.selectedScene': 'Seçili sahne',
    'run.steps.1': 'Warm-up · Kilit kelimeleri hızlı tanı',
    'run.steps.2': 'Warm-up · Doğal cümle tonunu ayır',
    'run.steps.3': 'Scene · Aynı sahneyi baskı altında prova et',
    'run.steps.4': 'Result · Bir sonraki odak noktanı gör',
    'run.start': 'Isınmayı başlat →',
    'run.skipWarmup': 'Isınmayı atla',
    'run.exit': 'Şimdilik çık',
    'account.title': 'Hesap',
    'account.student': 'Öğrenci',
    'account.plusSub': 'Ek pratik modları ve öncelikli güncellemeler yakında.',
    'account.learning': 'Öğrenme',
    'account.scenes': 'Sahneler',
    'account.progress': 'İlerleme',
    'account.account': 'Hesap',
    'account.editProfile': 'Profili düzenle',
    'account.learningLanguage': 'Öğrenme dili',
    'account.settings': 'Ayarlar',
    'account.revisitIntro': 'Tanıtımı tekrar izle',
    'account.help': 'Yardım merkezi',
    'startup.selectGoalTitle': 'Bir hedef seç',
    'startup.selectGoalMsg': 'Bugünün odağını listeden seçerek devam edebilirsin.',
    'startup.nativeTitle': 'Ana dilin hangisi?',
    'startup.nativeSubtitle': 'Deneyimi sana göre kurmak için anadilini seç.',
    'startup.focusTitle': 'Bugünkü konuşma odağın ne?',
    'startup.focusSubtitle': 'Roleo sahneleri bu hedefe göre önceliklendirir.',
    'startup.save': 'Kaydet ve başla',
    'startup.next': 'Devam et',
    'scenario.listening': 'Dinleniyor',
    'scenario.thinking': '{name} düşünüyor…',
    'scenario.speak': 'Konuşmaya başla',
    'scenario.chooseAbove': 'Ya da yukarıdan cevabını seç',
    'scenario.finish': 'Sahneyi Bitir',
    'scenario.nextTurn': 'Sonraki Tur →',
    'scenario.replay': 'Tekrar dinle',
    'scenario.release': 'Bitince bırak',
    'scenario.write': 'Yazılı cevap ver',
    'scenario.voiceEyebrow': 'SESLİ PROVA',
    'scenario.voicePrompt': 'Şimdi bu cevabı kendi sesinle söyle',
    'scenario.voiceReady': 'Kısa bir tekrar yeterli. İstersen bu adımı geçebilirsin.',
    'scenario.voiceRecording': 'Dinleniyor; cevabı doğal hızda söyle.',
    'scenario.voiceStart': 'Kaydı başlat',
    'scenario.voiceStop': 'Kaydı bitir',
    'scenario.voiceSkip': 'Şimdilik geç',
    'scenario.voiceSkipped': 'Sesli adım geçildi; text-only akış devam ediyor.',
    'scenario.voicePermissionDenied': 'Mikrofon izni olmadan sesli prova yapılamaz. Yazılı akışla devam edebilirsin.',
    'scenario.voicePrivacy': 'Sesin sadece bu cevabı değerlendirmek için işlenir.',
    'scenario.voiceUnavailable': 'Transkripsiyon şu an hazır değil; yazılı akışla devam edebilirsin.',
    'scenario.voiceLocked': 'Sesli prova Roleo Plus ile açılır.',
    'scenario.translationTap': 'çeviri için karta dokun',
    'scenario.translationLabel': 'ANADİL ÇEVİRİSİ',
    'scenario.translationLoading': 'Çeviri hazırlanıyor…',
    'scenario.translationUnavailable': 'Çeviri şu an hazır değil.',
    'scenario.translationTapBack': 'soruya dönmek için dokun',
    'scenario.translationBack': 'Çeviri',
    'scenarios.eyebrow': 'SAHNE SEÇ',
    'scenarios.title': 'Gerçek hayat\nsimülasyonları',
    'scenarios.count': '{language} · {count} sahne',
    'scenarios.completed': 'Tamamlandı',
    'scenarios.locked': 'Önce önceki sahneleri tamamla.',
    'scenarios.stage.social': 'Sosyal',
    'scenarios.stage.story': 'Hikaye',
    'scenarios.stage.travel': 'Seyahat',
    'scenarios.stage.business': 'İş',
    'scenarios.stage.survival': 'Hayatta Kalma',
    'scenarios.stage.cafe': 'Café',
    'mini.flashWarmup': '1/2 · Kelime Isınması',
    'mini.toneWarmup': '2/2 · Ton Isınması',
    'mini.whyNow': 'Neden şimdi?',
    'mini.questionCount': 'Karar sayısı',
    'mini.start': 'Başla →',
    'mini.playAgain': 'Bu anı tekrar çalış',
    'mini.accuracy': 'Doğruluk: %{value}',
    'mini.flashReady': 'Kelime refleksi hazır',
    'mini.runDone': 'Prova tamamlandı',
    'mini.flashStart': 'Kelime ısınmasını başlat →',
    'mini.toneStart': 'Ton ısınmasını başlat →',
    'mini.correct': 'Doğal seçim.',
    'mini.wrong': 'Yanlış tonu yakaladın.',
    'mini.fast': 'Hızlı ol, doğruyu kap.',
    'mini.corrected': 'Doğrusu: {text}',
  },
  en: {
    'tabs.discover': 'Discover', 'tabs.learn': 'Learn', 'tabs.practice': 'Practice', 'tabs.profile': 'Profile',
    'common.back': 'Back', 'common.continue': 'Continue', 'common.start': 'Start', 'common.retry': 'Try again', 'common.skipHome': 'Go to Home →', 'common.notReadyProfile': 'Profile not found.',
    'home.eyebrow': 'SCENE FLOW', 'home.hero': 'Your {language} practice\nis waiting.', 'home.sceneEyebrow': "TODAY'S SCENE", 'home.enterScene': 'Enter Scene',
    'home.defaultTitle': 'Preparing scene…', 'home.defaultMeta': 'Rehearse a real-life conversation', 'home.defaultGoal': 'Complete 6 turns and keep the flow',
    'home.turnGoal': '{turns} turns, fewer than {awkward} awkward replies', 'home.played': 'played {count}×', 'home.suggestionPlayed': 'Try another scene in Practice.', 'home.suggestionFresh': 'Warm up in Learn, then enter the scene.', 'home.streak': '{count} day rhythm', 'home.level': 'Lvl {level}',
    'learn.eyebrow': 'LEARN', 'learn.title': 'Let\'s get you\nready for the scene.', 'learn.subtitle': 'Short supports before you say it in real life.', 'learn.sectionPrep': 'Scene Prep', 'learn.rhythmPlayed': 'Linked to today’s scene flow', 'learn.rhythmAuto': 'Comes into the scene flow',
    'learn.vocab': 'Vocabulary', 'learn.vocabCaption': 'Short word cards for today’s scene', 'learn.pronunciation': 'Pronunciation', 'learn.pronunciationCaption': 'Prepare your voice before speaking', 'learn.listening': 'Listening', 'learn.listeningCaption': 'Listen and repeat the words',
    'learn.patterns': 'Scene Patterns', 'learn.patternsSub': 'Patterns, useful lines, and rescue phrases', 'learn.phrases': 'Scene Phrases', 'learn.phrasesSub': 'Sentences that help in real moments', 'learn.instant': 'Quick Rehearsal', 'learn.instantSub': 'Try a small speaking moment', 'learn.stories': 'Short Contexts', 'learn.storiesSub': 'Repeat expressions before the scene',
    'practice.eyebrow': 'PRACTICE', 'practice.title': 'Scene\nrehearsals', 'practice.subtitle': 'Rehearse real-life conversations. Today’s scene is the main route.', 'practice.main': 'MAIN REHEARSAL', 'practice.dailyRun': 'DAILY SCENE FLOW', 'practice.modes': 'REHEARSAL SUPPORTS',
    'practice.sceneMode': 'Scene Mode', 'practice.sceneModeSub': 'Freely rehearse real moments', 'practice.sceneList': 'Scene List', 'practice.sceneListSub': 'Return to your scenes or the list', 'practice.goalTitle': 'Rehearse today’s scene with your goal', 'practice.goalSub': 'Enter the same conversation flow after a short warm-up.', 'practice.miniGames': 'SHORT WARM-UPS', 'practice.flashSub': 'Catch the word fast', 'practice.trueFakeSub': 'Choose natural or awkward', 'practice.otherScenes': 'See other scenes →',
    'run.eyebrow': 'TODAY’S SCENE FLOW', 'run.title.before': 'Warm up', 'run.title.accent': 'first', 'run.title.after': 'then enter the scene.', 'run.subtitle': 'One flow today: word reflex, natural tone check, then real conversation rehearsal.', 'run.selectedScene': 'Selected scene', 'run.steps.1': 'Warm-up · Recognize key words fast', 'run.steps.2': 'Warm-up · Separate natural sentence tone', 'run.steps.3': 'Scene · Rehearse the same scene under pressure', 'run.steps.4': 'Result · See your next focus point', 'run.start': 'Start warm-up →', 'run.skipWarmup': 'Skip warm-up', 'run.exit': 'Exit for now',
    'account.title': 'Account', 'account.student': 'Learner', 'account.plusSub': 'Extra practice modes and priority updates coming soon.', 'account.learning': 'Learning', 'account.scenes': 'Scenes', 'account.progress': 'Progress', 'account.account': 'Account', 'account.editProfile': 'Edit profile', 'account.learningLanguage': 'Learning language', 'account.settings': 'Settings', 'account.revisitIntro': 'Watch intro again', 'account.help': 'Help center',
    'startup.selectGoalTitle': 'Choose a goal', 'startup.selectGoalMsg': 'Pick today’s focus from the list to continue.', 'startup.nativeTitle': 'What is your native language?', 'startup.nativeSubtitle': 'Choose your native language so Roleo can shape the experience.', 'startup.focusTitle': 'What is today’s speaking focus?', 'startup.focusSubtitle': 'Roleo prioritizes scenes around this goal.', 'startup.save': 'Save and start', 'startup.next': 'Continue',
    'scenario.listening': 'Listening', 'scenario.thinking': '{name} is thinking…', 'scenario.speak': 'Start speaking', 'scenario.chooseAbove': 'Or choose your reply above', 'scenario.finish': 'Finish Scene', 'scenario.nextTurn': 'Next Turn →', 'scenario.replay': 'Listen again', 'scenario.release': 'Release when done', 'scenario.write': 'Write an answer',
    'scenario.voiceEyebrow': 'VOICE REHEARSAL', 'scenario.voicePrompt': 'Now say this reply in your own voice', 'scenario.voiceReady': 'One short repeat is enough. You can skip this step.', 'scenario.voiceRecording': 'Listening; say the reply at a natural speed.', 'scenario.voiceStart': 'Start recording', 'scenario.voiceStop': 'Stop recording', 'scenario.voiceSkip': 'Skip for now', 'scenario.voiceSkipped': 'Voice step skipped; text-only flow continues.', 'scenario.voicePermissionDenied': 'Voice rehearsal needs microphone access. You can continue with text.', 'scenario.voicePrivacy': 'Your voice is processed only to evaluate this answer.', 'scenario.voiceUnavailable': 'Transcription is not available right now. You can continue with text.', 'scenario.voiceLocked': 'Voice rehearsal unlocks with Roleo Plus.', 'scenario.translationTap': 'tap the card for translation', 'scenario.translationLabel': 'NATIVE TRANSLATION', 'scenario.translationLoading': 'Preparing translation…', 'scenario.translationUnavailable': 'Translation is not available right now.', 'scenario.translationTapBack': 'tap to return to the line', 'scenario.translationBack': 'Translation',
    'scenarios.eyebrow': 'CHOOSE SCENE', 'scenarios.title': 'Real-life\nsimulations', 'scenarios.count': '{language} · {count} scenes', 'scenarios.completed': 'Completed', 'scenarios.locked': 'Complete the previous scenes first.', 'scenarios.stage.social': 'Social', 'scenarios.stage.story': 'Story', 'scenarios.stage.travel': 'Travel', 'scenarios.stage.business': 'Business', 'scenarios.stage.survival': 'Survival', 'scenarios.stage.cafe': 'Café',
    'mini.flashWarmup': '1/2 · Word Warm-up', 'mini.toneWarmup': '2/2 · Tone Warm-up', 'mini.whyNow': 'Why now?', 'mini.questionCount': 'Decision count', 'mini.start': 'Start →', 'mini.playAgain': 'Rehearse this moment again', 'mini.accuracy': 'Natural choices: {value}%', 'mini.flashReady': 'Word reflex ready', 'mini.runDone': 'Rehearsal complete', 'mini.flashStart': 'Start word warm-up →', 'mini.toneStart': 'Start tone warm-up →', 'mini.correct': 'Natural choice.', 'mini.wrong': 'Try the softer version.', 'mini.fast': 'Read the moment and choose the natural line.', 'mini.corrected': 'Try this: {text}',
  },
  es: {},
  fr: {},
  de: {},
  it: {},
  pt: {},
};

dictionaries.es = {
  ...dictionaries.en,
  'tabs.discover': 'Explorar', 'tabs.learn': 'Aprender', 'tabs.practice': 'Práctica', 'tabs.profile': 'Perfil',
  'common.back': 'Atrás', 'common.continue': 'Continuar', 'common.start': 'Empezar', 'common.retry': 'Intentar de nuevo', 'common.skipHome': 'Ir al inicio →', 'common.notReadyProfile': 'No se encontró el perfil.',
  'home.eyebrow': 'FLUJO DE ESCENA', 'home.hero': 'Tu práctica de {language}\nte espera.', 'home.sceneEyebrow': 'ESCENA DE HOY', 'home.enterScene': 'Entrar en la escena',
  'home.defaultTitle': 'Preparando escena…', 'home.defaultMeta': 'Ensaya una conversación real', 'home.defaultGoal': 'Completa 6 turnos y mantén el flujo', 'home.turnGoal': '{turns} turnos, menos de {awkward} respuestas raras', 'home.played': 'jugada {count}×', 'home.suggestionPlayed': 'Ensaya otra escena en Práctica.', 'home.suggestionFresh': 'Calienta en Aprender y entra en la escena.', 'home.streak': 'ritmo de {count} días', 'home.level': 'Niv. {level}',
  'learn.eyebrow': 'APRENDER', 'learn.title': 'Preparémonos\npara la escena.', 'learn.subtitle': 'Apoyos breves antes de decirlo en la vida real.', 'learn.sectionPrep': 'Preparación de escena', 'learn.rhythmPlayed': 'Conectado con el flujo de escena de hoy', 'learn.rhythmAuto': 'Aparece en el flujo de escena',
  'learn.vocab': 'Vocabulario', 'learn.vocabCaption': 'Tarjetas breves para la escena de hoy', 'learn.pronunciation': 'Pronunciación', 'learn.pronunciationCaption': 'Prepara tu voz antes de hablar', 'learn.listening': 'Escucha', 'learn.listeningCaption': 'Escucha y repite las palabras',
  'learn.patterns': 'Patrones de escena', 'learn.patternsSub': 'Estructuras cortas para usar en el momento', 'learn.phrases': 'Frases de escena', 'learn.phrasesSub': 'Frases útiles para momentos reales', 'learn.instant': 'Ensayo rápido', 'learn.instantSub': 'Prueba un pequeño momento de conversación', 'learn.stories': 'Contextos breves', 'learn.storiesSub': 'Repite expresiones antes de la escena',
  'practice.eyebrow': 'PRÁCTICA', 'practice.title': 'Ensayos\nde escena', 'practice.subtitle': 'Ensaya conversaciones reales. La escena de hoy es la ruta principal.', 'practice.main': 'ENSAYO PRINCIPAL', 'practice.dailyRun': 'FLUJO DE ESCENA DIARIO', 'practice.modes': 'APOYOS DE ENSAYO',
  'practice.sceneMode': 'Modo escena', 'practice.sceneModeSub': 'Ensaya momentos reales libremente', 'practice.sceneList': 'Lista de escenas', 'practice.sceneListSub': 'Vuelve a tus escenas o a la lista', 'practice.goalTitle': 'Ensaya la escena de hoy con tu objetivo', 'practice.goalSub': 'Entra al mismo flujo tras un calentamiento corto.', 'practice.miniGames': 'CALENTAMIENTOS BREVES', 'practice.flashSub': 'Reconoce la palabra rápido', 'practice.trueFakeSub': 'Elige natural o raro', 'practice.otherScenes': 'Ver otras escenas →',
  'run.eyebrow': 'FLUJO DE ESCENA DE HOY', 'run.title.before': 'Primero', 'run.title.accent': 'calienta', 'run.title.after': 'luego entra en la escena.', 'run.subtitle': 'Una sola ruta: reflejo de palabras, control de tono natural y ensayo de conversación real.', 'run.selectedScene': 'Escena seleccionada', 'run.steps.1': 'Warm-up · Reconoce palabras clave rápido', 'run.steps.2': 'Warm-up · Distingue el tono natural', 'run.steps.3': 'Scene · Ensaya bajo presión', 'run.steps.4': 'Result · Mira tu siguiente foco', 'run.start': 'Empezar calentamiento →', 'run.skipWarmup': 'Saltar calentamiento', 'run.exit': 'Salir por ahora',
  'account.title': 'Cuenta', 'account.student': 'Estudiante', 'account.plusSub': 'Pronto habrá modos extra y actualizaciones prioritarias.', 'account.learning': 'Aprendizaje', 'account.scenes': 'Escenas', 'account.progress': 'Progreso', 'account.account': 'Cuenta', 'account.editProfile': 'Editar perfil', 'account.learningLanguage': 'Idioma de aprendizaje', 'account.settings': 'Ajustes', 'account.revisitIntro': 'Ver introducción otra vez', 'account.help': 'Centro de ayuda',
  'startup.selectGoalTitle': 'Elige un objetivo', 'startup.selectGoalMsg': 'Elige el foco de hoy para continuar.', 'startup.nativeTitle': '¿Cuál es tu idioma nativo?', 'startup.nativeSubtitle': 'Elige tu idioma nativo para adaptar la experiencia.', 'startup.focusTitle': '¿Cuál es tu foco de conversación hoy?', 'startup.focusSubtitle': 'Roleo prioriza escenas según este objetivo.', 'startup.save': 'Guardar y empezar', 'startup.next': 'Continuar',
  'scenario.listening': 'Escuchando', 'scenario.thinking': '{name} está pensando…', 'scenario.speak': 'Empieza a hablar', 'scenario.chooseAbove': 'O elige tu respuesta arriba', 'scenario.finish': 'Terminar escena', 'scenario.nextTurn': 'Siguiente turno →', 'scenario.replay': 'Escuchar de nuevo', 'scenario.release': 'Suelta al terminar', 'scenario.write': 'Responder por escrito',
  'scenarios.eyebrow': 'ELIGE ESCENA', 'scenarios.title': 'Simulaciones\nde vida real', 'scenarios.count': '{language} · {count} escenas', 'scenarios.completed': 'Completada', 'scenarios.locked': 'Completa primero las escenas anteriores.', 'scenarios.stage.social': 'Social', 'scenarios.stage.story': 'Historia', 'scenarios.stage.travel': 'Viaje', 'scenarios.stage.business': 'Trabajo', 'scenarios.stage.survival': 'Supervivencia', 'scenarios.stage.cafe': 'Café',
  'mini.flashWarmup': '1/2 · Calentamiento de palabras', 'mini.toneWarmup': '2/2 · Calentamiento de tono', 'mini.whyNow': '¿Por qué ahora?', 'mini.questionCount': 'Número de decisiones', 'mini.start': 'Empezar →', 'mini.playAgain': 'Ensayar este momento otra vez', 'mini.accuracy': 'Elecciones naturales: {value}%', 'mini.flashReady': 'Reflejo de palabras listo', 'mini.runDone': 'Ensayo terminado', 'mini.flashStart': 'Empezar calentamiento de palabras →', 'mini.toneStart': 'Empezar calentamiento de tono →', 'mini.correct': 'Elección natural.', 'mini.wrong': 'Prueba una versión más suave.', 'mini.fast': 'Lee el momento y elige la frase natural.', 'mini.corrected': 'Prueba esto: {text}',
};

dictionaries.fr = {
  ...dictionaries.en,
  'tabs.discover': 'Explorer', 'tabs.learn': 'Apprendre', 'tabs.practice': 'Pratique', 'tabs.profile': 'Profil',
  'common.back': 'Retour', 'common.continue': 'Continuer', 'common.start': 'Commencer', 'common.retry': 'Réessayer', 'common.skipHome': 'Aller à l’accueil →', 'common.notReadyProfile': 'Profil introuvable.',
  'home.eyebrow': 'FLUX DE SCÈNE', 'home.hero': 'Ta pratique de {language}\nt’attend.', 'home.sceneEyebrow': 'SCÈNE DU JOUR', 'home.enterScene': 'Entrer dans la scène',
  'home.defaultTitle': 'Préparation de la scène…', 'home.defaultMeta': 'Répète une conversation réelle', 'home.defaultGoal': 'Termine 6 tours et garde le flow', 'home.turnGoal': '{turns} tours, moins de {awkward} réponses maladroites', 'home.played': 'jouée {count}×', 'home.suggestionPlayed': 'Répète une autre scène dans Pratique.', 'home.suggestionFresh': 'Échauffe-toi dans Apprendre, puis entre en scène.', 'home.streak': 'rythme de {count} jours', 'home.level': 'Niv. {level}',
  'learn.eyebrow': 'APPRENDRE', 'learn.title': 'Préparons-nous\npour la scène.', 'learn.subtitle': 'De courts appuis avant de le dire dans la vraie vie.', 'learn.sectionPrep': 'Préparation de scène', 'learn.rhythmPlayed': 'Lié au flux de scène du jour', 'learn.rhythmAuto': 'Arrive dans le flux de scène',
  'learn.vocab': 'Vocabulaire', 'learn.vocabCaption': 'Cartes de mots pour la scène du jour', 'learn.pronunciation': 'Prononciation', 'learn.pronunciationCaption': 'Prépare ta voix avant de parler', 'learn.listening': 'Écoute', 'learn.listeningCaption': 'Écoute et répète les mots',
  'learn.patterns': 'Structures de scène', 'learn.patternsSub': 'Courtes structures à utiliser dans l’instant', 'learn.phrases': 'Phrases de scène', 'learn.phrasesSub': 'Phrases utiles dans les vrais moments', 'learn.instant': 'Répétition rapide', 'learn.instantSub': 'Essaie un petit moment de conversation', 'learn.stories': 'Contextes courts', 'learn.storiesSub': 'Répète les expressions avant la scène',
  'practice.eyebrow': 'PRATIQUE', 'practice.title': 'Répétitions\nde scène', 'practice.subtitle': 'Répète des conversations réelles. La scène du jour est la route principale.', 'practice.main': 'RÉPÉTITION PRINCIPALE', 'practice.dailyRun': 'FLUX DE SCÈNE DU JOUR', 'practice.modes': 'APPUIS DE RÉPÉTITION',
  'practice.sceneMode': 'Mode scène', 'practice.sceneModeSub': 'Répète librement des moments réels', 'practice.sceneList': 'Liste des scènes', 'practice.sceneListSub': 'Reviens à tes scènes ou à la liste', 'practice.goalTitle': 'Répète la scène du jour avec ton objectif', 'practice.goalSub': 'Entre dans le même échange après un court échauffement.', 'practice.miniGames': 'ÉCHAUFFEMENTS COURTS', 'practice.flashSub': 'Attrape le mot vite', 'practice.trueFakeSub': 'Choisis naturel ou maladroit', 'practice.otherScenes': 'Voir d’autres scènes →',
  'run.eyebrow': 'FLUX DE SCÈNE DU JOUR', 'run.title.before': 'D’abord', 'run.title.accent': 'échauffe-toi', 'run.title.after': 'puis entre en scène.', 'run.subtitle': 'Un seul flux : réflexe de mots, ton naturel, puis répétition de conversation réelle.', 'run.selectedScene': 'Scène sélectionnée', 'run.steps.1': 'Warm-up · Reconnais vite les mots clés', 'run.steps.2': 'Warm-up · Distingue le ton naturel', 'run.steps.3': 'Scene · Répète sous pression', 'run.steps.4': 'Result · Vois ton prochain focus', 'run.start': 'Commencer l’échauffement →', 'run.skipWarmup': 'Passer l’échauffement', 'run.exit': 'Quitter pour l’instant',
  'account.title': 'Compte', 'account.student': 'Apprenant', 'account.plusSub': 'Modes de pratique supplémentaires et mises à jour prioritaires bientôt.', 'account.learning': 'Apprentissage', 'account.scenes': 'Scènes', 'account.progress': 'Progrès', 'account.account': 'Compte', 'account.editProfile': 'Modifier le profil', 'account.learningLanguage': 'Langue apprise', 'account.settings': 'Réglages', 'account.revisitIntro': 'Revoir l’introduction', 'account.help': 'Centre d’aide',
  'startup.selectGoalTitle': 'Choisis un objectif', 'startup.selectGoalMsg': 'Choisis le focus du jour pour continuer.', 'startup.nativeTitle': 'Quelle est ta langue maternelle ?', 'startup.nativeSubtitle': 'Choisis ta langue maternelle pour adapter l’expérience.', 'startup.focusTitle': 'Quel est ton focus de conversation aujourd’hui ?', 'startup.focusSubtitle': 'Roleo priorise les scènes selon cet objectif.', 'startup.save': 'Enregistrer et commencer', 'startup.next': 'Continuer',
  'scenario.listening': 'Écoute en cours', 'scenario.thinking': '{name} réfléchit…', 'scenario.speak': 'Commence à parler', 'scenario.chooseAbove': 'Ou choisis ta réponse ci-dessus', 'scenario.finish': 'Terminer la scène', 'scenario.nextTurn': 'Tour suivant →', 'scenario.replay': 'Réécouter', 'scenario.release': 'Relâche quand tu as fini', 'scenario.write': 'Répondre par écrit',
  'scenarios.eyebrow': 'CHOISIR UNE SCÈNE', 'scenarios.title': 'Simulations\nde vie réelle', 'scenarios.count': '{language} · {count} scènes', 'scenarios.completed': 'Terminée', 'scenarios.locked': 'Termine d’abord les scènes précédentes.', 'scenarios.stage.social': 'Social', 'scenarios.stage.story': 'Histoire', 'scenarios.stage.travel': 'Voyage', 'scenarios.stage.business': 'Travail', 'scenarios.stage.survival': 'Survie', 'scenarios.stage.cafe': 'Café',
  'mini.flashWarmup': '1/2 · Échauffement vocabulaire', 'mini.toneWarmup': '2/2 · Échauffement du ton', 'mini.whyNow': 'Pourquoi maintenant ?', 'mini.questionCount': 'Nombre de décisions', 'mini.start': 'Commencer →', 'mini.playAgain': 'Répéter ce moment', 'mini.accuracy': 'Choix naturels : {value}%', 'mini.flashReady': 'Réflexe vocabulaire prêt', 'mini.runDone': 'Répétition terminée', 'mini.flashStart': 'Lancer l’échauffement vocabulaire →', 'mini.toneStart': 'Lancer l’échauffement du ton →', 'mini.correct': 'Choix naturel.', 'mini.wrong': 'Essaie une version plus douce.', 'mini.fast': 'Lis le moment et choisis la phrase naturelle.', 'mini.corrected': 'Essaie ceci : {text}',
};

dictionaries.de = {
  ...dictionaries.en,
  'tabs.discover': 'Entdecken', 'tabs.learn': 'Lernen', 'tabs.practice': 'Üben', 'tabs.profile': 'Profil',
  'common.back': 'Zurück', 'common.continue': 'Weiter', 'common.start': 'Starten', 'common.retry': 'Erneut versuchen', 'common.skipHome': 'Zur Startseite →', 'common.notReadyProfile': 'Profil nicht gefunden.',
  'home.eyebrow': 'SZENENFLUSS', 'home.hero': 'Deine {language}-Übung\nwartet auf dich.', 'home.sceneEyebrow': 'HEUTIGE SZENE', 'home.enterScene': 'Szene betreten',
  'home.defaultTitle': 'Szene wird vorbereitet…', 'home.defaultMeta': 'Übe ein echtes Gespräch', 'home.defaultGoal': '6 Runden abschließen und den Fluss halten', 'home.turnGoal': '{turns} Runden, weniger als {awkward} holprige Antworten', 'home.played': '{count}× gespielt', 'home.suggestionPlayed': 'Übe eine andere Szene in Üben.', 'home.suggestionFresh': 'Wärme dich in Lernen auf, dann geh in die Szene.', 'home.streak': '{count} Tage Rhythmus', 'home.level': 'St. {level}',
  'learn.eyebrow': 'LERNEN', 'learn.title': 'Bereiten wir uns\nauf die Szene vor.', 'learn.subtitle': 'Kurze Hilfen, bevor du es im echten Leben sagst.', 'learn.sectionPrep': 'Szenen-Vorbereitung', 'learn.rhythmPlayed': 'Mit dem heutigen Szenenfluss verbunden', 'learn.rhythmAuto': 'Kommt im Szenenfluss',
  'practice.eyebrow': 'ÜBEN', 'practice.title': 'Szenen-\nproben', 'practice.subtitle': 'Übe echte Gespräche. Die heutige Szene ist die Hauptroute.', 'practice.main': 'HAUPTPROBE', 'practice.dailyRun': 'TÄGLICHER SZENENFLUSS', 'practice.modes': 'PROBENHILFEN',
  'practice.sceneMode': 'Szenenmodus', 'practice.sceneModeSub': 'Echte Momente frei üben', 'practice.sceneList': 'Szenenliste', 'practice.sceneListSub': 'Zurück zu Szenen oder Liste', 'practice.goalTitle': 'Übe die heutige Szene mit deinem Ziel', 'practice.goalSub': 'Nach kurzem Warm-up in denselben Gesprächsfluss gehen.', 'practice.miniGames': 'KURZE WARM-UPS', 'practice.flashSub': 'Wort schnell erkennen', 'practice.trueFakeSub': 'Natürlich oder holprig wählen', 'practice.otherScenes': 'Andere Szenen sehen →',
  'run.eyebrow': 'HEUTIGER SZENENFLUSS', 'run.title.before': 'Erst', 'run.title.accent': 'aufwärmen', 'run.title.after': 'dann in die Szene.', 'run.subtitle': 'Ein Ablauf: Wortreflex, natürlicher Ton, dann echtes Gespräch üben.', 'run.selectedScene': 'Ausgewählte Szene', 'run.start': 'Aufwärmen starten →', 'run.skipWarmup': 'Aufwärmen überspringen', 'run.exit': 'Vorerst beenden',
  'account.title': 'Konto', 'account.student': 'Lernende Person', 'account.learning': 'Lernen', 'account.scenes': 'Szenen', 'account.progress': 'Fortschritt', 'account.account': 'Konto', 'account.editProfile': 'Profil bearbeiten', 'account.learningLanguage': 'Lernsprache', 'account.settings': 'Einstellungen', 'account.revisitIntro': 'Einführung erneut ansehen', 'account.help': 'Hilfezentrum',
  'startup.nativeTitle': 'Was ist deine Muttersprache?', 'startup.nativeSubtitle': 'Wähle deine Muttersprache, damit Roleo die Erfahrung anpassen kann.', 'startup.focusTitle': 'Was ist heute dein Gesprächsfokus?', 'startup.save': 'Speichern und starten', 'startup.next': 'Weiter',
};

dictionaries.it = { ...dictionaries.es,
  'tabs.discover': 'Scopri', 'tabs.learn': 'Impara', 'tabs.practice': 'Pratica', 'tabs.profile': 'Profilo',
  'common.back': 'Indietro', 'common.continue': 'Continua', 'home.enterScene': 'Entra nella scena',
  'home.eyebrow': 'PERCORSO DI OGGI', 'home.hero': 'La tua pratica di {language}\nti aspetta.',
  'learn.eyebrow': 'IMPARA', 'learn.title': 'Preparazione\nalla scena',
  'practice.eyebrow': 'PRATICA', 'practice.title': 'Prove\ndi scena',
  'account.title': 'Account', 'account.editProfile': 'Modifica profilo', 'account.learningLanguage': 'Lingua di studio',
  'startup.nativeTitle': 'Qual è la tua lingua madre?', 'startup.nativeSubtitle': 'Scegli la tua lingua madre per adattare l’esperienza.', 'startup.save': 'Salva e inizia',
};

dictionaries.pt = { ...dictionaries.es,
  'tabs.discover': 'Explorar', 'tabs.learn': 'Aprender', 'tabs.practice': 'Praticar', 'tabs.profile': 'Perfil',
  'common.back': 'Voltar', 'common.continue': 'Continuar', 'home.enterScene': 'Entrar na cena',
  'home.eyebrow': 'ROTA DIÁRIA', 'home.hero': 'Sua prática de {language}\nestá esperando.',
  'learn.eyebrow': 'APRENDER', 'learn.title': 'Preparação\npara a cena',
  'practice.eyebrow': 'PRÁTICA', 'practice.title': 'Ensaios\nde cena',
  'account.title': 'Conta', 'account.editProfile': 'Editar perfil', 'account.learningLanguage': 'Idioma de aprendizado',
  'startup.nativeTitle': 'Qual é sua língua nativa?', 'startup.nativeSubtitle': 'Escolha sua língua nativa para adaptar a experiência.', 'startup.save': 'Salvar e começar',
};

export const createTranslator = (langCode?: string | null) => {
  const lang = normalizeAppLang(langCode);
  const dict = dictionaries[lang] ?? dictionaries.en;
  return (key: string, params?: Params) => {
    const raw = dict[key] ?? dictionaries.en[key] ?? dictionaries.tr[key] ?? key;
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
  };
};

export const getUiLanguageFromProfile = (profile?: UserProfile | null) => normalizeAppLang(profile?.nativeLanguage?.code);

export const useAppTranslation = () => {
  const [langCode, setLangCode] = useState<AppLangCode>('tr');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('userProfile').then(raw => {
      if (!mounted || !raw) return;
      const profile = tryParseJson<UserProfile>(raw);
      setLangCode(getUiLanguageFromProfile(profile));
    });
    return () => { mounted = false; };
  }, []);

  return useMemo(() => createTranslator(langCode), [langCode]);
};
