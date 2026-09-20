import { createRng } from '../random/rng'
import type { Problem, SkillTemplate, Tier } from './types'

interface TemplateModule {
  readonly template?: SkillTemplate
}

const modules = import.meta.glob<TemplateModule>(['./week*/*.ts', '!./week*/*.test.ts'], { eager: true })

export function collectTemplates(entries: Readonly<Record<string, TemplateModule>>): ReadonlyMap<string, SkillTemplate> {
  const map = new Map<string, SkillTemplate>()
  for (const [path, mod] of Object.entries(entries)) {
    const template = mod.template
    if (!template) throw new Error(`${path} must export "template"`)
    if (map.has(template.skillId)) throw new Error(`Duplicate template for "${template.skillId}"`)
    map.set(template.skillId, template)
  }
  return map
}

export const TEMPLATES: ReadonlyMap<string, SkillTemplate> = collectTemplates(modules)

export const hasTemplate = (skillId: string): boolean => TEMPLATES.has(skillId)

export function getTemplate(skillId: string): SkillTemplate {
  const template = TEMPLATES.get(skillId)
  if (!template) throw new Error(`No template for skill "${skillId}"`)
  return template
}

export function generateProblem(skillId: string, seed: number, tier: Tier): Problem {
  return getTemplate(skillId).generate(createRng(seed), tier)
}

export function expectedSeconds(skillId: string, tier: Tier): number {
  return getTemplate(skillId).expectedSeconds[tier]
}
