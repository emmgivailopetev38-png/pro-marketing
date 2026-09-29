import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { TeamManager } from "./TeamManager";
import { modulesFromForm, permissionsFromForm } from "@/lib/team/roles";
import type { TeamMember } from "@/lib/team/types";

// Сървърните действия са подменени: гледаме какво праща формата и какво
// остава на екрана, след като React я изчисти след изпращането.
const sent = vi.hoisted(() => ({ update: [] as FormData[], create: [] as FormData[] }));
vi.mock("@/app/admin/(protected)/ekip/actions", () => ({
  createMemberAction: vi.fn(async (_prev: unknown, fd: FormData) => {
    sent.create.push(fd);
    return { ok: true, password: "x", email: String(fd.get("email")), name: String(fd.get("full_name")) };
  }),
  resetPasswordAction: vi.fn(async () => null),
  toggleMemberAction: vi.fn(async () => {}),
  updateProfileAction: vi.fn(async (_prev: unknown, fd: FormData) => {
    sent.update.push(fd);
    return { ok: true, name: String(fd.get("full_name")) };
  }),
}));

const elena: TeamMember = {
  id: "90e6217b",
  slug: "elena",
  full_name: "Елена",
  email: "elena_pana@abv.bg",
  phone: "0898600876",
  role: "sales",
  title: "Продавач",
  permissions: { modules: { zvanene: true } },
  active: true,
  notify_new_leads: true,
  notes: null,
  last_login_at: null,
  created_at: "2026-09-26T09:50:17Z",
};

const formOf = (button: string) => screen.getByRole("button", { name: button }).closest("form") as HTMLFormElement;

beforeEach(() => {
  sent.update.length = 0;
  sent.create.length = 0;
});

describe("профилът в /admin/ekip след „Запази“ (26.09.2026, Елена)", () => {
  it("ролята остава „Продавач“ — менюто не скача на „Срещи“ и не я сменя при следващия запис", async () => {
    render(<TeamManager members={[elena]} />);
    fireEvent.click(screen.getByRole("button", { name: /Профил/ }));
    const form = formOf("Запази профила");
    const role = within(form).getByRole("combobox") as HTMLSelectElement;
    expect(role.value).toBe("sales");

    fireEvent.click(within(form).getByRole("button", { name: "Запази профила" }));
    await waitFor(() => expect(within(form).getByText("Записано.")).toBeInTheDocument());
    expect(role.value).toBe("sales");

    fireEvent.click(within(form).getByRole("button", { name: "Запази профила" }));
    await waitFor(() => expect(sent.update).toHaveLength(2));
    expect(sent.update[1].get("role")).toBe("sales");
  });

  it("каквото е отметнато на екрана, това стига до правата", async () => {
    render(<TeamManager members={[elena]} />);
    fireEvent.click(screen.getByRole("button", { name: /Профил/ }));
    const form = formOf("Запази профила");
    expect((within(form).getByRole("checkbox", { name: /Звънене · опашка/ }) as HTMLInputElement).checked).toBe(true);

    fireEvent.click(within(form).getByRole("button", { name: "Запази профила" }));
    await waitFor(() => expect(sent.update).toHaveLength(1));
    const fd = sent.update[0];
    expect(permissionsFromForm(modulesFromForm(fd), "sales")).toEqual({ modules: { zvanene: true } });
  });

  it("новият човек: след „Създай“ формата се връща на „Срещи“ заедно с отметките на сетъра", async () => {
    render(<TeamManager members={[]} />);
    const form = formOf("Създай и покажи паролата");
    const role = within(form).getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(within(form).getByPlaceholderText("Име Фамилия"), { target: { value: "Тест" } });
    fireEvent.change(within(form).getByPlaceholderText("ime@gmail.com"), { target: { value: "test@abv.bg" } });
    fireEvent.change(role, { target: { value: "sales" } });
    expect((within(form).getByRole("checkbox", { name: /Звънене · опашка/ }) as HTMLInputElement).checked).toBe(false);

    fireEvent.click(within(form).getByRole("button", { name: "Създай и покажи паролата" }));
    await waitFor(() => expect(sent.create).toHaveLength(1));
    expect(sent.create[0].get("role")).toBe("sales");

    await waitFor(() => expect(role.value).toBe("setter"));
    await waitFor(() => expect((within(form).getByRole("checkbox", { name: /Звънене · опашка/ }) as HTMLInputElement).checked).toBe(true));
    expect((within(form).getByRole("checkbox", { name: /Продажби · моите хора/ }) as HTMLInputElement).checked).toBe(false);
  });
});
