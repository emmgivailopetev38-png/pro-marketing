export const metadata = {
  title: "Общи условия — ProMarketing LTD",
  description:
    "Общи условия за ползване на уебсайта и услугите на ProMarketing LTD съгласно българското законодателство.",
};

const updatedAt = "26 май 2026 г.";

export default function TermsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
        Общи условия за ползване
      </h1>
      <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">
        В сила от {updatedAt}
      </p>

      <p className="mt-6 text-[var(--color-text-secondary)]">
        Настоящите Общи условия („Условия") уреждат отношенията между{" "}
        <strong>ProMarketing LTD</strong> („Доставчик", „ние", „нас") и потребителите на уебсайта{" "}
        <a className="text-[var(--color-accent-cyan)]" href="https://promarketing.pw">
          promarketing.pw
        </a>{" "}
        и предлаганите услуги. С достъп до сайта Вие приемате настоящите Условия. Ако не сте
        съгласни, моля не използвайте сайта.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">1. Идентификация на доставчика</h2>
      <ul className="text-[var(--color-text-secondary)]">
        <li>
          <strong>Фирма:</strong> ProMarketing LTD
        </li>
        <li>Седалище и адрес на управление: гр. София, България</li>
        <li>
          Електронна поща:{" "}
          <a className="text-[var(--color-accent-cyan)]" href="mailto:ivailo@promarketing.pw">
            ivailo@promarketing.pw
          </a>
        </li>
        <li>Телефон: +359 877 399 963</li>
        <li>
          Контролни органи: Комисия за защита на потребителите (КЗП) — kzp.bg; Комисия за защита
          на личните данни (КЗЛД) — cpdp.bg.
        </li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-bold">2. Описание на услугите</h2>
      <p className="text-[var(--color-text-secondary)]">
        ProMarketing LTD предлага консултантски и технически услуги в областта на изкуствения
        интелект, маркетинг автоматизация, AI чат агенти, AI CRM системи, AI софтуер по поръчка
        и интегрирани решения за бизнес процеси. Точният обхват и цена на всяка услуга се
        договарят индивидуално с клиента, въз основа на оферта.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">3. Приемане на условията</h2>
      <p className="text-[var(--color-text-secondary)]">
        Чрез използване на сайта, изпращане на форма, резервиране на онлайн среща или сключване
        на договор с нас, Вие потвърждавате, че сте прочели, разбрали и приели настоящите Условия.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">4. Права и задължения на потребителя</h2>
      <p className="text-[var(--color-text-secondary)]">Потребителят се задължава да:</p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>Предоставя вярна и актуална информация;</li>
        <li>Не нарушава нормативни актове и права на трети лица;</li>
        <li>
          Не предприема действия за компрометиране сигурността или функционалността на сайта
          (DDoS, инжектиране на код, неоторизиран достъп и пр.);
        </li>
        <li>
          Не изпраща спам, заплашителни, обидни, или незаконни съобщения чрез формите за контакт;
        </li>
        <li>Не копира, разпространява или модифицира съдържанието на сайта без разрешение.</li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-bold">5. Сключване на договор</h2>
      <p className="text-[var(--color-text-secondary)]">
        Услугите на ProMarketing LTD се предоставят въз основа на индивидуален писмен договор,
        който се сключва след първоначален разговор и одобрена оферта. Цените, сроковете и
        предметът на работа се определят в договора. До подписване на такъв, нищо на сайта не
        представлява правно обвързваща оферта.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">6. Цени и плащане</h2>
      <p className="text-[var(--color-text-secondary)]">
        Цените на услугите се обявяват в писмена оферта или договор. Освен ако не е уговорено
        друго, плащанията се извършват по банков път на основа на издадена фактура. ДДС не е
        включен в обявените цени, освен ако изрично е посочено.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">7. Право на отказ (за потребители)</h2>
      <p className="text-[var(--color-text-secondary)]">
        Съгласно Закона за защита на потребителите (ЗЗП), потребителят (физическо лице извън
        търговската си дейност) има право да се откаже от договор от разстояние в срок до 14 дни
        без посочване на причина. Правото на отказ не се прилага за услуги, които вече са
        изпълнени с изричното съгласие на потребителя преди изтичане на срока, както и за
        дигитално съдържание, предоставено не на материален носител.
      </p>
      <p className="text-[var(--color-text-secondary)]">
        За договори между ProMarketing LTD и юридически лица или търговци, правото на отказ по ЗЗП
        не се прилага.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">8. Интелектуална собственост</h2>
      <p className="text-[var(--color-text-secondary)]">
        Всички материали на сайта — текстове, изображения, лога, дизайн, код, видеа — са
        собственост на ProMarketing LTD или на съответните им притежатели и са защитени от Закона
        за авторското право и сродните му права. Възпроизвеждане, разпространение или промяна
        без писмено разрешение е забранено.
      </p>
      <p className="text-[var(--color-text-secondary)]">
        За създадени по поръчка решения (софтуер, AI агенти, дашбордове), правата се уреждат в
        индивидуалния договор с клиента.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">9. Ограничаване на отговорността</h2>
      <p className="text-[var(--color-text-secondary)]">
        ProMarketing LTD полага разумни усилия за поддържане на актуална и точна информация на
        сайта, но не гарантира, че съдържанието е без грешки или че сайтът ще е винаги достъпен.
        В максималната допусната от закона степен ProMarketing LTD не носи отговорност за:
      </p>
      <ul className="text-[var(--color-text-secondary)]">
        <li>Непреки или последвали вреди от използването на сайта;</li>
        <li>Прекъсване или повреда в работата на сайта поради хостинг или инфраструктура;</li>
        <li>Действия на трети лица — Vercel, Supabase, Resend, Meta, Google и др.;</li>
        <li>Загуба на данни поради независещи от нас обстоятелства.</li>
      </ul>

      <h2 className="mt-10 font-display text-2xl font-bold">10. Външни линкове</h2>
      <p className="text-[var(--color-text-secondary)]">
        Сайтът може да съдържа линкове към сайтове на трети лица. ProMarketing LTD не носи
        отговорност за съдържанието, политиките или практиките на тези сайтове.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">11. Защита на личните данни</h2>
      <p className="text-[var(--color-text-secondary)]">
        Обработването на лични данни се извършва в съответствие с нашата{" "}
        <a className="text-[var(--color-accent-cyan)]" href="/privacy">
          Политика за поверителност
        </a>
        , GDPR и ЗЗЛД.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">12. Промени в условията</h2>
      <p className="text-[var(--color-text-secondary)]">
        ProMarketing LTD си запазва правото да актуализира тези Условия по всяко време. Новите
        Условия влизат в сила от датата на публикуване на сайта. Продължаването на ползването на
        сайта след промените се счита за приемане.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">13. Приложимо право и юрисдикция</h2>
      <p className="text-[var(--color-text-secondary)]">
        Настоящите Условия се уреждат от законодателството на Република България. Всички спорове,
        които не могат да бъдат уредени по доброволен път, се решават от компетентния български
        съд по седалището на ProMarketing LTD, освен ако императивни норми не предвиждат друго.
      </p>
      <p className="text-[var(--color-text-secondary)]">
        Потребителите имат възможност да използват{" "}
        <a
          className="text-[var(--color-accent-cyan)]"
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
        >
          платформата за онлайн решаване на спорове (ODR) на Европейската комисия
        </a>
        .
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold">14. Контакт</h2>
      <p className="text-[var(--color-text-secondary)]">
        За въпроси относно настоящите Условия:
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
