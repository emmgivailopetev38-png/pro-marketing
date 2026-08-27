import { JsonLd } from "@/components/seo/JsonLd";
import { graph, webPageSchema } from "@/lib/seo/schema";

/* Малкият вариант на структурираните данни — за страниците, чието
   съдържание вече съществува и не се пренаписва.

   Дава на Google WebPage възел с име, описание и трохи, вързан за
   Organization и WebSite от коренния layout. Без него страницата се
   вижда като текст без адрес в графа на сайта. */

export function PageSchema({
  path,
  name,
  description,
  crumb,
}: {
  path: string;
  name: string;
  description: string;
  /** Името в трохите; по подразбиране е `name`. */
  crumb?: string;
}) {
  return (
    <JsonLd
      json={graph(
        webPageSchema({
          path,
          name,
          description,
          breadcrumbs: [{ name: crumb ?? name, path }],
        }),
      )}
    />
  );
}
