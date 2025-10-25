// frontend/js/register.js
const API_BASE = 'http://localhost:4000/api';

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!name || !email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('tt_token', data.token);
      localStorage.setItem('tt_user', JSON.stringify(data.user));
      alert('Registration successful!');
      window.location.href = 'login-page.html';
    } else {
      alert(data.error || 'Registration failed.');
    }
  } catch (err) {
    alert('Error: Could not connect to server.');
    console.error(err);
  }
}

document.getElementById('registerForm').addEventListener('submit', handleRegister);
