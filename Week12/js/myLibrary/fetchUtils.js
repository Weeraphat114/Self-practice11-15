//fetch api
async function getItems(url){
    try {
        const res = await fetch(url)
        const items = res.json() //json() - convert json to JavaScript Object
        return items
    } catch (error) {
        throw new Error(`There is a problem, cannot read items`)
    }
}
export { getItems }