//fetch API

async function deleteItem(url, id) {
  try {
    const res = await fetch(`${url}/${id}`, {
      method: "DELETE",
    })
    if (!res.ok)
      //res.ok  return boolean
      throw new Error(`Fail to delete item: ${res.status} - ${res.statusText}`)
    try {
      const deletedItem = await res.json()
      return deletedItem
    } catch (e) {
      return id
    }
  } catch (e) {
    throw new Error(e.message)
  }
}

async function addItem(url, item) {
  try {
    const res = await fetch(`${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    })
    if (res.status !== 201) {
      throw new Error(`Fail to add item: ${res.status} - ${res.statusText}`)
    }
    const addedItem = await res.json()
    return addedItem
  } catch (e) {
    throw new Error(e.message)
  }
}
export { deleteItem, addItem }
 