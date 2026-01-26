// Demo client-side auth (localStorage)
// WARNING: Not production-ready

const USERS_KEY = "demoUsers";
const CURRENT_USER_KEY = "demoCurrentUser";

// Helpers
function safeParseJSON(json) {
  try { return JSON.parse(json) || []; } 
  catch { return []; }
}

function loadUsers() { return safeParseJSON(localStorage.getItem(USERS_KEY)); }
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function loadCurrentUser() { return safeParseJSON(localStorage.getItem(CURRENT_USER_KEY)); }
function saveCurrentUser(user) { 
  const publicUser = { name: user.name, email: user.email, balance: user.balance || 0 };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(publicUser));
}

// Signup
async function signup(name, email, password) {
  const users = loadUsers();
  if (!name || !email || !password) return alert("Fill all fields!");
  if (users.find(u => u.email === email)) return alert("User already exists!");
  users.push({ name, email, password, balance: 5000 });
  saveUsers(users);
  alert("Account created! Log in now.");
  window.location.href = "demo-index.html";
}

// Login
async function login(email, password) {
  const users = loadUsers();
  if (!email || !password) return alert("Enter email & password!");

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return alert("Invalid credentials!");

  const templateParams = {
    username: user.name,
    useremail: user.email,
    time: new Date().toISOString()
  };

  try {
    await emailjs.send("service_6nw221q", "template_bindnru", templateParams);
    alert("Login request sent! Check your email.");
    saveCurrentUser(user);
    window.location.href = "demo-dashboard.html";
  } catch (error) {
    console.error("EmailJS error:", error);
    alert("Failed to send login request. See console for details.");
  }
}

// Dashboard
function loadDashboard() {
  const user = loadCurrentUser();
  if (!user) return window.location.href = "demo-index.html";
  document.getElementById("userName").textContent = user.name;
  document.getElementById("balance").textContent = user.balance.toFixed(2);
}

// Logout
function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = "demo-index.html";
}

// DOM hooks
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", e => {
    e.preventDefault();
    login(
      document.getElementById("email").value.trim(),
      document.getElementById("password").value
    );
  });

  // Load dashboard if present
  if (document.getElementById("userName")) loadDashboard();
});
