import supertest from 'supertest'
import app from '../app'

const agent = supertest(app)

export default agent