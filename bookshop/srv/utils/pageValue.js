
const pageValue = (pages) => {
    return pages < 20 ? pages * 2 : pages * 3
    // if(pages < 20) {
    //     return pages * 2
    // } else {
    //     return pages * 3
    // }
}

const notCalled = (pages) => {
    if(pages < 20) {
        return pages * 2
    } else {
        return pages * 3
    }
    
    
}


module.exports = {pageValue, notCalled}