import { create } from 'zustand'

export type Module = 'inventory' | 'spare'
export type UserRole = 'admin' | 'staff'

interface UserProfile {
  id: string
  email: string
  name?: string
  employee_id?: string
  phone?: string
  role: UserRole
  preferred_module?: 'inventory' | 'spare' | 'both'
}

interface AppState {
  currentModule: Module | null
  user: UserProfile | null
  setModule: (module: Module | null) => void
  setUser: (user: UserProfile | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentModule: (localStorage.getItem('currentModule') as Module) || null,
  user: null,
  setModule: (module) => {
    if (module) localStorage.setItem('currentModule', module)
    else localStorage.removeItem('currentModule')
    set({ currentModule: module })
  },
  setUser: (user) => {
    // On every new login, clear the saved module so Module Selection is always shown
    if (user) {
      localStorage.removeItem('currentModule')
      set({ user, currentModule: null })
    } else {
      set({ user: null })
    }
  },
  logout: () => {
    localStorage.removeItem('currentModule')
    set({ user: null, currentModule: null })
  },
}))
