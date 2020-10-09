const path = require('path')
const express = require('express')
const xss = require('xss')
const EstimatesService = require('./estimates-service')
const estimatesRouter = express.Router()
const jsonParser = express.json()

const serializeEstimate = estimate => ({
    id: estimate.id,
    project_id: estimate.project_id,
    name: xss(estimate.name),
    contractor_name: estimate.contractor_name,
    price: estimate.price,
    details: estimate.details,
    total_time: estimate.total_time,
    date_created: estimate.date_created,
  })

estimatesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    EstimatesService.getAllEstimates(knexInstance)
      .then(estimates => {
        res.json(estimates.map(serializeEstimate))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const addEstimate = req.body
    const newEstimate = addEstimate

    for (const [key, value] of Object.entries(newEstimate))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    EstimatesService.insertEstimate(
      req.app.get('db'),
      newEstimate
    )
      .then(estimate => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${estimate.id}`))
          .json(serializeEstimate(estimate))
      })
      .catch(next)
  })

estimatesRouter
  .route('/:estimate_id')
  .all((req, res, next) => {
    EstimatesService.getById(
      req.app.get('db'),
      req.params.estimate_id
    )
      .then(estimate => {
        if (!estimate) {
          return res.status(404).json({
            error: { message: `Estimate doesn't exist` }
          })
        }
        res.estimate = estimate
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializeEstimate(res.estimate))
  })
  .delete((req, res, next) => {
    EstimatesService.deleteEstimate(
      req.app.get('db'),
      req.params.estimate_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const editEstimate = req.body
    const estimateToUpdate = editEstimate
    const numberOfValues = Object.values(estimateToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain all relevent information`
        }
      })
    }

      EstimatesService.updateEstimate(
        req.app.get('db'),
        req.params.estimate_id,
        estimateToUpdate
      )
        .then(numRowsAffected => {
          res.status(204).end()
        })
        .catch(next)
  })

module.exports = estimatesRouter