import type { ReactNode } from 'react'

const baseInput =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20'

const baseLabel = 'mb-xs block text-label-sm text-on-surface-variant'

/** Champ texte sur une ligne, avec libellé au-dessus. */
export function ChampTexte({
  label,
  valeur,
  onChange,
  type = 'text',
  placeholder,
  inputMode,
}: {
  label: string
  valeur: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel'
}) {
  return (
    <label className="block">
      <span className={baseLabel}>{label}</span>
      <input
        className={baseInput}
        type={type}
        inputMode={inputMode}
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

/** Champ numérique (montant, quantité, taux). Renvoie un nombre. */
export function ChampNombre({
  label,
  valeur,
  onChange,
  step = 'any',
  suffixe,
}: {
  label: string
  valeur: number
  onChange: (v: number) => void
  step?: string
  suffixe?: string
}) {
  return (
    <label className="block">
      <span className={baseLabel}>{label}</span>
      <div className="flex items-center gap-sm">
        <input
          className={baseInput}
          type="number"
          inputMode="decimal"
          step={step}
          value={Number.isNaN(valeur) ? '' : valeur}
          onChange={(e) =>
            onChange(e.target.value === '' ? 0 : Number(e.target.value))
          }
        />
        {suffixe && <span className="text-on-surface-variant">{suffixe}</span>}
      </div>
    </label>
  )
}

/** Liste déroulante. */
export function ChampSelect<T extends string | number>({
  label,
  valeur,
  options,
  onChange,
}: {
  label: string
  valeur: T
  options: { valeur: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <label className="block">
      <span className={baseLabel}>{label}</span>
      <select
        className={baseInput}
        value={valeur}
        onChange={(e) => {
          const brut = e.target.value
          const choisi = options.find((o) => String(o.valeur) === brut)
          if (choisi) onChange(choisi.valeur)
        }}
      >
        {options.map((o) => (
          <option key={String(o.valeur)} value={String(o.valeur)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Champ texte multiligne. */
export function ChampZone({
  label,
  valeur,
  onChange,
  rows = 3,
}: {
  label: string
  valeur: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <label className="block">
      <span className={baseLabel}>{label}</span>
      <textarea
        className={baseInput}
        rows={rows}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

/** Interrupteur on/off (style pilule, conforme à la maquette). */
export function Interrupteur({
  label,
  valeur,
  onChange,
}: {
  label: string
  valeur: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-sm py-1">
      <span className="text-label-md text-on-surface">{label}</span>
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={valeur}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-outline-variant transition-colors peer-checked:bg-primary" />
        <span className="absolute left-[2px] size-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

/** Regroupe des champs sous un titre de section, dans une carte. */
export function Section({
  titre,
  children,
}: {
  titre: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
      <h2 className="mb-md text-headline-sm">{titre}</h2>
      <div className="space-y-md">{children}</div>
    </section>
  )
}
