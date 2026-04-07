import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

export interface Item {
  id: string
  name: string
  category: string
  quantity: number
  description: string
  qr_code: string
  created_at: string
}

export const useInventory = () => {
  const { currentModule, user } = useAppStore()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tableName = currentModule === 'inventory' ? 'inventory_items' : 'spare_items'

  const fetchItems = useCallback(async () => {
    if (!currentModule) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      setItems(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentModule, tableName])

  const addItem = async (itemData: Omit<Item, 'id' | 'created_at' | 'qr_code'>) => {
    if (!user) return null
    try {
      const { data: newId, error: fnError } = await supabase.rpc(
        currentModule === 'inventory' ? 'generate_inventory_id' : 'generate_spare_id'
      )
      if (fnError) throw fnError

      const { data, error } = await supabase.from(tableName).insert([{ ...itemData, id: newId }]).select().single()
      if (error) throw error

      await supabase.from('stock_transactions').insert([{
        item_id: newId,
        module: currentModule,
        action: 'add',
        quantity: itemData.quantity,
        user_id: user.id,
        remarks: 'Initial stock registry'
      }])

      setItems([data, ...items])
      return newId as string
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateItem = async (id: string, updates: Partial<Item>, remarks?: string) => {
    if (!user) return
    try {
      const oldItem = items.find(i => i.id === id)
      const { error: updateErr } = await supabase.from(tableName).update(updates).eq('id', id)
      if (updateErr) throw updateErr

      if (updates.quantity !== undefined && oldItem) {
        if (updates.quantity < 0) throw new Error('Stock quantity cannot be less than zero.')
        const diff = updates.quantity - oldItem.quantity
        if (diff !== 0) {
          await supabase.from('stock_transactions').insert([{
            item_id: id,
            module: currentModule,
            action: diff > 0 ? 'add' : 'remove',
            quantity: diff,
            user_id: user.id,
            remarks: remarks || 'Quantity manual adjustment'
          }])
        }
      } else {
        await supabase.from('stock_transactions').insert([{
          item_id: id,
          module: currentModule,
          action: 'update',
          user_id: user.id,
          remarks: remarks || 'Item metadata update'
        }])
      }

      fetchItems()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteItem = async (id: string) => {
    if (!user) return
    try {
      const { error: delErr } = await supabase.from(tableName).delete().eq('id', id)
      if (delErr) throw delErr

      // Log activity
      await supabase.from('activity_logs').insert([
        { user_id: user.id, action: 'delete', item_id: id, module: currentModule }
      ])

      fetchItems()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const logScan = async (itemId: string) => {
    if (!user) return
    await supabase.from('stock_transactions').insert([{
      item_id: itemId,
      module: currentModule,
      action: 'scan',
      user_id: user.id,
      remarks: 'QR Scan verification'
    }])
  }

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return { items, loading, error, fetchItems, addItem, updateItem, deleteItem, logScan }
}
