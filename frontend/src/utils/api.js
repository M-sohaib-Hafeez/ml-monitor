import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
})

export const analyzeDrift = (data) =>
  api.post('/api/drift/analyze', data).then(r => r.data)

export const analyzeMultiDrift = (data) =>
  api.post('/api/drift/analyze-multi', data).then(r => r.data)

export const evaluateClassification = (data) =>
  api.post('/api/model/evaluate/classification', data).then(r => r.data)

export const evaluateRegression = (data) =>
  api.post('/api/model/evaluate/regression', data).then(r => r.data)

export const compareModels = (data) =>
  api.post('/api/model/compare', data).then(r => r.data)

export const getInsights = (data) =>
  api.post('/api/insights/analyze', data).then(r => r.data)

export const getRetrainingPlan = (data) =>
  api.post('/api/insights/retraining-plan', data).then(r => r.data)

export const explainDrift = (data) =>
  api.post('/api/insights/explain-drift', data).then(r => r.data)

export const uploadCSV = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/api/upload/csv', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export const uploadCSVPair = (baseline, current) => {
  const form = new FormData()
  form.append('baseline', baseline)
  form.append('current', current)
  return api.post('/api/upload/validate-pair', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export default api

export const getDriftHistory = () =>
  api.get('/api/drift/history').then(r => r.data)

export const getModelHistory = () =>
  api.get('/api/model/history').then(r => r.data)
