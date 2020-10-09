const knex = require('knex');
const app = require('../src/app');
const { makeEstimatesArray, makeMaliciousEstimate } = require('./estimates.fixtures');
const { makeProjectsArray } = require('./projects.fixtures');

describe('Estimates Endpoints', function() {
    let db;

    before('make knex instance', () => {
        db = knex({
          client: 'pg',
          connection: process.env.TEST_DATABASE_URL,
        });
        app.set('db', db);
      });

      after('disconnect from db', () => db.destroy());
  
      before('clean the table', () => db.raw('TRUNCATE myhomereno_projects, myhomereno_estimates RESTART IDENTITY CASCADE'));
  
      afterEach('cleanup',() => db.raw('TRUNCATE myhomereno_projects, myhomereno_estimates RESTART IDENTITY CASCADE'));

      describe(`GET /api/estimates`, () => {
        context(`Given no estimates`, () => {
          it(`responds with 200 and an empty list`, () => {
            return supertest(app)
              .get('/api/estimates')
              .expect(200, []);
          });
        });

        context('Given there are estimates in the database', () => {
            const testProjects = makeProjectsArray();
            const testEstimates = makeEstimatesArray();

            beforeEach('insert estimates', () => {
                return db
                .into('myhomereno_projects')
                .insert(testProjects)
                .then(() => {
                  return db
                    .into('myhomereno_estimates')
                    .insert(testEstimates)
                });
            });

            it('responds with 200 and all of the estimates', () => {
                return supertest(app)
                  .get('/api/estimates')
                  .expect(200, testEstimates);
            });
        });

        context(`Given an XSS attack estimate`, () => {
            const testProjects = makeProjectsArray();
            const { maliciousEstimate, expectedEstimate } = makeMaliciousEstimate();
      
            beforeEach('insert malicious Estimate', () => {
              return db
                .into('myhomereno_projects')
                .insert(testProjects)
                .then(() => {
                  return db
                    .into('myhomereno_estimates')
                    .insert([ maliciousEstimate ]);
            });
            });

            it('removes XSS attack content', () => {
                return supertest(app)
                  .get(`/api/estimates`)
                  .expect(200)
                  .expect(res => {
                    expect(res.body[0].name).to.eql(expectedEstimate.name);
                  });
            });
        });
    });

    describe(`GET /api/estimates/:estimate_id`, () => {
        context(`Given no estimates`, () => {
          it(`responds with 404`, () => {
            const estimateId = 123456;
            return supertest(app)
              .get(`/api/estimates/${estimateId}`)
              .expect(404, { error: { message: `Estimate doesn't exist` } });
          });
        });

        context('Given there are estimates in the database', () => {
            const testProjects = makeProjectsArray();
            const testEstimates = makeEstimatesArray();
      
            beforeEach('insert estimates', () => {
              return db
                .into('myhomereno_projects')
                .insert(testProjects)
                .then(() => {
                  return db
                    .into('myhomereno_estimates')
                    .insert(testEstimates);
            });
            });

            it('responds with 200 and the specified estimate', () => {
                const estimateId = 2;
                const expectedEstimate = testEstimates[estimateId - 1];
                return supertest(app)
                  .get(`/api/estimates/${estimateId}`)
                  .expect(200, expectedEstimate);
              });
          });

          context(`Given an XSS attack estimate`, () => {
            const testProjects = makeProjectsArray();
            const { maliciousEstimate, expectedEstimate } = makeMaliciousEstimate();
      
            beforeEach('insert malicious estimate', () => {
              return db
                .into('myhomereno_projects')
                .insert(testProjects)
                .then(() => {
                  return db
                    .into('myhomereno_estimates')
                    .insert([ maliciousEstimate ]);
            });
            });

            it('removes XSS attack content', () => {
                return supertest(app)
                  .get(`/api/estimates/${maliciousEstimate.id}`)
                  .expect(200)
                  .expect(res => {
                    expect(res.body.name).to.eql(expectedEstimate.name);
                  });
              });
          });
      });

      describe(`POST /api/estimates`, () => {
        const testProjects = makeProjectsArray();
        beforeEach('insert malicious estimate', () => {
          return db
            .into('myhomereno_projects')
            .insert(testProjects);
        });

        it(`creates an estimate, responding with 201 and the new estimate`, function() {
            this.retries(3)
            const newEstimate = {
                id: 1,
                project_id: 2,
                name: "Master Bath Estimate 1",
                contractor_name: "Bathroom Specialties",
                price: "$30,000",
                details: "Can start the job in two weeks",
                total_time: "3 Weeks",
            };
            return supertest(app)
              .post('/api/estimates')
              .send(newEstimate)
              .expect(201)
              .expect(res => {
                expect(res.body.project_id).to.eql(newEstimate.project_id);
                expect(res.body.name).to.eql(newEstimate.name);
                expect(res.body.contractor_name).to.eql(newEstimate.contractor_name);
                expect(res.body.price).to.eql(newEstimate.price);
                expect(res.body.details).to.eql(newEstimate.details);
                expect(res.body.total_time).to.eql(newEstimate.total_time);
                expect(res.body).to.have.property('id');
                expect(res.headers.location).to.eql(`/api/estimates/${res.body.id}`);
                const expected = new Date().toLocaleString();
                const actual = new Date(res.body.date_created).toLocaleString();
                expect(actual).to.eql(expected);
              })
              .then(res =>
                supertest(app)
                  .get(`/api/estimates/${res.body.id}`)
                  .expect(res.body)
              );
        });

        const requiredFields = ['name', 'contractor_name', 'price', 'details', 'total_time'];

        requiredFields.forEach(field => {
            const newEstimate = {
              name: 'Test new estimate',
              contractor_name: 'Test name',
              project_id: 2,
              price: '$10,000',
              details: 'This is a new estimate',
              total_time: '4 weeks'
            };

        it(`responds with 400 and an error message when the '${field}' is missing`, () => {
            delete newEstimate[field];
      
            return supertest(app)
                .post('/api/estimates')
                .send(newEstimate)
                .expect(400, {
                  error: { message: `Missing '${field}' in request body`}
                });
            });
        });

        it('removes XSS attack content from response', () => {
            const { maliciousEstimate, expectedEstimate } = makeMaliciousEstimate();
            return supertest(app)
              .post(`/api/estimates`)
              .send(maliciousEstimate)
              .expect(201)
              .expect(res => {
                expect(res.body.name).to.eql(expectedEstimate.name)
              });
        });
    });

    describe(`DELETE /api/estimates/:estimate_id`, () => {
        context(`Given no estimates`, () => {
          it(`responds with 404`, () => {
            const estimateId = 123456;
            return supertest(app)
              .delete(`/api/estimates/${estimateId}`)
              .expect(404, { error: { message: `Estimate doesn't exist` } });
          });
        });

        context('Given there are estimates in the database', () => {
            const testProjects = makeProjectsArray();
            const testEstimates = makeEstimatesArray();
      
            beforeEach('insert estimates', () => {
              return db
                .into('myhomereno_projects')
                .insert(testProjects)
                .then(() => {
                  return db
                    .into('myhomereno_estimates')
                    .insert(testEstimates);
                });
            });

            it('responds with 204 and removes the estimate', () => {
                const idToRemove = 2;
                const expectedEstimates = testEstimates.filter(estimate => estimate.id !== idToRemove);
                return supertest(app)
                  .delete(`/api/estimates/${idToRemove}`)
                  .expect(204)
                  .then(res =>
                    supertest(app)
                      .get(`/api/estimates`)
                      .expect(expectedEstimates)
                  );
              });
        });
    });

    describe(`PATCH /api/estimates/:estimate_id`, () => {
        context(`Given no estimates`, () => {
          it(`responds with 404`, () => {
            const estimateId = 123456;
            return supertest(app)
              .patch(`/api/estimates/${estimateId}`)
              .expect(404, { error: { message: `Estimate doesn't exist` } });
          });
        });

        context('Given there are estimates in the database', () => {
            const testProjects = makeProjectsArray();
            const testEstimates = makeEstimatesArray();
            beforeEach('insert estimates', () => {
              return db
                .into('myhomereno_projects')
                .insert(testProjects)
                .then(() => {
                  return db
                    .into('myhomereno_estimates')
                    .insert(testEstimates);
                });
            });

            it('responds with 204 and updates the estimate', () => {
                const idToUpdate = 2;
                const updateEstimate = {
                    name: 'Test update estimate',
                    project_id: 2,
                    contractor_name: 'Test update name',
                    price: '$10,000',
                    details: 'This is an updated estimate',
                    total_time: '4 weeks'
                };
                const expectedEstimate = {
                  ...testEstimates[idToUpdate - 1],
                  ...updateEstimate
                };
              return supertest(app)
                .patch(`/api/estimates/${idToUpdate}`)
                .send(updateEstimate)
                .expect(204)
                .then(res =>
                  supertest(app)
                    .get(`/api/estimates/${idToUpdate}`)
                    .expect(expectedEstimate)
                 );
            });

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2;
                  return supertest(app)
                    .patch(`/api/estimates/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                      error: {
                        message: `Request body must contain all relevent information`
                      }
                    });
            });

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2;
                const updateEstimate = {
                  name: 'updated estimate name',
                };
                const expectedEstimate = {
                  ...testEstimates[idToUpdate - 1],
                  ...updateEstimate
                };
                return supertest(app)
                  .patch(`/api/estimates/${idToUpdate}`)
                  .send({
                    ...updateEstimate,
                    fieldToIgnore: 'should not be in GET response'
                  })
                  .expect(204)
                  .then(res =>
                    supertest(app)
                      .get(`/api/estimates/${idToUpdate}`)
                      .expect(expectedEstimate)
                  );
              });
          });
        });
      });

