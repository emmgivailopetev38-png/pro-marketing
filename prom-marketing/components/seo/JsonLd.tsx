/* Вкарва готовия schema.org граф в страницата.

   Server component — маркирането излиза в първоначалния HTML, така че
   всеки робот го вижда без да пуска JavaScript. Точно това е разликата
   между „индексира се" и „не се индексира" при AI търсачките, повечето
   от които изобщо не изпълняват скриптове. */

export function JsonLd({ json }: { json: string }) {
  return (
    <script
      type="application/ld+json"
      // Съдържанието е сериализирано от нас, не от потребител.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
