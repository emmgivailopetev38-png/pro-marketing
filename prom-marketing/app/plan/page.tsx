import Link from "next/link";

const ac = (c: string, d: string): React.CSSProperties =>
  ({ ["--ac" as string]: c, animationDelay: d } as React.CSSProperties);
const w = (p: string): React.CSSProperties =>
  ({ ["--w" as string]: p } as React.CSSProperties);

export default function PlanPage() {
  return (
    <main className="pl-root">
      <div className="pl-aurora" aria-hidden />
      <div className="pl-grid" aria-hidden />
      <div className="pl-stars" aria-hidden />
      <div className="pl-orbs" aria-hidden>
        <i /><i /><i />
      </div>

      <div className="pl-wrap">
        {/* ===== HERO ===== */}
        <header className="pl-hero pl-rise">
          <div className="pl-kicker">◆ PROMARKETING · ПРЕМИУМ AI ПЛАТФОРМА</div>
          <h1 className="pl-h1">
            Бизнес система <span>от бъдещето</span>
          </h1>
          <div className="pl-rule" aria-hidden />
          <p className="pl-sub">
            Изграждаме платформата ти на 3 фази — с изкуствен интелект във всяка.
            Премиум изпълнение, ясни цени, без изненади.
          </p>
          <div className="pl-chips">
            <span>✦ AI във всяка фаза</span>
            <span>✦ Премиум поддръжка</span>
            <span>✦ Готово за растеж</span>
          </div>
        </header>

        {/* ===== AI ЕКИП + УСПЕХ ===== */}
        <section className="pl-show pl-rise" style={{ animationDelay: "0.04s" }}>
          <div className="pl-orbwrap">
            <div className="pl-orb">
              <svg className="pl-olines" viewBox="0 0 720 320" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="og" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#34e7e4" />
                    <stop offset="1" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <line className="pl-oflow" stroke="url(#og)" x1="360" y1="160" x2="660" y2="160" />
                <line className="pl-oflow" stroke="url(#og)" x1="360" y1="160" x2="510" y2="56" />
                <line className="pl-oflow" stroke="url(#og)" x1="360" y1="160" x2="210" y2="56" />
                <line className="pl-oflow" stroke="url(#og)" x1="360" y1="160" x2="60" y2="160" />
                <line className="pl-oflow" stroke="url(#og)" x1="360" y1="160" x2="210" y2="264" />
                <line className="pl-oflow" stroke="url(#og)" x1="360" y1="160" x2="510" y2="264" />
              </svg>
              <div className="pl-oring" />
              <div className="pl-ocore">
                <b>AI</b>
                <small>екип</small>
              </div>
              <div className="pl-agents">
                <div className="pl-agent" style={{ left: "91.7%", top: "50%" }}><span className="pulse" /><span className="ic">🤝</span><span className="nm">Търговец</span><span className="pl-typing"><i /><i /><i /></span></div>
                <div className="pl-agent" style={{ left: "70.8%", top: "17.5%" }}><span className="pulse" /><span className="ic">💶</span><span className="nm">Касиер</span><span className="pl-typing"><i /><i /><i /></span></div>
                <div className="pl-agent" style={{ left: "29.2%", top: "17.5%" }}><span className="pulse" /><span className="ic">📣</span><span className="nm">Маркетолог</span><span className="pl-typing"><i /><i /><i /></span></div>
                <div className="pl-agent" style={{ left: "8.3%", top: "50%" }}><span className="pulse" /><span className="ic">💬</span><span className="nm">Чат-оператор</span><span className="pl-typing"><i /><i /><i /></span></div>
                <div className="pl-agent" style={{ left: "29.2%", top: "82.5%" }}><span className="pulse" /><span className="ic">🗂️</span><span className="nm">Архивар</span><span className="pl-typing"><i /><i /><i /></span></div>
                <div className="pl-agent" style={{ left: "70.8%", top: "82.5%" }}><span className="pulse" /><span className="ic">🔍</span><span className="nm">Контрольор</span><span className="pl-typing"><i /><i /><i /></span></div>
              </div>
            </div>
            <div className="pl-ocap">
              <b>AI Екип</b> — агенти, които работят и се учат заедно, денонощно
            </div>
          </div>

          <div className="pl-wins">
            <div className="pl-win"><div className="pl-wn">до +37%</div><div className="pl-wl">повече продажби</div><div className="pl-wbar"><span style={w("85%")} /></div></div>
            <div className="pl-win"><div className="pl-wn">24/7</div><div className="pl-wl">работа без почивка</div><div className="pl-wbar"><span style={w("100%")} /></div></div>
            <div className="pl-win"><div className="pl-wn">0</div><div className="pl-wl">изпуснати клиенти</div><div className="pl-wbar"><span style={w("95%")} /></div></div>
            <div className="pl-win"><div className="pl-wn">∞</div><div className="pl-wl">капацитет за растеж</div><div className="pl-wbar"><span style={w("90%")} /></div></div>
          </div>
        </section>

        {/* ===== ИЗРАБОТКА ===== */}
        <h2 className="pl-sec pl-rise" style={{ animationDelay: "0.05s" }}>
          <span>Изработка</span> · 3 фази, всяка с 3 модула
        </h2>

        <section className="pl-phases">
          <article className="pl-card pl-rise" style={ac("#34e7e4", "0.10s")}>
            <div className="pl-ph">Фаза 01</div>
            <h3 className="pl-name">Основа</h3>
            <div className="pl-tag">Достъпи · Управление · Хора</div>
            <p className="pl-desc">Сигурният гръбнак, върху който стъпва всичко.</p>
            <ul className="pl-mods">
              <li><div className="pl-mtitle">Достъпи &amp; роли</div><div className="pl-msub">роли за управление, служители и клиенти</div></li>
              <li><div className="pl-mtitle">Управление &amp; табло</div><div className="pl-msub">централно управление, настройки, преглед</div></li>
              <li><div className="pl-mtitle">AI асистент „Управление" <i className="pl-ai">AI</i></div><div className="pl-msub">дневен бриф и приоритети за екипа</div></li>
            </ul>
            <div className="pl-acc">
              <div className="pl-acch">🔐 Достъпи · основи</div>
              <div className="pl-accrow"><b>3 роли:</b> 👑 Управление · 🧑‍💼 Служители · 🤝 Клиенти</div>
              <div className="pl-accrow"><b>Основни права:</b> вход · профили · екип</div>
            </div>
            <div className="pl-out">Получаваш: сигурна основа, готова за растеж.</div>
            <div className="pl-meta"><span className="pl-time">⏱ 3–4 седмици</span><span className="pl-price">€2 200</span></div>
          </article>

          <article className="pl-card pl-rise" style={ac("#a78bfa", "0.18s")}>
            <div className="pl-ph">Фаза 02</div>
            <h3 className="pl-name">Клиенти &amp; операции</h3>
            <div className="pl-tag">Профили · Срещи · Процеси</div>
            <p className="pl-desc">Ежедневието ти — подредено и под контрол.</p>
            <ul className="pl-mods">
              <li><div className="pl-mtitle">Клиентски профил 360°</div><div className="pl-msub">цялата история на клиента на едно място</div></li>
              <li><div className="pl-mtitle">Сделки, срещи &amp; записки</div><div className="pl-msub">pipeline, напомняния, записки от срещи</div></li>
              <li><div className="pl-mtitle">AI бриф преди среща <i className="pl-ai">AI</i></div><div className="pl-msub">AI те подготвя за всеки клиент</div></li>
            </ul>
            <div className="pl-acc">
              <div className="pl-acch">🔐 Достъпи · операции</div>
              <div className="pl-accrow"><b>🧑‍💼 Служители:</b> задачи · клиенти · сделки · документи</div>
              <div className="pl-accrow"><b>🤝 Клиенти:</b> портал · фактури · заявки</div>
            </div>
            <div className="pl-out">Получаваш: повече сделки, нулево изпускане.</div>
            <div className="pl-meta"><span className="pl-time">⏱ 2–3 седмици</span><span className="pl-price">€2 900</span></div>
          </article>

          <article className="pl-card pl-card--gold pl-rise" style={ac("#e7c984", "0.26s")}>
            <div className="pl-flag">премиум</div>
            <div className="pl-ph">Фаза 03</div>
            <h3 className="pl-name">Растеж &amp; AI</h3>
            <div className="pl-tag">Агенти · Автоматизации · Интеграции</div>
            <p className="pl-desc">Машината, която работи вместо теб.</p>
            <ul className="pl-mods">
              <li><div className="pl-mtitle">Автоматизации</div><div className="pl-msub">welcome, лийдове, follow-up последователности</div></li>
              <li><div className="pl-mtitle">AI Екип (агенти) <i className="pl-ai">AI</i></div><div className="pl-msub">агенти със споделено учене</div></li>
              <li><div className="pl-mtitle">Авто-оферти &amp; интеграции</div><div className="pl-msub">авто-оферти + Meta/омниканал</div></li>
            </ul>
            <div className="pl-acc">
              <div className="pl-acch">🔐 Достъпи · AI &amp; растеж</div>
              <div className="pl-accrow"><b>👑 Управление:</b> финанси · отчети · стратегии</div>
              <div className="pl-accrow"><b>🤖 AI:</b> агенти · автоматизации · авто-оферти</div>
            </div>
            <div className="pl-out">Получаваш: растеж без да наемаш екип.</div>
            <div className="pl-meta"><span className="pl-time">⏱ 1–2 седмици</span><span className="pl-price">€3 600</span></div>
          </article>
        </section>

        {/* ===== ПАКЕТИ ===== */}
        <div className="pl-subsec pl-rise" style={{ animationDelay: "0.30s" }}>Пакети за изработка</div>
        <section className="pl-pkgs">
          <article className="pl-pkg pl-pkg--value pl-rise" style={{ animationDelay: "0.34s" }}>
            <div className="pl-pkflag">★ най-изгодно</div>
            <div className="pl-pktop"><b>Пълна платформа</b><span className="pl-pkprice">€7 400</span></div>
            <p className="pl-pkdesc">И трите фази — система от край до край. <em>Спестяваш €1 300.</em></p>
            <div className="pl-team">🤖 <b>6</b> AI · 👤 <b>до 10</b> служителя</div>
            <ul className="pl-inc">
              <li>Всичките 9 модула (Фаза 1 + 2 + 3)</li>
              <li>Базови интеграции (имейл, Meta, Cal.com)</li>
              <li>Обучение на екипа</li>
              <li>1–3 мес. хостинг включен (вкл. AI)</li>
            </ul>
          </article>

          <article className="pl-pkg pl-pkg--gold pl-rise" style={{ animationDelay: "0.38s" }}>
            <div className="pl-pkflag pl-pkflag--gold">✦ премиум</div>
            <div className="pl-pktop"><b>Премиум</b><span className="pl-pkprice pl-pkprice--gold">от €12 000</span></div>
            <p className="pl-pkdesc">За по-сериозен бизнес — изцяло по поръчка.</p>
            <div className="pl-team">🤖 <b>6+</b> AI · 👤 <b>до 20</b> служителя</div>
            <ul className="pl-inc">
              <li>Всичко от Пълната платформа</li>
              <li>Custom интеграции (ERP, счетоводство, телефония)</li>
              <li>Брандиран дизайн „от бъдещето"</li>
              <li>Повече AI агенти, специфични за бизнеса</li>
              <li>Приоритетна изработка + разширено обучение</li>
            </ul>
          </article>

          <article className="pl-pkg pl-rise" style={{ animationDelay: "0.42s" }}>
            <div className="pl-pktop"><b>Къстъм</b><span className="pl-pkprice pl-pkprice--c">без таван</span></div>
            <p className="pl-pkdesc">За мащабни и сложни проекти.</p>
            <div className="pl-team">🤖 <b>∞</b> AI · 👤 <b>30+</b> служителя</div>
            <ul className="pl-inc">
              <li>Мулти-екип / мулти-локация</li>
              <li>Интеграции по поръчка + миграция</li>
              <li>Специални модули за твоята ниша</li>
              <li>Dedicated инфраструктура + SLA</li>
            </ul>
          </article>
        </section>

        {/* ===== ПОДДРЪЖКА ===== */}
        <h2 className="pl-sec pl-rise" style={{ animationDelay: "0.05s" }}>
          <span>Поддръжка</span> · месечен абонамент
        </h2>

        <section className="pl-plans">
          <article className="pl-plan pl-rise" style={ac("#34e7e4", "0.10s")}>
            <h3 className="pl-pname">Базов</h3>
            <div className="pl-pprice">€149<small>/мес</small></div>
            <ul className="pl-feats">
              <li><b>4</b> тикета за промяна / мес</li>
              <li>до 1 000 контакта · 5 автоматизации</li>
              <li><i className="pl-ai">AI</i> 1 агент</li>
              <li>имейл поддръжка · до 48ч</li>
            </ul>
          </article>

          <article className="pl-plan pl-plan--pop pl-rise" style={ac("#a78bfa", "0.16s")}>
            <div className="pl-pop">Най-избиран</div>
            <h3 className="pl-pname">Про</h3>
            <div className="pl-pprice">€199<small>/мес</small></div>
            <ul className="pl-feats">
              <li><b>6</b> тикета за промяна / мес</li>
              <li>до 5 000 контакта · 12 автоматизации</li>
              <li><i className="pl-ai">AI</i> до 3 агента</li>
              <li>приоритет · до 24ч</li>
            </ul>
          </article>

          <article className="pl-plan pl-plan--gold pl-rise" style={ac("#e7c984", "0.22s")}>
            <h3 className="pl-pname">Премиум</h3>
            <div className="pl-pprice">€299<small>/мес</small></div>
            <ul className="pl-feats">
              <li><b>10</b> тикета за промяна / мес</li>
              <li>високи лимити</li>
              <li><i className="pl-ai">AI</i> цял AI Екип</li>
              <li>приоритет · 12ч + тримесечна стратегия</li>
            </ul>
          </article>
        </section>

        <section className="pl-custom pl-rise" style={{ animationDelay: "0.28s" }}>
          <div className="pl-cleft">
            <div className="pl-cbadge">Enterprise</div>
            <h3 className="pl-cname">Къстъм поддръжка</h3>
            <div className="pl-cprice">по договорка</div>
            <p className="pl-cpitch">
              За голям обем и мащаб — когато бизнесът ти прерасне стандартните планове.
              По-високи стойности, персонален подход, нула тавани.
            </p>
          </div>
          <div className="pl-cright">
            <div className="pl-cget">Какво точно получаваш</div>
            <ul className="pl-cgrid">
              <li><b>∞</b> тикета за промяна</li>
              <li><b>∞</b> контакти &amp; автоматизации</li>
              <li><i className="pl-ai">AI</i> Екип + собствени агенти</li>
              <li>🖥️ dedicated инфраструктура</li>
              <li>⚡ приоритет до 4ч · опция 24/7</li>
              <li>👤 личен акаунт мениджър</li>
              <li>📈 тримесечни стратегии</li>
              <li>🔌 интеграции по поръчка</li>
            </ul>
          </div>
        </section>

        {/* ===== TERMS + CTA ===== */}
        <footer className="pl-foot pl-rise" style={{ animationDelay: "0.34s" }}>
          <div className="pl-terms">
            🎟️ extra тикет <b>€20</b> · 📅 годишно <b>−2 месеца</b> · ☁️ платформи включени ·
            💳 изработка: депозит <b>50 / 50</b>
          </div>
          <Link className="pl-cta" href="/">Заяви консултация →</Link>
        </footer>
      </div>

      <style>{`
        .pl-root{font-family:var(--pl-body),system-ui,sans-serif;position:relative;overflow-x:hidden;
          --cy:#34e7e4;--vi:#a78bfa;--gold:#e7c984;--lime:#a3e635;--ink:#eef2f8;--mut:#94a3b8}
        .pl-root *{box-sizing:border-box;margin:0;padding:0}

        /* backgrounds */
        .pl-aurora{position:fixed;inset:-25%;z-index:0;pointer-events:none;filter:blur(30px);
          background:radial-gradient(34% 42% at 16% 8%,rgba(52,231,228,.13),transparent 62%),
            radial-gradient(40% 48% at 86% 12%,rgba(167,139,250,.15),transparent 62%),
            radial-gradient(50% 50% at 52% 104%,rgba(231,201,132,.08),transparent 60%);
          animation:pl-aurora 22s ease-in-out infinite alternate}
        @keyframes pl-aurora{100%{transform:translate(-2%,1.5%) scale(1.07)}}
        .pl-grid{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.04;
          background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);
          background-size:54px 54px;-webkit-mask-image:radial-gradient(circle at 50% 16%,#000,transparent 78%);
          mask-image:radial-gradient(circle at 50% 16%,#000,transparent 78%)}
        .pl-stars{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.5;
          background-image:radial-gradient(1.3px 1.3px at 12% 18%,rgba(255,255,255,.85),transparent),radial-gradient(1.1px 1.1px at 47% 8%,rgba(120,220,255,.8),transparent),radial-gradient(1px 1px at 73% 22%,rgba(255,255,255,.65),transparent),radial-gradient(1.2px 1.2px at 88% 12%,rgba(231,201,132,.7),transparent),radial-gradient(1px 1px at 30% 30%,rgba(255,255,255,.55),transparent),radial-gradient(1.1px 1.1px at 63% 33%,rgba(255,255,255,.6),transparent),radial-gradient(1px 1px at 8% 42%,rgba(120,220,255,.55),transparent);
          animation:pl-tw 6s ease-in-out infinite alternate}
        @keyframes pl-tw{0%{opacity:.3}100%{opacity:.66}}
        .pl-orbs{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
        .pl-orbs i{position:absolute;border-radius:50%;filter:blur(58px);opacity:.4}
        .pl-orbs i:nth-child(1){width:340px;height:340px;background:radial-gradient(circle,#34e7e4,transparent 70%);top:-70px;left:-50px;animation:pl-fl1 28s ease-in-out infinite alternate}
        .pl-orbs i:nth-child(2){width:300px;height:300px;background:radial-gradient(circle,#a78bfa,transparent 70%);top:26%;right:-70px;animation:pl-fl2 32s ease-in-out infinite alternate}
        .pl-orbs i:nth-child(3){width:280px;height:280px;background:radial-gradient(circle,#e7c984,transparent 70%);bottom:-90px;left:30%;animation:pl-fl3 36s ease-in-out infinite alternate}
        @keyframes pl-fl1{to{transform:translate(70px,50px)}}
        @keyframes pl-fl2{to{transform:translate(-60px,70px)}}
        @keyframes pl-fl3{to{transform:translate(50px,-60px)}}

        .pl-wrap{position:relative;z-index:1;max-width:1060px;margin:0 auto;padding:64px 24px 88px}

        @keyframes pl-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
        .pl-rise{animation:pl-rise .85s cubic-bezier(.2,.7,.2,1) both}
        @media (prefers-reduced-motion:reduce){.pl-root *,.pl-root::before,.pl-root::after{animation:none!important}}

        /* hero */
        .pl-hero{text-align:center;margin-bottom:50px}
        .pl-kicker{font-family:var(--pl-mono),monospace;font-size:11px;letter-spacing:.42em;color:var(--gold);text-transform:uppercase}
        .pl-h1{font-family:var(--pl-display),sans-serif;font-weight:800;line-height:1.02;font-size:clamp(40px,8vw,80px);margin:18px 0 0;letter-spacing:-.015em;color:var(--ink)}
        .pl-h1 span{background:linear-gradient(110deg,#34e7e4,#a78bfa 50%,#e7c984);background-size:220% auto;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 26px rgba(167,139,250,.3));animation:pl-shim 8s linear infinite}
        @keyframes pl-shim{to{background-position:220% center}}
        .pl-rule{width:60px;height:1px;margin:22px auto 0;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
        .pl-sub{max-width:600px;margin:20px auto 0;color:var(--mut);font-size:clamp(15px,2vw,18px);line-height:1.65}
        .pl-chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:24px}
        .pl-chips span{font-size:12px;color:#cdd9e8;background:rgba(255,255,255,.025);border:1px solid rgba(231,201,132,.22);padding:7px 14px;border-radius:999px;letter-spacing:.02em}

        /* section labels */
        .pl-sec{font-family:var(--pl-mono),monospace;font-weight:500;font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--mut);margin:58px 0 18px;display:flex;align-items:center;gap:14px}
        .pl-sec span{color:var(--ink);font-weight:700}
        .pl-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.12),transparent)}
        .pl-subsec{font-family:var(--pl-mono),monospace;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:#74829a;margin:20px 0 13px}

        /* AI team showcase */
        .pl-show{margin:34px 0 6px}
        .pl-orbwrap{position:relative;overflow:hidden;border-radius:22px;border:1px solid rgba(255,255,255,.07);padding:12px 8px;
          background:radial-gradient(58% 78% at 50% 36%,rgba(167,139,250,.1),transparent 70%),rgba(7,10,18,.5)}
        .pl-orb{position:relative;width:100%;max-width:720px;aspect-ratio:720/320;margin:0 auto}
        .pl-olines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
        .pl-oflow{stroke-width:1.6;stroke-dasharray:3 9;animation:pl-dash 1s linear infinite;opacity:.55}
        @keyframes pl-dash{to{stroke-dashoffset:-24}}
        .pl-oring{position:absolute;left:50%;top:50%;width:560px;height:228px;transform:translate(-50%,-50%);border:1px dashed rgba(231,201,132,.16);border-radius:50%;animation:pl-spin 50s linear infinite}
        @keyframes pl-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
        .pl-ocore{position:absolute;left:50%;top:50%;width:116px;height:116px;transform:translate(-50%,-50%);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;
          background:radial-gradient(circle at 38% 34%,#c9fff9,#34e7e4 34%,#a78bfa 82%);
          box-shadow:0 0 46px rgba(52,231,228,.38),0 0 90px rgba(167,139,250,.28),inset 0 0 22px rgba(255,255,255,.25);animation:pl-breathe 4.5s ease-in-out infinite}
        @keyframes pl-breathe{50%{box-shadow:0 0 70px rgba(52,231,228,.58),0 0 120px rgba(167,139,250,.42),inset 0 0 22px rgba(255,255,255,.3)}}
        .pl-ocore::before{content:"";position:absolute;inset:-11px;border-radius:50%;border:1px dashed rgba(231,201,132,.5);animation:pl-rot 16s linear infinite}
        @keyframes pl-rot{to{transform:rotate(360deg)}}
        .pl-ocore::after{content:"";position:absolute;inset:0;border-radius:50%;border:1px solid rgba(52,231,228,.55);animation:pl-ping 3.2s ease-out infinite}
        @keyframes pl-ping{0%{transform:scale(1);opacity:.6}80%,100%{transform:scale(1.9);opacity:0}}
        .pl-ocore b{font-family:var(--pl-display),sans-serif;font-weight:800;font-size:15px;letter-spacing:.06em;color:#06121a;z-index:1}
        .pl-ocore small{font-size:8px;letter-spacing:.3em;color:#0a2230;text-transform:uppercase;z-index:1}
        .pl-agent{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:7px;white-space:nowrap;
          background:rgba(12,16,26,.82);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:7px 13px;box-shadow:0 8px 26px rgba(0,0,0,.5);animation:pl-aglow 3.4s ease-in-out infinite}
        @keyframes pl-aglow{50%{border-color:rgba(52,231,228,.4);box-shadow:0 8px 26px rgba(0,0,0,.5),0 0 16px rgba(52,231,228,.18)}}
        .pl-agents .pl-agent:nth-child(2){animation-delay:.5s}
        .pl-agents .pl-agent:nth-child(3){animation-delay:1s}
        .pl-agents .pl-agent:nth-child(4){animation-delay:1.5s}
        .pl-agents .pl-agent:nth-child(5){animation-delay:2s}
        .pl-agents .pl-agent:nth-child(6){animation-delay:2.5s}
        .pl-agent .ic{font-size:15px;line-height:1}
        .pl-agent .nm{font-size:12px;font-weight:600;color:#eaf1f8}
        .pl-agent .pulse{width:6px;height:6px;border-radius:50%;background:var(--lime);box-shadow:0 0 8px var(--lime);animation:pl-blink 1.8s infinite}
        @keyframes pl-blink{50%{opacity:.3}}
        .pl-typing{display:inline-flex;gap:2px;align-items:center;margin-left:2px}
        .pl-typing i{width:3px;height:3px;border-radius:50%;background:var(--cy);opacity:.3;animation:pl-type 1.3s infinite}
        .pl-typing i:nth-child(2){animation-delay:.18s}
        .pl-typing i:nth-child(3){animation-delay:.36s}
        @keyframes pl-type{0%,65%,100%{opacity:.25}30%{opacity:1}}
        .pl-ocap{text-align:center;color:var(--mut);font-size:12.5px;margin-top:10px}
        .pl-ocap b{color:#cdd9e8}

        /* wins */
        .pl-wins{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
        .pl-win{position:relative;overflow:hidden;text-align:center;background:rgba(255,255,255,.022);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:17px 14px}
        .pl-wn{font-family:var(--pl-display),sans-serif;font-weight:800;font-size:30px;line-height:1;background:linear-gradient(120deg,#fff,var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 14px rgba(231,201,132,.35));animation:pl-glow 3.6s ease-in-out infinite}
        @keyframes pl-glow{50%{filter:drop-shadow(0 0 22px rgba(231,201,132,.6))}}
        .pl-wl{font-size:11.5px;color:var(--mut);margin-top:7px}
        .pl-wbar{height:3px;border-radius:3px;background:rgba(255,255,255,.06);margin-top:11px;overflow:hidden}
        .pl-wbar span{display:block;height:100%;width:0;border-radius:3px;background:linear-gradient(90deg,var(--cy),var(--gold));box-shadow:0 0 9px rgba(231,201,132,.4);animation:pl-fill 1.7s cubic-bezier(.2,.7,.2,1) .4s both}
        @keyframes pl-fill{to{width:var(--w,80%)}}

        /* shared card surface + alive sheen */
        .pl-card,.pl-plan,.pl-pkg,.pl-custom,.pl-foot{position:relative;background:rgba(255,255,255,.022);backdrop-filter:blur(16px);
          border:1px solid rgba(255,255,255,.075);box-shadow:0 18px 50px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.05)}
        .pl-card::after,.pl-plan::after,.pl-pkg::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
          background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.05) 48%,transparent 64%);
          background-size:250% 100%;background-position:210% 0;animation:pl-sheen 8.5s ease-in-out infinite}
        @keyframes pl-sheen{0%,55%{background-position:210% 0}100%{background-position:-60% 0}}
        .pl-phases .pl-card:nth-child(2)::after,.pl-plans .pl-plan:nth-child(2)::after,.pl-pkgs .pl-pkg:nth-child(2)::after{animation-delay:1.4s}
        .pl-phases .pl-card:nth-child(3)::after,.pl-plans .pl-plan:nth-child(3)::after,.pl-pkgs .pl-pkg:nth-child(3)::after{animation-delay:2.8s}

        /* phase cards */
        .pl-phases{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}
        .pl-card{border-radius:20px;padding:24px;transition:transform .4s cubic-bezier(.2,.7,.2,1),border-color .4s,box-shadow .4s}
        .pl-card:hover{transform:translateY(-7px);border-color:color-mix(in srgb,var(--ac) 50%,transparent);box-shadow:0 28px 70px rgba(0,0,0,.5),0 0 36px color-mix(in srgb,var(--ac) 16%,transparent)}
        .pl-card--gold{border-color:rgba(231,201,132,.34)}
        .pl-flag{position:absolute;top:16px;right:16px;font-family:var(--pl-mono),monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:#1a1408;background:linear-gradient(120deg,var(--gold),#f6e3b0);padding:4px 10px;border-radius:7px;box-shadow:0 0 18px rgba(231,201,132,.4);z-index:2;animation:pl-tagpulse 3s ease-in-out infinite}
        @keyframes pl-tagpulse{50%{filter:brightness(1.18)}}
        .pl-ph{font-family:var(--pl-mono),monospace;font-size:11px;letter-spacing:.22em;color:var(--ac);text-transform:uppercase;position:relative;z-index:1}
        .pl-name{font-family:var(--pl-display),sans-serif;font-weight:700;font-size:23px;margin:6px 0 4px;color:var(--ink);position:relative;z-index:1}
        .pl-tag{font-size:11.5px;color:var(--mut);position:relative;z-index:1}
        .pl-desc{font-size:13px;color:#c3cedd;margin:10px 0 14px;line-height:1.5;position:relative;z-index:1}
        .pl-mods{list-style:none;position:relative;z-index:1}
        .pl-mods li{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.055)}
        .pl-mods li:last-child{border:0}
        .pl-mtitle{display:flex;align-items:center;gap:8px;font-size:13.5px;color:#eaf1f8;font-weight:600}
        .pl-mtitle::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--ac);box-shadow:0 0 8px var(--ac);flex:none}
        .pl-msub{font-size:11.5px;color:var(--mut);margin-top:3px;padding-left:13px;line-height:1.5}
        .pl-ai{font-style:normal;font-size:9px;font-weight:700;letter-spacing:.05em;color:#06121a;background:linear-gradient(120deg,var(--cy),var(--lime));padding:2px 6px;border-radius:5px;box-shadow:0 0 12px rgba(52,231,228,.35);margin-left:auto;animation:pl-aipulse 2.6s ease-in-out infinite}
        @keyframes pl-aipulse{50%{box-shadow:0 0 18px rgba(52,231,228,.65)}}
        .pl-out{font-size:12px;color:var(--lime);background:rgba(163,230,53,.06);border:1px solid rgba(163,230,53,.18);border-radius:10px;padding:9px 12px;margin-top:16px;position:relative;z-index:1}
        .pl-acc{margin-top:12px;background:rgba(52,231,228,.05);border:1px solid rgba(52,231,228,.16);border-radius:10px;padding:9px 11px;position:relative;z-index:1}
        .pl-acch{font-family:var(--pl-mono),monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--cy);margin-bottom:6px}
        .pl-accrow{font-size:11px;color:#9fb0c4;padding:2px 0;line-height:1.4}
        .pl-accrow b{color:#eaf1f8;font-weight:600;margin-right:5px}
        .pl-meta{display:flex;align-items:center;justify-content:space-between;margin-top:16px;position:relative;z-index:1}
        .pl-time{font-size:11.5px;color:var(--mut)}
        .pl-price{font-family:var(--pl-mono),monospace;font-weight:700;font-size:25px;background:linear-gradient(120deg,#fff,var(--ac));-webkit-background-clip:text;background-clip:text;color:transparent}

        /* packages */
        .pl-pkgs{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}
        .pl-pkg{border-radius:18px;padding:20px;transition:transform .4s,border-color .4s}
        .pl-pkg:hover{transform:translateY(-5px);border-color:rgba(255,255,255,.16)}
        .pl-pkg--value{border-color:rgba(52,231,228,.3)}
        .pl-pkg--gold{border-color:rgba(231,201,132,.36);box-shadow:0 18px 50px rgba(0,0,0,.4),0 0 30px rgba(231,201,132,.1)}
        .pl-pkflag{position:absolute;top:-1px;right:16px;font-family:var(--pl-mono),monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#04121a;background:var(--cy);padding:4px 10px;border-radius:0 0 8px 8px;z-index:2}
        .pl-pkflag--gold{color:#1a1408;background:linear-gradient(120deg,var(--gold),#f6e3b0);animation:pl-tagpulse 3s ease-in-out infinite}
        .pl-pktop{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-top:6px;position:relative;z-index:1}
        .pl-pktop b{font-family:var(--pl-display),sans-serif;font-size:16px;color:var(--ink)}
        .pl-pkprice{font-family:var(--pl-mono),monospace;font-weight:700;font-size:21px;color:#fff;white-space:nowrap}
        .pl-pkprice--gold{background:linear-gradient(120deg,#fff,var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent}
        .pl-pkprice--c{font-size:15px;color:var(--gold)}
        .pl-pkdesc{font-size:12px;color:var(--mut);margin:8px 0 12px;line-height:1.5;position:relative;z-index:1}
        .pl-pkdesc em{color:var(--lime);font-style:normal;font-weight:600}
        .pl-team{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--cy);background:rgba(52,231,228,.08);border:1px solid rgba(52,231,228,.24);border-radius:8px;padding:4px 10px;margin:0 0 10px}
        .pl-team b{font-family:var(--pl-mono),monospace;color:#fff;font-size:13px}
        .pl-inc{list-style:none;position:relative;z-index:1}
        .pl-inc li{font-size:12px;color:#cdd9e8;padding:6px 0 6px 19px;position:relative;line-height:1.45}
        .pl-inc li::before{content:"✦";position:absolute;left:0;color:var(--gold);font-size:9px;top:8px}

        /* support plans */
        .pl-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}
        .pl-plan{border-radius:20px;padding:24px;transition:transform .4s,border-color .4s,box-shadow .4s}
        .pl-plan:hover{transform:translateY(-7px);border-color:color-mix(in srgb,var(--ac) 50%,transparent)}
        .pl-plan--pop{border-color:color-mix(in srgb,var(--ac) 46%,transparent);box-shadow:0 18px 50px rgba(0,0,0,.4),0 0 40px color-mix(in srgb,var(--ac) 18%,transparent)}
        .pl-plan--gold{border-color:rgba(231,201,132,.32)}
        .pl-pop{position:absolute;top:-1px;right:16px;font-family:var(--pl-mono),monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#fff;background:linear-gradient(120deg,var(--vi),#7c5cf0);padding:4px 11px;border-radius:0 0 9px 9px;box-shadow:0 0 16px rgba(167,139,250,.5);z-index:2;animation:pl-tagpulse 3s ease-in-out infinite}
        .pl-pname{font-family:var(--pl-display),sans-serif;font-weight:700;font-size:18px;color:var(--ink);position:relative;z-index:1}
        .pl-pprice{font-family:var(--pl-mono),monospace;font-weight:700;font-size:32px;margin:8px 0 16px;color:#fff;position:relative;z-index:1}
        .pl-pprice small{font-size:13px;color:#74829a;font-weight:500}
        .pl-feats{list-style:none;position:relative;z-index:1}
        .pl-feats li{font-size:12.5px;color:#cdd9e8;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.055);display:flex;align-items:center;gap:8px}
        .pl-feats li:last-child{border:0}
        .pl-feats li b{font-family:var(--pl-mono),monospace;color:var(--ac);font-size:14px}
        .pl-feats .pl-ai{margin-left:0}

        /* custom band */
        .pl-custom{margin-top:16px;display:grid;grid-template-columns:1fr 1.3fr;gap:26px;border-radius:20px;padding:26px;
          border-color:rgba(231,201,132,.28);box-shadow:0 18px 50px rgba(0,0,0,.4),0 0 46px rgba(231,201,132,.08)}
        .pl-cbadge{display:inline-block;font-family:var(--pl-mono),monospace;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:#1a1408;background:linear-gradient(120deg,var(--gold),#f6e3b0);padding:4px 11px;border-radius:7px}
        .pl-cname{font-family:var(--pl-display),sans-serif;font-weight:700;font-size:24px;color:var(--ink);margin:12px 0 2px}
        .pl-cprice{font-family:var(--pl-mono),monospace;font-size:15px;color:var(--gold)}
        .pl-cpitch{font-size:13px;color:#c3cedd;line-height:1.65;margin-top:12px}
        .pl-cget{font-family:var(--pl-mono),monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--mut);margin-bottom:12px}
        .pl-cgrid{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:9px 20px}
        .pl-cgrid li{font-size:12.5px;color:#eaf1f8;display:flex;align-items:center;gap:8px;line-height:1.4}
        .pl-cgrid li b{font-family:var(--pl-mono),monospace;color:var(--gold);font-size:15px}
        .pl-cgrid .pl-ai{margin-left:0}

        /* footer */
        .pl-foot{margin-top:34px;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;border-radius:18px;padding:20px 24px}
        .pl-terms{font-size:12.5px;color:var(--mut);line-height:1.7}
        .pl-terms b{color:var(--ink)}
        .pl-cta{font-family:var(--pl-display),sans-serif;font-weight:700;font-size:14px;text-decoration:none;color:#1a1408;background:linear-gradient(120deg,var(--gold),#f6e3b0);padding:13px 26px;border-radius:12px;white-space:nowrap;box-shadow:0 0 30px rgba(231,201,132,.35);transition:transform .2s,box-shadow .2s}
        .pl-cta:hover{transform:translateY(-2px);box-shadow:0 0 44px rgba(231,201,132,.6)}

        /* ===== whole-page life ===== */
        @property --pl-a{syntax:"<angle>";inherits:false;initial-value:0deg}
        .pl-card--gold::before,.pl-plan--pop::before,.pl-pkg--gold::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.5px;pointer-events:none;z-index:0;
          background:conic-gradient(from var(--pl-a),transparent 0deg,var(--bc) 55deg,transparent 140deg,transparent 235deg,var(--bc) 305deg,transparent 360deg);
          -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:pl-rotate 7s linear infinite}
        .pl-card--gold{--bc:#e7c984}
        .pl-plan--pop{--bc:#a78bfa}
        .pl-pkg--gold{--bc:#e7c984}
        @keyframes pl-rotate{to{--pl-a:360deg}}
        .pl-price,.pl-pprice,.pl-pkprice{animation:pl-pglow 4s ease-in-out infinite}
        @keyframes pl-pglow{50%{filter:drop-shadow(0 0 16px rgba(231,201,132,.42))}}
        .pl-mtitle::before{animation:pl-dot 2.6s ease-in-out infinite}
        @keyframes pl-dot{50%{box-shadow:0 0 14px var(--ac);transform:scale(1.3)}}
        .pl-sec::after{background:linear-gradient(90deg,rgba(255,255,255,.16),rgba(52,231,228,.45),transparent);background-size:200% 100%;animation:pl-line 4.5s linear infinite}
        @keyframes pl-line{to{background-position:-200% 0}}
        .pl-rule{animation:pl-rulep 3.2s ease-in-out infinite}
        @keyframes pl-rulep{50%{transform:scaleX(1.6);box-shadow:0 0 14px rgba(231,201,132,.6)}}
        .pl-foot::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;border-radius:18px 18px 0 0;background:linear-gradient(90deg,transparent,var(--cy),var(--gold),var(--vi),transparent);background-size:220% 100%;animation:pl-line 5s linear infinite}

        @media (max-width:880px){
          .pl-phases,.pl-plans,.pl-pkgs{grid-template-columns:1fr 1fr}
          .pl-custom{grid-template-columns:1fr;gap:18px}
        }
        @media (max-width:680px){
          .pl-orb{aspect-ratio:auto;max-width:none;display:flex;flex-direction:column;align-items:center;gap:14px}
          .pl-olines,.pl-oring{display:none}
          .pl-ocore{position:relative;left:auto;top:auto;transform:none}
          .pl-agents{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
          .pl-agent{position:static;transform:none;justify-content:center}
          .pl-wins{grid-template-columns:1fr 1fr}
        }
        @media (max-width:520px){
          .pl-phases,.pl-plans,.pl-pkgs{grid-template-columns:1fr}
          .pl-cgrid{grid-template-columns:1fr}
          .pl-foot{flex-direction:column;align-items:stretch;text-align:center}
        }
      `}</style>
    </main>
  );
}
