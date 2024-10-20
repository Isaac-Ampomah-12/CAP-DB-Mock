let db
const unitTestUtils = require('../unit-tests/unit-test-utils')

jest.mock('../../utils/pageValue')
const {pageValue, notCalled} = require('../../utils/pageValue')
const {bookValue, getBooks} = require('../../utils/helpers')


describe('test', () => {
    it('bookValue', async () => {
        // given
        const weight = 12;
        const page = 30
        const expectedValue = 39

        pageValue.mockReturnValue(3)

        // when
        const result = bookValue(weight, page)

        // then
        expect(result).toBe(expectedValue)
        expect(notCalled).not.toHaveBeenCalled()
        expect(pageValue).toHaveBeenCalledWith(30)
    })
})

describe('getBooks', () => {
    beforeEach(async () => {
        db = unitTestUtils.initUnitTestMocks()
    })

    afterEach(async () => {
        jest.resetAllMocks()
    })

    it('mock', async () => {
        // given
        const {Books} = db.entities()
        
        db.forEntity(Books).retrieve(
            {
                ID: 201,
                title: 'Wuthering Heights'
            }
        )

        const expected = {
              ID: 201,
              title: 'Love lost'
        }
          

        // when
        const result = await getBooks(db, 201)
        console.log(result);
        

        // then
        expect(result).toEqual(expected)
        expect(db.run).toHaveBeenCalled()
        expect(SELECT.from).toHaveBeenCalledWith(Books)
        expect(SELECT.where).toHaveBeenCalledWith({ID:201})
        expect(UPDATE).toHaveBeenCalledWith(Books)
        expect(UPDATE.with).toHaveBeenCalledWith({ title: "Love lost" })
        expect(INSERT.into).toHaveBeenCalledWith(Books)
        expect(INSERT.entries).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "New Man",
                descr: "Read it",
                stock: 20,
                price: 23.3
            })
        )
        expect(DELETE.from).toHaveBeenCalledWith(Books)
        expect(DELETE.where).toHaveBeenCalledWith({ID:201})
    })
})