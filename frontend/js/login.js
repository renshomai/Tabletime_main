const API_BASE = 'http://localhost:4000/api';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    console.log("🔹 Sending login request...");
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("🔹 Response:", res.status, data);

    if (res.ok) {
      alert(`Welcome back, ${data.user.name}!`);
      localStorage.setItem('tt_user', JSON.stringify(data.user));

      console.log("✅ Redirecting to index.html...");
      window.location.href = 'index.html';
    } else {
      alert(data.error || 'Login failed.');
    }
  } catch (err) {
    console.error("❌ Network or backend error:", err);
    alert('Error connecting to the backend.');
  }
});
