/**
 * FORM CONTROLS — shared form primitives
 *
 * Every form across the ERP must use these components to ensure visual
 * consistency and accessible behavior. Do not inline custom form
 * controls in individual pages.
 *
 * Components:
 *   FormField   — label + children + optional error + optional helper
 *   TextInput   — text/email/password/search input
 *   NumberInput — numeric input, optional unit suffix (KG, %)
 *   SelectField — native <select> styled to match
 *   Textarea    — resizable textarea
 *   Toggle      — accessible on/off toggle switch
 *   Checkbox    — accessible checkbox with label
 *   RadioGroup  — group of radio buttons
 */

import type { FC, ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ChangeEvent } from 'react'

/* ─── FormField wrapper ──────────────────────────────────────── */
interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  helper?: string
  error?: string
  children: ReactNode
  style?: React.CSSProperties
}

export const FormField: FC<FormFieldProps> = ({ label, htmlFor, required, helper, error, children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
    <label htmlFor={htmlFor} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'Inter', lineHeight: '16px', display: 'flex', alignItems: 'center', gap: 4 }}>
      {label}
      {required && <span aria-label="required" style={{ color: 'var(--sem-danger)', fontSize: 13, lineHeight: 1 }}>*</span>}
      {!required && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>}
    </label>
    {children}
    {helper && !error && <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0, fontFamily: 'Inter', lineHeight: '16px' }}>{helper}</p>}
    {error  && <p role="alert" style={{ fontSize: 11.5, color: 'var(--sem-danger)', margin: 0, fontFamily: 'Inter', lineHeight: '16px', display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      {error}
    </p>}
  </div>
)

/* ─── Shared input style ─────────────────────────────────────── */
const inputBase: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 11px',
  borderRadius: 8, background: 'var(--surface-01)', color: 'var(--text-primary)',
  fontSize: 13.5, fontFamily: 'Inter', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.12s ease, box-shadow 0.12s ease', lineHeight: '20px',
}

/* ─── TextInput ──────────────────────────────────────────────── */
interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  error?: string
  onChange?: (value: string) => void
}

export const TextInput: FC<TextInputProps> = ({ error, onChange, style, ...props }) => {
  const borderColor = error ? 'var(--sem-danger)' : 'var(--border-neutral)'
  const focusBorderColor = error ? 'var(--sem-danger)' : 'var(--brand-primary)'
  const focusShadow = error
    ? '0 0 0 3px rgba(220,38,38,0.08)'
    : '0 0 0 3px rgba(43,77,58,0.08)'

  return (
    <input
      {...props}
      onChange={onChange ? (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value) : undefined}
      style={{ ...inputBase, border: `1px solid ${borderColor}`, ...style }}
      onFocus={e => { e.currentTarget.style.borderColor = focusBorderColor; e.currentTarget.style.boxShadow = focusShadow }}
      onBlur={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

/* ─── NumberInput (with optional unit suffix) ────────────────── */
interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  unit?: string     // e.g. "KG", "%", "ETB"
  error?: string
  onChange?: (value: string) => void
}

export const NumberInput: FC<NumberInputProps> = ({ unit, error, onChange, style, ...props }) => {
  const borderColor = error ? 'var(--sem-danger)' : 'var(--border-neutral)'
  if (!unit) {
    return (
      <input type="number" {...props}
        onChange={onChange ? (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value) : undefined}
        style={{ ...inputBase, border: `1px solid ${borderColor}`, fontFamily: 'DM Mono', ...style }}
        onFocus={e => { e.currentTarget.style.borderColor = error ? 'var(--sem-danger)' : 'var(--brand-primary)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? 'rgba(220,38,38,0.08)' : 'rgba(43,77,58,0.08)'}` }}
        onBlur={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = 'none' }}
      />
    )
  }
  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      <input type="number" {...props}
        onChange={onChange ? (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value) : undefined}
        style={{ ...inputBase, border: `1px solid ${borderColor}`, borderRadius: '8px 0 0 8px', fontFamily: 'DM Mono', flex: 1, ...style }}
        onFocus={e => { e.currentTarget.style.borderColor = error ? 'var(--sem-danger)' : 'var(--brand-primary)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? 'rgba(220,38,38,0.08)' : 'rgba(43,77,58,0.08)'}` }}
        onBlur={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = 'none' }}
      />
      <div style={{ padding: '8px 12px', background: 'var(--surface-02)', border: `1px solid ${borderColor}`, borderLeft: 'none', borderRadius: '0 8px 8px 0', fontSize: 12.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0, userSelect: 'none' }}>
        {unit}
      </div>
    </div>
  )
}

/* ─── SelectField ────────────────────────────────────────────── */
interface SelectOption { value: string; label: string }

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[]
  placeholder?: string
  error?: string
  onChange?: (value: string) => void
}

export const SelectField: FC<SelectFieldProps> = ({ options, placeholder, error, onChange, style, value, ...props }) => {
  const borderColor = error ? 'var(--sem-danger)' : 'var(--border-neutral)'
  return (
    <select
      {...props}
      value={value}
      onChange={onChange ? (e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value) : undefined}
      style={{
        ...inputBase,
        border: `1px solid ${borderColor}`,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: 34,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = error ? 'var(--sem-danger)' : 'var(--brand-primary)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? 'rgba(220,38,38,0.08)' : 'rgba(43,77,58,0.08)'}` }}
      onBlur={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = 'none' }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

/* ─── Textarea ───────────────────────────────────────────────── */
interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  error?: string
  onChange?: (value: string) => void
}

export const Textarea: FC<TextareaProps> = ({ error, onChange, style, ...props }) => {
  const borderColor = error ? 'var(--sem-danger)' : 'var(--border-neutral)'
  return (
    <textarea
      {...props}
      onChange={onChange ? (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value) : undefined}
      style={{ ...inputBase, border: `1px solid ${borderColor}`, resize: 'vertical', minHeight: 72, ...style }}
      onFocus={e => { e.currentTarget.style.borderColor = error ? 'var(--sem-danger)' : 'var(--brand-primary)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? 'rgba(220,38,38,0.08)' : 'rgba(43,77,58,0.08)'}` }}
      onBlur={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

/* ─── Toggle ─────────────────────────────────────────────────── */
interface ToggleProps {
  id?: string; checked: boolean; onChange: (checked: boolean) => void
  label?: string; description?: string; disabled?: boolean
  danger?: boolean
}

export const Toggle: FC<ToggleProps> = ({ id, checked, onChange, label, description, disabled, danger }) => {
  const trackBg = checked ? (danger ? 'var(--sem-danger)' : 'var(--brand-primary)') : 'var(--surface-hover)'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <button
        id={id} role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{ width: 40, height: 22, borderRadius: 11, background: trackBg, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: checked ? 'flex-end' : 'flex-start', transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.5 : 1 }}
      >
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }} />
      </button>
      {(label || description) && (
        <div>
          {label && <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter', lineHeight: '20px' }}>{label}</div>}
          {description && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'Inter', marginTop: 1, lineHeight: '18px' }}>{description}</div>}
        </div>
      )}
    </div>
  )
}

/* ─── Checkbox ───────────────────────────────────────────────── */
interface CheckboxProps {
  id?: string; checked: boolean; onChange: (checked: boolean) => void
  label?: string; description?: string; disabled?: boolean; error?: string
}

export const Checkbox: FC<CheckboxProps> = ({ id, checked, onChange, label, description, disabled, error }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
      <input type="checkbox" id={id} checked={checked} disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, position: 'absolute', inset: 0, cursor: disabled ? 'not-allowed' : 'pointer', margin: 0, width: '100%', height: '100%' }}
      />
      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${error ? 'var(--sem-danger)' : checked ? 'var(--brand-primary)' : 'var(--border-neutral)'}`, background: checked ? 'var(--brand-primary)' : 'var(--surface-01)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1 }}>
        {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
    </div>
    {(label || description) && (
      <label htmlFor={id} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {label && <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'Inter', lineHeight: '20px' }}>{label}</div>}
        {description && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'Inter', lineHeight: '18px' }}>{description}</div>}
      </label>
    )}
  </div>
)

/* ─── RadioGroup ─────────────────────────────────────────────── */
interface RadioOption { value: string; label: string; description?: string }

interface RadioGroupProps {
  name: string; value: string; options: RadioOption[]
  onChange: (value: string) => void; disabled?: boolean
  orientation?: 'vertical' | 'horizontal'
}

export const RadioGroup: FC<RadioGroupProps> = ({ name, value, options, onChange, disabled, orientation = 'vertical' }) => (
  <div role="radiogroup" style={{ display: 'flex', flexDirection: orientation === 'horizontal' ? 'row' : 'column', gap: orientation === 'horizontal' ? 16 : 10, flexWrap: 'wrap' }}>
    {options.map(opt => (
      <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
          <input type="radio" name={name} value={opt.value} checked={value === opt.value} disabled={disabled}
            onChange={() => !disabled && onChange(opt.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, cursor: disabled ? 'not-allowed' : 'pointer', margin: 0, width: '100%', height: '100%' }}
          />
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${value === opt.value ? 'var(--brand-primary)' : 'var(--border-neutral)'}`, background: 'var(--surface-01)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1 }}>
            {value === opt.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-primary)' }} />}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'Inter', lineHeight: '20px' }}>{opt.label}</div>
          {opt.description && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'Inter', lineHeight: '18px' }}>{opt.description}</div>}
        </div>
      </label>
    ))}
  </div>
)
