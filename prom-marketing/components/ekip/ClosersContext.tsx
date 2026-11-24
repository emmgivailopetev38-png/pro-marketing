"use client";
import { createContext, useContext } from "react";

/** Клоузър за избор при „Записах среща“ — само името и id-то му. */
export interface CloserOption {
  id: string;
  name: string;
}

const Ctx = createContext<CloserOption[]>([]);

/**
 * Клоузърите, между които записващият може да избере. Страницата на опашката ги
 * подава само когато са повече от един и записва не самият клоузър — така
 * картата на лийда не носи нов параметър на всяко място, където се показва.
 */
export function ClosersProvider({ closers, children }: { closers: CloserOption[]; children: React.ReactNode }) {
  return <Ctx.Provider value={closers}>{children}</Ctx.Provider>;
}

export function useClosers(): CloserOption[] {
  return useContext(Ctx);
}
