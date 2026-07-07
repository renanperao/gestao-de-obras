import type { SVGProps } from 'react'

type IconeProps = SVGProps<SVGSVGElement>

function base(props: IconeProps) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: props.className ?? 'h-6 w-6',
    ...props,
  }
}

export function IconePainel(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function IconeObra(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20.5V6l6-2.5V20.5" />
      <path d="M10 8.5l7 2.5v9.5" />
      <path d="M2.5 20.5h19" />
      <path d="M6.5 9h1M6.5 12.5h1M6.5 16h1M13 14h1M13 17h1" />
    </svg>
  )
}

export function IconeCompras(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5h2l2.2 11.2A1.5 1.5 0 0 0 9.7 17.5h8.1a1.5 1.5 0 0 0 1.47-1.2L20.5 9H6.6" />
      <circle cx="10" cy="20.5" r="1.2" />
      <circle cx="17.5" cy="20.5" r="1.2" />
    </svg>
  )
}

export function IconeFinanceiro(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6.5" width="18" height="12" rx="2" />
      <circle cx="12" cy="12.5" r="2.6" />
      <path d="M6.2 9.5v.01M17.8 15.5v.01" />
    </svg>
  )
}

export function IconeRelatorios(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20.5h16" />
      <path d="M6.5 20.5v-7M11 20.5V5.5M15.5 20.5v-10M20 20.5v-4" />
    </svg>
  )
}

export function IconeConfiguracoes(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6" />
    </svg>
  )
}

export function IconeSair(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 6V4.5A1.5 1.5 0 0 0 12.5 3h-7A1.5 1.5 0 0 0 4 4.5v15A1.5 1.5 0 0 0 5.5 21h7a1.5 1.5 0 0 0 1.5-1.5V18" />
      <path d="M9 12h11.5M17.5 8.5 21 12l-3.5 3.5" />
    </svg>
  )
}

export function IconeFoto(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5.5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10.5" r="1.6" />
      <path d="M3.5 17.5 9 13l4 3.5 3.5-3 4 4" />
    </svg>
  )
}

export function IconeAviso(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M18 8.5a6 6 0 0 0-12 0c0 5.5-2 6.5-2 6.5h16s-2-1-2-6.5" />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" />
    </svg>
  )
}

export function IconeAgenda(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </svg>
  )
}

export function IconeProgresso(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 12a8.5 8.5 0 1 0 8.5-8.5" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  )
}

export function IconeMais(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
