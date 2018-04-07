const Port = require('get-port')
const App = require('express')()
const OpenApiMock = require('openapi-mockk')
const Opts = require('mri')
const Log = require('pino')()

const args = Opts(process.argv.slice(2))

if (args.api) {
  App.all('*', (req, res, next) => {
    const content = req.headers['content-type'] || 'application/json'
    const path = req.path
    const operation = req.method.toLowerCase()
    Log.trace({path, method: operation, content_type: content}, 'http request')
    OpenApiMock(args.api).responses({
      path,
      operation,
      response: '200',
      content
    }).then(mock => {
      const response = mock[path][operation].responses
      Log.trace({ response }, 'sending response')
      res.send(response)
    })
  })

  Port({port: 3000}).then(port => {
    App.listen(port, () => Log.info( { port }, `server started`))
  })
} else {
  Log.error('openapi specification file not found; use --api parameter')
}
