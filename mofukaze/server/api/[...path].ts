import { defineEventHandler, getProxyRequestHeaders, getRequestURL, sendProxy } from 'h3'

export default defineEventHandler((event) => {
  const gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3001'
  const requestUrl = getRequestURL(event)
  const targetPath = requestUrl.pathname.replace(/^\/api/, '') || '/'
  const targetUrl = new URL(`${targetPath}${requestUrl.search}`, gatewayUrl)

  return sendProxy(event, targetUrl.toString(), {
    headers: getProxyRequestHeaders(event),
  })
})
