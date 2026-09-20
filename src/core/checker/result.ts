export type CheckResult =
  | { readonly status: 'correct'; readonly note?: string }
  | { readonly status: 'incorrect'; readonly diagnosis?: string }
  | { readonly status: 'malformed'; readonly message: string }

export const correct = (note?: string): CheckResult => (note ? { status: 'correct', note } : { status: 'correct' })
export const incorrect = (diagnosis?: string): CheckResult => (diagnosis ? { status: 'incorrect', diagnosis } : { status: 'incorrect' })
export const malformed = (message: string): CheckResult => ({ status: 'malformed', message })

export const MSG = {
  empty: 'Введи ответ',
  unparsable: 'Не получилось разобрать формулу — проверь скобки и дроби',
  oneNumber: 'Нужно одно число. Десятичную дробь пиши через точку: 2.5',
  noVariables: 'Здесь нужно число, без переменных',
  wrongInput: 'Этот ответ вводится по-другому',
  sign: 'Похоже, ошибка в знаке',
  reciprocal: 'Похоже, дробь перевёрнута',
  approximate: 'Верно (приближённо)',
  notFactored: 'Значение верное, но нужно записать как произведение множителей',
  notFullyFactored: 'Значение верное, но разложено не до конца',
  notExpanded: 'Значение верное, но нужно раскрыть скобки',
} as const
