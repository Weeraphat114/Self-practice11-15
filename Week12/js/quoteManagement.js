//CRUD Quote
import { getItems } from "./myLibrary/fetchUtils";
async function loadQuotes() {
    try {
        const users = await getItems (`${import.meta.env.VITE_APP_URL}/users`)
        return users
    } catch (error) {
        alert(error)
    }
}
export { loadQuotes }