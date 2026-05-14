import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { readFileSync } from 'fs'

const env = readFileSync('.env', 'utf8')
const apiKey = env.split('\n').find(l => l.startsWith('VITE_ANTHROPIC_API_KEY')).split('=')[1].trim()

const app = express()
app.use(cors())
app.use('/api', createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader('x-api-key', apiKey)
      proxyReq.setHeader('anthropic-version', '2023-06-01')
      proxyReq.setHeader('content-type', 'application/json')
    },
  },
}))

app.listen(3001, () => console.log('Proxy running on port 3001'))