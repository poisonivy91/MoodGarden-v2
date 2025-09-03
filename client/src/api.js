// Use a dev URL locally; default to same-origin in production
const API_BASE = import.meta.env.VITE_API_URL || "";

export async function createEntry(title, content, mood) {
    const res = await fetch(`${API_BASE}/entries`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, mood }),
    });

    return res.json();
}

// Get all entries
export async function getEntries() {
    const res = await fetch(`${API_BASE}/entries`);
    return res.json();
}

// Get flower status for a single entry
export async function getFlowerStatus(id) {
    const res = await fetch(`${API_BASE}/entries${id}/flower-status`);
    return res.json();
}

export async function deleteEntry(id) {
    const res = await fetch(`${API_BASE}/entries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete entry');
    return res.json();
}

export async function updateEntry(id, title, content, mood) {
    const res = await fetch(`${API_BASE}/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, mood })
    });
    if (!res.ok) throw new Error('Failed to update entry');
    return res.json();
}