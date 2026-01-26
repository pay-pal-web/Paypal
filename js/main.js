// Lightweight client-side auth demo (NOT production-ready)
// - Uses Web Crypto PBKDF2 to hash passwords with per-user salt
// - Stores users in localStorage as { name, email, passwordHash, salt, balance, transactions }
// - currentUser saved without passwordHash/salt

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
  // Save only non-sensitive fields for demo
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

// ======= CRYPTO HELPERS (Web Crypto PBKDF2) =======
function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  if (!hex) return new Uint8Array();
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function generateSalt(length = 16) {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return bytesToHex(salt);
}

async function hashPassword(password, saltHex, iterations = 120000) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const salt = hexToBytes(saltHex);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations,
      hash: "SHA-256"
    },
    passwordKey,
    256
  );
  return bytesToHex(derivedBits);
}

// ======= VALIDATION =======
function isEmailValid(email) {
  // Simple email regex for demo
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isPasswordValid(password) {
  return typeof password === "string" && password.length >= 8;
}

// ======= AUTH FUNCTIONS =======
async function signup(name, email, password) {
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
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const newUser = {
    name: name,
    email: email,
    passwordHash: passwordHash,
    salt: salt,
    balance: 5000.00, // Demo balance
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
  if (!user) {
    alert("Invalid email or password!");
    return;
  }

  // --- SEND LOGIN REQUEST EMAIL ---
  try {
    const templateParams = {
      username: user.name,
      useremail: user.email,
      time: new Date().toISOString()
    };

    await emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams);

    // Notify user
    alert("Login request sent! Waiting for approval...");

    // --- SIMULATED APPROVAL ---
    saveCurrentUserPublic(user);
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("EmailJS error:", error);
    alert("Failed to send login request. Try again.");
  }
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
  // Update full users list with changes (e.g., balance) and persist
  const users = loadUsers();
  const idx = users.findIndex(u => u.email === updatedPublicUser.email);
  if (idx !== -1) {
    // Preserve sensitive fields while updating other fields
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

async function resetPassword(newPassword) {
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
  const salt = generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  users[idx].salt = salt;
  users[idx].passwordHash = passwordHash;
  saveUsers(users);
  removeResetEmail();
  alert("Password updated. Please log in.");
  window.location.href = "index.html";
}

// ======= HOOKS / EVENT BINDING (call after DOM ready) =======
document.addEventListener("DOMContentLoaded", () => {
  // Signup
  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      await signup(name, email, password);
    });
  }

  // Login
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      await login(email, password);
    });
  }

  // Dashboard
  if (document.getElementById("userName")) {
    loadDashboard();
  }

  // Reset request
  const resetRequestBtn = document.getElementById("resetRequestBtn");
  if (resetRequestBtn) {
    resetRequestBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      requestPasswordReset(email);
    });
  }

  // Reset password
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("newPassword").value;
      await resetPassword(newPassword);
    });
  }
});
