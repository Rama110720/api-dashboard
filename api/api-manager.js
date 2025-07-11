// File: /api/api-manager.js (untuk Vercel Serverless API)
import fs from 'fs'
import path from 'path'

const dataFile = path.resolve(process.cwd(), 'data', 'apis.json')
const allowedApiKey = 'RamzxProject123'

// Helper functions
const readAPIs = () => {
  if (!fs.existsSync(dataFile)) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true })
    fs.writeFileSync(dataFile, JSON.stringify([], null, 2))
  }
  const content = fs.readFileSync(dataFile, 'utf-8')
  try {
    return JSON.parse(content)
  } catch {
    return []
  }
}

const writeAPIs = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
  return true
}

const authenticate = (req, res) => {
  const apiKey = req.headers['x-api-key'] || ''
  if (apiKey !== allowedApiKey) {
    res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid API Key' })
    return false
  }
  return true
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  const method = req.method
  let apis = readAPIs()
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  console.log(`[API Manager] ${method} request received`)
  console.log(`[API Manager] Query:`, req.query)
  console.log(`[API Manager] Body:`, req.body)
  
  switch (method) {
    case 'GET': {
      console.log(`[API Manager] Returning ${apis.length} APIs`)
      return res.status(200).json({ status: 'success', data: apis })
    }
    
    case 'POST': {
      if (!authenticate(req, res)) return
      
      const { name, description, endpoint, category, status: apiStatus } = req.body
      
      if (!name || !description || !endpoint || !category || !apiStatus) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Missing required fields: name, description, endpoint, category, status' 
        })
      }
      
      // Generate unique ID
      let newId = name.toLowerCase().replace(/\s+/g, '-')
      if (apis.some(api => api.id === newId)) {
        newId += '-' + Date.now()
      }
      
      const newApi = { 
        id: newId, 
        name, 
        description, 
        endpoint, 
        category, 
        status: apiStatus,
        created_at: new Date().toISOString()
      }
      
      apis.push(newApi)
      writeAPIs(apis)
      
      console.log(`[API Manager] Added new API: ${newApi.id}`)
      return res.status(201).json({ 
        status: 'success', 
        message: 'API added successfully.', 
        api: newApi 
      })
    }
    
    case 'PUT': {
      if (!authenticate(req, res)) return
      
      const id = req.query.id
      if (!id) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Missing API ID in query parameter' 
        })
      }
      
      const index = apis.findIndex(api => api.id === id)
      if (index === -1) {
        return res.status(404).json({ 
          status: 'error', 
          message: `API with ID '${id}' not found.` 
        })
      }
      
      // Update fields
      Object.keys(req.body).forEach(key => {
        if (apis[index].hasOwnProperty(key) && key !== 'id') {
          apis[index][key] = req.body[key]
        }
      })
      
      apis[index].updated_at = new Date().toISOString()
      writeAPIs(apis)
      
      console.log(`[API Manager] Updated API: ${id}`)
      return res.status(200).json({ 
        status: 'success', 
        message: `API '${id}' updated successfully.`, 
        updated_api: apis[index] 
      })
    }
    
    case 'DELETE': {
      if (!authenticate(req, res)) return
      
      const id = req.query.id
      if (!id) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Missing API ID in query parameter' 
        })
      }
      
      const initialLength = apis.length
      apis = apis.filter(api => api.id !== id)
      
      if (apis.length === initialLength) {
        return res.status(404).json({ 
          status: 'error', 
          message: `API with ID '${id}' not found.` 
        })
      }
      
      writeAPIs(apis)
      
      console.log(`[API Manager] Deleted API: ${id}`)
      return res.status(200).json({ 
        status: 'success', 
        message: `API '${id}' deleted successfully.` 
      })
    }
    
    default:
      return res.status(405).json({ 
        status: 'error', 
        message: `Method ${method} Not Allowed` 
      })
  }
}
