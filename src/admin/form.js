import { createWidget } from './widgets.js'

export function buildForm(schema, state) {
  const root = document.createElement('div')
  root.className = 'pa-form'
  const groups = new Map()
  for (const field of schema) {
    let g = groups.get(field.section)
    if (!g) {
      g = document.createElement('details')
      g.className = 'pa-group'
      g.open = true
      const sum = document.createElement('summary')
      sum.className = 'pa-group__title'
      sum.textContent = field.section
      g.appendChild(sum)
      groups.set(field.section, g)
      root.appendChild(g)
    }
    g.appendChild(createWidget(field, state))
  }
  return root
}
