const Port = require('get-port')
const App = require('express')()
const OpenApiMock = require('openapi-mockk')
const args = require('args')
const debug = require('debug')('openapi-mock-server')
const chalk = require('chalk')

args.option(['a', 'api'], 'Path to OpenAPI specification file. JSON or YAML.')
args.option(['f', 'faker'], 'Use faker for examples provisioning.')
args.example('openapi-mock-server --api=petstore.yaml', 'To run a server serving examples from specification, simply point to a file')
args.example('openapi-mock-server --faker --api=petstore.yaml', 'To run a server and fake all responses')
const opts = args.parse(process.argv)

debug(`Reading OpenAPI in ${opts.api}`)
const mock = OpenApiMock(opts.api)
mock.openapi.then(api => {
  debug(`OpenAPI specification for ${api.info.title} loaded successfuly`)
})

if (opts.api) {
  App.all('*', (req, res, next) => {
    const content = req.headers['content-type'] || 'application/json'
    const path = req.path
    const operation = req.method.toLowerCase()
    debug(`HTTP ${req.method} ${req.path}; content-type=${content}`)
    mock.responses({
      path,
      operation,
      response: '200',
      content,
      faker: opts.faker
    }).then(mock => {
      if (path in mock) {
        const response = mock[path][operation].responses
        debug(`200: ${response}`)
        res.send(response)
      } else {
        debug(`404: path not found`)
        res.sendStatus(404)
      }
    })
  })

  Port({port: 3000}).then(port => {
    App.listen(port, () => console.log(chalk`{cyan openapi-mock-server: listening @ {underline http://localhost:${port}}}`))
  })
} else {
  args.showHelp()
}
