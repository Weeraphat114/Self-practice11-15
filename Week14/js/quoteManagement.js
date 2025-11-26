//CRUD Quote
import { editItem } from "./myLibrary/fetchUtils.js"
const quoteURL = `${import.meta.env.VITE_APP_URL}/quotes`
 
async function loadQuotes() {
  try {
    const quotes = await getItems(quoteURL)
    return quotes
  } catch (e) {
    throw new Error(`Quote: ${e.message}`)
  }
}
async function addQuote(quote) {
  try {
    const addedItem = await addItem(quoteURL, quote)
    return addedItem
  } catch (e) {
    throw new Error(`Quote: ${e.message}`)
  }
}
 
async function editQuote(quote) {
  try {
    const editedItem = await editItem(quoteURL, quote)
    return editedItem
  } catch (e) {
    throw new Error(`Quote: ${e.message}`)
  }
}
 
export { loadQuotes, addQuote, editQuote }