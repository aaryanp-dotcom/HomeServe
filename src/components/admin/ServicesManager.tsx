'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/overlays'
import { formatCurrency } from '@/lib/utils'
import { SERVICE_CATEGORIES } from '@/types'

interface Service {
  id: string
  name: string
  category: string
  description: string
  base_price: number
  price_unit: string
  is_active: boolean
}

interface Props {
  services: Service[]
}

export default function AdminServicesManager({ services }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', category: 'Plumbing', description: '', base_price: '', price_unit: 'fixed' })

  const openCreate = () => { setEditService(null); setForm({ name: '', category: 'Plumbing', description: '', base_price: '', price_unit: 'fixed' }); setModalOpen(true) }
  const openEdit = (s: Service) => { setEditService(s); setForm({ name: s.name, category: s.category, description: s.description, base_price: String(s.base_price), price_unit: s.price_unit }); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name || !form.base_price) { setError('Name and price are required.'); return }
    setLoading(true); setError(null)
    try {
      const url = editService ? `/api/services/${editService.id}` : '/api/services'
      const method = editService ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, base_price: parseFloat(form.base_price) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save service'); return }
      setModalOpen(false)
      router.refresh()
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  const toggleActive = async (service: Service) => {
    await fetch(`/api/services/${service.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !service.is_active }),
    })
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">{services.length} services</p>
        <Button size="sm" onClick={openCreate}>+ Add Service</Button>
      </div>

      <div className="table-scroll panel" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="min-w-full divide-y divide-ink-900/10 text-sm">
          <thead>
            <tr className="bg-paper-50 text-xs font-semibold text-stone-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Unit</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/10">
            {services.map(s => (
              <tr key={s.id} className="hover:bg-paper-50">
                <td className="px-4 py-3 font-medium text-ink-900">{s.name}</td>
                <td className="px-4 py-3 text-stone-500">{s.category}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(s.base_price)}</td>
                <td className="px-4 py-3 text-stone-500 capitalize">{s.price_unit.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 ${s.is_active ? 'bg-sage-100 text-sage-700' : 'bg-paper-100 text-stone-500'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(s)} className="inline-flex items-center px-2 coarse:min-h-11 text-cobalt-600 hover:text-cobalt-800 text-xs font-medium">Edit</button>
                    <button onClick={() => toggleActive(s)} className="inline-flex items-center px-2 coarse:min-h-11 text-stone-600 hover:text-ink-800 text-xs">
                      {s.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editService ? 'Edit Service' : 'Add New Service'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={loading}>Save Service</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <Input label="Service Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tap/Faucet Repair" />
          <Select
            label="Category"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            options={SERVICE_CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief description..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Price (₹)" type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} />
            <Select
              label="Price Unit"
              value={form.price_unit}
              onChange={e => setForm(f => ({ ...f, price_unit: e.target.value }))}
              options={[
                { value: 'fixed', label: 'Fixed Price' },
                { value: 'per_sqft', label: 'Per Sq.Ft' },
                { value: 'per_hour', label: 'Per Hour' },
                { value: 'per_unit', label: 'Per Unit' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}
