// Base API endpoint
const API = "/api/exercises";

// Fetch exercises from the API with optional filters
async function fetchExercises(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API}?${params}`);
  const data = await res.json();
  renderExercises(data);
}

// Build and render exercise cards from API data
function renderExercises(exercises) {
  const list = document.getElementById("exercise-list");
  list.innerHTML = "";

  if (exercises.length === 0) {
    list.innerHTML = "<p>No exercises found.</p>";
    return;
  }

  exercises.forEach((ex) => {
    const card = document.createElement("div");
    card.classList.add("exercise-card");
    card.dataset.id = ex._id;
    card.innerHTML = `
      <h2>${ex.Title}</h2>
      <p><strong>Body Part:</strong> ${ex.BodyPart}</p>
      <p><strong>Equipment:</strong> ${ex.Equipment}</p>
      <p><strong>Type:</strong> ${ex.Type}</p>
      <p><strong>Level:</strong> ${ex.Level}</p>
      <p>${ex.Desc || ""}</p>
      <div class="card-actions">
        <button class="edit-btn" data-id="${ex._id}">Edit</button>
        <button class="delete-btn" data-id="${ex._id}">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });

  // Attach delete listeners
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", handleDelete);
  });

  // Attach edit listeners
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", handleEdit);
  });
}

// Filter
document.getElementById("filter-btn").addEventListener("click", () => {
  const search = document.getElementById("search").value;
  const bodyPart = document.getElementById("bodyPart").value;
  const level = document.getElementById("level").value;
  const equipment = document.getElementById("equipment").value;

  const filters = {};
  if (search) filters.search = search;
  if (bodyPart) filters.bodyPart = bodyPart;
  if (level) filters.level = level;
  if (equipment) filters.equipment = equipment;

  fetchExercises(filters);
});

// Show/hide add form
document.getElementById("add-btn").addEventListener("click", () => {
  document.getElementById("exercise-form").style.display = "block";
});

document.getElementById("cancel-btn").addEventListener("click", () => {
  document.getElementById("exercise-form").style.display = "none";
});

// Add exercise
document
  .getElementById("add-exercise-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const exercise = {
      Title: document.getElementById("new-title").value,
      BodyPart: document.getElementById("new-bodypart").value,
      Equipment: document.getElementById("new-equipment").value,
      Level: document.getElementById("new-level").value,
      Type: document.getElementById("new-type").value,
      Desc: document.getElementById("new-desc").value,
    };

    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exercise),
    });

    document.getElementById("exercise-form").style.display = "none";
    document.getElementById("add-exercise-form").reset();
    fetchExercises();
  });

// Delete exercise
async function handleDelete(e) {
  const id = e.target.dataset.id;
  if (!confirm("Delete this exercise?")) return;
  await fetch(`${API}/${id}`, { method: "DELETE" });
  fetchExercises();
}

// Edit exercise
function handleEdit(e) {
  const id = e.target.dataset.id;
  const card = e.target.closest(".exercise-card");

  // Grab current values from the card
  const title = card.querySelector("h2").textContent;
  const bodyPart = card
    .querySelectorAll("p")[0]
    .textContent.replace("Body Part: ", "");
  const equipment = card
    .querySelectorAll("p")[1]
    .textContent.replace("Equipment: ", "");
  const type = card.querySelectorAll("p")[2].textContent.replace("Type: ", "");
  const level = card
    .querySelectorAll("p")[3]
    .textContent.replace("Level: ", "");
  const desc = card.querySelectorAll("p")[4].textContent;

  // Replace card with edit form
  card.innerHTML = `
    <input type="text" class="edit-title" value="${title}" placeholder="Exercise name" />
    <input type="text" class="edit-bodypart" value="${bodyPart}" placeholder="Body part" />
    <input type="text" class="edit-equipment" value="${equipment}" placeholder="Equipment" />
    <input type="text" class="edit-type" value="${type}" placeholder="Type" />
    <input type="text" class="edit-level" value="${level}" placeholder="Level" />
    <textarea class="edit-desc" placeholder="Description">${desc}</textarea>
    <button class="save-btn" data-id="${id}">Save</button>
    <button class="cancel-edit-btn">Cancel</button>
  `;

  card.querySelector(".save-btn").addEventListener("click", async () => {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Title: card.querySelector(".edit-title").value,
        BodyPart: card.querySelector(".edit-bodypart").value,
        Equipment: card.querySelector(".edit-equipment").value,
        Type: card.querySelector(".edit-type").value,
        Level: card.querySelector(".edit-level").value,
        Desc: card.querySelector(".edit-desc").value,
      }),
    });
    fetchExercises();
  });

  card.querySelector(".cancel-edit-btn").addEventListener("click", () => {
    fetchExercises();
  });
}

// Random workout generator
document.getElementById("random-btn").addEventListener("click", async () => {
  const checked = [
    ...document.querySelectorAll("#random-bodypart-options input:checked"),
  ].map((cb) => cb.value);
  const level = document.getElementById("random-level").value;
  const count = document.getElementById("random-count").value;

  const params = new URLSearchParams({ level, count });
  checked.forEach((bp) => params.append("bodyPart", bp));

  const res = await fetch(`/api/exercises/random?${params}`);
  const exercises = await res.json();

  const results = document.getElementById("random-results");
  results.innerHTML = `<h3>Your Random Workout</h3>`;

  exercises.forEach((ex) => {
    const card = document.createElement("div");
    card.classList.add("exercise-card");
    card.innerHTML = `
      <h2>${ex.Title}</h2>
      <p><strong>Body Part:</strong> ${ex.BodyPart}</p>
      <p><strong>Equipment:</strong> ${ex.Equipment}</p>
      <p><strong>Level:</strong> ${ex.Level}</p>
      <p>${ex.Desc || ""}</p>
    `;
    results.appendChild(card);
  });
});

// Load on start
fetchExercises();
