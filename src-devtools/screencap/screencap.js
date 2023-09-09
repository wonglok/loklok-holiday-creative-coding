const express = require('express')
const app = express()
const DEV_TOOL_PORT = 2329
let fs = require('fs')

let socket = require('socket.io')
let Http = require('http')
// app.use(express.json({ limit: '1GB' })) // for parsing application/json
let cors = require('cors')
let formidable = require('formidable').formidable
let http = Http.Server(app)
let io = new socket.Server(http, {
  cors: {
    credentials: true,
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  },
})

app.use(cors({}))

app.use(
  express.raw({
    limit: '4GB',
  }),
)

/*
{
    "fields": {},
    "files": {
        "file": [
            {
                "size": 51663,
                "filepath": "/var/folders/mj/v4rx5_m50g53bxnyqwd07fl00000gn/T/ea9c4ee1418ef972a79b3a800",
                "newFilename": "ea9c4ee1418ef972a79b3a800",
                "mimetype": "image/png",
                "mtime": "2023-09-08T23:31:02.424Z",
                "originalFilename": "image.png"
            }
        ]
    }
}
*/

app.post('/file', async (req, res) => {
  //
  const form = formidable({})
  let fields
  let files
  try {
    ;[fields, files] = await form.parse(req)
  } catch (err) {
    // example to check for a very specific error
    if (err.code === formidableErrors.maxFieldsExceeded) {
    }
    console.error(err)
    res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' })
    res.end(String(err))
    return
  }
  // res.writeHead(200, { 'Content-Type': 'application/json' })

  // res.end(JSON.stringify({ fields, files }, null, 2))

  let metas = []
  let proms = files.file.map(async (file) => {
    let name = `${file.originalFilename}`

    let ts = new Date().getTime()

    await fs.promises
      .mkdir(`./public/disocver`, {
        recursive: true,
      })
      .catch(console.error)

    let res = await fs.promises.readdir(`./public/disocver/`)
    let count = (res.length + '').padStart(5, '0')
    let data = await fs.promises.readFile(file.filepath)
    let userInputTitle = fields.title[0]
    let metadata = JSON.stringify(
      {
        title: userInputTitle,
        dateTime: new Date(),
        name: name,
        mimetype: file.mimetype,
        size: file.size,
        origin: fields.origin[0],
        pathname: fields.pathname[0],
        thumbURL: `/disocver/${count}__${userInputTitle}/${name}`,
      },
      null,
      '\t',
    )
    await fs.promises
      .mkdir(`./public/disocver/${count}__${userInputTitle}`, {
        recursive: true,
      })
      .catch(console.error)
    await fs.promises.writeFile(`./public/disocver/${count}__${userInputTitle}/${name}`, data)
    await fs.promises.writeFile(`./public/disocver/${count}__${userInputTitle}/meta.json`, metadata)

    metas.push(JSON.parse(metadata))
  })

  await Promise.all(proms)

  res.json(metas)

  // let data = req.body

  // console.log(data)

  // res.json({ ok: true })
})

http.listen(DEV_TOOL_PORT, () => {
  console.log(`[DEV_TOOL_PORT] server running at http://localhost:${DEV_TOOL_PORT}/`)
})
// await fs.promises
//   .mkdir(`./public/blender-livelink-dropzone/${dateStr}/${name}__TS__${ts}`, {
//     recursive: true,
//   })
//   .catch(console.error)
