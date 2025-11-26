// ---------------------------
// CONFIG
// ---------------------------
const BACKEND_URL = "https://bscit.sit.kmutt.ac.th/intproj25/ssa1/itb-ecors";

const KEYCLOAK_AUTH_URL = "https://bscit.sit.kmutt.ac.th/intproj25/ft/keycloak";
const REALM = "itb-ecors";
const CLIENT_ID = "itb-ecors-ssa1";

const BASE_PATH = window.location.pathname.replace(/[^/]*$/, "");
const REDIRECT_URI = window.location.origin + BASE_PATH + "reserve.html";

// ---------------------------
// CHECK LOGIN STATE
// ---------------------------
function isLoggedIn() {
  return localStorage.getItem("kc_token") !== null;
}

// ---------------------------
// AUTO REDIRECT IF LOGGED IN
// ---------------------------
function autoRedirectIfLoggedIn() {
  if (isLoggedIn()) {
    window.location.href = "reserve.html";
  }
}

// ---------------------------
// REDIRECT TO KEYCLOAK LOGIN
// ---------------------------
function goToKeycloakLogin() {
  if (isLoggedIn()) {
    // Already logged in → jump to reserve.html
    window.location.href = "reserve.html";
    return;
  }

  const loginURL = `${KEYCLOAK_AUTH_URL}/realms/${REALM}/protocol/openid-connect/auth` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&response_type=code`;

  window.location.href = loginURL;
}

// ---------------------------
// FORCE KEYCLOAK LOGIN (allows switching users)
// ---------------------------
function forceKeycloakLogin() {
  // Always redirect to Keycloak login, even if already logged in.
  // This allows users to log in as a different user.
  // The login_hint=logout param forces Keycloak to show the login screen.
  const loginURL = `${KEYCLOAK_AUTH_URL}/realms/${REALM}/protocol/openid-connect/auth` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&response_type=code` +
    `&prompt=login`;

  window.location.href = loginURL;
}

// ---------------------------
// LOAD STUDY PLANS
// ---------------------------
async function loadStudyPlans() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/study-plans`);
    if (!res.ok) throw new Error("Request failed");
    const plans = await res.json();

    const tableBody = document.getElementById("plansTable");
    tableBody.innerHTML = "";

    plans.forEach(plan => {
      const trEle = document.createElement('tr');
      trEle.className = 'ecors-row';

      const tdIDEle = document.createElement('td');
      tdIDEle.className = 'ecors-id';
      tdIDEle.textContent = plan.id;
      trEle.appendChild(tdIDEle);

      const tdStudyCodeEle = document.createElement('td');
      tdStudyCodeEle.className = 'ecors-planCode';
      tdStudyCodeEle.textContent = plan.planCode;
      trEle.appendChild(tdStudyCodeEle);

      const tdEngNameEle = document.createElement('td');
      tdEngNameEle.className = 'ecors-nameEng';
      tdEngNameEle.textContent = plan.nameEng;
      trEle.appendChild(tdEngNameEle);

      const tdThaiNameEle = document.createElement('td');
      tdThaiNameEle.className = 'ecors-nameTh';
      tdThaiNameEle.textContent = plan.nameTh;
      trEle.appendChild(tdThaiNameEle);

      tableBody.appendChild(trEle);
    });
  } catch (err) {
    console.error(err);
    document.getElementById("errorModal").showModal();
  }
}

// ---------------------------
// INIT
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadStudyPlans();
  autoRedirectIfLoggedIn();

 document.querySelector(".ecors-button-manage")
  .addEventListener("click", () => {
    window.location.href = "reserve.html";
  });

});