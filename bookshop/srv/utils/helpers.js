const {pageValue} = require('../utils/pageValue')

const weightValue = (weight) => {
    if(weight < 10){
        return weight * 2
    }else { 
        return weight * 3
    }
}

const bookValue = (weight, page) => {
    const bookPageValue = pageValue(page)
    const bookWeightValue = weightValue(weight)

    return bookWeightValue + bookPageValue;
}

const getBooks = async (db, ID) => {
    const { Books } = db.entities()         // get reflected definitions

    const book = await db.run(SELECT.one.from(Books).where({ID:ID}))
    
    await db.run(UPDATE(Books).with({title: "Love lost"}).where({ID:ID}))

    const i = await db.run(INSERT.into(Books).entries({
        title: "New Man",
        descr: "Read it",
        stock: 20,
        price: 23.3
    }))
    
    await db.run(DELETE.from(Books).where({ ID: ID}))

    return await db.run(SELECT.from(Books).where({ID:ID}))
}


module.exports = {bookValue, getBooks}