# Roleo — Proje Context

## Ne Yapıyor
Identity-driven dil öğrenme uygulaması. Kullanıcının hayali/hedefi onboarding'de alınıyor, AI sahneleri buna göre kişiselleştiriliyor. React Native / Expo / TypeScript / Claude API (haiku-4-5).

## Mimari
- `App.tsx` — merkezi navigation, screen state machine, global FAB
- `src/screens/` — tüm ekranlar
- `src/services/claude.ts` — Anthropic API wrapper
- `src/services/progress.ts` — XP, streak, unlock sistemi
- `src/services/personas.ts` — AI persona sistemi
- `src/services/telemetry.ts` — event tracking
- `src/data/scenarios.ts` — 14 statik senaryo (5 dil) + seçim fonksiyonları
- `src/types/index.ts` — UserProfile, Scenario, StageResult, UserIdentity

## Storage (AsyncStorage)
- `userProfile` → UserProfile { language, nativeLanguage, goal, goalDescription, identity: {goal, context, emotion}, streak, xp, completedScenarios[] }
- `roleoProgress` → ProgressState { xp, streak, lastPlayedDate (ISO YYYY-MM-DD), completedScenarioIds[] }
- `firstSessionState` → 'pending' | 'done'
- `phrasebook_{langCode}` → cache

## Core Learning Loop
ScenarioPrepModal (opsiyonel story bağlam +5 XP) → ScenarioScreen (AI konuşma) → StageResultScreen (XP/level/streak) → ProgressScreen

## ScenarioScreen AI Prompt Yapısı
3 katman: basePrompt (persona) + scenarioPrompt (sahne) + runtimePrompt (level, identity, micro feedback direktifi)
- Her AI yanıtı `✨ ` ile micro feedback ile başlar
- Hata varsa `💡 Düzeltme:` eklenir
- Her 3 mesajda identity goal öne çıkar

## XP Sistemi
- Senaryo tamamlama: xpReward (20-30) + mesaj bonusu
- Story okuma %80+: +8 XP
- Story quiz bitirme: +12 XP
- Prep story okuma: +5 XP bonus
- getLevelFromXp: floor(xp/100) + 1
- Unlock: travel (3 cafe), survival (2 travel), business (2 social)

## Scenario Seçim Fonksiyonları
- `getPersonalizedScenario(language, identity)` — goal/context keyword matching ile stageType seçer
- `getScenarioWithVariant(scenario, playCount, identity)` — replay/challenge mode overlay ekler
- Keywords: business (iş/work/office...), travel (seyahat/trip...), social (arkadaş/party...)

## Ekranlar
| Ekran | Açıklama |
|-------|----------|
| OnboardingScreen | native/language/goal/dream/context/emotion adımları |
| HomeScreen | FAB (⚡ InstantLearn), dreamCard, XP bar, modlar |
| ScenariosScreen | Unlock'a göre filtrelenmiş senaryo listesi, completed göstergesi |
| ScenarioScreen | AI chat, quick phrases panel (💬), micro feedback |
| StageResultScreen | XP, level-up tespiti, identity bağlantısı, unlock |
| ProgressScreen | Tam XP/streak/stage breakdown |
| InstantLearnScreen | Anında kelime/ifade açıklama, her yerden FAB ile açılır |
| StoriesScreen | AI hikaye okuma + quiz, XP bağlı |
| PhrasebookScreen | AI phrase listesi, cache'li |
| ScenarioPrepModal | Sahne öncesi story context modal |

## Önemli Kararlar
1. Dream/identity prompt'a inject edilmiş — ScenarioScreen runtimePrompt'ta goal+context+emotion kullanılıyor
2. Phrasebook ayrı mod değil — ScenarioScreen içi 💬 paneli
3. Story modu sahne hazırlığı — ScenarioPrepModal ile senaryo girişine bağlı
4. Streak tarihleri ISO 8601 (YYYY-MM-DD) — toDateString() değil
5. Global InstantLearn FAB — App.tsx overlay, focus ekranlarında gizli

## Bilinen Eksikler / Sıradaki İşler
- Senaryo sayısı az (14), çeşitlilik artırılabilir
- Daily Mission: getTodaysMissionScenario artık identity + completedScenarios'a göre seçiyor
- Push notification yok
- Conversation history persist edilmiyor (uygulama kapanınca sıfırlanıyor)
