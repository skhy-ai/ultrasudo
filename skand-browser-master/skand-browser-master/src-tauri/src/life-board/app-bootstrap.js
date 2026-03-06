document.addEventListener("DOMContentLoaded", function () {
  try { loadData(); } catch (e) { console.warn("loadData error", e); }
  try { initSpeech(); } catch (e) { console.warn("initSpeech error", e); }
  try { updateDateDisplay(); } catch (e) { console.warn("updateDateDisplay error", e); }
  try { renderAll(); } catch (e) { console.warn("renderAll error", e); }
  try { setupIconSelector(); } catch (e) { console.warn("setupIconSelector error", e); }
  try { setupDragAndDrop(); } catch (e) { console.warn("setupDragAndDrop error", e); }

  const addTodoForm = document.getElementById("addTodoForm");
  if (addTodoForm) {
    addTodoForm.addEventListener("submit", addTodo);
  }

  const mapInput = document.getElementById("mapSearchInput");
  if (mapInput) {
    mapInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") { e.preventDefault(); searchOnMap(); }
    });
  }

  try { populateCountrySelector(); } catch (e) { console.warn("populateCountrySelector error", e); }
  try { getUserLocation(); } catch (e) { console.warn("getUserLocation error", e); }
  try { updateDownloadCounter(); } catch (e) { console.warn("updateDownloadCounter error", e); }
});
