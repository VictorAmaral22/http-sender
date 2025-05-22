import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import type { Request } from './types'
import { getErrorMessage, getMethodColor } from './utils'

function App() {
  const [requests, setRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null)
  const [activeRequestTab, setActiveRequestTab] = useState<'body' | 'headers'>('body')
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body')

  useEffect(() => {
    const currentRequest = requests.find(r => r.id === selectedRequest)
    if (currentRequest && ['GET', 'DELETE'].includes(currentRequest.type)) {
      setActiveRequestTab('headers')
    }
  }, [requests, selectedRequest])

  const handleSendRequest = async () => {
    if (selectedRequest === null) return

    const request = requests.find(r => r.id === selectedRequest)
    if (!request) return

    try {
      const response = await axios({
        method: request.type.toLowerCase(),
        url: request.url,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        data: ["POST", "PUT", "PATCH"].includes(request.type) ? request.body : undefined,
      })

      const contentType = response.headers['content-type'] || ''
      let data: string

      if (contentType.includes('application/json')) {
        data = JSON.stringify(response.data)
      } else {
        data = response.data
      }

      const responseHeaders: Record<string, string> = {}
      Object.entries(response.headers).forEach(([key, value]) => {
        responseHeaders[key] = value as string
      })

      setRequests(prevRequests => prevRequests.map(r => 
        r.id === selectedRequest ? { 
          ...r, 
          response: data, 
          responseType: contentType,
          status: response.status,
          responseHeaders,
          error: undefined,
          errorMessage: undefined,
        } : r
      ))
    } catch (error) {
      console.log(error)
      if (axios.isAxiosError(error)) {
        setRequests(prevRequests => prevRequests.map(r => 
          r.id === selectedRequest ? { 
            ...r, 
            error: getErrorMessage(error.response?.status),
            errorMessage: error.message,
            errorData: error.response?.data ? JSON.stringify(error.response.data) : undefined,
            status: error.response?.status,
            response: error.response?.data ? JSON.stringify(error.response.data) : undefined,
            responseHeaders: error.response?.headers as Record<string, string>
          } : r
        ))
      } else {
        setRequests(prevRequests => prevRequests.map(r => 
          r.id === selectedRequest ? { 
            ...r, 
            error: 'Unknown Error',
            errorMessage: 'An unexpected error occurred'
          } : r
        ))
      }
    }
  }

  const handleTypeChange = (type: string) => {
    if (!selectedRequest) return
    setRequests(prevRequests => prevRequests.map(r => 
      r.id === selectedRequest ? { ...r, type } : r
    ))
  }

  const handleAddHeader = () => {
    if (!selectedRequest) return
    setRequests(prevRequests => prevRequests.map(r => 
      r.id === selectedRequest ? {
        ...r,
        headers: { ...(r.headers || {}), '': '' }
      } : r
    ))
  }

  const handleRemoveHeader = (key: string) => {
    if (!selectedRequest) return
    setRequests(prevRequests => prevRequests.map(r => {
      if (r.id === selectedRequest && r.headers) {
        const { [key]: removed, ...remainingHeaders } = r.headers
        return { ...r, headers: remainingHeaders }
      }
      return r
    }))
  }

  const handleAddRequest = () => {
    const newId = Math.max(0, ...requests.map(r => r.id)) + 1
    const newRequest: Request = {
      id: newId,
      type: 'GET',
      url: 'https://api.example.com/new'
    }
    setRequests(prev => [...prev, newRequest])
    setSelectedRequest(newId)
  }

  const handleRemoveRequest = (id: number) => {
    setRequests(prev => prev.filter(r => r.id !== id))
    if (selectedRequest === id) {
      setSelectedRequest(null)
    }
  }

  return (
    <div className='container'>
      <div className="requests">
        <div className="requestsHeader">
          <h1>Requests</h1>
          <button className="addRequest" onClick={handleAddRequest}>+</button>
        </div>
        <div className="requestList">
          {requests.map(request => (
            <div 
              key={request.id} 
              className="requestItem" 
              onClick={() => setSelectedRequest(request.id)}
              style={{
                backgroundColor: selectedRequest === request.id ? '#383838' : 'transparent'
              }}
            >
              <div className="requestType" style={{ backgroundColor: getMethodColor(request.type) }}>
                {request.type}
              </div>
              <div className="requestUrl">{request.url}</div>
              <button 
                className="removeRequest" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveRequest(request.id)
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="selectedRequest">
        {!selectedRequest && (
          <>
            <h1>Request</h1>
            <div className="noRequestSelected">
                <p>Selecione uma requisição para visualizar ou editar.</p>
                <p>Clique no botão "+" para adicionar uma nova requisição.</p>
            </div>
          </>
        )}
        {selectedRequest && (
          <>
            <h1>Request</h1>
            <div className="requestHeading">
              <div className="requestTypeDropdown">
                <button 
                  className="requestType dropdownTrigger" 
                  style={{ backgroundColor: getMethodColor(requests.find(r => r.id === selectedRequest)?.type || '') }}
                >
                  {requests.find(r => r.id === selectedRequest)?.type}
                  <span className="dropdownArrow">▼</span>
                </button>
                <div className="dropdownMenu">
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(type => (
                    <button
                      key={type}
                      className="dropdownItem"
                      style={{ backgroundColor: getMethodColor(type) }}
                      onClick={() => handleTypeChange(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <input 
                type="text" 
                value={requests.find(r => r.id === selectedRequest)?.url}
                onChange={(e) => {
                  const updatedUrl = e.target.value
                  setRequests(prevRequests => prevRequests.map(r => 
                    r.id === selectedRequest ? { ...r, url: updatedUrl } : r
                  ))
                }} 
              />
              <button className="send" onClick={handleSendRequest}>Send</button>
            </div>
            
            <div className="requestBody">
              <div className="bodyTabs">
                {!['GET', 'DELETE'].includes(requests.find(r => r.id === selectedRequest)?.type || '') && (
                  <button 
                    className={`tabButton ${activeRequestTab === 'body' ? 'active' : ''}`}
                    onClick={() => setActiveRequestTab('body')}
                  >
                    Body
                  </button>
                )}
                <button 
                  className={`tabButton ${activeRequestTab === 'headers' ? 'active' : ''}`}
                  onClick={() => setActiveRequestTab('headers')}
                >
                  Headers
                </button>
              </div>
              <div className="bodyContent">
                {activeRequestTab === 'body' && !['GET', 'DELETE'].includes(requests.find(r => r.id === selectedRequest)?.type || '') ? (
                  <textarea
                    className="jsonEditor"
                    placeholder="Enter request body (JSON)"
                    value={requests.find(r => r.id === selectedRequest)?.body || ''}
                    onChange={(e) => {
                      const updatedBody = e.target.value
                      setRequests(prevRequests => prevRequests.map(r => 
                        r.id === selectedRequest ? { ...r, body: updatedBody } : r
                      ))
                    }}
                  />
                ) : (
                  <div className="headersEditor">
                    <button className="addHeader" onClick={handleAddHeader}>+ Add Header</button>
                    {Object.entries(requests.find(r => r.id === selectedRequest)?.headers || {}).map((item, key) => (
                      <div key={key} className="headerRow">
                        <input
                          type="text"
                          defaultValue={item[0]}
                          placeholder="Header name"
                          onChange={(e) => {
                            const newKey = e.target.value;
                            setRequests(prevRequests => prevRequests.map(r => {
                              if (r.id === selectedRequest && r.headers) {
                                const headers = { ...r.headers }
                                delete headers[item[0]]
                                headers[newKey] = item[1]
                                return { ...r, headers }
                              }
                              return r
                            }))
                          }}
                        />
                        <input
                          type="text"
                          defaultValue={item[1]}
                          placeholder="Value"
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setRequests(prevRequests => prevRequests.map(r => {
                              if (r.id === selectedRequest && r.headers) {
                                return { ...r, headers: { ...r.headers, [item[0]]: newValue } }
                              }
                              return r
                            }))
                          }}
                        />
                        <button className="removeHeader" onClick={() => handleRemoveHeader(item[0])}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="selectedResponse">
        <div className="responseHeader">
          <h1>Response</h1>
          {selectedRequest && requests.find(r => r.id === selectedRequest)?.status && (
            <div className="statusBadge" style={{
              backgroundColor: requests.find(r => r.id === selectedRequest)?.status === 200 ? '#4caf50' : '#f44336'
            }}>
              {requests.find(r => r.id === selectedRequest)?.status}
            </div>
          )}
        </div>

        {selectedRequest && (
          <div className="responseContent">
            <div className="responseTabs">
              <button 
                className={`tabButton ${activeResponseTab === 'body' ? 'active' : ''}`}
                onClick={() => setActiveResponseTab('body')}
              >
                Body
              </button>
              <button 
                className={`tabButton ${activeResponseTab === 'headers' ? 'active' : ''}`}
                onClick={() => setActiveResponseTab('headers')}
              >
                Headers
              </button>
            </div>

            <div className="responseBody">
              {activeResponseTab === 'headers' ? (
                <div className="headersViewer">
                  {Object.entries(requests.find(r => r.id === selectedRequest)?.responseHeaders || {}).map(([key, value]) => (
                    <div key={key} className="headerRow">
                      <span className="headerKey">{key}:</span>
                      <span className="headerValue">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                requests.find(r => r.id === selectedRequest)?.error ? (
                  <div className="errorContainer">
                    <div className="errorTitle">
                      {requests.find(r => r.id === selectedRequest)?.status && (
                        <span className="errorStatus">
                          {requests.find(r => r.id === selectedRequest)?.status}
                        </span>
                      )}
                      {requests.find(r => r.id === selectedRequest)?.error}
                    </div>
                    <div className="errorMessage">
                      {requests.find(r => r.id === selectedRequest)?.errorMessage}
                    </div>
                    {requests.find(r => r.id === selectedRequest)?.errorData && (
                      <div className="errorData">
                        <div className="errorDataTitle">Error Details:</div>
                        <pre className="errorDataContent">
                          {JSON.stringify(JSON.parse(requests.find(r => r.id === selectedRequest)?.errorData || '{}'), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  requests.find(r => r.id === selectedRequest)?.response && (
                    <pre className="jsonViewer">
                      {(() => {
                        const request = requests.find(r => r.id === selectedRequest)
                        if (!request?.response) return null
                        
                        if (request.responseType?.includes('application/json')) {
                          try {
                            return JSON.stringify(JSON.parse(request.response), null, 2)
                          } catch {
                            return request.response
                          }
                        }
                        
                          if (request.responseType?.includes('text/html')) {
                          return <iframe srcDoc={request.response} style={{ width: '100%', height: '100%' }} />
                          }
                        
                        return request.response
                      })()}
                    </pre>
                  )
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



export default App
