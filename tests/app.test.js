process.env.NODE_ENV = 'test';    // must come before include of db. 
const supertest = require('supertest');
const app = require('../app');
const db = require('../db');
const jestConfig = require('../jest.config');

let request = supertest(app);

beforeAll(async () => {
  // We have to init DB here, and not in file pointed to by globalSetup prop
  // because the global file has a completely separate environment. 
  // see https://mongoosejs.com/docs/jest.html
  await db.connect();
  await clearDb();
  console.log("DB clear.");

})
afterAll(() => {
  db.disconnect();
})

describe('PUT /register', () => {
  noLog();
  test('succeeds for well-formed submissions', (done) => {
    const validUser = 'name=Mike&username=mike%40example.com&password=1234567&password2=1234567';
    request
      .post('/register')
      .send(validUser)
      .expect(302)
      .expect('Location', '/')
      .end(done);
  });

  test('fails for the second attempt to register the same email', async () => {
    const validUser = 'name=Mike&username=mike%40example2.com&password=1234567&password2=1234567';
    const res1 = await request.post('/register').send(validUser)  // Add the user 
    const res2 = await request.post('/register').send(validUser)  // try to add same user again. 

    expect(res2.status).toBe(409);
    expect(res2.text).toEqual(expect.stringMatching(/already registered/i));
  });

  test('fails for short passwords', (done) => {
    const shortPassUser = 'name=Mike&username=mike%40example.com&password=123456&password2=123456';
    request
      .post('/register')
      .send(shortPassUser)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.text).toEqual(expect.stringMatching(/invalid password/i));
        return done();
      })
  });
});

describe('GET /', () => {
  noLog();
  test('redirects to /login for anonymous', async () => {
    const res = await request.get('/');
    expect(res.status).toBe(302);
  });
  test('succeeds for authenticated users', async () => {
    const res = await request.get('/');
    expect(res.status).toBe(200);
  });
})


describe('GET /login', () => {
  test('succeeds for anonymous', async () => {
    const res = await request.get('/login');
    expect(res.status).toBe(200);
  });
})

describe('GET /register', () => {
  test('succeeds for anonymous', async () => {
    const res = await request.get('/register');
    expect(res.status).toBe(200);
  });
})

function noLog() {
  jest.spyOn(console, 'log').mockImplementation(jest.fn());
  //jest.spyOn(console, 'debug').mockImplementation(jest.fn());
}

function clearDb() {
  if (process.env.NODE_ENV !== 'test') process.exit(-1);

  const deleteUsers = new Promise((resolve, reject) => {
    db.User.deleteMany({}, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
  const deleteMeetups = new Promise((resolve, reject) => {
    db.Meetup.deleteMany({}, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
  return Promise.all([deleteUsers, deleteMeetups]);
}