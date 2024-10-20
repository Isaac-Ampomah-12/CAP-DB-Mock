const cds = require('@sap/cds')
const {bookValue, getBooks} = require('./utils/helpers')

module.exports = async function (srv){
  

  const db = await cds.connect.to('db') // connect to database service
  const { Books } = db.entities         // get reflected definitions

  srv.on('bookValue', async req => {
    const {book} = req.data

    let i = await getBooks(db, book)

    // return i

    // const n = await UPDATE (Books, book)
    //   .with ({ stock: {'-=': quantity }})
    //   .where ({ stock: {'>=': quantity }})
    // n > 0 || req.error (409,`${quantity} exceeds stock for book #${book}`)

    // const {book,quantity} = req.data
    // const n = await srv.run(UPDATE (Books)
    //   .with ({ stock: {'-=': quantity }})
    //   .where ({ stock: {'>=': quantity }}))
    // console.log(n);
    

    //  UPDATE (Books, book)
    //   .with ({ stock: {'-=': quantity }})
    //   .where ({ stock: {'>=': quantity }})
    // n > 0 || req.error (409,`${quantity} exceeds stock for book #${book}`)
    // bookValue(weight, pages)

  })

  // this.on ('bookValue', async req => {
  //   const {book, weight, pages} = req.data
  //   bookValue(weight, pages)

  // })

  // Reduce stock of ordered books if available stock suffices
  this.on ('submitOrder', async req => {
    const {book,quantity} = req.data
    const n = await UPDATE (Books, book)
      .with ({ stock: {'-=': quantity }})
      .where ({ stock: {'>=': quantity }})
    n > 0 || req.error (409,`${quantity} exceeds stock for book #${book}`)
  })

  // Add some discount for overstocked books
  this.after ('each','Books', book => {
    if (book.stock > 111) book.title += ` -- 11% discount!`
  })
}