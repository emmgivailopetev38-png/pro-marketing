# Тренировка · менторството на Георги

Адрес: `/admin/trenirovka`. Достъпът е със същата собственическа админ бисквитка като `/api/voice/session`.

## Пускане

1. Приложете `supabase/migrations/20261012120000_trenirovka_mvp.sql` в правилния Supabase проект. Миграцията не се прилага автоматично. Таблиците са с RLS и без достъп за `anon`/`authenticated`.
2. Проверете съществуващите `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` и `ADMIN_SESSION_SECRET` (поне 32 знака).
3. За глас задайте `ELEVENLABS_API_KEY` и новата `ELEVENLABS_TRAINER_AGENT_ID`. Създайте отделен частен тренировъчен агент.
4. За неговите server tools използвайте съществуващия `VOICE_AGENT_TOKEN` (или съществуващия резервен `HERMES_API_TOKEN`). `VOICE_AGENT_ENABLED=false` спира достъпа до инструментите.
5. Настройте подписания post-call transcription webhook към `/api/webhooks/elevenlabs` със съществуващия `ELEVENLABS_WEBHOOK_SECRET`. Гласовата история се попълва след доставянето му.
6. Заменете примерите в `data/trening/karti.json` и `data/trening/fokus.json` с оригиналния материал. Стабилните `id` на картите свързват следващите версии със запазения напредък. `otgovor` е дословният оригинал; `obyasnenie` е дословно обяснение на Георги или празен низ. Примерите не са авторско съдържание от менторството.

Текстовият режим не използва ElevenLabs и няма нужда от неговите ключове. „Чуй оригинала“ използва `window.speechSynthesis` и български глас, ако устройството разполага с такъв.

## ElevenLabs: променливи и инструменти

Разговорът получава следните `dynamicVariables`:

```json
{
  "tema": "skript",
  "tema_ime": "Скриптът",
  "rejim": "izpit",
  "sesia": "UUID от /api/trening/session"
}
```

Регистрирайте тези четири динамични променливи в тренировъчния агент. За `sesia` и `tema` в инструментите използвайте стойностите от разговора. Допустими теми: `skript`, `vazrazheniya`, `preramkirane`, `identichnost`, `istorii`, `prevencia`, `zatvaryane`, `principi`. Гласови режими: `uchi`, `izpit`, `rolya`; `rolya` е разрешен само за първите две теми.

И двата инструмента използват `Content-Type: application/json` и `Authorization: Bearer <VOICE_AGENT_TOKEN>`. Същият helper като CRM инструментите приема и голата стойност на токена в `Authorization`. Не поставяйте секрети в динамични променливи, клиентски код или публични URL адреси.

`POST /api/trening/tools/next-card`

Заявка:

```json
{"sesia":"UUID","tema":"skript"}
```

Успешен отговор:

```json
{
  "card_id": "string",
  "zaglavie": "string",
  "obyasnenie": "string",
  "vapros": "string",
  "otgovor": "string",
  "ostavat": 0
}
```

`ostavat` е броят допустими карти след текущата. Първо идват неотговаряните по `red`, после последна оценка 0, после 1, после най-отдавна отговаряните. Отговорените в текущата сесия се пропускат, докато останат само те.

`POST /api/trening/tools/answer`

Заявка:

```json
{
  "sesia": "UUID",
  "card_id": "string",
  "kazano": "string",
  "ocenka": 2,
  "komentar": "string"
}
```

Успешен отговор:

```json
{"ok":true,"tochni":1,"obshto":1}
```

`ocenka` е цяло число 0, 1 или 2. `tochni` брои отговорите с оценка 2, `obshto` брои всички отговори в сесията. Темата и режимът се вземат от проверената сесия на сървъра. Агентът трябва да записва всеки опит веднъж и да използва върнатия оригинал, без да измисля материал.

## Браузърни API

`GET /api/trening/session?tema=skript&rejim=izpit` връща:

```json
{"signedUrl":"wss://…","sesia":"UUID"}
```

Изисква админ бисквитката. При липсващ тренировъчен агент или API ключ отговорът е 503 с българско съобщение. Гласът се стартира само след натискане и разрешаване на микрофона.

`POST /api/trening/text` също изисква админ бисквитката. Действията са:

- `{"action":"start","tema":"skript"}` → `{"sesia":"UUID","card":{...}}`. Допълнителен `card_id` отваря избрана слаба карта.
- `{"action":"next","sesia":"UUID"}` → `{"card":{...}}` със същата логика като гласовия инструмент.
- `{"action":"answer","sesia":"UUID","card_id":"string","kazano":"string"}` → `{"ok":true,"tochni":1,"obshto":1,"comparison":{"percent":100,"ocenka":2,"words":[{"text":"string","matched":true}]}}`.
- `{"action":"finish","sesia":"UUID"}` → `{"ok":true}`.

При `answer` браузърът подава и `attempt_id` (UUID), запазен при повторно изпращане на същия опит, за да няма дублиран запис при загубена връзка. Нов опит получава нов UUID.

Сравнението отчита реда на думите, пропуснатите и добавените думи; игнорира регистър, пунктуация, кавички и излишни интервали. Показваният процент се закръгля надолу. Оценката е 2 при поне 90%, 1 при поне 60%, иначе 0, и се изчислява на сървъра.

## Ръчна проверка преди употреба

След настройването проверете реален разговор през HTTPS на iPhone/Safari: разрешение за микрофон, чуваем български звук, статус слуша/говори, „Стоп“, пристигащ webhook и историята. Затварянето на екрана прекратява гласовата връзка. Българският синтезиран глас зависи от гласовете на устройството.

Съдържанието на тренировъчния агент и реалните карти се предоставят от Ивайло; тази промяна не качва агент, не прилага SQL и не публикува сайта.

## Проверки при реализацията

- `npm run build` — успешно.
- `npx tsc --noEmit` — успешно.
- ESLint за всички променени TypeScript/TSX файлове — успешно, без предупреждения.
- `npx vitest run lib/trening components/admin/trenirovka app/api/trening lib/voice/postcall.test.ts` — 51 успешни теста. Проверяват реда на картите, сравняването, auth, webhook изолацията от CRM, текстовите повторения и гласовия lifecycle с mock на SDK/микрофона.
- HTTP проверка на production build: четирите нови API отказват неавтентикирани заявки с 403; страницата пренасочва към вход; влязъл админ вижда страницата; липсващ ElevenLabs trainer връща 503 на български.
- Общият `npm run lint` остава неуспешен с 22 съществуващи грешки и 35 предупреждения. Грешките са извън тази промяна: `CommandDeck`, `JarvisDeck`, `skript/Flight`, `ai-trading/TradingDeck`, `jarvis/JarvisExperience`, `landing/v2/{ConversionFloats,JarvisSpotlightV2,LiveLabsV2,NavbarV2,WelcomeLeadPopup}`, `strategii/StrategyLab`.
- Визуалната браузърна проверка не е извършена: sandbox-ът отказва Chromium (`MachPortRendezvousServer: Permission denied`), а браузърният инструмент изисква забранено от текущата политика approval. Реалният iPhone/Safari тест и live Supabase/ElevenLabs интеграцията остават ръчни след настройването.
- Commit-ът е блокиран от разрешенията на средата още при `git add`: общата Git директория е само за четене и създаването на `.git/worktrees/pro-marketing-wt-trenirovka/index.lock` връща `Operation not permitted`. Промените остават в работното дърво на `trenirovka-mvp`. Няма push и миграцията не е приложена.

## Файлове

Всички пътища са спрямо `prom-marketing/`:

```text
.env.example
package.json
package-lock.json
app/admin/(protected)/trenirovka/page.tsx
app/api/trening/session/route.ts
app/api/trening/text/route.ts
app/api/trening/tools/next-card/route.ts
app/api/trening/tools/answer/route.ts
app/api/trening/routes.test.ts
app/api/webhooks/elevenlabs/route.ts
components/admin/AdminShell.tsx
components/admin/trenirovka/TrainingDashboard.tsx
components/admin/trenirovka/TextPractice.tsx
components/admin/trenirovka/TextPractice.test.tsx
components/admin/trenirovka/VoicePractice.tsx
components/admin/trenirovka/VoicePractice.test.tsx
components/admin/trenirovka/HistoryModal.tsx
components/admin/trenirovka/text-api.ts
data/trening/karti.json
data/trening/fokus.json
lib/trening/temi.ts
lib/trening/types.ts
lib/trening/http.ts
lib/trening/repository.ts
lib/trening/scheduling.ts
lib/trening/scheduling.test.ts
lib/trening/comparison.ts
lib/trening/comparison.test.ts
lib/trening/transcript.ts
lib/trening/transcript.test.ts
lib/trening/postcall.ts
lib/trening/postcall.test.ts
supabase/migrations/20261012120000_trenirovka_mvp.sql
docs/trenirovka.md
```
