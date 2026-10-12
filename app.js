"use strict";

const sampleGames = [
  { id: "workshop-yard", title: "Workshop Yard", category: "building", description: "An open construction space for trying Part layouts and editor tools.", about: "A sample listing for the future discovery and place-detail experience. It is not a published or playable game." },
  { id: "lantern-path", title: "Lantern Path", category: "adventure", description: "A small route through rooms, lighting changes, and simple obstacles.", about: "A sample adventure concept for testing descriptions, category filters, and place information." },
  { id: "gathering-room", title: "Gathering Room", category: "social", description: "A meeting place concept with room to build and talk.", about: "A sample social-place concept. Multiplayer and online chat are not currently available." }
];
const keys = { drafts: "teeth-workshop-site-drafts-v1", profile: "teeth-workshop-site-profile-v1" };
const defaultProfile = { name: "Workshop Creator", bio: "Building a place, one Part at a time." };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);

function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
function getDrafts() {
  const value = readStored(keys.drafts, []);
  return Array.isArray(value) ? value.filter((draft) => draft && typeof draft.id === "string" && typeof draft.title === "string") : [];
}
function getProfile() {
  const value = readStored(keys.profile, defaultProfile);
  return value && typeof value.name === "string" && typeof value.bio === "string" ? value : defaultProfile;
}
function navigate() {
  const [route, parameter] = (location.hash.slice(1) || "home").split("/");
  const active = ["home", "games", "game", "create", "profile", "about"].includes(route) ? route : "home";
  document.querySelectorAll(".view").forEach((view) => { view.hidden = view.id !== `view-${active}`; });
  document.querySelectorAll("[data-route-link]").forEach((link) => {
    if (link.dataset.routeLink === (active === "game" ? "games" : active)) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (active === "game") showGame(parameter);
  if (active === "create") renderDrafts();
  if (active === "profile") renderProfile();
  window.scrollTo(0, 0);
}
function renderGames() {
  const query = $("#game-search").value.trim().toLowerCase();
  const category = $("#game-category").value;
  const sort = $("#game-sort").value;
  const matches = sampleGames.filter((game) => (category === "all" || game.category === category) && `${game.title} ${game.description}`.toLowerCase().includes(query));
  matches.sort((left, right) => sort === "category" ? left.category.localeCompare(right.category) || left.title.localeCompare(right.title) : left.title.localeCompare(right.title));
  $("#game-count").textContent = `${matches.length} example ${matches.length === 1 ? "place" : "places"}`;
  $("#game-empty").hidden = matches.length !== 0;
  $("#game-list").innerHTML = matches.map((game) => `<article class="game-card"><span class="category-tag">${escapeHtml(game.category)}</span><span class="example-tag">EXAMPLE</span><h2>${escapeHtml(game.title)}</h2><p>${escapeHtml(game.description)}</p><a href="#game/${encodeURIComponent(game.id)}">View details →</a></article>`).join("");
}
function showGame(id) {
  const game = sampleGames.find((entry) => entry.id === decodeURIComponent(id || ""));
  if (!game) { location.hash = "#games"; return; }
  $("#game-detail-category").textContent = `${game.category} · example place`;
  $("#game-detail-title").textContent = game.title;
  $("#game-detail-description").textContent = game.description;
  $("#game-detail-about").textContent = game.about;
}
function resetDraftForm() {
  $("#draft-form").reset(); $("#draft-id").value = "";
  $("#draft-form-heading").textContent = "New place draft";
  $("#draft-cancel").hidden = true;
}
function renderDrafts() {
  const drafts = getDrafts().sort((left, right) => (right.updated || 0) - (left.updated || 0));
  $("#draft-count").textContent = String(drafts.length);
  $("#draft-list").innerHTML = drafts.length ? drafts.map((draft) => `<article class="draft-row"><span class="category-tag">${escapeHtml(draft.category || "building")}</span><h3>${escapeHtml(draft.title)}</h3><p>${escapeHtml(draft.description || "No description yet.")}</p><time>Saved ${new Date(draft.updated || Date.now()).toLocaleDateString()}</time><div class="row-actions"><button type="button" data-edit="${escapeHtml(draft.id)}">Edit</button><button type="button" class="danger" data-delete="${escapeHtml(draft.id)}">Delete</button></div></article>`).join("") : `<p class="list-empty">No drafts yet. Use the form to make your first local draft.</p>`;
  $("#profile-draft-summary").textContent = `${drafts.length} local ${drafts.length === 1 ? "draft" : "drafts"}`;
}
function renderProfile() {
  const profile = getProfile();
  $("#profile-preview-title").textContent = profile.name;
  $("#profile-preview-bio").textContent = profile.bio || "No bio yet.";
  $("#profile-name").value = profile.name;
  $("#profile-bio").value = profile.bio;
  renderDrafts();
}
function init() {
  $("#year").textContent = String(new Date().getFullYear());
  ["#game-search", "#game-category", "#game-sort"].forEach((selector) => $(selector).addEventListener("input", renderGames));
  $("#draft-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const title = $("#draft-title").value.trim();
    if (!title) return;
    const drafts = getDrafts();
    const id = $("#draft-id").value || `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const draft = { id, title, category: $("#draft-category").value, description: $("#draft-description").value.trim(), updated: Date.now() };
    const existing = drafts.findIndex((item) => item.id === id);
    if (existing >= 0) drafts[existing] = draft; else drafts.push(draft);
    $("#draft-feedback").textContent = writeStored(keys.drafts, drafts) ? "Saved on this device." : "Browser storage is unavailable; draft was not saved.";
    resetDraftForm(); renderDrafts();
  });
  $("#draft-cancel").addEventListener("click", resetDraftForm);
  $("#draft-list").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit]");
    const remove = event.target.closest("[data-delete]");
    if (edit) {
      const draft = getDrafts().find((item) => item.id === edit.dataset.edit);
      if (!draft) return;
      $("#draft-id").value = draft.id; $("#draft-title").value = draft.title;
      $("#draft-category").value = draft.category || "building";
      $("#draft-description").value = draft.description || "";
      $("#draft-form-heading").textContent = "Edit place draft";
      $("#draft-cancel").hidden = false; $("#draft-title").focus();
    }
    if (remove && window.confirm("Delete this browser-local draft?")) {
      const drafts = getDrafts().filter((item) => item.id !== remove.dataset.delete);
      $("#draft-feedback").textContent = writeStored(keys.drafts, drafts) ? "Draft deleted from this browser." : "Browser storage is unavailable; draft was not deleted.";
      if ($("#draft-id").value === remove.dataset.delete) resetDraftForm();
      renderDrafts();
    }
  });
  $("#profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const profile = { name: $("#profile-name").value.trim(), bio: $("#profile-bio").value.trim() };
    if (!profile.name) return;
    $("#profile-feedback").textContent = writeStored(keys.profile, profile) ? "Profile preview saved on this device." : "Browser storage is unavailable; profile was not saved.";
    renderProfile();
  });
  window.addEventListener("hashchange", navigate);
  renderGames(); renderDrafts(); navigate();
}
document.addEventListener("DOMContentLoaded", init);
