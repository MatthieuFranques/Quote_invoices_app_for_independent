import type { ReactNode } from 'react'

const baseInput =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

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
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
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
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <div className="flex items-center gap-2">
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
        {suffixe && <span className="text-gray-500">{suffixe}</span>}
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
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
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
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <textarea
        className={baseInput}
        rows={rows}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

/** Interrupteur on/off (case à cocher stylée). */
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
    <label className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type="checkbox"
        className="size-6 accent-blue-600"
        checked={valeur}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

/** Regroupe des champs sous un titre de section. */
export function Section({
  titre,
  children,
}: {
  titre: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold tracking-wide text-gray-500 uppercase">
        {titre}
      </h2>
      {children}
    </section>
  )
}
