const workoutList = document.querySelector("#workout-list");
const showFormBtn = document.querySelector("#show-form-btn");
const planForm = document.querySelector("#workout");
const addPlanForm = document.querySelector("#add-workout-form");
const cancelFormBtn = document.querySelector("#cancel-form-btn");
const formTitle = document.querySelector("#form-title");
const formExerciseList = document.querySelector("#form-exercise-list");
const formSearchInput = document.querySelector("#form-exercise-search");
const formBodyPart = document.querySelector("#form-bodypart");
const formEquipment = document.querySelector("#form-equipment");
const formLevel = document.querySelector("#form-level");
const formSearchResults = document.querySelector("#form-search-results");

// State for the form
let editingId = null;
let formExercises = [];

function openForm(title, name = "", description = "", exercises = []) {
  formTitle.textContent = title;
  document.querySelector("#workout-name").value = name;
  document.querySelector("#workout-description").value = description;
  formExercises = [...exercises];
  renderFormExercises();
  formSearchInput.value = "";
  formSearchResults.innerHTML = "";
  planForm.style.display = "block";
  workoutList.style.display = "none";
}

function closeForm() {
  planForm.style.display = "none";
  workoutList.style.display = "block";
  addPlanForm.reset();
  editingId = null;
  formExercises = [];
  formExerciseList.innerHTML = "";
  formSearchResults.innerHTML = "";
}

function renderFormExercises() {
  formExerciseList.innerHTML = "";
  formExercises.forEach((ex, i) => {
    const li = document.createElement("li");
    li.textContent = ex.Title;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      formExercises.splice(i, 1);
      renderFormExercises();
    });
    li.appendChild(removeBtn);
    formExerciseList.appendChild(li);
  });
}

let searchTimer = null;

async function runSearch() {
  const params = new URLSearchParams({
    search: formSearchInput.value.trim(),
    bodyPart: formBodyPart.value,
    equipment: formEquipment.value,
    level: formLevel.value,
  });
  let exercises;
  try {
    const res = await fetch(`/api/exercises?${params}`);
    // Throw if the server returned a non-2xx status so the catch block handles it
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    exercises = await res.json();
  } catch (err) {
    console.error("Failed to search exercises:", err);
    return;
  }
  formSearchResults.innerHTML = "";
  exercises.forEach((ex) => {
    const div = document.createElement("div");
    div.className = "search-result-item";
    div.textContent = `${ex.Title} (${ex.BodyPart})`;
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "+ Add";
    addBtn.addEventListener("click", () => {
      if (!formExercises.find((e) => e._id === ex._id)) {
        formExercises.push(ex);
        renderFormExercises();
      }
    });
    div.appendChild(addBtn);
    formSearchResults.appendChild(div);
  });
}

function triggerSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 300);
}

formSearchInput.addEventListener("input", triggerSearch);
formBodyPart.addEventListener("change", triggerSearch);
formEquipment.addEventListener("change", triggerSearch);
formLevel.addEventListener("change", triggerSearch);

async function loadWorkouts() {
  let workouts;
  try {
    const res = await fetch("/api/workouts");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    workouts = await res.json();
  } catch (err) {
    console.error("Failed to load workouts:", err);
    return;
  }

  workoutList.innerHTML = "";

  workouts.forEach((plan) => {
    const card = document.createElement("article");
    card.innerHTML = `
      <h2>${plan.name}</h2>
      <p>${plan.description || ""}</p>
      <ul>
        ${
          plan.exercises?.length
            ? plan.exercises
                .map(
                  (ex) => `<li>${ex.Title} — ${ex.BodyPart} (${ex.Level})</li>`
                )
                .join("")
            : "<li>No exercises added yet.</li>"
        }
      </ul>
      <button type="button" class="edit-btn">Edit</button>
      <button type="button" class="delete-btn">Delete</button>
    `;

    card.querySelector(".edit-btn").addEventListener("click", () => {
      editingId = plan._id;
      openForm(
        "Edit Workout Plan",
        plan.name,
        plan.description,
        plan.exercises || []
      );
    });

    card.querySelector(".delete-btn").addEventListener("click", async () => {
      try {
        const res = await fetch(`/api/workouts/${plan._id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        console.error("Failed to delete workout:", err);
        return;
      }
      loadWorkouts();
    });

    workoutList.appendChild(card);
  });
}

addPlanForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const workout = {
    name: document.querySelector("#workout-name").value.trim(),
    description: document.querySelector("#workout-description").value.trim(),
    exercises: formExercises,
  };

  if (!workout.name) return;

  try {
    if (editingId) {
      const res = await fetch(`/api/workouts/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workout),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } else {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workout),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("Failed to save workout:", err);
    return;
  }

  closeForm();
  loadWorkouts();
});

showFormBtn.addEventListener("click", () => {
  editingId = null;
  openForm("Create Workout Plan");
});

cancelFormBtn.addEventListener("click", closeForm);

loadWorkouts();
