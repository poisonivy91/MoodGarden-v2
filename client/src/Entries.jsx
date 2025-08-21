import { useEffect, useState } from 'react';
import { createEntry, getEntries, deleteEntry, updateEntry } from './api'; // Add delete/update as needed

export default function Entries() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', mood: '' });
    const [editingId, setEditingId] = useState(null); // Track if editing

    useEffect(() => {
        loadEntries(); // initial load

        // Poll more often for processing entries
        const interval = setInterval(() => {
            // If any entry is still processing, reload more aggressively
            if (entries.some(e => e.status === "processing")) {
                loadEntries();
            }
        }, 2000); // every 2s instead of 5

        return () => clearInterval(interval);
    }, [entries]);

    async function loadEntries() {
        const data = await getEntries();
        setEntries(data);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        if (editingId) {
            await updateEntry(editingId, form.title, form.content, form.mood);
        } else {
            await createEntry(form.title, form.content, form.mood);
        }
        await loadEntries();
        setForm({ title: '', content: '', mood: '' });
        setEditingId(null);
        setLoading(false);
    }

    function handleEdit(entry) {
        setForm({ title: entry.title, content: entry.content, mood: entry.mood });
        setEditingId(entry.id);
    }

    async function handleDelete(id) {
        console.log('Deleting ID:', id);
        if (confirm('Are you sure you want to delete this entry?')) {
            await deleteEntry(id);
            await loadEntries();
        }
    }

    return (
        <div className="app-wrapper">
            <div className="app">
                <header>
                    <h1>🌸 Mood Garden 🌸</h1>
                </header>
                <form className="entry-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Title"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        required
                    />
                    <textarea
                        placeholder="Content"
                        value={form.content}
                        onChange={e => setForm({ ...form, content: e.target.value })}
                        required
                    />
                    <select
                        name="mood"
                        id="mood"
                        value={form.mood}
                        onChange={e => setForm({ ...form, mood: e.target.value })}
                        required
                    >
                        <option value="">Select Mood</option>
                        <option value="Happy">😊 Happy</option>
                        <option value="Sad">😢 Sad</option>
                        <option value="Anxious">😰 Anxious</option>
                        <option value="Excited">😄 Excited</option>
                        <option value="Tired">😴 Tired</option>
                        <option value="Angry">😡 Angry</option>
                        <option value="Calm">😌 Calm</option>
                        <option value="Relaxed">🧘 Relaxed</option>
                        <option value="Grateful">🙏 Grateful</option>
                        <option value="Lonely">🥺 Lonely</option>
                        <option value="Hopeful">🌈 Hopeful</option>
                        <option value="Stressed">😫 Stressed</option>
                        <option value="Confident">😎 Confident</option>
                        <option value="Bored">😐 Bored</option>
                        <option value="Surprised">😮 Surprised</option>
                        <option value="Content">🙂 Content</option>
                        <option value="Motivated">💪 Motivated</option>
                        <option value="Scared">😱 Scared</option>
                        <option value="Peaceful">🕊️ Peaceful</option>
                        <option value="Curious">🤔 Curious</option>
                        <option value="Frustrated">😤 Frustrated</option>
                        <option value="Inspired">🌟 Inspired</option>
                        <option value="Nostalgic">📸 Nostalgic</option>
                        <option value="Playful">😜 Playful</option>
                        <option value="Affectionate">🥰 Affectionate</option>
                        <option value="Jealous">😒 Jealous</option>
                        <option value="Embarrassed">😳 Embarrassed</option>
                        <option value="Determined">🔥 Determined</option>
                        <option value="Relieved">😌 Relieved</option>
                        <option value="Sympathetic">🤗 Sympathetic</option>
                        <option value="Amused">😂 Amused</option>
                        <option value="Overwhelmed">😵 Overwhelmed</option>
                        <option value="Resentful">😠 Resentful</option>
                        <option value="Optimistic">🌞 Optimistic</option>
                        <option value="Proud">🏆 Proud</option>
                        <option value="Vulnerable">💧 Vulnerable</option>
                        <option value="Courageous">🦁 Courageous</option>
                        <option value="Sentimental">💖 Sentimental</option>
                        <option value="Worried">😟 Worried</option>
                        <option value="Ecstatic">🤩 Ecstatic</option>
                        <option value="Melancholic">🌧️ Melancholic</option>
                        <option value="Indifferent">😶 Indifferent</option>
                        <option value="Guilty">😔 Guilty</option>
                        <option value="Enthusiastic">😃 Enthusiastic</option>
                    </select>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Submitting...' : editingId ? 'Update Entry' : 'Create Entry'}
                    </button>
                </form>
                <div className="mood-grid">
                    {entries.map((entry) => (
                        <div key={entry.id} className="entry-card">
                            <h3>{entry.title}</h3>
                            <p>{entry.content}</p>
                            <span className="mood-badge">Mood: {entry.mood}</span>
                            {entry.status === "processing" && <p>🌱 Growing flower...</p>}
                            {entry.status === "completed" && entry.flowerImageUrl && (
                                <img className="flower-image" src={entry.flowerImageUrl} alt="Mood flower" />
                            )}
                            {entry.status === "failed" && <p>❌ Failed to grow flower</p>}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                <button onClick={() => handleEdit(entry)}>Edit</button>
                                <button onClick={() => handleDelete(entry.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}