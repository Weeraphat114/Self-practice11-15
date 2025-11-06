import { loadQuotes } from "./quoteManagement.js";

const buttonLoadBtn = document.getElementById("loadBtn");
const ulUserList = document.getElementById("userList");
buttonLoadBtn.addEventListener("click", async () => {
  const users = await loadQuotes();
  console.log(users);

  ulUserList.textContent = ""   

  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.name} - ${user.email}`;
    ulUserList.appendChild(li);
  });
});
