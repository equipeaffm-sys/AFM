import React, { useEffect, useState } from 'react'

export default function AdminLegalPage() {
  const [siret, setSiret] = useState('')
  const [rna, setRna] = useState('')
  const [acaced, setAcaced] = useState('')
  const [icad, setIcad] = useState('')
  const [certificateUrl, setCertificateUrl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/legal')
        if (!res.ok) return
        const json = await res.json()
        const val = json?.value ? JSON.parse(json.value) : {}
        if (!mounted) return
        setSiret(val?.siret || '')
        setRna(val?.rna || '')
        setAcaced(val?.acaced || '')
        setIcad(val?.icad || '')
        setCertificateUrl(val?.certificate_url || '')
      } catch (e) {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function handleSave() {
    setLoading(true)
    try {
      await fetch('/api/admin/legal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siret, rna, acaced, icad, certificate_url: certificateUrl }) })
      alert('Enregistré')
    } catch (e) {
      alert('Erreur')
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const res = await fetch('/api/admin/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, contentType: file.type, base64 }) })
      const json = await res.json()
      if (json?.url) setCertificateUrl(json.url)
      else alert('Erreur upload')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[#e4ded3] bg-white p-6">
        <h1 className="font-serif text-3xl">Identité légale & documents</h1>
        <p className="text-sm text-zinc-600">Renseignez les numéros officiels et uploadez les documents officiels.</p>
      </header>

      <div className="rounded-2xl border bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-sm">SIRET</span><input value={siret} onChange={(e) => setSiret(e.target.value)} className="w-full mt-1" /></label>
          <label className="block"><span className="text-sm">RNA</span><input value={rna} onChange={(e) => setRna(e.target.value)} className="w-full mt-1" /></label>
          <label className="block"><span className="text-sm">ACACED</span><input value={acaced} onChange={(e) => setAcaced(e.target.value)} className="w-full mt-1" /></label>
          <label className="block"><span className="text-sm">ICAD Habilitation</span><input value={icad} onChange={(e) => setIcad(e.target.value)} className="w-full mt-1" /></label>
        </div>

        <div className="mt-4">
          <label className="block"><span className="text-sm">Certificat (PDF)</span>
            <input type="file" accept="application/pdf" onChange={handleFile} className="mt-1" />
          </label>
          {certificateUrl && (
            <p className="mt-2 text-sm">URL du certificat : <a href={certificateUrl} target="_blank" rel="noopener noreferrer" className="underline">Voir le document</a></p>
          )}
        </div>

        <div className="mt-6">
          <button onClick={handleSave} disabled={loading} className="rounded bg-[#665d4d] px-4 py-2 text-white">{loading ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  )
}
