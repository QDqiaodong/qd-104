import type { City } from '@/types'

export function getCityAliases(city: City): string[] {
  if (!city.aliases) return []
  return city.aliases.split(',').map(a => a.trim()).filter(Boolean)
}

export function matchCityByAlias(keyword: string, cities: City[]): City[] {
  if (!keyword.trim()) return cities
  
  const lowerKeyword = keyword.trim().toLowerCase()
  
  return cities.filter(city => {
    if (city.name.toLowerCase().includes(lowerKeyword)) return true
    if (city.province.toLowerCase().includes(lowerKeyword)) return true
    
    const aliases = getCityAliases(city)
    return aliases.some(alias => alias.toLowerCase().includes(lowerKeyword))
  })
}

export function getMatchedAlias(keyword: string, city: City): string | null {
  if (!keyword.trim()) return null
  
  const lowerKeyword = keyword.trim().toLowerCase()
  const aliases = getCityAliases(city)
  
  for (const alias of aliases) {
    if (alias.toLowerCase().includes(lowerKeyword)) {
      return alias
    }
  }
  
  return null
}
