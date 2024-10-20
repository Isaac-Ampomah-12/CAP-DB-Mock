const dbEntities = {
    Books: "Books"
}

const mockedLog = {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
}

let dbMock = {}

jest.mock('@sap/cds', () => {
    return {
        tx: jest.fn(),
        log: jest.fn(),
        connect: {
            to: jest.fn()
        },
        entities: jest.fn(),
        run: jest.fn()
    }
})

global.cds = require('@sap/cds')
initCDSMock()

function initCDSMock() {
    cds.log.mockReturnValue(mockedLog)
    cds.connect.to.mockReturnValue(dbMock)
    cds.entities.mockReturnValue(dbEntities)
    cds.run.mockImplementation((arg) => {
        return dbMock.run(arg)
    })
}

function applyUpdate(value, updateValues) {
    for(let [key, updateValue] of Object.entries(updateValues)) {
        if(!value.hasOwnProperty(key)) {
            continue
        }
        // TODO: add handling of updateValue if it's not a value literal (e.g. {"-=": 1} or {xpr: [...]})
        value[key] = updateValue
    }
    return value
}

const entityDef = (columns) => {
    if (columns instanceof Function) {
        try {
            columns(entityDef)
        } catch (e) {
        }
    }
}

module.exports = {
    initUnitTestMocks: () =>  {
        SELECT = jest.fn().mockImplementation((entity, objId) => {
            if (!entity) logEntityError()
            SELECT.entity = entity
            if (objId)
                SELECT.condition = {ID: objId}
                entityDef(objId)
            return SELECT
        })
        Object.assign(SELECT, {
            condition: null,
            from: jest.fn().mockImplementation((entity, objId) => {
                    if (!entity) logEntityError()
                    SELECT.entity = entity
                    if (objId)
                        SELECT.condition = {ID: objId}
                        entityDef(objId)
                    return SELECT
                }),
            forUpdate: jest.fn().mockImplementation(() => SELECT),
            columns: jest.fn().mockImplementation((colfnc) => {
                entityDef(colfnc)
                return SELECT
            }),
            orderBy: jest.fn().mockImplementation(() => SELECT),
            where: jest.fn().mockImplementation((condition) => {
                    SELECT.condition = condition
                    return SELECT
                }),
            limit: jest.fn().mockReturnValue(SELECT)
            
        })
        SELECT.one = SELECT.from
        SELECT.one.from = SELECT.from
        SELECT.one.columns = SELECT.columns

        UPDATE = jest.fn().mockImplementation((entity, id) => {
            if (entity) {
                UPDATE.updateEntity = entity
            }
            if (id) {
                UPDATE.updateCondition = {ID: id}
            } else {
                UPDATE.updateCondition = null
            }
            UPDATE.updateValues = null
            return {...UPDATE}
        })

        Object.assign(UPDATE, {
            updateEntity: null,
            updateCondition: null,
            updateValues: null,
            entity: jest.fn().mockImplementation((entity, id) => {
                if (entity) {
                    UPDATE.updateEntity = entity
                }
                if (id) {
                    UPDATE.updateCondition = {ID: id}
                } else {
                    UPDATE.updateCondition = null
                }
                UPDATE.updateValues = null
                return {...UPDATE}
            }),
            set: jest.fn().mockImplementation((values) => {
                UPDATE.updateValues = values
                return {...UPDATE}
            }),
            with: jest.fn().mockImplementation((values) => {
                UPDATE.updateValues = values
                return {...UPDATE}
            }),
            where: jest.fn().mockImplementation((condition) => {
                UPDATE.updateCondition = {...condition} // Make a shallow copy in case the condition is a pointer to an object used multiple times
                return {...UPDATE}
            })
        })



        INSERT = {
            creationIds: [],
            nextId: 1000000,
            useNextIds: jest.fn().mockImplementation((ids) => {
                if (Array.isArray(ids)) INSERT.creationIds = INSERT.creationIds.concat(ids)
                else INSERT.creationIds.push(ids)
            }),
            getNextId: jest.fn().mockImplementation(() => {
                if (INSERT.creationIds.length === 0) return(INSERT.nextId++).toString()
                return INSERT.creationIds.shift()
            }),
            insertEntity: null,
            into: jest.fn().mockImplementation((entity) => {
                INSERT.insertEntity = entity
                return {...INSERT}
            }),
            entries: jest.fn().mockImplementation((entries) => {
                if (Array.isArray(entries)) entries.forEach((entry) => {entry.ID ||= INSERT.getNextId()})
                else entries.ID ||= INSERT.getNextId()
                INSERT.data = JSON.parse(JSON.stringify(entries))
                return {...INSERT}
            })
        }

        DELETE = jest.fn().mockImplementation(() => DELETE)
        Object.assign(DELETE, {
            entity: jest.fn().mockImplementation(() => DELETE),
            from: jest.fn().mockImplementation((entity) => {
                DELETE.deleteEntity = entity
                return {...DELETE}
            }),
            with: jest. fn().mockImplementation(() => DELETE),
            where: jest.fn().mockImplementation((condition) => {
                DELETE.deleteCondition = condition
                return {...DELETE}
            }),
        })
        
        Object.assign(dbMock, {
            entities: jest.fn().mockReturnValue(dbEntities),
            run: jest.fn().mockImplementation((query) => {
                let entity, condition
                if (query.updateEntity || query.updateCondition) {
                    entity = query.updateEntity
                    condition = query.updateCondition
                } else {
                    entity = query.entity
                    condition = query.condition
                }
                if (dbMock.returnData[entity]) {
                    let fulfilsCondition = true             
                    for (let data of dbMock.returnData[entity]) {
                        if (condition && data.condition) {
                            let fulfilsCondition = true
                            if (Object.keys(condition).length !== Object.keys(data.condition).length) {
                                fulfilsCondition = false
                                continue
                            }                            
                            if (Array.isArray(condition)) {
                                if (Array.isArray(data.condition)) {
                                    if (condition.length != data.condition.length) {
                                        fulfilsCondition = false
                                    } else {
                                        condition.forEach((value, index, array) => {
                                            if (JSON.stringify(value) != JSON.stringify(data.condition[index])) {
                                                fulfilsCondition = false
                                            }
                                        })
                                    }
                                } else {
                                    fulfilsCondition = false
                                }
                            } else {
                                if (Array.isArray(data.condition)) {
                                    fulfilsCondition = false
                                } else {
                                    for (const [key, value] of Object.entries(data.condition)) {
                                        if(value?.constructor && value.constructor === Object && value.in && Array.isArray(value.in)) {
                                            if (condition[key] && condition[key].constructor === Object && condition[key].in && Array.isArray(condition[key].in) && 
                                                    condition[key].in.length === value.in.length) {
                                                for (const individualValue of value.in) {
                                                    if(!condition[key].in.includes(individualValue)) {
                                                        fulfilsCondition = false
                                                        break
                                                    }
                                                }
                                                if (!fulfilsCondition) break
                                            } else {
                                                fulfilsCondition = false
                                                break
                                            }
                                        } else if (JSON.stringify(condition[key]) !== JSON.stringify(value)) {
                                            fulfilsCondition = false
                                            break
                                        }
                                    }
                                }
                            }
                            if (fulfilsCondition) {
                                if(query.updateValues)
                                    return applyUpdate(data.value, query.updateValues)
                                if (data.timesProcessed === data.timesMocked)
                                    logMockingError(2, entity, condition, data.timesMocked)
                                data.timesProcessed += 1
                                return data.value
                            }
                        } else {
                            if(query.updateValues)
                                return applyUpdate(data.value, query.updateValues)
                            return data.value
                        }
                    }
                    if (!query.updateEntity && !fulfilsCondition) {
                        logMockingError(1, entity, condition, null)                           
                    }                    
                }
                if (query.data) {
                    if (Array.isArray(query.data) && query.data.length === 1)
                        return query.data[0]
                    else
                        return query.data
                }
                if (dbMock.returnData['default']){
                    return dbMock.returnData['default'][0].value
                }
                return [];
            }),
    
            currentEntity: null,
            returnData: {},
            condition: null, // field: value
            byDefault: () => {
                dbMock.currentEntity = 'default'
                return dbMock
            },
            forEntity: (entityName) => {
                if (!entityName) logEntityError()
                dbMock.currentEntity = entityName
                return dbMock
            },
            withCondition: (condition) => {
                dbMock.condition = condition
                return dbMock
            },
            retrieve: (data) => {
                if (!dbMock.returnData[dbMock.currentEntity])
                    dbMock.returnData[dbMock.currentEntity] = []
                dbMock.returnData[dbMock.currentEntity].push({
                    entity: dbMock.currentEntity,
                    value: data,
                    condition: dbMock.condition,
                    timesProcessed: 0,
                    timesMocked: 1
                })
                dbMock.condition = null
                return {
                    times: (qty) => {
                        const entityData = dbMock.returnData[dbMock.currentEntity]
                        const lastEntryIndex = entityData.length - 1
                        dbMock.currentEntity = null                        
                        if (!qty || isNaN(qty) || qty <= 0) {
                            entityData[lastEntryIndex].timesMocked = 0
                            return dbMock
                        }
                        entityData[lastEntryIndex].timesMocked = qty
                        return dbMock
                    },
                }
            },      
        })

        initCDSMock()
        return dbMock
    }
}

function logMockingError(type, entity, condition, times) {
    let errorLabel1, errorLabel2, errorLabel3, errorPart1, errorPart2, errorPart3

    switch (type) {
        case 1:
            errorLabel1 = 'No mocked data found for entity:'
            errorLabel2 = 'Expected condition:'
            errorPart1 = entity
            errorPart2 = JSON.stringify(condition)

            console.log(errorLabel1, errorPart1, '\n', errorLabel2, errorPart2)
            throw new Error(`No mocked data found for entity: ${entity}`)

        case 2:
            errorLabel1 = 'Mock occurences already used for entity:'
            errorLabel2 = 'Already processed times:'
            errorLabel3 = 'Condition:'
            errorPart1 = entity
            errorPart2 = JSON.stringify(times)
            errorPart3 = JSON.stringify(condition)

            console.log(errorLabel1, errorPart1, '\n', errorLabel2, errorPart2, '\n', errorLabel3, errorPart3)
            throw new Error(`No mocked data found for entity: ${entity}`)
    }
}

function logEntityError() {
    console.log('Entity for request mock is not defined')
    throw new Error(`Entity for request mock is not defined`)
}