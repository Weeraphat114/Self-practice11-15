// ---------------------------
// CONFIG
// ---------------------------
const BACKEND_URL = "https://bscit.sit.kmutt.ac.th/intproj25/ssa1/itb-ecors";
const KEYCLOAK_AUTH_URL = "https://bscit.sit.kmutt.ac.th/intproj25/ft/keycloak";
const REALM = "itb-ecors";
const CLIENT_ID = "itb-ecors-ssa1";
const BASE_PATH = window.location.pathname.replace(/[^/]*$/, "");

// ---------------------------
// DECODE JWT (safer)
// ---------------------------
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

// ---------------------------
// EXCHANGE CODE → TOKEN
// ---------------------------
async function exchangeCodeForToken() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return;

  const tokenURL = `${KEYCLOAK_AUTH_URL}/realms/${REALM}/protocol/openid-connect/token`;
  const res = await fetch(tokenURL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code: code,
      redirect_uri: window.location.origin + BASE_PATH + "reserve.html"
    })
  });

  if (!res.ok) {
    console.error("Token exchange failed", await res.text());
    return;
  }

  const data = await res.json();
  localStorage.setItem("kc_token", data.access_token);
  localStorage.setItem("kc_refresh", data.refresh_token);
  window.history.replaceState({}, "", "reserve.html");
}

// ---------------------------
// PROTECT PAGE
// ---------------------------
function protectPage() {
  const token = localStorage.getItem("kc_token");

  // Not logged in → go to Keycloak login
  if (!token) {
    const loginURL =
      `${KEYCLOAK_AUTH_URL}/realms/${REALM}/protocol/openid-connect/auth` +
      `?client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${window.location.origin + BASE_PATH + "reserve.html"}` +
      `&response_type=code` +
      `&prompt=login`;
    window.location.href = loginURL;
    return;
  }

  // Logged in → do nothing
}

// ---------------------------
// DISPLAY USER INFO
// ---------------------------
function displayUserInfo() {
  const decoded = decodeToken(localStorage.getItem("kc_token"));
  if (decoded?.name) {
    // Prepend a friendly welcome message before the full name
    document.getElementById("ecors-fullname").textContent = `Welcome, ${decoded.name}`;
  }
}

// ---------------------------
// LOGOUT
// ---------------------------
function setupLocalLogout() {
  document.getElementById("ecors-button-signout").addEventListener("click", () => {
    // Clear locally stored tokens
    localStorage.removeItem("kc_token");
    localStorage.removeItem("kc_refresh");

    // Force navigate to homepage (no Keycloak redirect)
    window.location.href = "https://bscit.sit.kmutt.ac.th/intproj25/ssa1/itb-ecors/";
  });
}

// ---------------------------
// TIMEZONE HELPERS
// ---------------------------
function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function convertUTCToLocalFormatted(utcIsoString) {
  return new Date(utcIsoString).toLocaleString("en-GB", {
    hour12: false,
    timeZone: getBrowserTimezone()
  }); // → 13/11/2025, 20:56:44
}

// ---------------------------
// LOAD STUDY PLANS
// ---------------------------
async function loadStudyPlans() {
  const res = await fetch(`${BACKEND_URL}/api/v1/study-plans`);
  if (!res.ok) throw new Error("Failed to load");

  const plans = await res.json();
  const dropdown = document.querySelector(".ecors-dropdown-plan");

  try {
    plans.forEach(plan => {
      const opt = document.createElement("option");
      opt.value = plan.id;
      opt.classList.add('ecors-plan-row');
      opt.classList.add('ecors-plan-code');
      opt.classList.add('ecors-plan-name');
      opt.dataset.planCode = plan.planCode;
      opt.dataset.nameEng = plan.nameEng;
      opt.textContent = `${plan.planCode} - ${plan.nameEng}`;
      dropdown.appendChild(opt);
    });
    return plans
  } catch (err) {
    console.error(err);
    document.querySelector(".ecors-dropdown-plan").innerHTML = `<option>Error loading plans</option>`;
  }
}

// ---------------------------
// JOIN declared_plan + study_plans
// ---------------------------
function mergeDeclaredWithStudyPlan(declared, studyPlans) {
  if (!declared || !studyPlans) return declared;
  const matched = studyPlans.find(p => p.id === declared.planId);
  if (!matched) return declared;
  return {
    ...declared,
    planCode: matched.planCode,
    nameEng: matched.nameEng
  };
}

// ---------------------------
// GET DECLARED PLAN
// ---------------------------
async function loadDeclaredPlan(studyPlans) {
  const token = localStorage.getItem("kc_token");
  const decoded = decodeToken(token);
  const studentId = decoded?.preferred_username;

  const statusLabel = document.getElementById("ecors-declared-plan");
  const dropdown = document.querySelector(".ecors-dropdown-plan");
  const declareBtn = document.querySelector(".ecors-button-declare");
  const changeBtn = document.querySelector(".ecors-button-change")
  const cancelBtn = document.getElementById("ecors-button-cancel");

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/students/${studentId}/declared-plan`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.status === 404) {
      // not declared → allow input
      statusLabel.textContent = "Not Declared";
      dropdown.disabled = false;
      declareBtn.style.display = "inline-block";
      declareBtn.disabled = true;
      cancelBtn.style.display = "none";
      changeBtn.hidden = true;
      dropdown.value = "";
      return null;
    }

    if (!res.ok) throw new Error(await res.text());

    let declared = await res.json();

    // JOIN WITH STUDY PLANS
    declared = mergeDeclaredWithStudyPlan(declared, studyPlans);

    // Format date/time
    const local = convertUTCToLocalFormatted(declared.updatedAt || declared.createdAt);
    const tz = getBrowserTimezone();

    statusLabel.textContent = `Declared ${declared.planCode} - ${declared.nameEng} on ${local} (${tz})`;

    // Disable UI after declaration
    dropdown.value = declared.planId;
    dropdown.disabled = false;
    declareBtn.style.display = "none";

    //show change button
    changeBtn.hidden = false;
    // FIX HERE — disable Change button initially
    changeBtn.disabled = true;

    // Enable/disable Change button when user changes dropdown
    dropdown.onchange = () => {
      if (dropdown.value && dropdown.value !== String(declared.planId)) {
        changeBtn.disabled = false;
      } else {
        changeBtn.disabled = true;
      }
    };

    //show delete button
    cancelBtn.style.display = "inline-block";

    declareBtn.onclick = null;

    changeBtn.onclick = async () => {
      // FIX HERE — block changing if invalid selection
      if (!(dropdown.value && dropdown.value !== String(declared.planId))) return;

      const originalPlanId = declared.planId;

      // If clicking "Change" with the same plan → do nothing
      if (!dropdown.value || dropdown.value == originalPlanId) {
        return;
      }

      // Send PUT immediately
      await declarePlan(studyPlans, true);
    };

    cancelBtn.onclick = () => cancelDeclaredPlan(studyPlans, declared);

    return declared;

  } catch (err) {
    console.error("Declared plan load error:", err);
    statusLabel.textContent = "Error loading status";
  }
}

// ---------------------------
// ShowDialog already declared with button "Ok"
// ---------------------------
const errorModal = document.getElementById("errorModal");
const errorOkBtn = document.getElementById("errorOkBtn");

errorOkBtn.addEventListener("click", () => {
  errorModal.close();
});

document.addEventListener("keydown", (e) => {
  if ((e.key === "Escape" || e.key === "Esc") && errorModal.open) {
    errorModal.close();
  }
});

// ---------------------------
// POST METHOD
// ---------------------------
async function postDeclaredPlan(studentId, token, payload) {
  return fetch(
    `${BACKEND_URL}/api/v1/students/${studentId}/declared-plan`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );
}

// ---------------------------
// PUT METHOD
// ---------------------------
async function putDeclaredPlan(studentId, token, payload) {
  return await fetch(
    `${BACKEND_URL}/api/v1/students/${studentId}/declared-plan`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );
}

// ---------------------------
// DECLARE PLAN (POST/PUT)
// ---------------------------
async function declarePlan(studyPlans, isUpdate = false) {
  const token = localStorage.getItem("kc_token");
  const decoded = decodeToken(token);
  const studentId = decoded?.preferred_username;
  const dropdown = document.querySelector(".ecors-dropdown-plan");
  const planId = dropdown.value;

  if (!planId) {
    alert("Please select a plan");
    return;
  }

  const payload = {
    planId: Number(planId),
  };

  let requestFn = isUpdate ? putDeclaredPlan : postDeclaredPlan;

  try {
    const res = await requestFn(studentId, token, payload);

    // -------------------------------
    // UPDATE (PUT)
    // -------------------------------
    if (isUpdate) {
      if (res.status === 200) {
        const updated = await res.json();
        const merged = mergeDeclaredWithStudyPlan(updated, studyPlans);
        const local = convertUTCToLocalFormatted(updated.updatedAt);
        const tz = getBrowserTimezone();

        document.getElementById("ecors-declared-plan").textContent =
          `Declared ${merged.planCode} - ${merged.nameEng} on ${local} (${tz})`;

        errorModal.querySelector(".ecors-dialog-message").textContent = "Declaration updated.";
        errorModal.showModal();

        await loadDeclaredPlan(studyPlans); // refresh UI
        return;
      }

      if (res.status === 404) {
        errorModal.querySelector(".ecors-dialog-message").textContent =
          `No declared plan found for student with id=${studentId}.`;
        errorModal.showModal();
        return await loadDeclaredPlan(studyPlans);
      }
    }
    // -------------------------------
    // CREATE (POST)
    // -------------------------------
    else {
      if (res.status === 201) {
        await loadDeclaredPlan(studyPlans);
        return;
      }

      if (res.status === 409) {
        errorModal.querySelector(".ecors-dialog-message").textContent =
          "You may have declared study plan already. Please check again.";
        errorModal.showModal();
        await loadDeclaredPlan(studyPlans); // refresh UI
        return;
      }
    }

    // ----------- SERVER ERROR -----------
    if ([500, 502, 503].includes(res.status)) {
      errorModal.querySelector(".ecors-dialog-message").textContent =
        "There is a problem. Please try again later.";
      errorModal.showModal();
      return;
    }

    alert("Error declaring plan.");

  } catch (err) {
    console.error("Declare Error:", err);
    errorModal.querySelector(".ecors-dialog-message").textContent =
      "There is a problem. Please try again later.";
    errorModal.showModal();
  }
}


// ---------------------------
// INIT
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Handle login redirect (exchange auth code for token)
  await exchangeCodeForToken();

  // 2. Protect page (redirect if no token)
  protectPage();

  // 3. Show username
  displayUserInfo();

  // 4. Logout button
  setupLocalLogout();

  // HIDE cancel button BY DEFAULT
  document.getElementById("ecors-button-cancel").style.display = "none";

  // Load plans (returns an array)
  let STUDY_PLANS = await loadStudyPlans(); // load once

  // Load declared status
  const declaredInfo = await loadDeclaredPlan(STUDY_PLANS);

  // Cancel button only if declared
  if (declaredInfo) {
    document.getElementById("ecors-button-cancel").onclick = () =>
      cancelDeclaredPlan(STUDY_PLANS, declaredInfo);
  }

  // Enable/disable declare button
  const dropdown = document.querySelector(".ecors-dropdown-plan");
  const declareBtn = document.querySelector(".ecors-button-declare");

  dropdown.addEventListener("change", () => {
    declareBtn.disabled = dropdown.value === "";
  });

  declareBtn.addEventListener("click", () => declarePlan(STUDY_PLANS));
});
