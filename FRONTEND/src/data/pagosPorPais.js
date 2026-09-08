export const PAISES = ['Perú', 'México', 'Argentina', 'Venezuela', 'Ecuador', 'Colombia']

export const PAGOS_POR_PAIS = {
  'Perú': ['Yape', 'Binance', 'Astropay'],
  'México': ['Mercado Pago México', 'Binance', 'Astropay'],
  'Argentina': ['Mercado Pago Argentina', 'Binance', 'Astropay'],
  'Venezuela': ['Pago móvil Venezuela', 'Binance', 'Astropay'],
  'Ecuador': ['Banco Pichincha', 'Binance', 'Astropay'],
  'Colombia': ['Nequi', 'Binance', 'Astropay'],
  // agregá más países/métodos aquí
}

export const TODOS_METODOS = [...new Set(Object.values(PAGOS_POR_PAIS).flat())]

// Fallback para país no mapeado: lista vacía (no se muestra ningún método)
export function getMetodosPorPais(pais) {
  return PAGOS_POR_PAIS[pais] || []
}
