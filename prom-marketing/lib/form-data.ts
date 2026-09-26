/**
 * Отметките в server action формите.
 *
 * Шаблонът в админа е скрито поле „0“ + отметка „1“ със същото име — така и
 * махнатата отметка пристига и сървърът знае, че е изключена, а не забравена.
 * Отметнатата обаче праща ДВЕТЕ стойности, а `FormData.get` връща първата —
 * тоест винаги „0“. Затова се гледат всички стойности, не първата.
 */

/** „1“ — отметнато; „0“ — изрично махнато; null — полето го няма във формата. */
export function checkboxValue(fd: FormData, name: string): "1" | "0" | null {
  const all = fd.getAll(name);
  if (all.includes("1")) return "1";
  if (all.includes("0")) return "0";
  return null;
}

/** Отметнато ли е — със или без скритото „0“ пред отметката. */
export function isChecked(fd: FormData, name: string): boolean {
  return checkboxValue(fd, name) === "1";
}
