// ======= USER & WALLET STORAGE =======
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// ======= SIGNUP FUNCTION =======
function signup(name, email, password) {
  if (users.find(u => u.email === email)) {
    alert("User already exists!");
    return;
  }
  const newUser = {
    name: name,
    email: email,
    password: password,
    balance: 5000.00, // Demo balance
    transactions: []
  };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  alert("Account created successfully!");
  window.location.href = "index.html"; // Go to login
}

// ======= LOGIN FUNCTION =======
function login(email, password) {
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    alert("Invalid email or password!");
    return;
  }
  currentUser = user;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  window.location.href = "dashboard.html"; // Go to dashboard
}

// ======= LOAD DASHBOARD =======
function loadDashboard() {
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }
  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("balance").textContent = currentUser.balance.toFixed(2);
}

// ======= SAVE CURRENT USER =======
function saveCurrentUser() {
  const idx = users.findIndex(u => u.email === currentUser.email);
  if (idx !== -1) {
    users[idx] = currentUser;
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }
}

// ======= HOOK SIGNUP PAGE =======
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signup(name, email, password);
  });
}

// ======= HOOK LOGIN PAGE =======
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}

// ======= HOOK DASHBOARD PAGE =======
if (document.getElementById("userName")) {
  loadDashboard();
}

// ===== FORGOT PASSWORD =====
const resetRequestBtn = document.getElementById("resetRequestBtn");
if (resetRequestBtn) {
  resetRequestBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const user = users.find(u => u.email === email);
    if (!user) {
      alert("Email not found");
      return;
    }
    localStorage.setItem("resetEmail", email);
    window.location.href = "reset-password.html";
  });
}

// ===== RESET PASSWORD =====
const resetBtn = document.getElementById("resetBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    const newPassword = document.getElementById("newPassword").value;
    const email = localStorage.getItem("resetEmail");
    const user = users.find(u => u.email === email);
    if (!user) return;

    user.password = newPassword; // demo only
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.removeItem("resetEmail");

    alert("Password updated. Please log in.");
    window.location.href = "index.html";
  });
}
