export const metadata = {
  title: "Политика за поверителност — ProMarketing LTD",
  description:
    "Политика за поверителност и защита на личните данни на ProMarketing LTD съгласно GDPR и българското законодателство.",
};

const updatedAt = "26 май 2026 г.";

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
        Политика за поверителност
      </h1>
      <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">
        В сила от {updatedAt}
      </p>

      <p className="mt-6 text-[var(--color-text-secondary)]">
        Настоящата Политика за поверителност урежда обработването на лични данни от{" "}
        <strong>ProMarketing LTD</strong> („ние", „нас", „Администратора") във връзка с
        използването на уебсайта{" "}
        <a className="text-[var(--color-accent-cyan)]" href="https://promarketing.pw">
          promarketing.pw
        </a>{" "}
        и предлаганите услуги. Политиката е изготвена в съответствие с Регламент (ЕС) 2016/679
        („GDPR"), Закона за защита на личните данни (ЗЗЛД) и Закона за електронната търговия
        (ЗЕТ).
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">1. Идентификация на администратора</h2>
      <p className="text-[var(--color-text-secondary)]">
        Администратор на личните данни е:
      </p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>
          <strong>ProMarketing LTD</strong>
        </li>
        <li>Седалище и адрес на управление: гр. София, България</li>
        <li>
          Електронна поща за връзка:{" "}
          <a className="text-[var(--color-accent-cyan)]" href="mailto:ivailo@promarketing.pw">
            ivailo@promarketing.pw
          </a>
        </li>
        <li>Телефон: +359 877 399 963</li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-bold">2. Какви лични данни събираме</h2>
      <p className="text-[var(--color-text-secondary)]">Чрез формите и услугите на сайта можем да обработваме:</p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>Идентификационни данни: име, фамилия;</li>
        <li>Данни за контакт: имейл адрес, телефонен номер;</li>
        <li>Данни за фирмата: наименование на компанията, бранш/дейност;</li>
        <li>Съдържание на изпратени съобщения и въпроси;</li>
        <li>Данни за резервация на онлайн среща през Cal.com (час, тема, отговори на въпроси);</li>
        <li>
          Технически данни: IP адрес (хеширан), тип браузър, операционна система, страници, които
          посещавате, време на сесия, източник на трафика;
        </li>
        <li>Cookies и подобни технологии (вж. раздел „Бисквитки").</li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-bold">3. Цели и правни основания за обработка</h2>
      <p className="text-[var(--color-text-secondary)]">Обработваме личните Ви данни на следните основания:</p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>
          <strong>Изпълнение на договор или преддоговорни отношения (чл. 6, ал. 1, б. „б" GDPR)</strong>{" "}
          — за да отговорим на запитване, изпратим оферта, проведем консултация или предоставим
          услуга.
        </li>
        <li>
          <strong>Съгласие (чл. 6, ал. 1, б. „а" GDPR)</strong> — за маркетингови съобщения,
          бисквитки за анализ и реклама, които изискват вашето изрично съгласие.
        </li>
        <li>
          <strong>Законов интерес (чл. 6, ал. 1, б. „е" GDPR)</strong> — за защита на сайта от
          злоупотреби, мерене на ефективността на маркетинга, подобряване на услугите.
        </li>
        <li>
          <strong>Законово задължение (чл. 6, ал. 1, б. „в" GDPR)</strong> — за съхранение на
          счетоводни документи и изпълнение на нормативни изисквания.
        </li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-bold">4. Срокове на съхранение</h2>
      <ul className="text-[var(--color-text-secondary)]">
        <li>Данни от запитвания и формуляри: до 24 месеца от последния контакт;</li>
        <li>Данни от резервирани срещи: до 36 месеца от приключване на проекта;</li>
        <li>Счетоводни и данъчни документи: 10 години (съгласно Закона за счетоводството);</li>
        <li>Маркетингови комуникации: до оттегляне на съгласието Ви;</li>
        <li>Технически логове и cookies: до 12 месеца.</li>
      </ul>
      <p className="text-[var(--color-text-secondary)]">
        След изтичане на сроковете данните се изтриват или анонимизират.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">5. Получатели и обработващи лични данни</h2>
      <p className="text-[var(--color-text-secondary)]">
        За доставянето на услугите използваме доверени технически партньори, които действат като
        обработващи лични данни от името на ProMarketing LTD:
      </p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>
          <strong>Vercel Inc.</strong> (САЩ) — хостинг на сайта;
        </li>
        <li>
          <strong>Supabase Inc.</strong> (САЩ, ЕС регион Франкфурт) — база данни и автентикация;
        </li>
        <li>
          <strong>Resend Inc.</strong> (САЩ) — доставка на транзакционни и маркетингови имейли;
        </li>
        <li>
          <strong>Cal.com Inc.</strong> (САЩ) — резервация на онлайн срещи;
        </li>
        <li>
          <strong>Meta Platforms Inc.</strong> (Ирландия / САЩ) — Facebook/Instagram реклами и
          пиксел за анализ;
        </li>
        <li>
          <strong>PostHog Inc.</strong> (САЩ) — продуктова аналитика и потребителско поведение
          (с маскирани форми);
        </li>
        <li>
          <strong>Google LLC</strong> (Ирландия / САЩ) — шрифтове и евентуално Google Ads.
        </li>
      </ul>
      <p className="text-[var(--color-text-secondary)]">
        Всички доставчици имат подписани Data Processing Agreements (DPA) с подходящи гаранции
        за защита на данните. Прехвърлянията към САЩ се осъществяват на база Standard
        Contractual Clauses (SCC) и/или EU-US Data Privacy Framework.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">6. Бисквитки (Cookies)</h2>
      <p className="text-[var(--color-text-secondary)]">
        Сайтът използва следните типове бисквитки:
      </p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>
          <strong>Необходими (задължителни)</strong> — за функциониране на сайта, сесии и сигурност.
          Не изискват съгласие.
        </li>
        <li>
          <strong>Аналитични</strong> — PostHog, Meta Pixel, Google Analytics — за да разберем как
          се ползва сайтът. Изискват вашето съгласие.
        </li>
        <li>
          <strong>Маркетингови</strong> — Meta Pixel, Google Ads conversion tracking — за
          таргетиране на реклами. Изискват вашето съгласие.
        </li>
      </ul>
      <p className="text-[var(--color-text-secondary)]">
        Можете да управлявате или оттеглите съгласието си по всяко време чрез настройките на
        браузъра или като ни пишете на{" "}
        <a className="text-[var(--color-accent-cyan)]" href="mailto:ivailo@promarketing.pw">
          ivailo@promarketing.pw
        </a>
        .
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">7. Вашите права по GDPR</h2>
      <p className="text-[var(--color-text-secondary)]">
        Като субект на лични данни имате следните права:
      </p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>
          <strong>Право на достъп</strong> (чл. 15) — да получите потвърждение и копие на
          обработваните за Вас данни;
        </li>
        <li>
          <strong>Право на коригиране</strong> (чл. 16) — да поискате корекция на неточни или
          непълни данни;
        </li>
        <li>
          <strong>Право на изтриване („право да бъдеш забравен")</strong> (чл. 17);
        </li>
        <li>
          <strong>Право на ограничаване на обработката</strong> (чл. 18);
        </li>
        <li>
          <strong>Право на преносимост</strong> (чл. 20) — да получите данните в машинно четим
          формат;
        </li>
        <li>
          <strong>Право на възражение</strong> (чл. 21) — срещу обработка на база законен интерес
          или директен маркетинг;
        </li>
        <li>
          <strong>Право на оттегляне на съгласие</strong> по всяко време, без това да засяга
          законосъобразността на обработката преди оттеглянето.
        </li>
      </ul>
      <p className="text-[var(--color-text-secondary)]">
        За упражняване на правата си се свържете с нас на{" "}
        <a className="text-[var(--color-accent-cyan)]" href="mailto:ivailo@promarketing.pw">
          ivailo@promarketing.pw
        </a>
        . Ще отговорим в срок до 30 дни.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">8. Право на жалба</h2>
      <p className="text-[var(--color-text-secondary)]">
        Ако смятате, че правата Ви са нарушени, имате право да подадете жалба до{" "}
        <strong>Комисия за защита на личните данни (КЗЛД)</strong>:
      </p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>Адрес: гр. София 1592, бул. „Проф. Цветан Лазаров" № 2</li>
        <li>
          Уебсайт:{" "}
          <a
            className="text-[var(--color-accent-cyan)]"
            href="https://www.cpdp.bg"
            target="_blank"
            rel="noopener noreferrer"
          >
            cpdp.bg
          </a>
        </li>
        <li>
          Имейл:{" "}
          <a className="text-[var(--color-accent-cyan)]" href="mailto:kzld@cpdp.bg">
            kzld@cpdp.bg
          </a>
        </li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-bold">9. Сигурност на данните</h2>
      <p className="text-[var(--color-text-secondary)]">
        Прилагаме подходящи технически и организационни мерки за защита на личните данни —
        криптиране при пренос (TLS), сигурно съхранение, ограничен достъп с двуфакторно
        автентициране, регулярни одити на сигурността.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">10. Промени в политиката</h2>
      <p className="text-[var(--color-text-secondary)]">
        Тази Политика може да бъде актуализирана периодично. Съществени промени се публикуват на
        тази страница и при необходимост уведомяваме засегнатите лица по имейл. Препоръчваме да
        проверявате тази страница регулярно.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">11. Контакт</h2>
      <p className="text-[var(--color-text-secondary)]">
        За всякакви въпроси относно обработката на лични данни или упражняване на правата си:
      </p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>
          Имейл:{" "}
          <a className="text-[var(--color-accent-cyan)]" href="mailto:ivailo@promarketing.pw">
            ivailo@promarketing.pw
          </a>
        </li>
        <li>
          Телефон:{" "}
          <a className="text-[var(--color-accent-cyan)]" href="tel:+359877399963">
            +359 877 399 963
          </a>
        </li>
      </ul>
    </article>
  );
}
