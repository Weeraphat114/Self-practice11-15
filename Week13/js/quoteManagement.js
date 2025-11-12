//CRUD Quote
import { deleteItem, addItem} from "./myLibrary/fetchUtils.js"
const quoteURL = `${import.meta.env.VITE_APP_URL}/quotes`

async function deleteQuote(quoteId) {
  try {
    const deleteId = await deleteItem(quoteURL, quoteId)
    return deleteId
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
 
 
export { deleteQuote, addQuote }