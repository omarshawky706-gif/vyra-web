import React, { useState } from 'react'

function buildPrompt({ gender, occasion, budget, style }) {
  return `You are a professional fashion stylist specialized for Middle Eastern customers.
Given the inputs:
gender="${gender}", occasion="${occasion}", budget="${budget}", style="${style}".
Output EXACTLY a JSON array named "suggestions" with 3 objects. Each object must have:
- name (string)
- items (array of strings, top/bottom/shoes/accessories)
- price_estimate_egp (number)
- caption (string, max 18 words)
- supplier_keywords (array of 3 short keywords)

Example output:
{"suggestions":[{"name":"...","items":["..."],"price_estimate_egp":1200,"caption":"...","supplier_keywords":["..."]}, ...]}

Do NOT add any text outside the JSON. Keep prices realistic for Egyptian market.`
}

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [gender, setGender] = useState('female')
  const [occasion, setOccasion] = useState('casual')
  const [style, setStyle] = useState('modern')
  const [budget, setBudget] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [lang, setLang] = useState('en')

  const t = {
    en: {
      title: 'VYRA — AI Personal Stylist',
      pasteKey: 'Paste OpenAI API Key here (sk-...)',
      gender: 'Gender',
      occasion: 'Occasion',
      style: 'Style',
      budget: 'Budget',
      generate: 'Generate Outfit',
      warning: 'For testing only: pasting API key here is convenient but not secure for public use.',
      clear: 'Clear',
      results: 'Suggestions'
    },
    ar: {
      title: 'VYRA — الأستايلر الذكي',
      pasteKey: 'لصق مفتاح OpenAI هنا (sk-...)',
      gender: 'النوع',
      occasion: 'المناسبة',
      style: 'الستايل',
      budget: 'الميزانية',
      generate: 'توليد الإطلالة',
      warning: 'للتجربة فقط: لصق المفتاح هنا مريح لكنه غير آمن للاستخدام العام.',
      clear: 'مسح',
      results: 'الاقتراحات'
    }
  }[lang]

  async function handleGenerate(e) {
    e.preventDefault()
    if (!apiKey || apiKey.trim().length < 10) {
      alert('Please paste your OpenAI API key first.')
      return
    }
    setLoading(true)
    setSuggestions(null)
    try {
      const prompt = buildPrompt({ gender, occasion, budget, style })
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional Middle-Eastern fashion stylist.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 700
        })
      })
      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(`OpenAI error: ${resp.status} ${txt}`)
      }
      const data = await resp.json()
      const raw = data.choices?.[0]?.message?.content || ''
      // try parse JSON
      let parsed = null
      try {
        parsed = JSON.parse(raw)
      } catch (err) {
        const i = raw.indexOf('{')
        const j = raw.lastIndexOf('}')
        if (i >= 0 && j > i) {
          const sub = raw.slice(i, j + 1)
          parsed = JSON.parse(sub)
        }
      }
      if (!parsed || !parsed.suggestions) {
        throw new Error('Failed to parse suggestions from the AI response.')
      }
      setSuggestions(parsed.suggestions)
    } catch (err) {
      console.error(err)
      alert('Error: ' + (err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>VYRA</h1>
        <div className="lang">
          <button onClick={()=>setLang(lang==='en'?'ar':'en')}>{lang==='en'?'العربي':'EN'}</button>
        </div>
        <p className="subtitle">{t.title}</p>
      </header>

      <main>
        <div className="card">
          <label className="label">{t.pasteKey}</label>
          <input className="input" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder={t.pasteKey} />

          <div className="grid">
            <div>
              <label className="label">{t.gender}</label>
              <select value={gender} onChange={e=>setGender(e.target.value)} className="input">
                <option value="female">Female / أنثى</option>
                <option value="male">Male / ذكر</option>
                <option value="unisex">Unisex / للجميع</option>
              </select>
            </div>

            <div>
              <label className="label">{t.occasion}</label>
              <select value={occasion} onChange={e=>setOccasion(e.target.value)} className="input">
                <option value="casual">Casual / يومي</option>
                <option value="work">Work / مقابلة</option>
                <option value="wedding">Wedding / زفاف</option>
                <option value="party">Party / سهرة</option>
              </select>
            </div>

            <div>
              <label className="label">{t.style}</label>
              <select value={style} onChange={e=>setStyle(e.target.value)} className="input">
                <option value="modern">Modern</option>
                <option value="vintage">Vintage</option>
                <option value="street">Street</option>
                <option value="elegant">Elegant</option>
              </select>
            </div>

            <div>
              <label className="label">{t.budget}</label>
              <select value={budget} onChange={e=>setBudget(e.target.value)} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={handleGenerate} disabled={loading}>{loading? 'Generating...' : t.generate}</button>
            <button className="btn" onClick={()=>{ setApiKey(''); setSuggestions(null) }}>{t.clear}</button>
          </div>

          <p className="warn">{t.warning}</p>
        </div>

        <div className="results card">
          <h3>{t.results}</h3>
          {!suggestions && <p className="muted">No suggestions yet.</p>}
          {suggestions && suggestions.map((s, idx) => (
            <div key={idx} className="suggestion">
              <div className="s-header">
                <strong>{s.name}</strong>
                <span className="price">{s.price_estimate_egp} EGP</span>
              </div>
              <ul>
                {s.items.map((it,i)=> <li key={i}>• {it}</li>)}
              </ul>
              <p className="caption">{s.caption}</p>
              <div className="keywords">{s.supplier_keywords?.map((k,i)=> <span key={i} className="kw">{k}</span>)}</div>
            </div>
          ))}
        </div>
      </main>

      <footer>
        <small>VYRA • AI Stylist — Prototype</small>
      </footer>
    </div>
  )
}
